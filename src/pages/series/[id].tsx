import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Markdown } from '@/components/ui/markdown';
import { getInitials, timeAgo, formatNumber } from '@/lib/utils';
import type { Series, Module, User, ContentFile } from '@shared/schema';
import { 
  Users, 
  Calendar, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen,
  Clock,
  Bookmark,
  Share2,
  AlertTriangle,
  Tag,
  FileText,
  ArrowDown
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SeriesDetails() {
  const [, params] = useRoute('/series/:id');
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, requireAuth } = useAuth();
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Get series ID from params
  const seriesId = params?.id ? parseInt(params.id) : 0;
  
  // Fetch series details
  const { data: series, isLoading: loadingSeries } = useQuery({
    queryKey: ['/api/series', seriesId],
    queryFn: async () => {
      const res = await fetch(`/api/series/${seriesId}`);
      if (!res.ok) throw new Error('Failed to fetch series');
      return await res.json();
    },
    enabled: !!seriesId
  });
  
  // Fetch creator details
  const { data: creator, isLoading: loadingCreator } = useQuery({
    queryKey: ['/api/users', series?.creatorId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${series.creatorId}`);
      if (!res.ok) throw new Error('Failed to fetch creator');
      return await res.json();
    },
    enabled: !!series?.creatorId
  });
  
  // Fetch modules for this series
  const { data: modules, isLoading: loadingModules } = useQuery({
    queryKey: ['/api/series', seriesId, 'modules'],
    queryFn: async () => {
      const res = await fetch(`/api/series/${seriesId}/modules`);
      if (!res.ok) throw new Error('Failed to fetch modules');
      const modules = await res.json();
      return modules.sort((a: Module, b: Module) => a.order - b.order);
    },
    enabled: !!seriesId
  });
  
  // Fetch current content if a module is selected
  const { data: content, isLoading: loadingContent } = useQuery({
    queryKey: ['/api/files', activeModuleId && modules?.find(m => m.id === activeModuleId)?.contentFileId],
    queryFn: async () => {
      const module = modules?.find(m => m.id === activeModuleId);
      if (!module?.contentFileId) return null;
      
      const res = await fetch(`/api/files/${module.contentFileId}`);
      if (!res.ok) {
        if (res.status === 403) {
          // Content is locked, need subscription
          return { locked: true };
        }
        throw new Error('Failed to fetch content');
      }
      return await res.json();
    },
    enabled: !!activeModuleId && !!modules
  });
  
  // Fetch user progress if authenticated
  const { data: userProgress, isLoading: loadingProgress } = useQuery({
    queryKey: ['/api/progress', seriesId],
    queryFn: async () => {
      const res = await fetch(`/api/progress/${seriesId}`);
      if (!res.ok) throw new Error('Failed to fetch progress');
      return await res.json();
    },
    enabled: isAuthenticated && !!seriesId
  });
  
  // Fetch user subscriptions if authenticated
  const { data: userSubscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['/api/subscriptions'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions');
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      return await res.json();
    },
    enabled: isAuthenticated
  });
  
  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/subscriptions', {
        userId: user?.id,
        seriesId: seriesId
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Subscribed successfully!" });
      setIsSubscribed(true);
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/series', seriesId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Subscription failed", 
        description: error.message || "Could not complete subscription",
        variant: "destructive"
      });
    }
  });
  
  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ moduleId, isCompleted }: { moduleId: number, isCompleted: boolean }) => {
      const res = await apiRequest('POST', `/api/progress/${moduleId}`, { isCompleted });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress', seriesId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update progress", 
        description: error.message || "Could not save your progress",
        variant: "destructive"
      });
    }
  });
  
  // Set active module on initial load
  useEffect(() => {
    if (modules && modules.length > 0 && !activeModuleId) {
      setActiveModuleId(modules[0].id);
    }
  }, [modules, activeModuleId]);
  
  // Check if user is subscribed
  useEffect(() => {
    if (userSubscriptions && seriesId) {
      const subscribed = userSubscriptions.some((sub: any) => sub.seriesId === seriesId);
      setIsSubscribed(subscribed);
    }
  }, [userSubscriptions, seriesId]);
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!modules || !userProgress) return 0;
    
    const completedModules = userProgress.filter((progress: any) => progress.isCompleted).length;
    return (completedModules / modules.length) * 100;
  };
  
  // Handle module navigation
  const navigateToModule = (moduleId: number) => {
    setActiveModuleId(moduleId);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle navigation to previous/next module
  const navigateToPreviousModule = () => {
    if (!modules || !activeModuleId) return;
    
    const currentIndex = modules.findIndex(m => m.id === activeModuleId);
    if (currentIndex > 0) {
      navigateToModule(modules[currentIndex - 1].id);
    }
  };
  
  const navigateToNextModule = () => {
    if (!modules || !activeModuleId) return;
    
    const currentIndex = modules.findIndex(m => m.id === activeModuleId);
    if (currentIndex < modules.length - 1) {
      navigateToModule(modules[currentIndex + 1].id);
    }
  };
  
  // Handle subscribe button click
  const handleSubscribe = () => {
    requireAuth(() => {
      subscribeMutation.mutate();
    });
  };
  
  // Handle mark as complete
  const handleMarkComplete = (moduleId: number, isCompleted: boolean) => {
    requireAuth(() => {
      updateProgressMutation.mutate({ moduleId, isCompleted });
    });
  };
  
  // Check if module is completed
  const isModuleCompleted = (moduleId: number) => {
    if (!userProgress) return false;
    return userProgress.some((progress: any) => progress.moduleId === moduleId && progress.isCompleted);
  };
  
  // Get current module
  const currentModule = modules?.find(m => m.id === activeModuleId);
  
  // Get current module index and calculate prev/next
  const currentModuleIndex = modules?.findIndex(m => m.id === activeModuleId) ?? -1;
  const prevModule = currentModuleIndex > 0 ? modules?.[currentModuleIndex - 1] : null;
  const nextModule = currentModuleIndex >= 0 && currentModuleIndex < (modules?.length ?? 0) - 1 ? modules?.[currentModuleIndex + 1] : null;

  if (loadingSeries || !series) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-screen">
        <div className="cyberpunk-card animate-pulse p-8">
          <div className="h-8 bg-card/50 w-3/4 mb-4 rounded"></div>
          <div className="h-4 bg-card/50 w-full mb-8 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="cyberpunk-card p-6 h-64 bg-card/50"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="cyberpunk-card p-6 h-64 bg-card/50"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 min-h-screen">
      {/* Series Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <Link href="/series/browse">
            <a className="text-muted-foreground hover:text-accent inline-flex items-center mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
            </a>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold font-rajdhani mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            {series.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {creator && (
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={creator.avatarUrl} />
                  <AvatarFallback className="bg-primary/30 text-xs">
                    {getInitials(creator.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span>{creator.fullName}</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Updated {timeAgo(series.updatedAt)}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{formatNumber(series.subscriberCount)} subscribers</span>
            </div>
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              <span>{series.moduleCount} modules</span>
            </div>
            {series.isTrending && (
              <Badge variant="default" className="bg-primary/80 text-white">
                Trending
              </Badge>
            )}
            {series.isNew && (
              <Badge variant="default" className="bg-accent/80 text-black">
                New
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0">
          {isSubscribed ? (
            <Badge variant="outline" className="px-4 py-2 text-md border-success text-success">
              Subscribed
            </Badge>
          ) : (
            <Button 
              className="cyberpunk-btn bg-primary hover:bg-secondary"
              onClick={handleSubscribe}
              disabled={subscribeMutation.isPending}
            >
              {subscribeMutation.isPending ? 'Processing...' : `Subscribe for ${series.price}`}
            </Button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="cyberpunk-card p-6 sticky top-24">
            <h3 className="font-rajdhani font-semibold text-xl mb-4">Module Contents</h3>
            
            <ul className="space-y-3 custom-scrollbar pr-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {loadingModules ? (
                Array(5).fill(0).map((_, i) => (
                  <li key={i} className="animate-pulse">
                    <div className="py-2 flex items-center">
                      <div className="w-6 h-6 rounded-full bg-card/50 mr-3"></div>
                      <div className="h-4 bg-card/50 rounded w-full"></div>
                    </div>
                  </li>
                ))
              ) : (
                modules?.map((module, index) => {
                  const isActive = module.id === activeModuleId;
                  const completed = isModuleCompleted(module.id);
                  
                  return (
                    <li key={module.id}>
                      <button 
                        onClick={() => navigateToModule(module.id)}
                        className={`flex items-center py-2 w-full text-left ${
                          isActive 
                            ? 'text-secondary border-l-2 border-secondary pl-3' 
                            : 'text-muted-foreground hover:text-primary border-l-2 border-transparent hover:border-primary/50 pl-3 transition-colors'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full ${
                          completed 
                            ? 'bg-success/20 text-success' 
                            : isActive 
                              ? 'bg-secondary/20'
                              : 'bg-card'
                        } flex items-center justify-center text-xs mr-3`}>
                          {completed ? '✓' : index + 1}
                        </span>
                        {module.title}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            
            {isAuthenticated && (
              <div className="mt-6 pt-6 border-t border-primary/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Course Progress</span>
                  <span className="text-sm text-accent">
                    {userProgress ? `${userProgress.filter(p => p.isCompleted).length}/${modules?.length || 0} modules` : 'Not started'}
                  </span>
                </div>
                
                <Progress value={calculateProgress()} className="h-2 bg-dark" />
              </div>
            )}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <div className="cyberpunk-card p-6 lg:p-8">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content">
                {loadingContent ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-card/50 rounded w-3/4"></div>
                    <div className="h-4 bg-card/50 rounded w-full"></div>
                    <div className="h-4 bg-card/50 rounded w-full"></div>
                    <div className="h-4 bg-card/50 rounded w-2/3"></div>
                  </div>
                ) : content?.locked ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-16 w-16 text-primary/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Content Locked</h3>
                    <p className="text-muted-foreground mb-6">
                      Subscribe to this series to access this content
                    </p>
                    {!isSubscribed && (
                      <Button 
                        onClick={handleSubscribe}
                        className="cyberpunk-btn bg-primary hover:bg-secondary"
                      >
                        Subscribe for {series.price}
                      </Button>
                    )}
                  </div>
                ) : content ? (
                  <>
                    <div className="flex items-center mb-6">
                      <div className="flex-1">
                        <h2 className="text-2xl lg:text-3xl font-bold font-rajdhani text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                          {currentModule?.title}
                        </h2>
                        <div className="flex items-center mt-2">
                          <span className="text-muted-foreground text-sm">
                            {creator?.fullName} • Last updated {timeAgo(content.updatedAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-primary hover:text-secondary transition-colors">
                          <Bookmark className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-primary hover:text-secondary transition-colors">
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    
                    <Markdown content={content.content} />
                    
                    {isAuthenticated && (
                      <div className="mt-6 border-t border-primary/10 pt-6">
                        <div className="flex justify-between items-center mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2"
                            onClick={() => handleMarkComplete(currentModule?.id!, !isModuleCompleted(currentModule?.id!))}
                          >
                            <span>{isModuleCompleted(currentModule?.id!) ? 'Completed ✓' : 'Mark as Complete'}</span>
                          </Button>
                          
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Module {currentModuleIndex + 1} of {modules?.length}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-8 pt-8 border-t border-primary/10 flex justify-between items-center">
                      <Button 
                        variant="outline" 
                        className={`cyberpunk-btn bg-card/60 text-foreground ${!prevModule && 'opacity-50 cursor-not-allowed'}`}
                        onClick={navigateToPreviousModule}
                        disabled={!prevModule}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className={`cyberpunk-btn bg-card hover:bg-card/80 border border-primary/50 text-primary hover:text-secondary transition-colors ${!nextModule && 'opacity-50 cursor-not-allowed'}`}
                        onClick={navigateToNextModule}
                        disabled={!nextModule}
                      >
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-primary/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Content Available</h3>
                    <p className="text-muted-foreground">
                      This module doesn't have any content yet
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="overview">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-rajdhani mb-4">About This Series</h2>
                    <p className="text-muted-foreground">{series.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold font-rajdhani mb-3">What You'll Learn</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {modules?.slice(0, 6).map((module) => (
                        <li key={module.id} className="flex items-start">
                          <ArrowRight className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                          <span>{module.title}</span>
                        </li>
                      ))}
                      {modules && modules.length > 6 && (
                        <li className="flex items-center text-muted-foreground">
                          <ArrowDown className="h-5 w-5 mr-2" />
                          And {modules.length - 6} more modules
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  {creator && (
                    <div>
                      <h3 className="text-xl font-semibold font-rajdhani mb-3">About the Creator</h3>
                      <div className="flex items-start">
                        <Avatar className="h-12 w-12 mr-4">
                          <AvatarImage src={creator.avatarUrl} />
                          <AvatarFallback className="bg-primary/30">
                            {getInitials(creator.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{creator.fullName}</h4>
                          <p className="text-muted-foreground text-sm">{creator.bio || "Creator on Perlite"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-primary/10 pt-6">
                    <h3 className="text-xl font-semibold font-rajdhani mb-4">Subscribe to Access</h3>
                    <div className="bg-card/30 p-6 rounded-lg border border-primary/20">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="text-2xl font-bold font-rajdhani mb-2">{series.price}</p>
                          <ul className="space-y-2">
                            <li className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-success mr-2 h-5 w-5"><path d="M20 6 9 17l-5-5"/></svg>
                              <span>Full Access to {series.moduleCount} Modules</span>
                            </li>
                            <li className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-success mr-2 h-5 w-5"><path d="M20 6 9 17l-5-5"/></svg>
                              <span>Lifetime Updates</span>
                            </li>
                            <li className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-success mr-2 h-5 w-5"><path d="M20 6 9 17l-5-5"/></svg>
                              <span>Progress Tracking</span>
                            </li>
                          </ul>
                        </div>
                        
                        {isSubscribed ? (
                          <Badge variant="outline" className="px-4 py-2 text-md border-success text-success">
                            You are Subscribed
                          </Badge>
                        ) : (
                          <Button 
                            size="lg"
                            className="cyberpunk-btn bg-primary hover:bg-secondary w-full md:w-auto"
                            onClick={handleSubscribe}
                            disabled={subscribeMutation.isPending}
                          >
                            {subscribeMutation.isPending ? 'Processing...' : `Subscribe Now`}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
