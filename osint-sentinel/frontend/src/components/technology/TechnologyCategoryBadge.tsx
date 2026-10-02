import React from 'react';

interface TechnologyCategoryBadgeProps {
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  cdn: 'CDN',
  web_server: 'Web Server',
  framework: 'Framework',
  cms: 'CMS',
  cloud: 'Cloud',
  email: 'Email',
  other: 'Other',
};

export const TechnologyCategoryBadge: React.FC<TechnologyCategoryBadgeProps> = ({ category }) => {
  const normalized = category.toLowerCase().trim();
  const label = CATEGORY_LABELS[normalized] || normalized.replace(/_/g, ' ').toUpperCase();
  const variantClass = CATEGORY_LABELS[normalized]
    ? `tech-category-badge--${normalized}`
    : 'tech-category-badge--other';

  return (
    <span className={`tech-category-badge ${variantClass}`}>
      {label}
    </span>
  );
};
