import React, { useEffect } from 'react';
import {
  MarketingNav,
  HeroSection,
  TraceSection,
  IntelligencePipeline,
  ExternalViewSection,
  EvidenceSection,
  RelationshipSection,
  AuthorizedAssessmentSection,
  AssessmentWorkflow,
  FinalCTA,
  MarketingFooter,
} from '../components/marketing';

import '../design/tokens/design-tokens.css';
import '../design/typography/typography.css';
import '../design/motion/motion.css';
import '../components/marketing/marketing.css';

export const MarketingHomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'OSINT Sentinel — Authorized External Security Exposure Assessment Platform';
  }, []);

  return (
    <div className="marketing-root" id="marketing-top">
      {/* 1. Minimal Premium Navigation */}
      <MarketingNav />

      <main id="main-content" role="main">
        {/* Section 1: Hero */}
        <HeroSection />

        {/* Section 2: Observable Footprint / Traces */}
        <TraceSection />

        {/* Section 3: Six-Stage Intelligence Pipeline */}
        <IntelligencePipeline />

        {/* Section 4: External View (8 Entity Types) */}
        <ExternalViewSection />

        {/* Section 5: Factual Evidence Provenance */}
        <EvidenceSection />

        {/* Section 6: Relationships Reveal Context (Obsidian Technical Surface) */}
        <RelationshipSection />

        {/* Section 7: Authorized by Design Principles */}
        <AuthorizedAssessmentSection />

        {/* Section 8: End-to-End Assessment Workflow */}
        <AssessmentWorkflow />

        {/* Section 9: Final Conversion Action */}
        <FinalCTA />
      </main>

      {/* 10. Commercial Footer */}
      <MarketingFooter />
    </div>
  );
};
