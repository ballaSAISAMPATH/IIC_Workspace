import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function HeroSection() {
  const containerRef = useRef(null);
  const fExpandRef = useRef(null);
  const iExpandRef = useRef(null);
  const rExpandRef = useRef(null);
  const subtitleRef = useRef(null);
  const badgesRef = useRef(null);
  const scrollRef = useRef(null);
  const taglineRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([fExpandRef.current, iExpandRef.current, rExpandRef.current], {
        width: 0, opacity: 0, overflow: "hidden", display: "inline-block",
      });
      gsap.set(taglineRef.current, { opacity: 0, y: 12 });
      gsap.set(subtitleRef.current, { opacity: 0, y: 24 });
      gsap.set(badgesRef.current, { opacity: 0, y: 20 });
      gsap.set(scrollRef.current, { opacity: 0 });
      gsap.set(statsRef.current, { opacity: 0, y: 16 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.3 });

      // Letters fly in
      tl.from(".fir-letter", {
        y: 70, opacity: 0, rotationX: -50, stagger: 0.18, duration: 1.1, ease: "back.out(1.3)",
      });

      // Small tagline above title fades in
      tl.to(taglineRef.current, { opacity: 1, y: 0, duration: 0.5 }, "-=0.4");

      // Expand into full words with a stagger cascade
      tl.to(fExpandRef.current, { width: "auto", opacity: 1, duration: 0.55, ease: "power2.inOut" }, "+=0.4");
      tl.to(iExpandRef.current, { width: "auto", opacity: 1, duration: 0.35, ease: "power2.inOut" }, "-=0.2");
      tl.to(rExpandRef.current, { width: "auto", opacity: 1, duration: 0.55, ease: "power2.inOut" }, "-=0.2");

      // Subtitle
      tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.7 }, "-=0.15");

      // Badges stagger in
      tl.to(badgesRef.current, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3");
      tl.from(".hero-badge", { y: 8, opacity: 0, stagger: 0.08, duration: 0.35, ease: "power2.out" }, "-=0.3");

      // Stats row
      tl.to(statsRef.current, { opacity: 1, y: 0, duration: 0.5 }, "-=0.15");
      tl.from(".hero-stat", { y: 10, opacity: 0, stagger: 0.1, duration: 0.35, ease: "power2.out" }, "-=0.3");

      // Scroll indicator
      tl.to(scrollRef.current, { opacity: 1, duration: 0.6 }, "-=0.1");

      // Floating orbs
      gsap.to(".hero-orb", {
        y: "random(-18, 18)", x: "random(-12, 12)",
        duration: "random(5, 8)", repeat: -1, yoyo: true,
        ease: "sine.inOut", stagger: { each: 1, from: "random" },
      });

      // Parallax on mouse for orbs
      const handleMouse = (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(".hero-orb-1", { x: x * 15, y: y * 10, duration: 1.2, ease: "power2.out" });
        gsap.to(".hero-orb-2", { x: x * -10, y: y * -8, duration: 1.2, ease: "power2.out" });
        gsap.to(".hero-orb-3", { x: x * 8, y: y * 12, duration: 1.2, ease: "power2.out" });
      };
      window.addEventListener("mousemove", handleMouse);
      return () => window.removeEventListener("mousemove", handleMouse);
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const scrollToChat = () => {
    document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" ref={containerRef} className="hero">
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      <div className="hero-content">
        {/* Small tagline above title */}
        <div ref={taglineRef} className="hero-tagline">
          Justice should have no barriers
        </div>

        <div className="hero-title-row">
          <span className="hero-word">
            <span className="fir-letter hero-letter">F</span>
            <span ref={fExpandRef} className="hero-expand">ile</span>
          </span>
          <span className="hero-word">
            <span className="fir-letter hero-letter">I</span>
            <span ref={iExpandRef} className="hero-expand">t</span>
          </span>
          <span className="hero-word">
            <span className="fir-letter hero-letter">R</span>
            <span ref={rExpandRef} className="hero-expand">esponsibly</span>
          </span>
        </div>

        <p ref={subtitleRef} className="hero-subtitle">
          Voice-powered FIR filing assistant. Speak in your language, we handle
          the paperwork. 
        </p>

        <div ref={badgesRef} className="hero-badges">
          {[
            { icon: "🎙️", text: "Voice Input" },
            { icon: "🌐", text: "Telugu & More" },
            { icon: "🤖", text: "AI Guided" },
            { icon: "📄", text: "Instant Report" },
          ].map((b) => (
            <span key={b.text} className="hero-badge">
              <span className="hero-badge-icon">{b.icon}</span>
              {b.text}
            </span>
          ))}
        </div>

        {/* Stats row — social proof */}
        <div ref={statsRef} className="hero-stats">
          {[
            { value: "EN", label: "English" },
            { value: "100%", label: "Free & Open" },
            { value: "< 2min", label: "To File" },
            { value: "PDF/DOC", label: "Export" },
          ].map((s) => (
            <div key={s.label} className="hero-stat">
              <span className="hero-stat-value">{s.value}</span>
              <span className="hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div ref={scrollRef} className="hero-scroll-wrap">
          <button onClick={scrollToChat} className="hero-scroll">
            <span className="hero-scroll-label">Scroll to begin</span>
            <svg className="hero-scroll-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
