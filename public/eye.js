// The Dividual eye: a glowing iris of jagged radial strands around a dark pupil.
// Strands are drawn once to an offscreen canvas; each frame only scales and fades it,
// so it stays smooth on a phone.
//
//   const eye = makeEye(canvas, { seed: 7 });
//   eye.setLevel(0..1)   brighten and swell (e.g. from audio level)
//   eye.setOpen(0..1)    pupil size, 0 = dilated, 1 = narrow
(function () {
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  function strands(seed) {
    const r = rng(seed), out = [];
    const strand = (theta, r0, r1, segs) => {
      const pts = [];
      let drift = 0;
      for (let k = 0; k <= segs; k++) {
        if (k) {
          drift += (r() - 0.5) * 0.048;
          if (r() < 0.15) drift += (r() - 0.5) * 0.14;
        }
        const rad = r0 + (r1 - r0) * (k / segs), a = theta + drift;
        pts.push([rad * Math.cos(a), rad * Math.sin(a)]);
      }
      return pts;
    };
    const Rp = 0.34;
    for (let i = 0; i < 190; i++) {
      out.push(strand(2 * Math.PI * i / 190 + (r() - 0.5) * 0.024, Rp * (0.97 + r() * 0.11), 0.8 + r() * 0.24, 10));
    }
    for (let i = 0; i < 90; i++) {
      out.push(strand(r() * 2 * Math.PI, Rp * (0.98 + r() * 0.07), 0.45 + r() * 0.27, 6));
    }
    return out;
  }

  window.makeEye = function (canvas, opts = {}) {
    const ctx = canvas.getContext("2d");
    const lines = strands(opts.seed || 4242);
    const off = document.createElement("canvas");
    let size = 0, level = 0, shown = 0, open = 0.5, shownOpen = 0.5, t0 = performance.now();

    function bake() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const css = canvas.clientWidth || 300;
      size = Math.round(css * dpr);
      canvas.width = canvas.height = size;
      off.width = off.height = size;
      const o = off.getContext("2d"), R = size * 0.42, c = size / 2;
      o.clearRect(0, 0, size, size);
      const halo = o.createRadialGradient(c, c, R * 0.3, c, c, R * 1.25);
      halo.addColorStop(0, "rgba(31,127,144,0.32)");
      halo.addColorStop(0.7, "rgba(17,65,76,0.16)");
      halo.addColorStop(1, "rgba(5,8,15,0)");
      o.fillStyle = halo;
      o.beginPath(); o.arc(c, c, R * 1.25, 0, Math.PI * 2); o.fill();
      o.lineJoin = "round"; o.lineCap = "round";
      const layers = [["#2ba9bd", 0.026, 0.12], ["#4fd0e0", 0.013, 0.32], ["#d8fbff", 0.005, 1]];
      for (const [col, w, a] of layers) {
        o.strokeStyle = col; o.globalAlpha = a; o.lineWidth = Math.max(0.6, w * R);
        o.beginPath();
        for (const pts of lines) {
          o.moveTo(c + pts[0][0] * R, c + pts[0][1] * R);
          for (let i = 1; i < pts.length; i++) o.lineTo(c + pts[i][0] * R, c + pts[i][1] * R);
        }
        o.stroke();
      }
      o.globalAlpha = 1;
    }

    function frame(now) {
      if (!size) bake();
      shown += (level - shown) * 0.18;
      shownOpen += (open - shownOpen) * 0.06;
      const t = (now - t0) / 1000, c = size / 2, R = size * 0.42;
      const breathe = 1 + 0.012 * Math.sin(t * 0.9) + 0.05 * shown;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(t * 0.01);
      ctx.scale(breathe, breathe);
      ctx.globalAlpha = 0.82 + 0.18 * shown;
      ctx.drawImage(off, -c, -c);
      if (shown > 0.02) {                       // extra glow while sound plays
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.min(0.9, shown * 0.9);
        ctx.drawImage(off, -c, -c);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.restore();
      const pr = R * (0.30 + 0.12 * (1 - shownOpen)) * (1 + 0.04 * shown);
      ctx.fillStyle = "#020306";
      ctx.beginPath(); ctx.arc(c, c, pr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(79,208,224,0.35)"; ctx.lineWidth = Math.max(1, size * 0.002);
      ctx.stroke();
      requestAnimationFrame(frame);
    }

    window.addEventListener("resize", () => { size = 0; });
    requestAnimationFrame(frame);
    return {
      setLevel(v) { level = Math.max(0, Math.min(1, v)); },
      setOpen(v) { open = Math.max(0, Math.min(1, v)); },
    };
  };
})();
