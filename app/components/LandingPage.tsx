"use client";
import { useState, useEffect } from "react";
import AawazLogo from "./AawazLogo";
import VoiceCommandHub from "./VoiceCommandHub";

interface LandingPageProps {
  onExplore: (initialCommand?: string) => void;
}

export default function LandingPage({ onExplore }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = ['hero', 'workflow', 'agents', 'testimonials'];
      const newVisible = sections.filter(id => {
        const el = document.getElementById(id);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.8;
      });
      setVisibleSections(newVisible);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const agents = [
    { title: "Transaction Agent", icon: "🟣", desc: "Safe, voice-verified Monad transfers and balance checks.", color: "#8b5cf6" },
    { title: "Hyperliquid Perps", icon: "💧", desc: "AI-guarded leveraged trading with strict risk management.", color: "#3b82f6" },
    { title: "Sign Language Hub", icon: "🤟", desc: "Inclusive gesture-based interaction for non-verbal users.", color: "#818cf8" },
    { title: "Contract Creator", icon: "🧠", desc: "Generate Anchor-ready Rust code from natural speech.", color: "#6366f1" },
    { title: "Network Analyzer", icon: "🌐", desc: "Real-time Monad health and congestion analysis.", color: "#10b981" },
    { title: "AI Marketplace", icon: "🛒", desc: "Discover and trade custom-trained voice AI agents.", color: "#ec4899" }
  ];

  const steps = [
    { num: "01", title: "Wake Up Aawaz", desc: "Use the central Voice Hub onto any tool instantly.", icon: "🎙️" },
    { num: "02", title: "Speak Your Intent", desc: "Simply say 'Send MON' or 'Audit this contract'.", icon: "🗣️" },
    { num: "03", title: "AI Precision", desc: "Our agents parse and validate your voice instantly.", icon: "🛡️" },
    { num: "04", title: "Experience Web3", desc: "All details appear in a clean, professional window.", icon: "⚡" }
  ];

  const testimonials = [
    { name: "Solana Whale", text: "Aawaz is the first voice agent that actually understands my complex transaction requests. It's a game changer.", avatar: "🐋" },
    { name: "DeFi Degen", text: "The contract analysis saved me from a potential rug pull. The voice interface is just the cherry on top!", avatar: "🔥" },
    { name: "Anchor Dev", text: "Generating boilerplate with voice feels like living in the future. Highly recommended for any Monad builder.", avatar: "🛠️" }
  ];

  return (
    <div className="landing-wrapper">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');

        .landing-wrapper {
          min-height: 100vh;
          background: #020617;
          color: #f1f5f9;
          font-family: 'Outfit', sans-serif;
          overflow-x: hidden;
          overflow-y: auto; /* Explicitly allow scroll */
          position: relative;
        }

        .landing-wrapper::before {
            content: '';
            position: fixed; // Fixed for performance
            top: 0; left: 0; right: 0; bottom: 0;
            background: 
                radial-gradient(circle at 20% 30%, rgba(30, 30, 30, 0.3) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(40, 40, 40, 0.2) 0%, transparent 40%);
            z-index: 0;
            pointer-events: none;
        }
        /* Removed heavy flowGlow animation to fix "walking slowly" lag */

        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 25px 80px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          background: ${scrolled ? "rgba(2, 6, 23, 0.85)" : "transparent"};
          backdrop-filter: ${scrolled ? "blur(40px)" : "none"};
          border-bottom: ${scrolled ? "1px solid rgba(255, 255, 255, 0.05)" : "none"};
        }

        .nav-links {
          display: flex;
          gap: 50px;
          align-items: center;
        }

        .nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-weight: 700;
          font-size: 1.15rem;
          transition: all 0.3s;
          letter-spacing: -0.5px;
        }

        .nav-link:hover {
          color: #e2e8f0;
          transform: translateY(-2px);
        }

        .launch-btn {
            background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
            color: white !important;
            padding: 12px 30px;
            border-radius: 50px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        .hero {
          min-height: 110vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 0 40px;
          background: radial-gradient(circle at center, rgba(30, 30, 30, 0.3) 0%, rgba(2, 6, 23, 1) 70%);
          position: relative;
          z-index: 1;
        }

        .hero-title {
          font-size: 10rem;
          font-weight: 950;
          line-height: 0.8;
          margin-bottom: 20px;
          letter-spacing: -6px;
          background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 30px rgba(100, 100, 100, 0.4)) drop-shadow(0 20px 60px rgba(0,0,0,0.5));
          animation: titleFadeIn 1.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes titleFadeIn {
          from { transform: translateY(80px) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .hero-subtitle {
          font-size: 1.9rem;
          color: #94a3b8;
          max-width: 950px;
          margin-bottom: 60px;
          line-height: 1.5;
          font-weight: 500;
          animation: fadeIn 1s ease-out 0.6s backwards;
        }

        .voice-hub-wrapper {
            animation: bounceIn 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.8s backwards;
        }

        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .section-container {
          padding: 150px 80px;
          max-width: 1500px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 4.5rem;
          font-weight: 900;
          text-align: center;
          margin-bottom: 100px;
          letter-spacing: -2.5px;
          color: #ffffff;
        }

        /* WORKFLOW */
        .workflow-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 60px;
        }

        .step-card {
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(10px);
            padding: 60px 40px;
            border-radius: 50px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .step-card:hover {
            transform: translateY(-20px);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
            border-color: rgba(100, 100, 100, 0.4);
            background: rgba(30, 41, 59, 0.6);
        }

        /* AGENTS GRID */
        .agent-card {
            padding: 60px;
            border-radius: 60px;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            border: 1px solid rgba(255, 255, 255, 0.03);
            transition: all 0.4s;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }

        .agent-card:hover {
            transform: scale(1.02);
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
            border-color: #64748b;
            background: rgba(30, 41, 59, 0.7);
        }

        /* TESTIMONIALS PREMIUM */
        .testo-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 40px;
        }

        .premium-testo-card {
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(15px);
            padding: 60px;
            border-radius: 60px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            gap: 30px;
            transition: all 0.4s;
        }

        .premium-testo-card:hover {
            background: rgba(30, 41, 59, 0.6);
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
            transform: translateY(-15px);
            border-color: rgba(100, 100, 100, 0.3);
        }

        .testo-quote {
            font-size: 1.5rem;
            font-style: italic;
            color: #cbd5e1;
            line-height: 1.7;
            font-weight: 500;
        }

        .testo-author {
            font-weight: 900;
            color: #ffffff;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 15px;
            border-top: 2px solid rgba(255, 255, 255, 0.05);
            padding-top: 30px;
        }

        .footer {
          background: #030712;
          color: white;
          padding: 160px 80px 80px;
          text-align: center;
          border-radius: 100px 100px 0 0;
        }

        .footer-kush {
          font-size: 2.2rem;
          font-weight: 900;
          background: linear-gradient(135deg, #e2e8f0, #94a3b8, #64748b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-decoration: none;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1200px) {
          .hero-title { font-size: 5rem; }
          .workflow-grid, .testo-container { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
           .workflow-grid, .testo-container { grid-template-columns: 1fr; }
           .navbar { padding: 20px 30px; }
        }
      `}</style>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <AawazLogo size="small" onClick={() => { if (typeof window !== 'undefined') window.speechSynthesis.cancel(); onExplore(); }} />
        <div className="nav-links">
          <a href="#workflow" className="nav-link" onClick={() => { if (typeof window !== 'undefined') window.speechSynthesis.cancel(); }}>Workflow</a>
          <a href="#agents" className="nav-link" onClick={() => { if (typeof window !== 'undefined') window.speechSynthesis.cancel(); }}>Agents</a>
          <a href="#" className="nav-link launch-btn" onClick={(e) => {
            e.preventDefault();
            if (typeof window !== "undefined") window.speechSynthesis.cancel();
            onExplore();
          }}>Launch Aawaz ⚡</a>
        </div>
      </nav>

      <header id="hero" className="hero">
        <h1 className={`hero-title ${visibleSections.includes('hero') ? 'visible' : ''}`}
          onClick={() => { if (typeof window !== 'undefined') window.speechSynthesis.cancel(); onExplore(); }}
          style={{ cursor: "pointer" }}
        >
          Aawaz
        </h1>
        <p style={{
          fontSize: "1.8rem",
          fontWeight: "800",
          color: "#94a3b8",
          marginBottom: "60px",
          letterSpacing: "4px",
          textTransform: "uppercase",
          opacity: 0.8
        }}>
          The Monad Super Agent
        </p>

        <div className="voice-hub-wrapper">
          <VoiceCommandHub
            onCommand={(cmd) => {
              if (typeof window !== "undefined") window.speechSynthesis.cancel();
              onExplore(cmd);
            }}
            onStopSpeech={() => {
              if (typeof window !== "undefined") window.speechSynthesis.cancel();
            }}
          />
        </div>
        <p style={{ marginTop: "30px", color: "#f1f5f9", fontWeight: "900", fontSize: "1.2rem", textShadow: "0 0 10px rgba(100, 100, 100, 0.5)" }}>"Open Hyperliquid Trading"</p>
      </header>

      <section id="workflow" className="section-container">
        <h2 className="section-title">The Workflow</h2>
        <div className="workflow-grid">
          {steps.map((s, i) => (
            <div key={i} className="step-card" style={{ animation: `fadeIn 1s ease-out ${i * 0.2}s backwards` }}>
              <div style={{ fontSize: "4rem", marginBottom: "30px" }}>{s.icon}</div>
              <div style={{ color: "#94a3b8", fontWeight: "900", fontSize: "1.2rem", marginBottom: "15px" }}>{s.num}</div>
              <h3 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "15px", letterSpacing: "-1px" }}>{s.title}</h3>
              <p style={{ color: "#94a3b8", fontSize: "1.15rem", lineHeight: "1.6" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="agents" className="section-container" style={{ background: "rgba(15, 23, 42, 0.4)", borderRadius: "120px" }}>
        <h2 className="section-title">One Voice for Every Tool</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "40px" }}>
          {agents.map((a, i) => (
            <div key={i} className="agent-card" onClick={() => {
              if (typeof window !== 'undefined') window.speechSynthesis.cancel();
              onExplore();
            }}>
              <div style={{ fontSize: "4.5rem", marginBottom: "30px" }}>{a.icon}</div>
              <h3 style={{ fontSize: "2.2rem", fontWeight: "900", marginBottom: "20px", letterSpacing: "-1.5px" }}>{a.title}</h3>
              <p style={{ color: "#94a3b8", fontSize: "1.25rem", lineHeight: "1.6" }}>{a.desc}</p>
              <div style={{ marginTop: "40px", fontWeight: "800", color: "#94a3b8", fontSize: "1.1rem" }}>Launch Agent →</div>
            </div>
          ))}
        </div>
      </section>

      <section id="testimonials" className="section-container">
        <h2 className="section-title">Trusted by the Ecosystem</h2>
        <div className="testo-container">
          {testimonials.map((t, i) => (
            <div key={i} className="premium-testo-card">
              <div style={{ fontSize: "4rem" }}>{t.avatar}</div>
              <p className="testo-quote">"{t.text}"</p>
              <div className="testo-author">
                <span style={{ fontSize: "1.5rem" }}>💬</span>
                {t.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div style={{ marginBottom: "80px" }}><AawazLogo /></div>
        <div style={{ fontSize: "5rem", fontWeight: "900", marginBottom: "40px", letterSpacing: "-3px", lineHeight: "1.1" }}>Built for the <br /> Next Billion.</div>

        <button style={{ padding: "22px 80px", background: "white", color: "#030712", borderRadius: "60px", fontSize: "1.6rem", fontWeight: "900", border: "none", cursor: "pointer", marginBottom: "100px" }} onClick={() => {
          if (typeof window !== 'undefined') window.speechSynthesis.cancel();
          onExplore();
        }}>Join the Revolution ⚡</button>

        <div style={{ borderTop: "1px solid #1f2937", paddingTop: "80px" }}>
          <p style={{ fontSize: "1.8rem" }}>Made with ❤️ from <a href="https://www.linkedin.com/in/kush-anchalia-41678a228/" target="_blank" className="footer-kush">Kush</a></p>
          <p style={{ color: "#4b5563", marginTop: "30px", fontSize: "1rem" }}>© 2026 Aawaz Labs. Simplifying Web3, one voice at a time.</p>
        </div>
      </footer>
    </div>
  );
}
