import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeriesCard } from '@/components/series-card';
import { CategoryCard } from '@/components/category-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Series, Category, User } from '@shared/schema';
import { 
  Search, 
  Filter,
  Loader2,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BrowseSeries() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'title' | 'id'>('title'); // 新增搜索方式选择
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('trending');
  
  // Parse URL parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const category = params.get('category');
    const by = params.get('searchBy');
    
    if (q) setSearchQuery(q);
    if (category) setCategoryFilter(category);
    if (by === 'id' || by === 'title') setSearchBy(by);
  }, []);
  
  // Fetch all series
  const { data: allSeries, isLoading: loadingSeries } = useQuery({
    queryKey: ['/api/series'],
    queryFn: async () => {
      const res = await fetch('/api/series');
      if (!res.ok) throw new Error('Failed to fetch series');
      return await res.json();
    }
  });
  
  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    }
  });
  
  // Fetch search results if search query is provided
  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ['/api/series/search', searchQuery, searchBy],
    queryFn: async () => {
      const res = await fetch(`/api/series/search?q=${encodeURIComponent(searchQuery)}&searchBy=${searchBy}`);
      if (!res.ok) throw new Error('Failed to search series');
      return await res.json();
    },
    enabled: searchQuery.length > 0
  });
  
  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (categoryFilter) params.set('category', categoryFilter);
    params.set('searchBy', searchBy); // 添加搜索方式参数
    
    const newUrl = `/series/browse${params.toString() ? '?' + params.toString() : ''}`;
    setLocation(newUrl);
  };
  
  // Filter and sort series
  const getFilteredSeries = () => {
    // Use search results if search query exists
    let filteredSeries = searchQuery ? searchResults || [] : allSeries || [];
    
    // Apply category filter if selected
    if (categoryFilter) {
      filteredSeries = filteredSeries.filter((series: Series) => 
        series.categoryId === parseInt(categoryFilter)
      );
    }
    
    // Apply sorting
    return [...filteredSeries].sort((a: Series, b: Series) => {
      switch (sortOption) {
        case 'trending':
          return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) || b.subscriberCount - a.subscriberCount;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'popular':
          return b.subscriberCount - a.subscriberCount;
        default:
          return 0;
      }
    });
  };
  
  const filteredSeries = getFilteredSeries();
  const isLoading = loadingSeries || loadingCategories || (searchQuery && loadingSearch);

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

  return (
    <div className="container mx-auto px-4 py-20 min-h-screen">
      <SectionHeading 
        title="Browse Series"
        subtitle="Discover educational content across various categories"
        size="lg"
      />
      
      {/* Search and Filter Bar */}
      <div className="cyberpunk-card p-4 md:p-6 mb-8">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* 搜索方式选择 */}
          <div className="md:col-span-1">
            <Select
              value={searchBy}
              onValueChange={(value) => setSearchBy(value as 'title' | 'id')}
            >
              <SelectTrigger className="w-full bg-card border-primary/30">
                <SelectValue placeholder="搜索方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">按标题搜索</SelectItem>
                <SelectItem value="id">按专栏ID搜索</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* 搜索输入框 */}
          <div className="md:col-span-2 relative">
            <Input
              type="text"
              placeholder={searchBy === 'id' ? "输入专栏ID..." : "输入专栏标题或关键词..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border-primary/30"
            />
            <Button 
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-primary hover:text-secondary transition-colors"
            >
              <Search size={18} />
            </Button>
          </div>
          
          {/* 分类筛选 */}
          <div className="md:col-span-1">
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-full bg-card border-primary/30">
                <SelectValue placeholder="所有分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">所有分类</SelectItem>
                {categories?.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-1">
            <Select
              value={sortOption}
              onValueChange={setSortOption}
            >
              <SelectTrigger className="w-full bg-card border-primary/30">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-1">
            <Button type="submit" className="w-full cyberpunk-btn bg-primary hover:bg-secondary">
              <Filter className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
          </div>
        </form>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="series" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="series">Series</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="series">
          {/* Search Results Count */}
          {searchQuery && (
            <div className="mb-6">
              <h3 className="text-xl font-rajdhani font-semibold">
                {isLoading ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin mr-2 h-5 w-5" /> 
                    Searching...
                  </span>
                ) : (
                  <span>
                    Search results for "{searchQuery}": {filteredSeries.length} series found
                  </span>
                )}
              </h3>
            </div>
          )}
          
          {/* Sort Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button 
              variant={sortOption === 'trending' ? "default" : "outline"} 
              size="sm"
              onClick={() => setSortOption('trending')}
              className="flex items-center"
            >
              <TrendingUp className="mr-2 h-4 w-4" /> Trending
            </Button>
            <Button 
              variant={sortOption === 'newest' ? "default" : "outline"} 
              size="sm"
              onClick={() => setSortOption('newest')}
              className="flex items-center"
            >
              <Clock className="mr-2 h-4 w-4" /> Newest
            </Button>
            <Button 
              variant={sortOption === 'popular' ? "default" : "outline"} 
              size="sm"
              onClick={() => setSortOption('popular')}
              className="flex items-center"
            >
              <Users className="mr-2 h-4 w-4" /> Most Popular
            </Button>
            
            {categoryFilter && categories?.map((category: Category) => {
              if (category.id.toString() === categoryFilter) {
                return (
                  <Button 
                    key={category.id}
                    variant="default" 
                    size="sm"
                    className="bg-secondary"
                  >
                    {category.name}
                  </Button>
                );
              }
              return null;
            })}
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => (
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
          ) : filteredSeries.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredSeries.map((series: Series) => (
                <motion.div key={series.id} variants={itemVariants}>
                  <SeriesCard series={series} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold mb-2">No Series Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? `No results found for "${searchQuery}". Try a different search term.` 
                  : "No series available matching your filters."}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setSortOption('trending');
                  setLocation('/series/browse');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="categories">
          {loadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="cyberpunk-card p-6 animate-pulse">
                  <div className="w-10 h-10 bg-primary/30 rounded mb-4"></div>
                  <div className="h-5 bg-card/50 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-card/50 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {categories?.map((category: Category) => (
                <motion.div key={category.id} variants={itemVariants}>
                  <CategoryCard category={category} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
