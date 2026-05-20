import React, { useMemo } from 'react';

// Deterministic generation: "BASTION_VISUAL_PROVISIONAL_V5:" + seedInput
// Hash with SHA-256 to get hex

const ADJECTIVES = [
  "Silent", "Ethereal", "Cosmic", "Lunar", "Solar", "Digital", "Quantum", "Velvet",
  "Shadow", "Crystal", "Golden", "Arctic", "Neon", "Sovereign", "Mystic", "Zenith"
];

const NOUNS = [
  "Phoenix", "Traveler", "Guardian", "Specter", "Voyager", "Sentinel", "Oracle",
  "Navigator", "Architect", "Nomad", "Seeker", "Warden", "Observer", "Explorer"
];

export const generateVisualIdentity = async (seedInput: string, isVaultFound: boolean) => {
  if (!seedInput) return { colors: ['#64748b', '#475569', '#334155'], patternType: 0, name: 'Ethereal Traveler' };
  
  const encoder = new TextEncoder();
  const data = encoder.encode("BASTION_VISUAL_PROVISIONAL_V5:" + seedInput);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Use hash bytes for properties
  const hue = parseInt(hashHex.substring(0, 2), 16) % 360;
  const patternType = parseInt(hashHex.substring(2, 3), 16) % 4; // 0: wavy, 1: blobs, 2: stripes, 3: circles
  
  // Use hash bytes to pick name parts for dictionary-backed uniqueness
  const adjIdx = parseInt(hashHex.substring(4, 6), 16) % ADJECTIVES.length;
  const nounIdx = parseInt(hashHex.substring(6, 8), 16) % NOUNS.length;
  
  const colors = [
    `hsl(${(hue) % 360}, 80%, 50%)`,
    `hsl(${(hue + 45) % 360}, 80%, 40%)`,
    `hsl(${(hue + 180) % 360}, 80%, 50%)`,
    `hsl(${(hue + 225) % 360}, 80%, 40%)`
  ];

  // Stable ID name combination
  const name = `${ADJECTIVES[adjIdx]} ${NOUNS[nounIdx]}`;

  return { colors, patternType, name };
};

interface ProvisionalFlagAvatarProps {
  seedInput: string;
  isVaultFound: boolean;
  size?: number;
  showName?: boolean;
}

export const ProvisionalFlagAvatar: React.FC<ProvisionalFlagAvatarProps> = ({ seedInput, isVaultFound, size = 120, showName = true }) => {
  const [identity, setIdentity] = React.useState<any>(null);

  React.useEffect(() => {
    // Debounce hash calculation to prevent flickering
    const timeout = setTimeout(() => {
      generateVisualIdentity(seedInput, isVaultFound).then(setIdentity);
    }, 300);
    return () => clearTimeout(timeout);
  }, [seedInput, isVaultFound]);

  if (!identity) return null;

  const { colors, patternType, name } = identity;

  return (
    <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
      <svg width={size} height={size * 0.75} viewBox="0 0 120 90">
        <defs>
          <clipPath id="flagClip">
            <rect x="0" y="0" width="120" height="90" rx="15" ry="15" />
          </clipPath>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>

        <g clipPath="url(#flagClip)">
          {/* Background */}
          <rect width="120" height="90" fill={colors[2]} />
          
          {/* Main Symmetric Pattern */}
          <g fill={colors[0]}>
            {patternType === 0 && (
                <path d="M0,0 L60,45 L120,0 L120,90 L60,45 L0,90 Z" />
            )}
            {patternType === 1 && (
                <path d="M0,45 L60,0 L120,45 L60,90 Z" />
            )}
            {patternType === 2 && (
                <path d="M60,0 L120,45 L60,90 L0,45 Z" fill={colors[1]} />
            )}
            {patternType !== 2 && (
             <circle cx="60" cy="45" r="20" fill={colors[3]} stroke={colors[1]} strokeWidth="4" />
            )}
          </g>
        </g>
        
        {/* Soft Shine Overlay */}
        <rect x="0" y="0" width="120" height="90" rx="15" ry="15" fill="white" fillOpacity="0.1" />
      </svg>
      {showName && seedInput && (
        <span className="text-white/80 text-sm font-medium tracking-wide">
          Welcome back, {name}
        </span>
      )}
    </div>
  );
};
