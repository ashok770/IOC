import React from 'react';

interface ExposureTypeBadgeProps {
  type: string;
  className?: string;
}

export const ExposureTypeBadge: React.FC<ExposureTypeBadgeProps> = ({ type, className = '' }) => {
  const normalized = (type || '').toLowerCase();

  const getLabel = () => {
    switch (normalized) {
      case 'remote_access_indicator':
        return 'Remote Access Indicator';
      case 'development_test_indicator':
        return 'Development / Test Indicator';
      case 'technology_disclosure':
        return 'Technology Disclosure';
      case 'external_dependency_reference':
        return 'External Dependency Reference';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const getVariantClass = () => {
    switch (normalized) {
      case 'remote_access_indicator':
        return 'signal-type-badge--remote';
      case 'development_test_indicator':
        return 'signal-type-badge--dev';
      case 'technology_disclosure':
        return 'signal-type-badge--tech';
      case 'external_dependency_reference':
        return 'signal-type-badge--dep';
      default:
        return 'signal-type-badge--default';
    }
  };

  return (
    <span className={`signal-type-badge ${getVariantClass()} ${className}`}>
      {getLabel()}
    </span>
  );
};
