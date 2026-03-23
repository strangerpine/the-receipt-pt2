import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Palette & Tokens ────────────────────────────────────────
const T = {
  bg: '#0F0E0D',
  surface: '#1A1918',
  card: '#232221',
  border: '#2E2D2B',
  accent: '#C8A97E',
  accentDim: '#8B7355',
  text: '#E8E2D9',
  textDim: '#9B9590',
  white: '#FDFAF6',
  serif: "'Playfair Display', Georgia, serif",
  sans: "'DM Sans', -apple-system, sans-serif",
  radius: '12px',
};

// ─── Global CSS (injected once) ──────────────────────────────
const GlobalCSS = () => {
  useEffect(() => {
    const id = 'praxis-global';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
      html { scroll-behavior: smooth; }
      body { background:${T.bg}; color:${T.text}; font-family:${T.sans};
             line-height:1.7; overflow-x:hidden; }
      ::selection { background:${T.accent}; color:${T.bg}; }
      ::-webkit-scrollbar { width:6px; }
      ::-webkit-scrollbar-track { background:${T.bg}; }
      ::-webkit-scrollbar-thumb { background:${T.accentDim}; border-radius:3px; }
      a { color:${T.accent}; text-decoration:none; transition:color .2s; }
      a:hover { color:${T.white}; }

      @keyframes fadeUp {
        from { opacity:0; transform:translateY(30px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity:0; }
        to   { opacity:1; }
      }
      @keyframes slideLeft {
        from { opacity:0; transform:translateX(-30px); }
        to   { opacity:1; transform:translateX(0); }
      }
      @keyframes pulse {
        0%, 100% { opacity:.4; }
        50% { opacity:1; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 20px rgba(200,169,126,0.1); }
        50% { box-shadow: 0 0 40px rgba(200,169,126,0.25); }
      }
      @keyframes borderGlow {
        0%, 100% { border-color: ${T.border}; }
        50% { border-color: ${T.accent}; }
      }
      @keyframes typeBar {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      @keyframes scaleIn {
        from { opacity:0; transform:scale(0.85); }
        to { opacity:1; transform:scale(1); }
      }
      @keyframes slideRight {
        from { opacity:0; transform:translateX(30px); }
        to { opacity:1; transform:translateX(0); }
      }
      @keyframes rotateIn {
        from { opacity:0; transform:rotate(-10deg) scale(0.9); }
        to { opacity:1; transform:rotate(0) scale(1); }
      }
      .card-tilt { transition: transform .3s ease, box-shadow .3s ease; }
      .card-tilt:hover { transform: perspective(800px) rotateX(2deg) rotateY(-2deg) translateY(-6px) !important;
        box-shadow: 0 20px 60px rgba(200,169,126,0.12) !important; }
      .scroll-top-btn:hover { background: ${T.accent} !important; color: ${T.bg} !important; transform: scale(1.1); }
      .progress-bar { transition: width .15s linear; }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
};

// ─── Intersection Observer Hook ──────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ─── Particle Background (with connecting lines) ────────────
const Particles = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let raf;
    const dots = [];
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMouse, { passive: true });

    for (let i = 0; i < 70; i++) {
      dots.push({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        o: Math.random() * 0.3 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw connecting lines between nearby particles
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(200,169,126,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      dots.forEach(d => {
        // Repel from mouse
        const ddx = d.x - mx;
        const ddy = d.y - my;
        const mouseDist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (mouseDist < 150 && mouseDist > 0) {
          const force = (150 - mouseDist) / 150 * 0.8;
          d.x += (ddx / mouseDist) * force;
          d.y += (ddy / mouseDist) * force;
        }

        d.x += d.dx; d.y += d.dy;
        if (d.x < 0) d.x = c.width;
        if (d.x > c.width) d.x = 0;
        if (d.y < 0) d.y = c.height;
        if (d.y > c.height) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,169,126,${d.o})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
};

// ─── Mouse Glow ─────────────────────────────────────────────
const MouseGlow = () => {
  const [pos, setPos] = useState({ x: -500, y: -500 });
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const move = (e) => { setPos({ x: e.clientX, y: e.clientY }); setVis(true); };
    const leave = () => setVis(false);
    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    return () => { window.removeEventListener('mousemove', move); document.removeEventListener('mouseleave', leave); };
  }, []);
  if (!vis) return null;
  return <div style={{
    position: 'fixed', left: pos.x - 250, top: pos.y - 250, width: 500, height: 500,
    borderRadius: '50%', pointerEvents: 'none', zIndex: 1,
    background: 'radial-gradient(circle, rgba(200,169,126,0.035) 0%, transparent 70%)',
    transition: 'left 0.08s linear, top 0.08s linear',
  }} />;
};

// ─── Scroll Progress Bar ────────────────────────────────────
const ScrollProgress = () => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const h = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setPct(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return <div className="progress-bar" style={{
    position: 'fixed', top: 0, left: 0, height: 3, zIndex: 200,
    width: `${pct}%`,
    background: `linear-gradient(90deg, ${T.accent}, ${T.white})`,
    boxShadow: `0 0 10px ${T.accent}`,
  }} />;
};

// ─── Scroll-to-Top Button ───────────────────────────────────
const ScrollToTop = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 500);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  if (!show) return null;
  return (
    <button className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
      position: 'fixed', bottom: 32, right: 32, width: 48, height: 48,
      borderRadius: '50%', border: `1px solid ${T.accent}`, cursor: 'pointer',
      background: 'rgba(200,169,126,0.1)', color: T.accent, fontSize: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)', zIndex: 150,
      transition: 'all .3s ease', animation: 'fadeUp .4s ease',
    }}>
      ↑
    </button>
  );
};

