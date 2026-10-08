import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../brand/Logo';

export const MarketingNav: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="marketing-nav" role="banner">
      <div className="marketing-container marketing-nav-inner">
        {/* Left: Brand Identity */}
        <Link
          to="/"
          style={{ textDecoration: 'none', color: 'inherit' }}
          aria-label="OSINT Sentinel Home"
        >
          <Logo variant="full" />
        </Link>

        {/* Center: Primary Editorial Navigation */}
        <nav
          className="marketing-nav-links"
          aria-label="Main Navigation"
          role="navigation"
        >
          <button
            onClick={() => scrollToSection('product')}
            className="marketing-nav-link"
            type="button"
          >
            Product
          </button>
          <button
            onClick={() => scrollToSection('methodology')}
            className="marketing-nav-link"
            type="button"
          >
            Methodology
          </button>
          <button
            onClick={() => scrollToSection('security')}
            className="marketing-nav-link"
            type="button"
          >
            Security
          </button>
        </nav>

        {/* Right: Platform Entrypoint Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/overview"
            className="marketing-nav-cta"
            id="nav-platform-btn"
            aria-label="Go to Platform Application"
          >
            <span>PLATFORM</span>
            <span aria-hidden="true">→</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="marketing-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="marketing-mobile-drawer is-open">
          <button
            onClick={() => scrollToSection('product')}
            className="marketing-nav-link"
            style={{ textAlign: 'left' }}
            type="button"
          >
            Product
          </button>
          <button
            onClick={() => scrollToSection('methodology')}
            className="marketing-nav-link"
            style={{ textAlign: 'left' }}
            type="button"
          >
            Methodology
          </button>
          <button
            onClick={() => scrollToSection('security')}
            className="marketing-nav-link"
            style={{ textAlign: 'left' }}
            type="button"
          >
            Security
          </button>
          <div style={{ paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
            <Link
              to="/overview"
              className="marketing-nav-cta"
              style={{ display: 'inline-flex', width: '100%', justifyContent: 'center' }}
            >
              <span>PLATFORM</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
