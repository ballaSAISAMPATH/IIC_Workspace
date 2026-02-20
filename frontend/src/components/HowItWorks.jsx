import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { num: "01", icon: "🎙️", title: "Speak Your Problem", desc: "Tap the microphone and explain what happened in your own language. No typing needed — just talk naturally." },
  { num: "02", icon: "🤖", title: "AI Asks Follow-ups", desc: "Our assistant will ask you simple questions one by one to collect all necessary details for the FIR." },
  { num: "03", icon: "📋", title: "Review Your FIR", desc: "Once all information is gathered, a complete FIR report is generated. Review every detail carefully." },
  { num: "04", icon: "📥", title: "Download or Print", desc: "Save your FIR as PDF, TXT, or DOC. You can also print it directly. Your report, your way." },
];

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".how-header-anim", {
        scrollTrigger: { trigger: sectionRef.current, start: "top 85%", toggleActions: "play none none none" },
        y: 30, opacity: 0, stagger: 0.12, duration: 0.7, ease: "power2.out",
      });

      gsap.from(".steps-timeline-line", {
        scrollTrigger: { trigger: gridRef.current, start: "top 85%", toggleActions: "play none none none" },
        scaleX: 0, transformOrigin: "left center", duration: 1.2, ease: "power2.inOut",
      });

      const cards = gridRef.current?.querySelectorAll(".step-card");
      if (cards && cards.length > 0) {
        gsap.fromTo(cards,
          { y: 50, opacity: 0 },
          {
            scrollTrigger: { trigger: gridRef.current, start: "top 88%", toggleActions: "play none none none" },
            y: 0, opacity: 1, stagger: 0.13, duration: 0.7, ease: "power3.out",
          }
        );
      }

      const icons = gridRef.current?.querySelectorAll(".step-card-icon");
      if (icons && icons.length > 0) {
        gsap.fromTo(icons,
          { scale: 0, rotation: -20 },
          {
            scrollTrigger: { trigger: gridRef.current, start: "top 88%", toggleActions: "play none none none" },
            scale: 1, rotation: 0, stagger: 0.13, duration: 0.5, delay: 0.3, ease: "back.out(2)",
          }
        );
      }

      if (ctaRef.current) {
        gsap.from(ctaRef.current, {
          scrollTrigger: { trigger: ctaRef.current, start: "top 92%", toggleActions: "play none none none" },
          y: 20, opacity: 0, duration: 0.6, ease: "power2.out",
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="how-section">
      <div className="section-divider" />
      <div className="how-inner">
        <div className="section-header">
          <span className="section-badge how-header-anim">How It Works</span>
          <h2 className="section-title how-header-anim">Four simple steps</h2>
          <p className="section-desc how-header-anim">
            Designed for everyone — even if you've never used a computer before.
          </p>
        </div>

        <div className="steps-timeline">
          <div className="steps-timeline-line" />
        </div>

        <div className="steps-grid" ref={gridRef}>
          {STEPS.map((step) => (
            <div key={step.num} className="step-card">
              <span className="step-card-watermark">{step.num}</span>
              <div className="step-card-dot" />
              <div className="step-card-icon">{step.icon}</div>
              <div className="step-card-num">Step {step.num}</div>
              <h3 className="step-card-title">{step.title}</h3>
              <p className="step-card-desc">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="how-cta-row" ref={ctaRef}>
          <p className="how-cta-text">
            Ready to file your FIR? It takes less than <strong>2 minutes</strong>.
          </p>
          <button className="how-cta-btn" onClick={() => document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" })}>
            Start Filing Now →
          </button>
        </div>
      </div>
    </section>
  );
}
