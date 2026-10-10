/* The constellation field: ridges and linked points that drift on their own.
   It never follows the pointer. It can be paused, and pushed by the scroll. */

export function initField(canvas, isStill) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let stars = [];
  let raf = 0;
  let running = false;
  let last = 0;
  let t = 0;
  let pace = 1;

  const seed = (i) => {
    const x = Math.sin(i * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };

  const build = () => {
    const count = w < 700 ? 56 : 88;
    stars = Array.from({ length: count }, (_, i) => {
      const r1 = seed(i + 1);
      const r3 = seed(i + 97);
      return {
        x: r1,
        y: seed(i + 41),
        z: 0.35 + r3 * 0.65,
        r: 1 + r3 * 1.8,
        phase: r1 * Math.PI * 2,
        speed: 0.55 + seed(i + 211) * 0.9,
        orbit: 10 + r3 * 22,
      };
    });
  };

  const project = (s) => ({
    x: s.x * w + Math.sin(t * 0.28 * s.speed + s.phase) * s.orbit * s.z + Math.sin(t * 0.08 + s.phase * 2.1) * 14,
    y: s.y * h + Math.cos(t * 0.22 * s.speed + s.phase * 1.3) * s.orbit * 0.75 * s.z + Math.cos(t * 0.06 + s.phase * 1.7) * 12,
    z: s.z,
    r: s.r,
    phase: s.phase,
  });

  const draw = () => {
    ctx.clearRect(0, 0, w, h);

    /* Soft terrain ridges: continuous wave motion */
    ctx.lineWidth = 1;
    const rows = 9;
    for (let i = 0; i < rows; i++) {
      const baseY = ((i + 1) / (rows + 1)) * h;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(33, 92, 78, ${0.09 + i * 0.012})`;
      for (let x = 0; x <= w; x += 8) {
        const nx = x / w;
        const y =
          baseY +
          Math.sin(nx * Math.PI * 2.2 + t * 0.45 + i * 0.4) * 22 +
          Math.sin(nx * Math.PI * 5.1 - t * 0.35 + i) * 10 +
          Math.cos(t * 0.2 + i * 0.5) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    /* Constellation links */
    const pts = stars.map(project);
    const linkDist = Math.min(w, h) * 0.2;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d >= linkDist) continue;
        ctx.strokeStyle = `rgba(33, 92, 78, ${(1 - d / linkDist) * 0.28 * Math.min(pts[i].z, pts[j].z)})`;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }

    /* Stars */
    pts.forEach((p) => {
      const alpha = 0.28 + p.z * 0.4 * (0.55 + Math.sin(t * 1.8 + p.phase) * 0.3);
      ctx.fillStyle = `rgba(33, 92, 78, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.z, 0, Math.PI * 2);
      ctx.fill();

      if (p.phase > 5) {
        ctx.fillStyle = `rgba(196, 146, 90, ${alpha * 0.55})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.8, p.r * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // a push from the scroll wears off on its own
    pace += (1 - pace) * Math.min(1, dt * 2);
    t += dt * pace;
    draw();
    raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (!running) draw();
  };

  resize();
  window.addEventListener("resize", resize);

  return {
    play() {
      if (running || isStill()) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    pause() {
      running = false;
      cancelAnimationFrame(raf);
    },
    push(velocity) {
      pace = Math.min(5, 1 + Math.abs(velocity) / 700);
    },
  };
}
