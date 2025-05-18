import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionLink?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SectionHeading({
  title,
  subtitle,
  actionLabel,
  actionLink,
  className,
  size = 'md',
}: SectionHeadingProps) {
  // Size mappings
  const titleSizeClasses = {
    sm: 'text-2xl md:text-2xl',
    md: 'text-3xl md:text-3xl',
    lg: 'text-4xl md:text-5xl',
  };

  const subtitleSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between mb-6', className)}>
      <div>
        <h2 className={cn(
          titleSizeClasses[size],
          'font-bold font-rajdhani text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary'
        )}>
          {title}
        </h2>
        {subtitle && (
          <p className={cn('text-muted-foreground mt-1', subtitleSizeClasses[size])}>
            {subtitle}
          </p>
        )}
      </div>
      
      {actionLabel && actionLink && (
        <Link href={actionLink}>
          <a className="flex items-center text-secondary hover:text-accent transition-colors font-medium mt-2 sm:mt-0">
            {actionLabel} <i className="fas fa-chevron-right ml-2 text-sm"></i>
          </a>
        </Link>
      )}
    </div>
  );
}
