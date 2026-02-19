import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".footer-anim", {
        scrollTrigger: { trigger: footerRef.current, start: "top 90%", toggleActions: "play none none none" },
        y: 20, opacity: 0, stagger: 0.1, duration: 0.6, ease: "power2.out",
      });
    }, footerRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer id="footer" ref={footerRef} className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-anim">
            <div className="footer-about-logo">
              <div className="nav-logo-icon">F</div>
              <span className="nav-logo-text">File It Responsibly</span>
            </div>
            <p className="footer-about-desc">
              FIR is a voice-powered, AI-guided tool designed to make filing First
              Information Reports accessible to everyone — regardless of literacy
              or language. Built with the belief that justice should have no barriers.
            </p>
            <p className="footer-about-langs">
              Supports Telugu and English.
            </p>
          </div>

          <div className="footer-anim">
            <h4 className="footer-links-title">Quick Links</h4>
            <ul>
              {[
                { label: "Home", id: "hero" },
                { label: "How It Works", id: "how-it-works" },
                { label: "File FIR", id: "chat" },
                { label: "Report", id: "report" },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    className="footer-link"
                    onClick={() =>
                      document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="section-divider" style={{ marginTop: 48 }} />
        <div className="footer-bottom footer-anim">
          <p className="footer-copy">
            © {new Date().getFullYear()} File It Responsibly. Built for the people.
          </p>
          <span className="footer-heart">Made with ❤️ for accessible justice</span>
        </div>
      </div>
    </footer>
  );
}
