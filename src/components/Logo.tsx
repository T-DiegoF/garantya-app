import { type SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  showWordmark?: boolean;
  size?: number;
}

export function Logo({ showWordmark = true, size = 40, ...props }: LogoProps) {
  const icon = (
    <>
      <circle cx="45" cy="45" r="40" fill="#1C1917" />
      <rect x="23" y="40" width="44" height="28" rx="4" fill="#F5F0E8" />
      <polygon points="45,12 73,40 17,40" fill="#F5F0E8" />
      <line x1="29" y1="51" x2="51" y2="51" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <line x1="29" y1="60" x2="46" y2="60" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <path d="M53 48 L58 54 L67 42" stroke="#75AADB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="29" y1="24" x2="45" y2="12" stroke="#75AADB" strokeWidth="2" opacity="0.7" strokeLinecap="round" />
      <line x1="61" y1="24" x2="45" y2="12" stroke="#75AADB" strokeWidth="2" opacity="0.7" strokeLinecap="round" />
    </>
  );

  if (!showWordmark) {
    return (
      <svg width={size} height={size} viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" {...props}>
        {icon}
      </svg>
    );
  }

  return (
    <svg width={size * 4.5} height={size} viewBox="0 0 360 90" xmlns="http://www.w3.org/2000/svg" {...props}>
      {icon}
      <text x="98" y="62" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="46" letterSpacing="-3">
        <tspan fill="#1C1917">Garant</tspan>
        <tspan fill="#A07850" fontStyle="italic" dx="-2">Y</tspan>
        <tspan fill="#1C1917" fontStyle="normal" dx="-1">a</tspan>
      </text>
    </svg>
  );
}
