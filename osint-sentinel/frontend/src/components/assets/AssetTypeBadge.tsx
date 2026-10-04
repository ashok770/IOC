import React from 'react';
import { AssetType } from '../../types';

interface AssetTypeBadgeProps {
  type: AssetType;
  className?: string;
}

export const AssetTypeBadge: React.FC<AssetTypeBadgeProps> = ({ type, className = '' }) => {
  const normalized = (type || '').toLowerCase();

  const getLabel = () => {
    switch (normalized) {
      case 'domain':
        return 'Domain';
      case 'subdomain':
        return 'Subdomain';
      case 'ip':
        return 'IP Address';
      case 'certificate_associated_hostname':
      case 'certificate_hostname':
        return 'Cert Hostname';
      default:
        return type;
    }
  };

  const getVariantClass = () => {
    switch (normalized) {
      case 'domain':
        return 'asset-type-badge--domain';
      case 'subdomain':
        return 'asset-type-badge--subdomain';
      case 'ip':
        return 'asset-type-badge--ip';
      case 'certificate_associated_hostname':
      case 'certificate_hostname':
        return 'asset-type-badge--cert';
      default:
        return 'asset-type-badge--default';
    }
  };

  return (
    <span className={`asset-type-badge ${getVariantClass()} ${className}`}>
      {getLabel()}
    </span>
  );
};
