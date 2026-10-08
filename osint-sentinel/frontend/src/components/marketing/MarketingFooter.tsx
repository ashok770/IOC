import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../brand/Logo';

export const MarketingFooter: React.FC = () => {
  const scrollToSection = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="marketing-footer" role="contentinfo">
      <div className="marketing-container">
        <div className="footer-top">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <Logo variant="full" />
            <p className="footer-desc">
              Evidence-driven external security intelligence platform designed exclusively
              for authorized assessments of public-facing infrastructure.
            </p>
          </div>

          {/* Product Col */}
          <div>
            <div className="footer-col-title">PRODUCT</div>
            <ul className="footer-links">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('product')}
                  className="marketing-nav-link"
                >
                  Connected Entities
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('traces')}
                  className="marketing-nav-link"
                >
                  Observable Footprint
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('evidence')}
                  className="marketing-nav-link"
                >
                  Evidence Provenance
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('relationships')}
                  className="marketing-nav-link"
                >
                  Correlation Engine
                </button>
              </li>
            </ul>
          </div>

          {/* Methodology Col */}
          <div>
            <div className="footer-col-title">METHODOLOGY</div>
            <ul className="footer-links">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('methodology')}
                  className="marketing-nav-link"
                >
                  6-Stage Pipeline
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('security')}
                  className="marketing-nav-link"
                >
                  Passive-First Recon
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('workflow')}
                  className="marketing-nav-link"
                >
                  Assessment Flow
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('security')}
                  className="marketing-nav-link"
                >
                  Auditable Governance
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Col */}
          <div>
            <div className="footer-col-title">PLATFORM</div>
            <ul className="footer-links">
              <li>
                <Link to="/overview" className="footer-link">
                  Target Overview
                </Link>
              </li>
              <li>
                <Link to="/assets" className="footer-link">
                  Asset Inventory
                </Link>
              </li>
              <li>
                <Link to="/exposure" className="footer-link">
                  Exposure Signals
                </Link>
              </li>
              <li>
                <Link to="/reports" className="footer-link">
                  Assessment Reports
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Authorization Statement */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} OSINT Sentinel. Authorized External Security Exposure Assessment Platform.
          </div>
          <div style={{ maxWidth: '640px', lineHeight: 1.5 }}>
            <strong>Authorization Notice:</strong> OSINT Sentinel is designed exclusively for authorized
            security evaluations of organizational public infrastructure. All observations are derived strictly
            from publicly accessible data sources and standard non-invasive protocol queries.
          </div>
        </div>
      </div>
    </footer>
  );
};
