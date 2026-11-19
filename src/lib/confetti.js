/**
 * Tiny dependency-free confetti engine.
 * One shared, click-through <canvas> is created on demand and removed as soon
 * as the last particle is gone, so the game is never blocked or slowed down.
 * Every effect is a no-op when the user prefers reduced motion.
 */

export const PALETTE = {
  midnight: '#22367f',
  royal: '#2f5fff',
  sky: '#6f93ff',
  silver: '#c3cad8',
  white: '#f3f5f9',
  gold: '#c9a44c',
};

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

let canvas = null;
let ctx = null;
let particles = [];
let frame = 0;
let dpr = 1;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
}

function teardown() {
  cancelAnimationFrame(frame);
  frame = 0;
  window.removeEventListener('resize', resize);
  canvas?.remove();
  canvas = null;
  ctx = null;
  particles = [];
}

/** Shade a hex colour; used to give particles a metallic glint as they turn. */
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amount > 0 ? (255 - c) * amount : c * amount))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function draw(p) {
  const turn = Math.cos(p.flip); // -1…1: simulates the piece rotating in 3D
  ctx.save();
  ctx.globalAlpha = p.alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.scale(1, turn || 0.05);
  ctx.fillStyle = shade(p.color, turn * 0.28);
  if (p.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.shape === 'ribbon') {
    ctx.fillRect(-p.size * 0.18, -p.size * 1.1, p.size * 0.36, p.size * 2.2);
  } else {
    ctx.fillRect(-p.size / 2, -p.size * 0.32, p.size, p.size * 0.64);
  }
  ctx.restore();
}

function tick() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  particles = particles.filter((p) => {
    if (p.delay > 0) {
      p.delay--;
      return true;
    }
    p.age++;
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.gravity;
    p.wobble += p.wobbleSpeed;
    p.x += p.vx + Math.sin(p.wobble) * p.sway;
    p.y += p.vy;
    p.rot += p.spin;
    p.flip += p.flipSpeed;
    const fadeStart = p.life * 0.72;
    p.alpha = p.age < fadeStart ? 1 : Math.max(0, 1 - (p.age - fadeStart) / (p.life - fadeStart));
    if (p.age >= p.life || p.y > h + 40 || p.x < -80 || p.x > w + 80) return false;
    draw(p);
    return true;
  });

  if (particles.length) frame = requestAnimationFrame(tick);
  else teardown();
}

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Emit particles.
 * origin: { x, y } as fractions of the viewport; angle in degrees (90 = up).
 */
function emit({
  origin,
  angle = 90,
  spread = 60,
  count = 40,
  velocity = 12,
  colors,
  gravity = 0.28,
  drag = 0.965,
  size = [6, 10],
  life = [110, 170],
  shapes = ['rect', 'rect', 'ribbon', 'circle'],
  delay = [0, 0],
  sway = 0.6,
}) {
  const ox = origin.x * window.innerWidth;
  const oy = origin.y * window.innerHeight;
  for (let i = 0; i < count; i++) {
    const a = ((angle + rand(-spread / 2, spread / 2)) * Math.PI) / 180;
    const v = velocity * rand(0.55, 1.15);
    particles.push({
      x: ox + rand(-4, 4),
      y: oy + rand(-4, 4),
      vx: Math.cos(a) * v,
      vy: -Math.sin(a) * v,
      gravity: gravity * rand(0.85, 1.15),
      drag,
      size: rand(size[0], size[1]),
      color: pick(colors),
      shape: pick(shapes),
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.12, 0.12),
      flip: rand(0, Math.PI * 2),
      flipSpeed: rand(0.08, 0.2),
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.04, 0.09),
      sway: sway * rand(0.4, 1),
      age: 0,
      life: rand(life[0], life[1]),
      alpha: 1,
      delay: Math.round(rand(delay[0], delay[1])),
    });
  }
}

function start() {
  if (!frame) frame = requestAnimationFrame(tick);
}

/** Scale particle counts down on small screens so mobile stays smooth. */
const density = () => Math.max(0.5, Math.min(1, window.innerWidth / 1100));

/** A short, elegant blue-and-silver burst — used when a single word is solved. */
export function winBurst(origin = { x: 0.5, y: 0.42 }) {
  if (reducedMotion()) return () => {};
  ensureCanvas();
  const { royal, sky, silver, white } = PALETTE;
  const colors = [royal, royal, sky, silver, silver, white];
  const n = Math.round(70 * Math.max(0.7, density()));
  emit({ origin, angle: 90, spread: 100, count: n, velocity: 11, colors, life: [70, 110], size: [5, 8] });
  start();
  return stop;
}

/**
 * The grand finale: party poppers fire from both upper corners, then a gentle
 * shower of confetti falls across the whole screen.
 */
export function finaleCelebration(getOrigins = () => ({})) {
  if (reducedMotion()) return () => {};
  ensureCanvas();
  const { midnight, royal, sky, silver, white, gold } = PALETTE;
  const colors = [midnight, royal, royal, sky, silver, silver, white, gold];
  const d = density();
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  // Popper blasts — angled down and in towards the centre.
  const blast = (count, velocity) => {
    const common = { colors, count: Math.round(count * d), velocity: velocity * (0.75 + d * 0.25), spread: 38, gravity: 0.24, drag: 0.958, life: [160, 240] };
    const { left, right } = getOrigins();
    emit({ ...common, origin: left ?? { x: 0.03, y: 0.06 }, angle: -38 });
    emit({ ...common, origin: right ?? { x: 0.97, y: 0.06 }, angle: 218 });
    start();
  };
  at(420, () => blast(110, 22));
  at(900, () => blast(70, 18));

  // Soft rain from above the viewport.
  at(1100, () => {
    emit({
      origin: { x: 0.5, y: -0.04 },
      angle: -90,
      spread: 0,
      count: Math.round(160 * d),
      velocity: 1.5,
      colors,
      gravity: 0.05,
      drag: 0.99,
      life: [320, 420],
      delay: [0, 150],
      sway: 1.2,
    });
    // spread the rain across the full width
    for (const p of particles.slice(-Math.round(160 * d))) p.x = Math.random() * window.innerWidth;
    start();
  });

  return () => {
    timers.forEach(clearTimeout);
    stop();
  };
}

export function stop() {
  if (canvas) teardown();
}
