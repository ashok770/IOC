import React from 'react';
import { EvidenceItem } from '../../types';
import { EvidenceTypeBadge } from './EvidenceTypeBadge';

interface EvidenceRowProps {
  item: EvidenceItem;
  isSelected: boolean;
  onSelect: (item: EvidenceItem) => void;
}

const formatDate = (isoStr?: string | null): string => {
  if (!isoStr) return '--';
  try {
    const d = new Date(isoStr);
    return d.toISOString().split('T')[0] + ' ' + d.toTimeString().slice(0, 5) + ' UTC';
  } catch {
    return isoStr;
  }
};

export const getEvidenceSummary = (item: EvidenceItem): { title: string; subtitle?: string } => {
  const data = (item.data || {}) as Record<string, unknown>;
  const domain = (data.domain as string) || '';

  if (item.evidence_type === 'dns_record') {
    const rType = (data.record_type as string) || 'DNS';
    const val =
      (data.address as string) ||
      (data.exchange as string) ||
      (data.nameserver as string) ||
      (data.target as string) ||
      (data.text as string) ||
      '';
    const ttl = data.ttl ? `TTL: ${data.ttl}s` : '';
    return {
      title: `${rType} → ${val || domain}`,
      subtitle: [domain, ttl].filter(Boolean).join(' • '),
    };
  }

  if (item.evidence_type === 'rdap_registration') {
    const registrar = (data.registrar as string) || 'Registry Record';
    const status = Array.isArray(data.status) ? data.status.slice(0, 2).join(', ') : '';
    return {
      title: `${domain || 'Domain'} Registration (${registrar})`,
      subtitle: status ? `Status: ${status}` : 'Authoritative RDAP Metadata',
    };
  }

  if (item.evidence_type === 'http_headers') {
    const status = data.status_code ? `HTTP ${data.status_code}` : 'HTTP Response';
    const headers = (data.headers as Record<string, string>) || {};
    const server = headers.server ? `Server: ${headers.server}` : '';
    const probed = (data.probed_url as string) || domain;
    return {
      title: `${status}${server ? ` • ${server}` : ''}`,
      subtitle: probed,
    };
  }

  if (item.evidence_type === 'certificate_hostnames') {
    const count = data.total_discovered || (Array.isArray(data.discovered_hostnames) ? data.discovered_hostnames.length : 0);
    return {
      title: `${count} Hostnames Discovered`,
      subtitle: `Certificate Transparency Logs (${domain})`,
    };
  }

  if (item.evidence_type === 'certificate_log_sample') {
    const count = data.total_entries_found || (Array.isArray(data.sample_entries) ? data.sample_entries.length : 0);
    return {
      title: `${count} Log Entries Sampled`,
      subtitle: `crt.sh Transparency Telemetry (${domain})`,
    };
  }

  // Fallback
  return {
    title: domain || item.source,
    subtitle: Object.keys(data).slice(0, 3).join(', '),
  };
};

export const EvidenceRow: React.FC<EvidenceRowProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
  const summary = getEvidenceSummary(item);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(item);
    }
  };

  return (
    <tr
      className={`evidence-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(item)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-selected={isSelected}
    >
      {/* Evidence Type */}
      <td>
        <EvidenceTypeBadge type={item.evidence_type} />
      </td>

      {/* Source */}
      <td>
        <span className="evidence-source-badge">{item.source}</span>
      </td>

      {/* Subject / Observation Summary */}
      <td>
        <div className="evidence-summary-cell">
          <span className="evidence-summary-title" title={summary.title}>
            {summary.title}
          </span>
          {summary.subtitle && (
            <span className="evidence-summary-sub" title={summary.subtitle}>
              {summary.subtitle}
            </span>
          )}
        </div>
      </td>

      {/* Confidence */}
      <td>
        <span
          className="evidence-confidence-cell"
          title={`Observation Confidence: ${(item.confidence * 100).toFixed(0)}% (Factual authoritative source)`}
        >
          {item.confidence.toFixed(2)}
        </span>
      </td>

      {/* Collected At */}
      <td>
        <span className="evidence-date-cell">
          {formatDate(item.collected_at)}
        </span>
      </td>

      {/* Evidence ID */}
      <td>
        <span className="evidence-id-cell" title={item.id}>
          {item.id.slice(0, 8)}...
        </span>
      </td>
    </tr>
  );
};
