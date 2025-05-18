import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import type { User, Series } from '@shared/schema';
import { ArrowRight, Lock, Network } from 'lucide-react';

interface FeaturedCreatorProps {
  creator: User;
  popularSeries?: Series[];
  stats?: {
    seriesCount: number;
    totalSubscribers: number;
    averageRating?: number;
  };
}

export function FeaturedCreator({ creator, popularSeries, stats }: FeaturedCreatorProps) {
  // We'll use a placeholder image for the featured creator section
  const backgroundImage = "https://images.unsplash.com/photo-1580894894513-541e068a3e2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800";

  return (
    <div className="cyberpunk-card p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full hidden lg:block">
        <img 
          src={backgroundImage} 
          alt={`${creator.fullName}'s workspace`} 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent"></div>
      </div>
      
      <div className="lg:w-2/3 relative z-10">
        <div className="flex items-center mb-6">
          <Badge variant="outline" className="text-xs uppercase tracking-widest text-secondary font-medium px-3 py-1 border-secondary/50 rounded">
            Featured Creator
          </Badge>
        </div>
        
        <div className="flex items-center mb-4">
          <Avatar className="h-12 w-12 mr-4">
            <AvatarImage src={creator.avatarUrl} />
            <AvatarFallback className="bg-primary/30">
              {getInitials(creator.fullName)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-3xl md:text-4xl font-bold font-rajdhani text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            {creator.fullName}
          </h2>
        </div>
        
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
          {creator.bio || "Distinguished creator specializing in cutting-edge educational content."}
        </p>
        
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="bg-card/60 px-4 py-3 rounded">
            <div className="text-2xl font-bold font-rajdhani text-accent">{stats?.seriesCount || 0}</div>
            <div className="text-sm text-muted-foreground">Series Published</div>
          </div>
          
          <div className="bg-card/60 px-4 py-3 rounded">
            <div className="text-2xl font-bold font-rajdhani text-accent">{stats?.totalSubscribers || 0}</div>
            <div className="text-sm text-muted-foreground">Subscribers</div>
          </div>
          
          {stats?.averageRating && (
            <div className="bg-card/60 px-4 py-3 rounded">
              <div className="text-2xl font-bold font-rajdhani text-accent">{stats.averageRating.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
          )}
        </div>
        
        {popularSeries && popularSeries.length > 0 && (
          <>
            <h3 className="text-xl font-rajdhani font-semibold mb-4">Popular Series</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {popularSeries.slice(0, 2).map(series => (
                <div key={series.id} className="bg-card/40 p-4 rounded flex items-center">
                  <div className="w-12 h-12 rounded bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary">
                    {series.title.includes('Quantum') ? <Cpu className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-rajdhani font-medium">
                      <Link href={`/series/${series.id}`}>
                        <a className="hover:text-accent transition-colors">{series.title}</a>
                      </Link>
                    </h4>
                    <p className="text-sm text-muted-foreground">{series.subscriberCount} subscribers</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        <Button 
          variant="default" 
          className="cyberpunk-btn bg-secondary hover:bg-primary text-white font-medium py-2 px-6 transition-all inline-flex items-center"
          asChild
        >
          <Link href={`/series/browse?creator=${creator.id}`}>
            <a>View Creator Profile <ArrowRight className="ml-2 h-4 w-4" /></a>
          </Link>
        </Button>
      </div>
    </div>
  );
}
