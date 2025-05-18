import React from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import type { Category } from '@shared/schema';
import {
  Code,
  ShieldAlert,
  Glasses,
  Brain,
  Cpu,
  Coins,
  Boxes,
  Workflow
} from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

// Map category icon names to Lucide icons
const IconMap: Record<string, React.ElementType> = {
  'code': Code,
  'shield-alt': ShieldAlert,
  'vr-cardboard': Glasses,
  'robot': Brain,
  'microchip': Cpu,
  'coins': Coins,
  'cubes': Boxes,
  'brain': Workflow
};

export function CategoryCard({ category, className }: CategoryCardProps) {
  const IconComponent = IconMap[category.iconName] || Code;

  return (
    <div className={cn(
      "cyberpunk-card group overflow-hidden category-card transition-all duration-300",
      className
    )}>
      <Link href={`/series/browse?category=${category.id}`}>
        <a className="block p-6">
          <IconComponent className="h-10 w-10 mb-4 text-primary group-hover:text-accent transition-colors" />
          <h3 className="font-rajdhani font-semibold text-lg">{category.name}</h3>
          <p className="text-muted-foreground text-sm mt-1">{category.seriesCount} series</p>
        </a>
      </Link>
    </div>
  );
}