// ─── Typewriter Hook ────────────────────────────────────────
function useTypewriter(text, speed = 50, delay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let timeout;
    const start = setTimeout(() => {
      let i = 0;
      const tick = () => {
        if (i <= text.length) {
          setDisplayed(text.slice(0, i));
          i++;
          timeout = setTimeout(tick, speed);
        } else {
          setDone(true);
        }
      };
      tick();
    }, delay);
    return () => { clearTimeout(start); clearTimeout(timeout); };
  }, [text, speed, delay]);
  return [displayed, done];
}

// ─── Count-Up Animation ─────────────────────────────────────
const CountUp = ({ end, suffix = '', duration = 2000 }) => {
  const [val, setVal] = useState(0);
  const [ref, vis] = useReveal(0.3);
  useEffect(() => {
    if (!vis) return;
    let start = 0;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [vis, end, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
};

// ─── Navigation ──────────────────────────────────────────────
const NAV_ITEMS = ['Home', 'About', 'Journey', 'Reflections', 'Contact'];

const Nav = ({ active }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 clamp(1rem, 4vw, 3rem)',
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(15,14,13,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? `1px solid ${T.border}` : '1px solid transparent',
      transition: 'all .35s ease',
    }}>
      <span style={{
        fontFamily: T.serif, fontSize: '1.25rem', fontWeight: 600,
        color: T.accent, letterSpacing: '0.02em',
      }}>
        Praxis Pathways
      </span>

      {/* Desktop */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}
           className="nav-desktop">
        {NAV_ITEMS.map(item => (
          <a key={item} href={`#${item.toLowerCase()}`} style={{
            color: active === item.toLowerCase() ? T.accent : T.textDim,
            fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.06em',
            textTransform: 'uppercase', transition: 'color .2s',
            borderBottom: active === item.toLowerCase() ? `2px solid ${T.accent}` : '2px solid transparent',
            paddingBottom: 2,
          }}>
            {item}
          </a>
        ))}
      </div>

      {/* Mobile burger */}
      <button onClick={() => setMenuOpen(!menuOpen)} style={{
        display: 'none', background: 'none', border: 'none', color: T.text,
        fontSize: '1.5rem', cursor: 'pointer',
      }} className="nav-burger">
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Responsive CSS */}
      <style>{`
        @media(max-width:768px) {
          .nav-desktop { display:none !important; }
          .nav-burger { display:block !important; }
        }
      `}</style>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,14,13,0.97)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '2rem', zIndex: 99,
          animation: 'fadeIn .3s ease',
        }}>
          {NAV_ITEMS.map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
               onClick={() => setMenuOpen(false)}
               style={{
                 color: T.text, fontFamily: T.serif, fontSize: '1.5rem',
                 fontWeight: 500, letterSpacing: '0.04em',
               }}>
              {item}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

// ─── Section Wrapper ─────────────────────────────────────────
const Section = ({ id, children, style = {} }) => {
  const [ref, vis] = useReveal(0.08);
  return (
    <section id={id} ref={ref} style={{
      position: 'relative', zIndex: 1,
      padding: 'clamp(4rem, 10vh, 8rem) clamp(1.5rem, 5vw, 6rem)',
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(30px)',
      transition: 'opacity .8s ease, transform .8s ease',
      ...style,
    }}>
      {children}
    </section>
  );
};

// ─── Section Heading ─────────────────────────────────────────
const Heading = ({ sub, title }) => (
  <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
    {sub && <span style={{
      display: 'block', fontSize: '0.75rem', fontWeight: 600,
      letterSpacing: '0.15em', textTransform: 'uppercase',
      color: T.accent, marginBottom: '0.75rem',
    }}>{sub}</span>}
    <h2 style={{
      fontFamily: T.serif, fontSize: 'clamp(1.8rem, 4vw, 3rem)',
      fontWeight: 600, color: T.white, lineHeight: 1.2,
    }}>{title}</h2>
    <div style={{
      width: 60, height: 2, background: T.accent,
      margin: '1.25rem auto 0', borderRadius: 1,
    }} />
  </div>
);

// ─── Card Component (with 3D tilt) ──────────────────────────
const Card = ({ children, style = {}, hover = true }) => {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  const handleMove = useCallback((e) => {
    if (!cardRef.current || !hover) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -3;
    const ry = ((x - cx) / cx) * 3;
    cardRef.current.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
  }, [hover]);

  const handleLeave = useCallback(() => {
    setHovered(false);
    if (cardRef.current) cardRef.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        background: T.card,
        border: `1px solid ${hovered && hover ? T.accent : T.border}`,
        borderRadius: T.radius,
        padding: 'clamp(1.5rem, 3vw, 2.5rem)',
        transition: 'border-color .3s ease, box-shadow .3s ease, transform .15s ease',
        boxShadow: hovered && hover
          ? '0 20px 60px rgba(200,169,126,0.12)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ─── Hero Section (with typewriter + stats) ─────────────────
const Hero = () => {
  const [loaded, setLoaded] = useState(false);
  const [typed, typeDone] = useTypewriter('A reflective journey through inquiry, growth, and transformation in the Bachelor of Health Sciences program.', 35, 900);
  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  return (
    <section id="home" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      position: 'relative', zIndex: 1,
      padding: 'clamp(2rem, 5vw, 4rem)',
    }}>
      <div style={{
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(40px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: `2px solid ${T.accent}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 2rem',
          fontSize: '2rem', color: T.accent,
          animation: 'float 4s ease-in-out infinite, glow 3s ease-in-out infinite',
        }}>
          ✦
        </div>

        <p style={{
          fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: T.accent, marginBottom: '1rem',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 1s ease 0.3s',
        }}>
          McMaster BHSc — Praxis Portfolio
        </p>

        <h1 style={{
          fontFamily: T.serif,
          fontSize: 'clamp(2.5rem, 7vw, 5rem)',
          fontWeight: 700, color: T.white, lineHeight: 1.1,
          marginBottom: '1.5rem',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease 0.4s',
        }}>
          Four Years of<br />
          <span style={{
            color: T.accent, fontStyle: 'italic',
            background: `linear-gradient(90deg, ${T.accent}, ${T.white}, ${T.accent})`,
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shimmer 4s linear infinite',
          }}>Becoming</span>
        </h1>

        {/* Typewriter subtitle */}
        <p style={{
          maxWidth: 560, margin: '0 auto', fontSize: 'clamp(1rem, 2vw, 1.15rem)',
          color: T.textDim, lineHeight: 1.8, minHeight: '3.6em',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 1s ease 0.6s',
        }}>
          {typed}
          {!typeDone && <span style={{ animation: 'typeBar 0.8s step-end infinite', color: T.accent }}>|</span>}
        </p>

        {/* Animated Stats Row */}
        <div style={{
          display: 'flex', gap: '2rem', justifyContent: 'center',
          margin: '2rem auto', flexWrap: 'wrap',
          opacity: loaded ? 1 : 0, transition: 'opacity 1s ease 0.8s',
        }}>
          {[
            { end: 4, suffix: '', label: 'Years' },
            { end: 6, suffix: '', label: 'Reflections' },
            { end: 12, suffix: '+', label: 'Experiences' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: T.serif, fontSize: '2rem', fontWeight: 700, color: T.accent,
              }}>
                <CountUp end={s.end} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '0.75rem', color: T.textDim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <a href="#about" style={{
          display: 'inline-block',
          padding: '0.85rem 2.5rem',
          background: 'transparent',
          border: `1.5px solid ${T.accent}`,
          borderRadius: '999px',
          color: T.accent,
          fontSize: '0.85rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          transition: 'all .3s ease',
          opacity: loaded ? 1 : 0,
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.target.style.background = T.accent;
          e.target.style.color = T.bg;
          e.target.style.boxShadow = `0 0 30px rgba(200,169,126,0.3)`;
        }}
        onMouseLeave={e => {
          e.target.style.background = 'transparent';
          e.target.style.color = T.accent;
          e.target.style.boxShadow = 'none';
        }}>
          Begin the Journey
        </a>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: '2rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        opacity: loaded ? 0.5 : 0, transition: 'opacity 1s ease 1s',
      }}>
        <span style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: T.textDim }}>
          SCROLL
        </span>
        <div style={{
          width: 1, height: 30, background: `linear-gradient(to bottom, ${T.accent}, transparent)`,
          animation: 'pulse 2s ease infinite',
        }} />
      </div>
    </section>
  );
};

// ─── About Section ───────────────────────────────────────────
const About = () => (
  <Section id="about">
    <Heading sub="Who I Am" title="About Me" />
    <div style={{
      maxWidth: 800, margin: '0 auto',
      display: 'grid', gap: '2rem',
    }}>
      <Card>
        <p style={{ fontSize: '1.05rem', color: T.text, lineHeight: 1.9 }}>
          I'm <strong style={{ color: T.white }}>Zaid Chaudhary</strong>, a student in the
          Bachelor of Health Sciences (Honours) program at McMaster University. Over
          four years, I've been shaped by interdisciplinary inquiry — blending the
          sciences with the humanities, community engagement, and self-reflection.
        </p>
      </Card>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
      }}>
        {[
          { icon: '🔬', label: 'Inquiry', desc: 'Evidence-based thinking & research methods', color: '#6DBFB8' },
          { icon: '🤝', label: 'Community', desc: 'Service, advocacy & collaborative practice', color: '#CF8BA9' },
          { icon: '🌱', label: 'Growth', desc: 'Personal development & reflective learning', color: '#B8A9C9' },
          { icon: '💡', label: 'Innovation', desc: 'Creative problem-solving & design thinking', color: '#E8B87D' },
        ].map(item => (
          <Card key={item.label} style={{ textAlign: 'center', padding: '1.5rem', borderTop: `3px solid ${item.color}` }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>{item.icon}</div>
            <h4 style={{
              fontFamily: T.serif, color: item.color, fontSize: '1rem',
              marginBottom: '0.5rem',
            }}>{item.label}</h4>
            <p style={{ fontSize: '0.85rem', color: T.textDim, lineHeight: 1.6 }}>
              {item.desc}
            </p>
          </Card>
        ))}
      </div>
    </div>
  </Section>
);

// ─── Timeline / Journey Section ──────────────────────────────
const YEARS = [
  {
    year: 'Year 1',
    title: 'Foundation',
    color: '#6DBFB8',
    items: [
      'Navigated the transition to university life and self-directed learning',
      'Explored interdisciplinary perspectives on health and society',
      'Built a foundation in scientific inquiry and critical analysis',
    ],
  },
  {
    year: 'Year 2',
    title: 'Exploration',
    color: '#B8A9C9',
    items: [
      'Deepened engagement with research methodology and ethics',
      'Pursued community-based projects and volunteer work',
      'Began to identify key areas of interest and passion',
    ],
  },
  {
    year: 'Year 3',
    title: 'Integration',
    color: '#E8B87D',
    items: [
      'Applied knowledge through practicum and experiential learning',
      'Developed leadership skills and mentorship relationships',
      'Integrated interdisciplinary frameworks into personal practice',
    ],
  },
  {
    year: 'Year 4',
    title: 'Synthesis',
    color: '#C8A97E',
    items: [
      'Synthesized four years of learning into a cohesive narrative',
      'Completed capstone projects and final reflections',
      'Prepared to carry forward the lessons of this journey',
    ],
  },
];

const Journey = () => (
  <Section id="journey">
    <Heading sub="The Path" title="My Journey" />
    <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: 20, top: 0, bottom: 0, width: 2,
        background: `linear-gradient(to bottom, ${T.accent}, ${T.border})`,
      }} />

      {YEARS.map((yr, i) => {
        const [ref, vis] = useReveal(0.2);
        return (
          <div key={yr.year} ref={ref} style={{
            paddingLeft: 56, marginBottom: '3rem', position: 'relative',
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateX(0)' : 'translateX(-20px)',
            transition: `all .6s ease ${i * 0.15}s`,
          }}>
            {/* Dot */}
            <div style={{
              position: 'absolute', left: 12, top: 6,
              width: 18, height: 18, borderRadius: '50%',
              background: T.bg, border: `3px solid ${yr.color}`,
            }} />

            <Card>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                marginBottom: '1rem',
              }}>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: yr.color,
                  padding: '0.25rem 0.75rem',
                  border: `1px solid ${yr.color}`,
                  borderRadius: 999,
                }}>{yr.year}</span>
                <h3 style={{
                  fontFamily: T.serif, fontSize: '1.25rem',
                  color: T.white, fontWeight: 600,
                }}>{yr.title}</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {yr.items.map((item, j) => (
                  <li key={j} style={{
                    padding: '0.4rem 0', fontSize: '0.92rem',
                    color: T.textDim, lineHeight: 1.7,
                    display: 'flex', gap: '0.75rem',
                  }}>
                    <span style={{ color: yr.color, flexShrink: 0 }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        );
      })}
    </div>
  </Section>
);

// ─── Reflections Section ─────────────────────────────────────
const REFLECTIONS = [
  {
    title: 'On Inquiry',
    quote: 'The questions we ask shape the knowledge we build.',
    body: 'Through BHSc, I learned that genuine inquiry isn\'t about finding the "right" answer — it\'s about asking questions that open new doors of understanding.',
  },
  {
    title: 'On Vulnerability',
    quote: 'Growth lives at the edge of comfort.',
    body: 'Sharing my ideas in seminars, receiving critical feedback, and sitting with uncertainty taught me that vulnerability is not weakness — it\'s the precondition for learning.',
  },
  {
    title: 'On Connection',
    quote: 'We learn not in isolation, but in community.',
    body: 'The most meaningful moments of my education happened in dialogue — with peers, mentors, and community members who challenged and enriched my perspective.',
  },
];

const Reflections = () => (
  <Section id="reflections">
    <Heading sub="Looking Back" title="Reflections" />
    <div style={{
      maxWidth: 900, margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
      gap: '1.5rem',
    }}>
      {REFLECTIONS.map((r, i) => {
        const [ref, vis] = useReveal(0.15);
        return (
          <div key={r.title} ref={ref} style={{
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(20px)',
            transition: `all .6s ease ${i * 0.12}s`,
          }}>
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{
                fontFamily: T.serif, fontSize: '1.15rem',
                color: T.white, marginBottom: '1rem',
              }}>{r.title}</h3>
              <blockquote style={{
                borderLeft: `3px solid ${T.accent}`,
                paddingLeft: '1rem', marginBottom: '1rem',
                fontStyle: 'italic', color: T.accent, fontSize: '0.95rem',
                lineHeight: 1.7,
              }}>
                "{r.quote}"
              </blockquote>
              <p style={{
                fontSize: '0.9rem', color: T.textDim, lineHeight: 1.8,
                flex: 1,
              }}>{r.body}</p>
            </Card>
          </div>
        );
      })}
    </div>
  </Section>
);

// ─── Contact Section ─────────────────────────────────────────
const Contact = () => (
  <Section id="contact" style={{ textAlign: 'center' }}>
    <Heading sub="Get In Touch" title="Let's Connect" />
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <p style={{
        fontSize: '1rem', color: T.textDim, lineHeight: 1.8,
        marginBottom: '2rem',
      }}>
        Interested in discussing health sciences, research, or collaboration?
        I'd love to hear from you.
      </p>
      <a
        href="mailto:hello@example.com"
        style={{
          display: 'inline-block',
          padding: '0.9rem 2.5rem',
          background: T.accent,
          color: T.bg,
          borderRadius: 999,
          fontSize: '0.9rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          transition: 'all .3s ease',
          border: 'none',
        }}
        onMouseEnter={e => { e.target.style.background = T.white; }}
        onMouseLeave={e => { e.target.style.background = T.accent; }}
      >
        Say Hello
      </a>
    </div>
  </Section>
);

// ─── Footer ──────────────────────────────────────────────────
const Footer = () => (
  <footer style={{
    position: 'relative', zIndex: 1,
    borderTop: `1px solid ${T.border}`,
    padding: '2rem clamp(1.5rem, 5vw, 6rem)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '1rem',
  }}>
    <span style={{
      fontFamily: T.serif, fontSize: '0.9rem', color: T.textDim,
    }}>
      © 2026 Zaid Chaudhary
    </span>
    <span style={{ fontSize: '0.8rem', color: T.textDim }}>
      Praxis Pathways — McMaster BHSc
    </span>
  </footer>
);

// ─── App ─────────────────────────────────────────────────────
export default function App() {
  const [activeSection, setActiveSection] = useState('home');

  // Track active section on scroll
  useEffect(() => {
    const sections = NAV_ITEMS.map(n => n.toLowerCase());
    const handler = () => {
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= 200) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Keyboard shortcuts: 1-5 jump to sections
  useEffect(() => {
    const sections = NAV_ITEMS.map(n => n.toLowerCase());
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= sections.length) {
        const el = document.getElementById(sections[num - 1]);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <GlobalCSS />
      <ScrollProgress />
      <Particles />
      <MouseGlow />
      <Nav active={activeSection} />
      <Hero />
      <About />
      <Journey />
      <Reflections />
      <Contact />
      <Footer />
      <ScrollToTop />
    </>
  );
}
