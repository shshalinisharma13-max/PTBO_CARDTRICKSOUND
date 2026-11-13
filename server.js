// Tinderbox reveal server.
//
// Two kinds of page join a room (?room=name, default "tinderbox"):
//   phone   (/)         the performer's secret input; sends the chosen card and the fire cue
//   speaker (/speaker)  the sound computer; plays the chosen card's audio when fired
//
// The server only relays. It remembers the last selected card per room, so a sound
// page that reconnects mid-trick still knows what to play.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { cardFromPile } from "./public/cards.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
const AUDIO_DIR = path.join(PUBLIC, "audio");
const AUDIO_EXT = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg", ".oga", ".flac", ".webm"]);
const PORT = globalThis.process?.env?.PORT || 3000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { pingInterval: 10000, pingTimeout: 8000 });

app.use(express.static(PUBLIC, { extensions: ["html"] }));
app.get("/", (_q, r) => r.sendFile(path.join(PUBLIC, "phone.html")));
app.get("/speaker", (_q, r) => r.sendFile(path.join(PUBLIC, "speaker.html")));
app.get("/ping", (_q, r) => r.type("text").send("ok"));

// Audio files in public/audio, matched to cards by a leading card number ("17-kettle.mp3").
app.get("/api/audio", (_q, r) => {
  const out = {};
  let files = [];
  try { files = fs.readdirSync(AUDIO_DIR); } catch { /* no folder yet */ }
  for (const name of files) {
    if (!AUDIO_EXT.has(path.extname(name).toLowerCase())) continue;
    const m = name.match(/^0*(\d{1,2})(?!\d)/);
    if (!m) continue;
    const n = Number(m[1]);
    if (n >= 1 && n <= 36 && !out[n]) out[n] = "/audio/" + encodeURIComponent(name);
  }
  r.json(out);
});

const lastSelection = new Map();   // room -> { n, pile, a, b, at }

function cleanRoom(value) {
  const room = String(value || "tinderbox").trim().toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 30);
  return room || "tinderbox";
}

function members(room) {
  const ids = io.sockets.adapter.rooms.get(room) || new Set();
  return [...ids].map((id) => io.sockets.sockets.get(id)).filter(Boolean);
}

function speakers(room) {
  return members(room).filter((s) => s.data.role === "speaker");
}

function state(room) {
  const m = members(room);
  return {
    room,
    speakers: m.filter((s) => s.data.role === "speaker").length,
    phones: m.filter((s) => s.data.role === "phone").length,
  };
}

function broadcastState(room) {
  io.to(room).emit("room-state", state(room));
}

function validCard(p) {
  const pile = Number(p?.pile), a = Number(p?.a), b = Number(p?.b);
  const card = cardFromPile(pile, a, b);
  return card ? { pile, a, b, n: card.n } : null;
}

io.on("connection", (socket) => {
  socket.on("join", (payload) => {
    const room = cleanRoom(payload?.room);
    const role = payload?.role === "speaker" ? "speaker" : "phone";
    if (socket.data.room && socket.data.room !== room) {
      const old = socket.data.room;
      socket.leave(old);
      broadcastState(old);
    }
    socket.join(room);
    socket.data.room = room;
    socket.data.role = role;
    socket.emit("joined", { ...state(room), role });
    if (role === "speaker" && lastSelection.has(room)) socket.emit("select", lastSelection.get(room));
    broadcastState(room);
  });

  // Phone: the place and two leaf taps are settled; prepare that pile's card.
  socket.on("select", (payload, ack = () => {}) => {
    const room = socket.data.room;
    const card = validCard(payload);
    if (!room || socket.data.role !== "phone" || !card) return ack({ ok: false, reason: "invalid" });
    const sel = { ...card, at: Date.now() };
    lastSelection.set(room, sel);
    speakers(room).forEach((s) => s.emit("select", sel));
    ack({ ok: true, speakers: speakers(room).length, ...card });
  });

  // Phone: the final secret tap. Plays the card on every sound computer in the room.
  socket.on("fire", (payload, ack = () => {}) => {
    const room = socket.data.room;
    const card = validCard(payload);
    if (!room || socket.data.role !== "phone" || !card) return ack({ ok: false, reason: "invalid" });
    const cue = { ...card, at: Date.now() };
    const sp = speakers(room);
    sp.forEach((s) => s.emit("fire", cue));
    ack({ ok: sp.length > 0, speakers: sp.length, n: card.n, reason: sp.length ? undefined : "no-speaker" });
  });

  // Phone: start over (two-finger tap). Clears the sound computer's ready card.
  socket.on("cancel", () => {
    const room = socket.data.room;
    if (!room || socket.data.role !== "phone") return;
    lastSelection.delete(room);
    speakers(room).forEach((s) => s.emit("cancel", {}));
  });

  socket.on("disconnect", () => {
    const room = socket.data.room;
    if (room) setTimeout(() => broadcastState(room), 0);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  const port = httpServer.address().port;
  console.log(`Tinderbox reveal running on port ${port}`);
  console.log(`  phone:   http://localhost:${port}/?room=tinderbox`);
  console.log(`  speaker: http://localhost:${port}/speaker?room=tinderbox`);
});
