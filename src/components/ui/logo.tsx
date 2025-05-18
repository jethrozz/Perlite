import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', withText = true, className = '' }: LogoProps) {
  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <Link href="/">
      <a className={`flex items-center gap-2 ${className}`}>
        {/* Animated logo - stylized cartoon version of perlite */}
        <div className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-secondary animate-pulse-slow overflow-hidden flex items-center justify-center`}>
          <div className="absolute w-[60%] h-[60%] rounded-full bg-background"></div>
          <div className="absolute w-[50%] h-[50%] rounded-full bg-accent/30 animate-float"></div>
        </div>
        
        {withText && (
          <span className={`font-bold font-rajdhani ${textSizeClasses[size]} text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary`}>
            Perlite
          </span>
        )}
      </a>
    </Link>
  );
}
