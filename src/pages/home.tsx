import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { SeriesCard } from '@/components/series-card';
import { useToast } from '@/hooks/use-toast';
import { useCurrentAccount } from '@mysten/dapp-kit';

import {
  Series,
  getTopN
} from '@/shared/perlite-market';
import { 
  Code,
  Brain,
  Workflow
} from 'lucide-react';

export default function Home() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const currentAccount = useCurrentAccount();
  //const { user, isAuthenticated } = useAuth();
  const seriesArray = getTopN();
  const loadingSeries = false;
  // Fetch top series
/**   const { data: topSeries, isLoading: loadingSeries } = useQuery({
    queryKey: ['/api/series/top'],
    queryFn: async () => {
      const res = await fetch('/api/series/top?limit=4');
      if (!res.ok) throw new Error('Failed to fetch top series');
      return await res.json();
    }
  });


  // Fetch featured creator (Maya Richards, ID 5)
  const { data: featuredCreator, isLoading: loadingCreator } = useQuery({
    queryKey: ['/api/users/5'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/users/5');
        if (!res.ok) throw new Error('Failed to fetch featured creator');
        return await res.json();
      } catch (error) {
        console.error('Error fetching featured creator:', error);
        return null;
      }
    }
  });*/

  // Fetch featured creator's series

  // Handle subscription button click
  const handleSubscribe = (seriesId: string) => {
    if (!currentAccount) {
      toast({
        title: "Wallet Connect Required",
        description: "Please connect your wallet",
        variant: "default"
      });
      return;
    }

    toast({
      title: "Subscription Initiated",
      description: "Processing your subscription...",
      variant: "default"
    });

    // do something with the seriesId
    console.log(`Subscribing to series: ${seriesId}`);
  };

  // Animation variants for elements
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

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 mb-12 mt-16">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 to-background/90 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080" 
            alt="Futuristic workspace with purple lighting" 
            className="object-cover w-full h-full"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-20">
          <motion.div 
            className="max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold font-rajdhani leading-tight mb-4">
              <span className="text-white">Advanced Learning in the</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent"> Digital Age</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Subscribe to cutting-edge courses from top creators. Master new skills in our cyberpunk-themed learning environment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="cyberpunk-btn bg-secondary hover:bg-primary text-white font-rajdhani font-semibold text-lg animate-glow"
                asChild
              >
                <Link href="/series/browse">
                  <a>Explore Courses</a>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="cyberpunk-btn bg-dark border border-accent/50 hover:border-accent text-accent font-rajdhani font-semibold text-lg"
                asChild
              >
                <Link href="/creator/dashboard">
                  <a>Become a Creator</a>
                </Link>
              </Button>
            </div>
            
            <div className="mt-8 flex items-center">
              <span className="text-muted-foreground mr-3">Trusted by 20,000+ learners</span>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-background bg-card"></div>
                <div className="w-8 h-8 rounded-full border-2 border-background bg-card"></div>
                <div className="w-8 h-8 rounded-full border-2 border-background bg-card"></div>
                <div className="w-8 h-8 rounded-full border-2 border-background bg-card"></div>
                <div className="w-8 h-8 rounded-full border-2 border-background bg-card flex items-center justify-center text-xs font-medium">+99</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Top Courses Section */}
      <section className="container mx-auto px-4 py-12">
        <SectionHeading 
          title="Top Subscribed Series"
          actionLabel="View All"
          actionLink="/series/browse"
        />
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          {loadingSeries ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="cyberpunk-card p-5 h-full animate-pulse">
                <div className="w-full h-48 bg-card/50 rounded mb-4"></div>
                <div className="h-6 bg-card/50 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-card/50 rounded w-full mb-4"></div>
                <div className="h-4 bg-card/50 rounded w-2/3 mb-4"></div>
                <div className="mt-auto">
                  <div className="w-full bg-card/50 h-10 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            seriesArray?.map((series: Series) => (
              <motion.div key={series.id} variants={itemVariants}>
                <SeriesCard 
                  series={series} 
                  onSubscribe={handleSubscribe}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      </section>
      
      {/* Categories section removed as requested */}

      
      {/* Creator Dashboard Preview */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold font-rajdhani mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Creator Dashboard
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Manage your knowledge base with our intuitive creator tools. Organize content hierarchically, publish series, and grow your subscriber base.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-4 flex-shrink-0">
                  <Workflow className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-rajdhani font-semibold mb-1">Hierarchical Content Management</h3>
                  <p className="text-muted-foreground">Organize your content with knowledge bases, folders, and markdown files for intuitive navigation.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mr-4 flex-shrink-0">
                  <Code className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-rajdhani font-semibold mb-1">Markdown Editor with Preview</h3>
                  <p className="text-muted-foreground">Write content in Markdown with real-time preview and support for code syntax highlighting.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent mr-4 flex-shrink-0">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-rajdhani font-semibold mb-1">Subscriber Analytics</h3>
                  <p className="text-muted-foreground">Track engagement, subscriptions, and revenue with detailed analytics dashboard.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <Button 
                className="cyberpunk-btn bg-primary hover:bg-secondary text-white font-medium py-3 px-6"
                size="lg"
                asChild
              >
                <Link href="/creator/dashboard">
                  <a>Start Creating Today</a>
                </Link>
              </Button>
            </div>
          </motion.div>
          
          {/* Knowledge Base: Quantum Computing section removed as requested */}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-dark/90 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600" 
            alt="Futuristic cyberpunk background" 
            className="object-cover w-full h-full"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold font-rajdhani mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Become a Creator Today
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Share your knowledge, build your audience, and earn crypto through our subscription platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="cyberpunk-btn bg-secondary hover:bg-primary text-white font-rajdhani font-semibold py-3 px-8 text-lg animate-glow"
                asChild
              >
                <Link href="/creator/dashboard">
                  <a>Start Creating</a>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="cyberpunk-btn bg-dark border border-accent/50 hover:border-accent text-accent font-rajdhani font-semibold py-3 px-8 text-lg"
                asChild
              >
                <Link href="/about">
                  <a>Learn More</a>
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold font-rajdhani text-accent mb-2">500+</div>
                <p className="text-muted-foreground">Creators</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold font-rajdhani text-accent mb-2">250k+</div>
                <p className="text-muted-foreground">Learners</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold font-rajdhani text-accent mb-2">1.2k+</div>
                <p className="text-muted-foreground">Series</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold font-rajdhani text-accent mb-2">15M+</div>
                <p className="text-muted-foreground">USD Earned</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
