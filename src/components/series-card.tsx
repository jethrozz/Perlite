import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getInitials, truncateString } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Series, User } from '@shared/schema';
import { Users } from 'lucide-react';

interface SeriesCardProps {
  series: Series;
  creator?: User;
  progress?: number;
  onSubscribe?: (seriesId: number) => void;
}

export function SeriesCard({ series, creator, progress, onSubscribe }: SeriesCardProps) {
  // Generate random thumbnail if none exists
  const thumbnailUrl = series.thumbnailUrl || `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1550745165-9bc0b252726f' : '1506399558188-acca6f8cbf41'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400`;

  return (
    <div className="cyberpunk-card p-5 h-full flex flex-col">
      <Link href={`/series/${series.id}`}>
        <a className="relative mb-4 overflow-hidden rounded block">
          <img 
            src={thumbnailUrl} 
            alt={series.title} 
            className="w-full h-48 object-cover transform hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark py-2 px-3">
            <div className="flex items-center text-sm">
              {series.isTrending && (
                <Badge variant="default" className="bg-primary/80 text-white mr-2">
                  Trending
                </Badge>
              )}
              {series.isNew && (
                <Badge variant="default" className="bg-accent/80 text-black mr-2">
                  New
                </Badge>
              )}
              <span className="text-accent flex items-center">
                <Users className="h-3.5 w-3.5 mr-1" /> {series.subscriberCount} subscribers
              </span>
            </div>
          </div>
        </a>
      </Link>
      
      <Link href={`/series/${series.id}`}>
        <a className="block">
          <h3 className="text-xl font-semibold font-rajdhani mb-2 text-white hover:text-accent transition-colors">
            {series.title}
          </h3>
        </a>
      </Link>
      
      <p className="text-muted-foreground mb-4 text-sm flex-grow">
        {truncateString(series.description, 120)}
      </p>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={creator?.avatarUrl} />
            <AvatarFallback className="bg-primary/30 text-sm font-medium">
              {getInitials(creator?.fullName || 'U')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground">{creator?.fullName || 'Creator'}</span>
        </div>
        <span className="text-secondary font-semibold">{series.moduleCount} modules</span>
      </div>
      
      {progress !== undefined && (
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm text-accent">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="mb-3 h-1.5 bg-dark" />
        </div>
      )}
      
      <Button 
        variant="outline" 
        className="mt-auto w-full cyberpunk-btn bg-card hover:bg-card/80 border border-primary/50 text-primary hover:text-secondary transition-colors"
        onClick={() => onSubscribe && onSubscribe(series.id)}
      >
        Subscribe for {series.price}
      </Button>
    </div>
  );
}
