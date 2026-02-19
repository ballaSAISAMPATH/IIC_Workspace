import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { id: "hero", label: "Home" },
  { id: "how-it-works", label: "How It Works" },
  { id: "chat", label: "File FIR" },
  { id: "report", label: "Report" },
  { id: "footer", label: "About" },
];

export default function Navbar() {
  const [active, setActive] = useState("hero");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      const sections = NAV_ITEMS.map((n) => document.getElementById(n.id)).filter(Boolean);
      let current = "hero";
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= 200) current = section.id;
      }
      // If scrolled to the very bottom, force "About" active
      if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
        current = "footer";
      }
      setActive(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <nav className={`navbar no-print ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <button className="nav-logo" onClick={() => scrollTo("hero")}>
          <div className="nav-logo-icon">F</div>
          <span className="nav-logo-text">
            FIR<span className="nav-logo-version"></span>
          </span>
        </button>

        <div className="nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${active === item.id ? "active" : ""}`}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          className="nav-mobile-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>

        <button className="nav-cta nav-cta-desktop" onClick={() => scrollTo("chat")}>
          Start Filing →
        </button>
      </div>

      <div className={`nav-mobile-dropdown ${mobileOpen ? "open" : ""}`}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-link ${active === item.id ? "active" : ""}`}
            onClick={() => scrollTo(item.id)}
          >
            {item.label}
          </button>
        ))}
        <button className="nav-cta" onClick={() => scrollTo("chat")}>
          Start Filing →
        </button>
      </div>
    </nav>
  );
}
