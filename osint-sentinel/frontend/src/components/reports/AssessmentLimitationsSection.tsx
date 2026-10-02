import React from 'react';

export const AssessmentLimitationsSection: React.FC = () => {
  return (
    <section className="report-section" id="assessment-limitations">
      <div className="report-section-header">
        <span className="section-number">11</span>
        <h2 className="section-title">ASSESSMENT LIMITATIONS</h2>
      </div>

      <p className="report-section-desc">
        This document represents an authorized defensive perimeter analysis. The scope, methodology, and conclusions
        are bounded by the following operational constraints:
      </p>

      <div className="limitations-grid">
        <div className="limitation-item">
          <span className="limitation-num">01</span>
          <div className="limitation-content">
            <h4 className="limitation-title">Passive External Observation Only</h4>
            <p className="limitation-text">
              All findings are derived from public DNS queries, RDAP registries, Certificate Transparency logs, and
              public HTTP response headers. No intrusive port scanning, packet injection, or network fuzzing was
              conducted.
            </p>
          </div>
        </div>

        <div className="limitation-item">
          <span className="limitation-num">02</span>
          <div className="limitation-content">
            <h4 className="limitation-title">Zero Exploitation / No Penetration Testing</h4>
            <p className="limitation-text">
              Zero exploit payloads, proof-of-concept exploits, denial-of-service tests, or security bypass attempts were
              performed. Observed systems were not probed for weakness or accessed beyond normal public interaction.
            </p>
          </div>
        </div>

        <div className="limitation-item">
          <span className="limitation-num">03</span>
          <div className="limitation-content">
            <h4 className="limitation-title">No Credential or Authentication Testing</h4>
            <p className="limitation-text">
              No brute-force attacks, credential stuffing, password spray, or authentication bypass verification was
              executed against identified login portals, VPN gateways, or administrative interfaces.
            </p>
          </div>
        </div>

        <div className="limitation-item">
          <span className="limitation-num">04</span>
          <div className="limitation-content">
            <h4 className="limitation-title">No Internal Network Visibility</h4>
            <p className="limitation-text">
              This assessment provides visibility strictly into publicly observable external assets. Internal subnets,
              private split-horizon DNS, air-gapped systems, and protected LAN infrastructure are entirely out of scope.
            </p>
          </div>
        </div>

        <div className="limitation-item">
          <span className="limitation-num">05</span>
          <div className="limitation-content">
            <h4 className="limitation-title">Technology Observation ≠ Vulnerability</h4>
            <p className="limitation-text">
              The detection of a specific web server, proxy, or software component indicates its presence and public
              disclosure. It does not establish the presence of exploitable security vulnerabilities or patch deficits.
            </p>
          </div>
        </div>

        <div className="limitation-item">
          <span className="limitation-num">06</span>
          <div className="limitation-content">
            <h4 className="limitation-title">Exposure Signals ≠ Compromise</h4>
            <p className="limitation-text">
              Observed signals (e.g. pre-production naming conventions, remote-access identifiers) are heuristic flags for
              defensive review. They do not constitute evidence of security compromise or unauthorized access.
            </p>
          </div>
        </div>

        <div className="limitation-item">
          <span className="limitation-num">07</span>
          <div className="limitation-content">
            <h4 className="limitation-title">Prioritization Heuristic vs. Universal Standard</h4>
            <p className="limitation-text">
              Assessment scores (0–100) and priority tiers (P1–P4) are internal OSINT Sentinel triage weights designed to
              guide defensive investigation. They are not universal industry metrics, CVSS ratings, or compliance certifications.
            </p>
          </div>
        </div>

        <div className="limitation-item">
          <span className="limitation-num">08</span>
          <div className="limitation-content">
            <h4 className="limitation-title">Point-in-Time Telemetry</h4>
            <p className="limitation-text">
              Public DNS configurations, IP allocations, and HTTP headers can change rapidly. Findings reflect the target's
              state at the recorded collection timestamps and require periodic re-assessment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
