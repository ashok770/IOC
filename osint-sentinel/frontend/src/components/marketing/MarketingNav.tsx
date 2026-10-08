import React, { useState, useEffect } from 'react';
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

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="marketing-nav" role="banner">
      <div className="marketing-container marketing-nav-inner">
        {/* Left: Brand Identity */}
        <Link
          to="/"
          className="marketing-nav-brand"
          aria-label="OSINT Sentinel Home — External Security Intelligence"
        >
          <Logo variant="full" />
        </Link>

        {/* Center / Right: Primary Editorial Navigation */}
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

        {/* Far Right: Platform Entrypoint Action */}
        <div className="marketing-nav-actions">
          <Link
            to="/overview"
            className="marketing-nav-cta"
            id="nav-platform-btn"
            aria-label="Enter Platform Application"
          >
            <span>PLATFORM</span>
            <span className="marketing-nav-cta-arrow" aria-hidden="true">→</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="marketing-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="marketing-mobile-drawer"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
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
              aria-hidden="true"
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
        <div
          id="marketing-mobile-drawer"
          className="marketing-mobile-drawer is-open"
          role="region"
          aria-label="Mobile Navigation Drawer"
        >
          <button
            onClick={() => scrollToSection('product')}
            className="marketing-mobile-link"
            type="button"
          >
            Product
          </button>
          <button
            onClick={() => scrollToSection('methodology')}
            className="marketing-mobile-link"
            type="button"
          >
            Methodology
          </button>
          <button
            onClick={() => scrollToSection('security')}
            className="marketing-mobile-link"
            type="button"
          >
            Security
          </button>
          <div className="marketing-mobile-cta-wrap">
            <Link
              to="/overview"
              className="marketing-nav-cta marketing-mobile-cta"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>PLATFORM</span>
              <span className="marketing-nav-cta-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
