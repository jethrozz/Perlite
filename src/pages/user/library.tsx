import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SeriesCard } from '@/components/series-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Series } from '@shared/schema';
import { Search, BarChart2, BookOpen, ArrowLeft } from 'lucide-react';

export default function UserLibrary() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, requireAuth } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Protect this route - user must be logged in
  React.useEffect(() => {
    requireAuth();
  }, [requireAuth]);
  
  // Fetch user's subscriptions
  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['/api/subscriptions'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions');
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      return await res.json();
    },
    enabled: isAuthenticated
  });
  
  // Filter subscriptions by search query
  const filteredSubscriptions = React.useMemo(() => {
    if (!subscriptions) return [];
    
    if (!searchQuery) return subscriptions;
    
    const lowerQuery = searchQuery.toLowerCase();
    return subscriptions.filter((sub: any) => 
      sub.series.title.toLowerCase().includes(lowerQuery)
    );
  }, [subscriptions, searchQuery]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  if (!isAuthenticated) {
    return null; // Will be redirected by requireAuth
  }
  
  return (
    <div className="container mx-auto px-4 py-20 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <SectionHeading 
          title="My Library"
          subtitle="Access your subscribed educational content"
          size="lg"
        />
        
        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[300px] bg-card border-primary/30"
            />
            <Button 
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-primary hover:text-secondary transition-colors"
            >
              <Search size={18} />
            </Button>
          </div>
        </div>
      </div>
      
      {loadingSubscriptions ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="cyberpunk-card p-5 h-full animate-pulse">
              <div className="w-full h-48 bg-card/50 rounded mb-4"></div>
              <div className="h-6 bg-card/50 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-card/50 rounded w-full mb-4"></div>
              <div className="h-4 bg-card/50 rounded w-2/3 mb-4"></div>
              <div className="mt-auto">
                <div className="w-full bg-card/50 h-10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredSubscriptions.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredSubscriptions.map((subscription: any) => (
            <motion.div key={subscription.id} variants={itemVariants}>
              <SeriesCard 
                series={subscription.series}
                progress={subscription.progress}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-20">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-2xl font-semibold mb-2">Your Library is Empty</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchQuery 
              ? `No subscriptions found matching "${searchQuery}". Try a different search term.` 
              : "You haven't subscribed to any series yet. Browse our collection to find content you're interested in."}
          </p>
          
          {searchQuery ? (
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery('')}
              className="mr-4"
            >
              Clear Search
            </Button>
          ) : null}
          
          <Button asChild className="cyberpunk-btn bg-primary hover:bg-secondary">
            <Link href="/series/browse">
              <a className="flex items-center">
                Browse Content <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </a>
            </Link>
          </Button>
        </div>
      )}
      
      {/* Recently Viewed (Optional Enhancement) */}
      {filteredSubscriptions.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-rajdhani font-bold mb-6">Recently Viewed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* This would ideally be tracked in the database */}
            <Card className="cyberpunk-card h-36 flex items-center justify-center p-6 border-dashed border-primary/30 text-muted-foreground">
              <CardContent className="flex flex-col items-center justify-center h-full w-full">
                <BarChart2 className="h-8 w-8 mb-2" />
                <p className="text-center">
                  Continue tracking your learning progress
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}