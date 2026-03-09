"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Features",    href: "#features" },
  { label: "How It Works", href: "#how" },
  { label: "Gallery",     href: "#gallery"  },
  { label: "Contact",     href: "#contact"  },
];

// ─── The 4 real dashboard features ───────────────────────────────────────────
const FEATURES = [
  {
    emoji: "🪄",
    tab: "Generate Image",
    title: "AI Image Generation",
    desc: "Type any prompt and watch it become a stunning image in seconds. Choose from three Stable Diffusion models — XL, 2.1, or v1.5 — and fine-tune results with detailed prompts.",
    bullets: ["3 AI models: SD XL, 2.1, and v1.5", "Cmd/Ctrl + Enter shortcut to generate", "Results saved directly to your gallery"],
    color: "from-violet-500/20 to-violet-500/0",
    border: "border-violet-500/20",
    accent: "text-violet-300",
    glow: "shadow-violet-500/10",
    badge: "bg-violet-500/15 text-violet-300",
  },
  {
    emoji: "✂️",
    tab: "Remove Background",
    title: "Background Removal",
    desc: "Instantly isolate any subject with one click. Powered by remove.bg — handles people, products, logos, and complex edges with pixel-perfect precision.",
    bullets: ["No manual masking or selection", "Side-by-side before/after preview", "Download as transparent PNG instantly"],
    color: "from-emerald-400/20 to-emerald-400/0",
    border: "border-emerald-400/20",
    accent: "text-emerald-300",
    glow: "shadow-emerald-400/10",
    badge: "bg-emerald-500/15 text-emerald-300",
  },
  {
    emoji: "🔍",
    tab: "Upscale Image",
    title: "Image Upscaling",
    desc: "Enlarge any image up to 4× its original size right in your browser — no API, no upload, no cost. High-quality bicubic rendering keeps edges crisp and details sharp.",
    bullets: ["1.5×, 2×, 3×, and 4× scale options", "Runs 100% in your browser, no upload", "Shows output dimensions live as you pick"],
    color: "from-amber-400/20 to-amber-400/0",
    border: "border-amber-400/20",
    accent: "text-amber-300",
    glow: "shadow-amber-400/10",
    badge: "bg-amber-500/15 text-amber-300",
  },
  {
    emoji: "🗂️",
    tab: "My Gallery",
    title: "Personal Gallery",
    desc: "Every image you create is saved automatically in your session gallery. Filter by type, view in a full-screen lightbox, inspect metadata, and download anything at any time.",
    bullets: ["Filter: Generated / BG Removed / Upscaled", "Full-screen lightbox with metadata panel", "One-click download or delete per image"],
    color: "from-rose-500/20 to-rose-500/0",
    border: "border-rose-500/20",
    accent: "text-rose-300",
    glow: "shadow-rose-500/10",
    badge: "bg-rose-500/15 text-rose-300",
  },
];

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: "01", color: "text-orange-400", border: "border-orange-400/20", bg: "bg-orange-400/5",
    title: "Sign Up Free",
    desc: "Create your account in seconds — no credit card, no setup. Just an email and password.",
  },
  {
    n: "02", color: "text-teal-400", border: "border-teal-400/20", bg: "bg-teal-400/5",
    title: "Pick a Tool",
    desc: "Choose from Generate, Remove Background, or Upscale. Each tool is one click away in the sidebar.",
  },
  {
    n: "03", color: "text-indigo-400", border: "border-indigo-400/20", bg: "bg-indigo-400/5",
    title: "Create & Download",
    desc: "Run any tool, see the result side-by-side, save to gallery, and download your final image.",
  },
];

