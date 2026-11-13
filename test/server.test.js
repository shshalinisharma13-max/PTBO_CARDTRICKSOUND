import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// A minimal Engine.IO polling client exercises the real Socket.IO server without
// adding a second client library to this small app's dependencies.
class Client {
  constructor(base) { this.base = base; this.events = []; this.acks = new Map(); this.nextAck = 1; }
  async connect() {
    const response = await fetch(`${this.base}/socket.io/?EIO=4&transport=polling`);
    const opening = await response.text();
    assert.equal(opening[0], '0');
    this.sid = JSON.parse(opening.slice(1)).sid;
    await this.post('40');
    await this.poll();
    return this;
  }
  url() { return `${this.base}/socket.io/?EIO=4&transport=polling&sid=${this.sid}`; }
  async post(body) {
    const response = await fetch(this.url(), { method: 'POST', body, headers: { 'content-type': 'text/plain;charset=UTF-8' }, signal: AbortSignal.timeout(3000) });
    assert.equal(response.status, 200);
  }
  async poll() {
    const response = await fetch(this.url(), { signal: AbortSignal.timeout(3000) });
    assert.equal(response.status, 200);
    for (const packet of (await response.text()).split('\x1e')) {
      if (packet === '2') { await this.post('3'); continue; }
      if (packet.startsWith('42[')) this.events.push(JSON.parse(packet.slice(2)));
      const ack = packet.match(/^43(\d+)(\[.*\])$/s);
      if (ack) this.acks.set(Number(ack[1]), JSON.parse(ack[2])[0]);
    }
  }
  async emit(event, payload) { await this.post('42' + JSON.stringify([event, payload])); }
  async request(event, payload) {
    const id = this.nextAck++;
    await this.post('42' + id + JSON.stringify([event, payload]));
    while (!this.acks.has(id)) await this.poll();
    const result = this.acks.get(id); this.acks.delete(id); return result;
  }
  async event(name) {
    while (!this.events.some(e => e[0] === name)) await this.poll();
    return this.events.splice(this.events.findIndex(e => e[0] === name), 1)[0][1];
  }
}

test('real server prepares and fires the correct pile, rejects invalid cues, and isolates rooms', { timeout: 20000 }, async t => {
  const cwd = fileURLToPath(new URL('..', import.meta.url));
  const child = spawn(process.execPath, ['server.js'], { cwd, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill());
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timed out: ' + stderr)), 5000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${stderr}`)); });
    child.stdout.on('data', chunk => {
      const match = String(chunk).match(/running on port (\d+)/);
      if (match) { clearTimeout(timer); resolve(Number(match[1])); }
    });
  });
  const base = `http://127.0.0.1:${port}`;
  assert.equal(await (await fetch(base + '/ping')).text(), 'ok');
  assert.match(await (await fetch(base + '/')).text(), /Where did your/);
  const speaker = await new Client(base).connect();
  await speaker.emit('join', { room: 'test-a', role: 'speaker' }); await speaker.event('joined');
  const phone = await new Client(base).connect();
  await phone.emit('join', { room: 'test-a', role: 'phone' }); await phone.event('joined');
  const other = await new Client(base).connect();
  await other.emit('join', { room: 'test-b', role: 'speaker' }); await other.event('joined');

  let reply = await phone.request('select', { pile: 2, a: 3, b: 3 });
  assert.equal(reply.n, 13); assert.equal(reply.pile, 2);
  assert.equal((await speaker.event('select')).n, 13);
  assert.ok(!speaker.events.some(e => e[0] === 'fire'), 'preselection must not fire');
  reply = await phone.request('fire', { pile: 2, a: 3, b: 3 });
  assert.equal(reply.ok, true); assert.equal(reply.n, 13);
  assert.equal((await speaker.event('fire')).pile, 2);
  reply = await phone.request('fire', { pile: 3, a: 3, b: 3 });
  assert.equal(reply.n, 22); assert.equal((await speaker.event('fire')).n, 22);
  assert.equal((await phone.request('fire', { pile: 4, a: 3, b: 2 })).n, 32);
  assert.equal((await speaker.event('fire')).n, 32);
  assert.deepEqual(await phone.request('fire', { a: 3, b: 3 }), { ok: false, reason: 'invalid' });
  assert.deepEqual(await phone.request('fire', { pile: 3, a: 1, b: 1 }), { ok: false, reason: 'invalid' });
  assert.deepEqual(await speaker.request('fire', { pile: 3, a: 3, b: 3 }), { ok: false, reason: 'invalid' });
  // Drain any preceding packets via an acknowledged request before checking isolation.
  await other.request('select', { pile: 3, a: 3, b: 3 });
  assert.ok(!other.events.some(e => ['select', 'fire'].includes(e[0])));
  await phone.emit('cancel', {}); await speaker.event('cancel');
  const reconnected = await new Client(base).connect();
  await reconnected.emit('join', { room: 'test-a', role: 'speaker' }); await reconnected.event('joined');
  await reconnected.request('select', { pile: 1, a: 3, b: 6 });
  assert.ok(!reconnected.events.some(e => e[0] === 'select'), 'restart clears the remembered selection');
  await phone.emit('join', { room: 'alone', role: 'phone' }); await phone.event('joined');
  reply = await phone.request('fire', { pile: 1, a: 3, b: 6 });
  assert.equal(reply.ok, false); assert.equal(reply.reason, 'no-speaker');
});
