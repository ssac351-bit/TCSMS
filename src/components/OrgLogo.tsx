import React from 'react';
import { Shield, Building, Globe, FileText, Sliders } from 'lucide-react';

interface OrgLogoProps {
  orgId: string;
  size?: number;
  className?: string;
  // Optional pre-fetched style and url (to avoid reading localStorage multiple times in heavy renders)
  logoStyle?: string;
  logoUrl?: string;
}

export const OrgLogo: React.FC<OrgLogoProps> = ({
  orgId,
  size = 24,
  className = '',
  logoStyle,
  logoUrl,
}) => {
  // If not provided as props, load from localStorage
  const resolvedStyle = logoStyle || localStorage.getItem(`tanzil_logo_style_${orgId}`) || 'shield';
  const resolvedUrl = logoUrl || localStorage.getItem(`tanzil_logo_url_${orgId}`) || '';

  // 1. Render custom uploaded logo image if available
  if (resolvedUrl) {
    return (
      <div 
        className={`shrink-0 overflow-hidden rounded-full border border-slate-200/80 bg-white flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <img 
          src={resolvedUrl} 
          alt="Organization Logo" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback if image fails to load
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // 2. Render preset Lucide icon styled nicely
  const iconProps = {
    size: Math.max(12, size - 8),
    className: 'text-inherit',
  };

  let IconComponent = Building;
  let bgGradient = 'from-blue-500 to-indigo-600 text-white';

  switch (resolvedStyle) {
    case 'shield':
      IconComponent = Shield;
      bgGradient = 'from-emerald-500 to-teal-600 text-white';
      break;
    case 'building':
      IconComponent = Building;
      bgGradient = 'from-blue-500 to-indigo-600 text-white';
      break;
    case 'globe':
      IconComponent = Globe;
      bgGradient = 'from-violet-500 to-fuchsia-600 text-white';
      break;
    case 'filetext':
      IconComponent = FileText;
      bgGradient = 'from-amber-500 to-orange-600 text-white';
      break;
    case 'sliders':
      IconComponent = Sliders;
      bgGradient = 'from-pink-500 to-rose-600 text-white';
      break;
    default:
      IconComponent = Building;
      bgGradient = 'from-blue-500 to-indigo-600 text-white';
  }

  return (
    <div 
      className={`shrink-0 rounded-lg bg-gradient-to-br ${bgGradient} flex items-center justify-center shadow-xs ${className}`}
      style={{ width: size, height: size }}
    >
      <IconComponent {...iconProps} />
    </div>
  );
};
