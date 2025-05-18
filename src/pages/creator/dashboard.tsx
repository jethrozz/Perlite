import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeading } from '@/components/ui/section-heading';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { formatNumber } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  LayoutDashboard,
  PenSquare,
  FolderKanban,
  BookOpen,
  Users,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Plus,
  LineChart as LineChartIcon,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';

export default function CreatorDashboard() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, requireCreator } = useAuth();
  
  // Protect this route - only for creators
  React.useEffect(() => {
    requireCreator();
  }, []);

  // Get creator stats
  const { data: creatorStats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/creator/stats'],
    queryFn: async () => {
      const res = await fetch('/api/creator/stats');
      if (!res.ok) throw new Error('Failed to fetch creator stats');
      return await res.json();
    }
  });

  // Get creator series
  const { data: creatorSeries, isLoading: loadingSeries } = useQuery({
    queryKey: ['/api/series'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/series');
        if (!res.ok) throw new Error('Failed to fetch series');
        const series = await res.json();
        return series.filter((s: any) => s.creatorId === user?.id);
      } catch (error) {
        console.error('Error fetching series:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Get knowledge bases
  const { data: knowledgeBases, isLoading: loadingKBs } = useQuery({
    queryKey: ['/api/knowledgebases'],
    queryFn: async () => {
      const res = await fetch('/api/knowledgebases');
      if (!res.ok) throw new Error('Failed to fetch knowledge bases');
      return await res.json();
    }
  });

  // Mock data for visualizations - in a real app this would come from API
  const subscriberData = [
    { name: 'Jan', subscribers: 120 },
    { name: 'Feb', subscribers: 150 },
    { name: 'Mar', subscribers: 200 },
    { name: 'Apr', subscribers: 250 },
    { name: 'May', subscribers: 300 },
    { name: 'Jun', subscribers: 350 },
  ];

  const seriesPerformance = creatorSeries?.map((series: any) => ({
    name: series.title.length > 15 ? series.title.substring(0, 15) + '...' : series.title,
    subscribers: series.subscriberCount
  })) || [];

  const categoryData = [
    { name: 'Blockchain', value: 40 },
    { name: 'AI', value: 25 },
    { name: 'VR', value: 15 },
    { name: 'Quantum', value: 20 },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  // Stats cards
  const statsCards = [
    {
      title: "Total Series",
      value: creatorStats?.seriesCount || 0,
      change: "+2",
      isPositive: true,
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      title: "Total Subscribers",
      value: creatorStats?.totalSubscribers || 0,
      change: "+15%",
      isPositive: true,
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "Knowledge Bases",
      value: knowledgeBases?.length || 0,
      change: "+1",
      isPositive: true,
      icon: <FolderKanban className="h-5 w-5" />
    },
    {
      title: "Revenue (ETH)",
      value: "0.85",
      change: "+0.15",
      isPositive: true,
      icon: <CreditCard className="h-5 w-5" />
    }
  ];

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

  if (!isAuthenticated || (user && !user.isCreator)) {
    return null; // Will be redirected by requireCreator
  }

  return (
    <div className="container mx-auto px-4 py-20 min-h-screen">
      {/* Dashboard Header with Gradient Background */}
      <div className="relative mb-12 pb-8 border-b border-primary/20">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl -z-10 opacity-50"></div>
        <SectionHeading 
          title="Creator Dashboard"
          subtitle={`Welcome back, ${user?.fullName || 'Creator'}`}
          size="lg"
        />
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mt-8">
          <Button asChild className="cyberpunk-btn bg-primary hover:bg-secondary relative overflow-hidden group">
            <Link href="/creator/series/new">
              <a className="flex items-center">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                <Plus className="mr-2 h-4 w-4" /> Create New Series
              </a>
            </Link>
          </Button>
          <Button asChild variant="outline" className="cyberpunk-btn border-primary/50 text-primary hover:text-secondary hover:border-secondary relative overflow-hidden group">
            <Link href="/creator/content">
              <a className="flex items-center">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></span>
                <FolderKanban className="mr-2 h-4 w-4" /> Manage Content
              </a>
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {statsCards.map((stat, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="cyberpunk-card relative overflow-hidden group border-b-2 border-b-primary/50 hover:border-b-secondary/70 transition-colors duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-secondary/10 rounded-bl-3xl -z-0"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                    <h4 className="text-3xl font-bold font-rajdhani mt-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{stat.value}</h4>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-card border border-primary/30 flex items-center justify-center text-primary shadow-md shadow-primary/5 group-hover:bg-primary/10 transition-colors duration-300">
                    {stat.icon}
                  </div>
                </div>
                <div className={`flex items-center mt-4 text-sm ${stat.isPositive ? 'text-success' : 'text-destructive'} bg-card/50 py-1 px-2 rounded-md w-fit`}>
                  {stat.isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                  <span>{stat.change} from last period</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Charts and Analytics */}
      <div className="mb-12">
        <h2 className="text-2xl font-rajdhani font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Analytics Dashboard</h2>
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="mb-6 bg-dark/70 p-1 border border-primary/20">
            <TabsTrigger value="performance" className="flex items-center data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <LineChartIcon className="mr-2 h-4 w-4" /> Performance
            </TabsTrigger>
            <TabsTrigger value="series" className="flex items-center data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <BarChart2 className="mr-2 h-4 w-4" /> Series
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <PieChartIcon className="mr-2 h-4 w-4" /> Categories
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance">
            <Card className="cyberpunk-card border-t-4 border-t-primary/50 shadow-lg">
              <CardHeader className="border-b border-primary/10 bg-card/50">
                <CardTitle className="text-xl font-rajdhani flex items-center">
                  <LineChartIcon className="mr-2 h-5 w-5 text-primary" /> Subscriber Growth
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={subscriberData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="subscriberGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--primary))',
                          borderWidth: '1px',
                          color: 'hsl(var(--foreground))',
                          borderRadius: '4px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }} 
                      />
                      <Line
                        type="monotone"
                        dataKey="subscribers"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                        activeDot={{ r: 8, fill: 'hsl(var(--secondary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                        fillOpacity={1}
                        fill="url(#subscriberGradient)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="series">
            <Card className="cyberpunk-card border-t-4 border-t-secondary/50 shadow-lg">
              <CardHeader className="border-b border-secondary/10 bg-card/50">
                <CardTitle className="text-xl font-rajdhani flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5 text-secondary" /> Series Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={seriesPerformance}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="seriesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--secondary))',
                          borderWidth: '1px',
                          color: 'hsl(var(--foreground))',
                          borderRadius: '4px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }} 
                      />
                      <Bar 
                        dataKey="subscribers" 
                        fill="url(#seriesGradient)" 
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories">
            <Card className="cyberpunk-card border-t-4 border-t-accent/50 shadow-lg">
              <CardHeader className="border-b border-accent/10 bg-card/50">
                <CardTitle className="text-xl font-rajdhani flex items-center">
                  <PieChartIcon className="mr-2 h-5 w-5 text-accent" /> Content Distribution by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={150}
                        innerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--accent))',
                          borderWidth: '1px',
                          color: 'hsl(var(--foreground))',
                          borderRadius: '4px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Recent Activity */}
      <div className="mb-10">
        <h2 className="text-2xl font-rajdhani font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Your Content</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="cyberpunk-card border-l-4 border-l-primary/70 shadow-lg group hover:shadow-primary/10 transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/10">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="mr-3 h-5 w-5 text-primary" />
                  <span>Your Series</span>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-primary hover:text-secondary hover:bg-primary/5">
                  <Link href="/creator/series">
                    <a className="flex items-center">View All <ArrowRight className="ml-1 h-4 w-4" /></a>
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingSeries ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 border border-primary/10 rounded-md animate-pulse">
                      <div className="h-5 bg-card/50 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-card/50 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : creatorSeries && creatorSeries.length > 0 ? (
                <div className="space-y-4">
                  {creatorSeries.slice(0, 5).map((series: any, index: number) => (
                    <div 
                      key={series.id} 
                      className="p-4 border border-primary/10 rounded-md hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all group/item"
                      style={{ 
                        transitionDelay: `${index * 50}ms`,
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <Link href={`/series/${series.id}`}>
                          <a className="font-medium text-lg hover:text-primary transition-colors">{series.title}</a>
                        </Link>
                        <span className="text-primary/70 group-hover/item:text-primary text-sm flex items-center bg-primary/5 rounded-full px-2 py-1">
                          <Users className="h-3.5 w-3.5 mr-1" /> {series.subscriberCount}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 flex items-center">
                        <BookOpen className="h-3.5 w-3.5 mr-1" /> {series.moduleCount} modules
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                  <BookOpen className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-6">You haven't created any series yet</p>
                  <Button asChild className="cyberpunk-btn bg-primary hover:bg-secondary shadow-md">
                    <Link href="/creator/series/new">
                      <a className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" /> Create Your First Series
                      </a>
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="cyberpunk-card border-l-4 border-l-secondary/70 shadow-lg group hover:shadow-secondary/10 transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-transparent border-b border-secondary/10">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FolderKanban className="mr-3 h-5 w-5 text-secondary" />
                  <span>Knowledge Bases</span>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-secondary hover:text-primary hover:bg-secondary/5">
                  <Link href="/creator/content">
                    <a className="flex items-center">Manage <ArrowRight className="ml-1 h-4 w-4" /></a>
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingKBs ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 border border-secondary/10 rounded-md animate-pulse">
                      <div className="h-5 bg-card/50 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-card/50 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : knowledgeBases && knowledgeBases.length > 0 ? (
                <div className="space-y-4">
                  {knowledgeBases.map((kb: any, index: number) => (
                    <div 
                      key={kb.id} 
                      className="p-4 border border-secondary/10 rounded-md hover:bg-gradient-to-r hover:from-secondary/5 hover:to-transparent transition-all"
                      style={{ 
                        transitionDelay: `${index * 50}ms`,
                      }}
                    >
                      <Link href={`/creator/content?kb=${kb.id}`}>
                        <a className="font-medium text-lg hover:text-secondary transition-colors">{kb.title}</a>
                      </Link>
                      <div className="text-sm text-muted-foreground mt-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 mr-1"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        {kb.description || 'No description'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4 rounded-lg border border-dashed border-secondary/30 bg-secondary/5">
                  <FolderKanban className="h-10 w-10 text-secondary/40 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-6">You haven't created any knowledge bases yet</p>
                  <Button asChild className="cyberpunk-btn bg-secondary hover:bg-primary shadow-md">
                    <Link href="/creator/content?new=kb">
                      <a className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" /> Create Knowledge Base
                      </a>
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Getting Started Tips */}
      <Card className="cyberpunk-card mb-8 border-accent/30">
        <CardHeader>
          <CardTitle>Quick Tips for Creators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-card/30 rounded-md">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-3">
                <BookOpen className="h-5 w-5" />
              </div>
              <h4 className="font-rajdhani font-semibold mb-2">Create Series</h4>
              <p className="text-sm text-muted-foreground">Start by creating a series that represents your course or content collection.</p>
            </div>
            
            <div className="p-4 bg-card/30 rounded-md">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mb-3">
                <FolderKanban className="h-5 w-5" />
              </div>
              <h4 className="font-rajdhani font-semibold mb-2">Organize Content</h4>
              <p className="text-sm text-muted-foreground">Create knowledge bases and folders to organize your markdown content files.</p>
            </div>
            
            <div className="p-4 bg-card/30 rounded-md">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-3">
                <PenSquare className="h-5 w-5" />
              </div>
              <h4 className="font-rajdhani font-semibold mb-2">Link Content</h4>
              <p className="text-sm text-muted-foreground">Associate markdown files with modules in your series to publish your content.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