// ─── Marquee ──────────────────────────────────────────────────────────────────
function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  const items = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6];
  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-4"
        animate={{ x: reverse ? ["0%", "50%"] : ["0%", "-50%"] }}
        transition={{ duration: 35, ease: "linear", repeat: Infinity }}
        style={{ width: "max-content" }}
      >
        {items.map((n, i) => (
          <div key={i} className="relative w-52 h-36 md:w-64 md:h-44 rounded-2xl overflow-hidden shrink-0 border border-white/8 group">
            <img src={`/samples/sample${n}.png`} alt={`Sample ${n}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let v = 0;
        const step = Math.ceil(to / 60);
        const id = setInterval(() => { v = Math.min(v + step, to); setCount(v); if (v >= to) clearInterval(id); }, 16);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [to]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Animated Hero Background (replaces video) ───────────────────────────────
function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0, H = 0;

    // Particles
    const PARTICLE_COUNT = 90;
    type Particle = {
      x: number; y: number; vx: number; vy: number;
      r: number; alpha: number; hue: number;
    };
    let particles: Particle[] = [];

    // Aurora orbs — big blurry blobs that drift
    type Orb = {
      x: number; y: number; vx: number; vy: number;
      rx: number; ry: number;
      hue: number; alpha: number; t: number; speed: number;
    };
    let orbs: Orb[] = [];

    function resize() {
      W = canvas!.width  = canvas!.offsetWidth;
      H = canvas!.height = canvas!.offsetHeight;
    }

    function initParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.3,
        alpha: Math.random() * 0.5 + 0.1,
        hue: [260, 30, 200, 330][Math.floor(Math.random() * 4)], // violet, orange, teal, pink
      }));
    }

    function initOrbs() {
      const palette = [
        { h: 265, s: 70 },  // violet
        { h: 25,  s: 90 },  // orange
        { h: 175, s: 65 },  // teal
        { h: 330, s: 75 },  // rose
        { h: 240, s: 60 },  // indigo
      ];
      orbs = palette.map((p, i) => ({
        x: W * (0.1 + i * 0.22),
        y: H * (0.2 + (i % 2) * 0.5),
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.12,
        rx: W * (0.22 + Math.random() * 0.15),
        ry: H * (0.22 + Math.random() * 0.12),
        hue: p.h,
        alpha: 0.045 + Math.random() * 0.035,
        t: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.003,
      }));
    }

    function drawOrbs(t: number) {
      for (const o of orbs) {
        o.t += o.speed;
        // gentle sinusoidal drift
        const cx = o.x + Math.sin(o.t * 0.7) * W * 0.06;
        const cy = o.y + Math.cos(o.t * 0.5) * H * 0.04;

        const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(o.rx, o.ry));
        grad.addColorStop(0, `hsla(${o.hue},70%,65%,${o.alpha})`);
        grad.addColorStop(0.5, `hsla(${o.hue},60%,50%,${o.alpha * 0.4})`);
        grad.addColorStop(1, `hsla(${o.hue},60%,40%,0)`);

        ctx!.save();
        ctx!.scale(1, o.ry / o.rx);
        ctx!.beginPath();
        ctx!.arc(cx, cy * (o.rx / o.ry), o.rx, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
        ctx!.restore();
      }
    }

    function drawParticles() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue},80%,75%,${p.alpha})`;
        ctx!.fill();
      }
    }

    // Draw subtle connecting lines between nearby particles
    function drawConnections() {
      const MAX_DIST = 110;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.08;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(160,130,255,${alpha})`;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          }
        }
      }
    }

    let frame = 0;
    function draw() {
      frame++;
      ctx!.clearRect(0, 0, W, H);

      // Deep base
      ctx!.fillStyle = "#050508";
      ctx!.fillRect(0, 0, W, H);

      drawOrbs(frame);
      drawConnections();
      drawParticles();

      animId = requestAnimationFrame(draw);
    }

    resize();
    initParticles();
    initOrbs();
    draw();

    const ro = new ResizeObserver(() => {
      resize();
      initParticles();
      initOrbs();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, -60]);

  return (
    <main className="flex flex-col min-h-screen bg-[#050508] text-white overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; }
        .display { font-family: 'Syne', sans-serif; }
        .grain::after {
          content: ''; position: fixed; inset: 0; z-index: 9999;
          pointer-events: none; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .mesh {
          background:
            radial-gradient(ellipse 80% 50% at 20% 10%, rgba(139,92,246,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 5%,  rgba(249,115,22,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 50% 100%, rgba(20,184,166,0.05) 0%, transparent 70%);
        }
      `}</style>
      <div className="grain" />

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <motion.nav
        className="fixed top-0 left-0 w-full z-50 border-b border-white/5"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ backdropFilter: "blur(20px)", background: "rgba(5,5,8,0.75)" }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="display text-xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-orange-400 to-indigo-400">Genova</span>
            <span className="text-white/90"> AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-white/55 hover:text-white transition-colors">Sign In</Link>
            <Link href="/register"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-linear-to-r from-orange-500 to-indigo-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 transition-all duration-200">
              Get Started Free
            </Link>
          </div>
          <button onClick={() => setMobileOpen(v => !v)}
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors" aria-label="Menu">
            <motion.span animate={mobileOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }} className="block w-5 h-0.5 bg-white/70 rounded-full origin-center" />
            <motion.span animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }} className="block w-5 h-0.5 bg-white/70 rounded-full" />
            <motion.span animate={mobileOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} className="block w-5 h-0.5 bg-white/70 rounded-full origin-center" />
          </button>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 px-5 py-4 flex flex-col gap-1"
              style={{ background: "rgba(5,5,8,0.97)", backdropFilter: "blur(20px)" }}>
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                  className="py-3 text-sm text-white/55 hover:text-white border-b border-white/5 last:border-0 transition-colors">{l.label}</Link>
              ))}
              <div className="flex gap-3 pt-3">
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2.5 text-sm border border-white/10 rounded-xl text-white/55 hover:text-white transition-all">Sign In</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2.5 text-sm font-semibold rounded-xl bg-linear-to-r from-orange-500 to-indigo-500 text-white">Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-10 overflow-hidden">

        {/* ✦ Animated canvas background — replaces the video */}
        <HeroBackground />

        {/* Extra static glow layers on top of canvas for depth */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

        <motion.div style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 flex flex-col items-center text-center px-5 max-w-5xl mx-auto">

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/55 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            4 powerful AI tools — all free to start
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }}
            className="display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05]">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-orange-400 via-pink-300 to-indigo-400">Generate.</span>
            <br />
            <span className="text-white">Enhance.</span>
            <br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-teal-300 to-indigo-400">Perfect.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="mt-6 text-base md:text-lg text-white/45 max-w-xl leading-relaxed">
            Genova AI gives you a full creative studio in your browser — generate images from text,
            remove backgrounds instantly, upscale up to 4×, and keep everything in one gallery.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/register"
              className="group px-7 py-3.5 rounded-2xl bg-linear-to-r from-orange-500 to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/45 hover:scale-105 transition-all duration-200">
              Start Creating Free
              <span className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
            <Link href="#features"
              className="px-7 py-3.5 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:border-white/25 text-sm font-medium transition-all backdrop-blur-sm">
              See All Features
            </Link>
          </motion.div>

          {/* Tool pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="mt-10 flex flex-wrap justify-center gap-2">
            {[
              { label: "✦ Generate Image",       color: "border-violet-500/25  bg-violet-500/8  text-violet-300"  },
              { label: "✂️ Remove Background",   color: "border-emerald-500/25 bg-emerald-500/8 text-emerald-300" },
              { label: "🔍 Upscale 1.5×–4×",    color: "border-amber-500/25   bg-amber-500/8   text-amber-300"   },
              { label: "🗂️ Personal Gallery",    color: "border-rose-500/25    bg-rose-500/8    text-rose-300"    },
            ].map(p => (
              <span key={p.label} className={`px-3 py-1.5 rounded-full border text-xs font-medium ${p.color}`}>{p.label}</span>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="mt-14 flex items-center gap-8 sm:gap-14 text-center">
            {[
              { value: 50000, suffix: "+",    label: "Images Created" },
              { value: 3,     suffix: " Models", label: "AI Models"   },
              { value: 4,     suffix: "× Max",   label: "Upscale Size" },
            ].map(s => (
              <div key={s.label} className="flex flex-col gap-1">
                <span className="display text-2xl sm:text-3xl font-bold text-white">
                  <Counter to={s.value} suffix={s.suffix} />
                </span>
                <span className="text-xs text-white/30 uppercase tracking-widest">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs text-white/20 uppercase tracking-widest">Scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-8 bg-linear-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────────────────── */}
      <section id="gallery" className="py-20 overflow-hidden space-y-4 bg-[#050508]">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-10 px-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/25 mb-3">Created with Genova AI</p>
          <h2 className="display text-3xl md:text-4xl font-bold text-white">See What's Possible</h2>
        </motion.div>
        <MarqueeRow />
        <MarqueeRow reverse />
      </section>

      {/* ── Features — exactly matching the 4 dashboard tools ───────────── */}
      <section id="features" className="py-24 px-5 md:px-8 relative">
        <div className="absolute inset-0 mesh pointer-events-none opacity-40" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-white/25 mb-3">What's Inside the Dashboard</p>
            <h2 className="display text-3xl md:text-5xl font-bold">
              Your complete{" "}
              <span className="bg-clip-text text-transparent bg-linear-to-r from-orange-400 to-indigo-400">AI studio</span>
            </h2>
            <p className="mt-4 text-white/40 text-sm max-w-xl mx-auto">
              Four dedicated tools, each designed for a specific creative task. Accessible from the sidebar — no switching between apps.
            </p>
          </motion.div>

          {/* 2×2 feature grid */}
          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -5 }}
                className={`relative rounded-2xl border ${f.border} bg-white/3 p-7 flex flex-col gap-5 overflow-hidden group cursor-default shadow-xl ${f.glow}`}>

                {/* Hover fill */}
                <div className={`absolute inset-0 bg-linear-to-b ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Header row */}
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <span className="text-4xl leading-none">{f.emoji}</span>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${f.badge}`}>
                    {f.tab}
                  </span>
                </div>

                {/* Text */}
                <div className="relative z-10 space-y-2">
                  <h3 className="display font-bold text-xl text-white">{f.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
                </div>

                {/* Bullet points — exact features */}
                <ul className="relative z-10 space-y-2 pt-1">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-white/55">
                      <span className={`text-xs mt-0.5 shrink-0 ${f.accent}`}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-5 md:px-8 bg-[#07070c]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-white/25 mb-3">Getting Started</p>
            <h2 className="display text-3xl md:text-4xl font-bold">Up and running in minutes</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }}
                className={`rounded-2xl border ${s.border} ${s.bg} p-6 flex flex-col gap-4`}>
                <span className={`display text-4xl font-extrabold ${s.color} opacity-50`}>{s.n}</span>
                <div className="space-y-1.5">
                  <h3 className="display font-bold text-base text-white">{s.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ───────────────────────────────────────────────────────── */}
      <section id="about" className="py-24 px-5 md:px-8 bg-[#050508]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-white/25">About</p>
            <h2 className="display text-3xl md:text-5xl font-bold leading-tight">
              One dashboard.{" "}
              <span className="bg-clip-text text-transparent bg-linear-to-r from-orange-400 to-pink-400">
                Every tool you need.
              </span>
            </h2>
            <p className="text-white/45 leading-relaxed text-sm md:text-base">
              Genova AI combines image generation, background removal, and upscaling in a single clean interface.
              No switching between apps. No complicated settings. Just open the dashboard and start creating.
            </p>
            <ul className="space-y-3">
              {[
                "Works in any browser — no install needed",
                "3 Stable Diffusion models built in",
                "Background removal — no manual masking",
                "Upscale up to 4× entirely in-browser",
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/55">
                  <span className="w-5 h-5 rounded-full bg-teal-400/12 border border-teal-400/25 flex items-center justify-center text-teal-400 text-xs shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register"
              className="inline-block px-6 py-3 rounded-xl bg-linear-to-r from-orange-500 to-indigo-500 text-white text-sm font-semibold hover:scale-105 transition-transform shadow-lg shadow-orange-500/20">
              Open the Studio →
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-linear-to-br from-violet-500/10 to-orange-500/8 blur-2xl" />
            <img src="/illustration.jpg" alt="AI Illustration"
              className="relative w-full h-auto rounded-2xl border border-white/8 shadow-2xl" />
          </motion.div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 md:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto rounded-3xl relative overflow-hidden border border-white/8"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(249,115,22,0.1) 50%, rgba(99,102,241,0.1) 100%)" }}>
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="relative z-10 text-center py-16 px-6 space-y-6">
            <h2 className="display text-3xl md:text-5xl font-extrabold leading-tight">
              Ready to build your
              <br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-orange-400 to-indigo-400">
                creative studio?
              </span>
            </h2>
            <p className="text-white/40 max-w-md mx-auto text-sm leading-relaxed">
              Sign up free and get instant access to image generation, background removal,
              upscaling, and your personal gallery — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register"
                className="inline-block px-8 py-4 rounded-2xl bg-linear-to-r from-orange-500 to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/45 hover:scale-105 transition-all duration-200">
                Start Creating for Free →
              </Link>
              <Link href="/login"
                className="inline-block px-8 py-4 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:border-white/25 text-sm font-medium transition-all">
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 px-5 md:px-8 bg-[#07070c] text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto space-y-5">
          <h2 className="display text-3xl md:text-4xl font-bold">Get in Touch</h2>
          <p className="text-white/40 text-sm">Questions, partnerships, or media inquiries — we'd love to hear from you.</p>
          <Link href="mailto:contact@genovaai.app"
            className="inline-block px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/25 hover:bg-white/8 transition-all">
            contact@genovaai.app
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-8 px-5 md:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="display font-bold text-sm">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-orange-400 to-indigo-400">Genova</span>
            <span className="text-white/45"> AI</span>
          </span>
          <span className="text-white/25 text-xs">© {new Date().getFullYear()} Genova AI — Where imagination meets intelligence.</span>
          <div className="flex gap-5 text-xs text-white/30">
            <Link href="/login"    className="hover:text-white/60 transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white/60 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}