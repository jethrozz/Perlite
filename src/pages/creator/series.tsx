import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SectionHeading } from '@/components/ui/section-heading';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { getInitials, timeAgo } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertSeriesSchema } from '@shared/schema';
import type { Series, Category } from '@shared/schema';
import {
  Plus,
  Trash,
  Edit,
  MoreHorizontal,
  Search,
  ArrowUpDown,
  Users,
  Clock,
  TrendingUp,
  Tag,
  Sparkles,
  Loader2,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

export default function CreatorSeries() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, requireCreator } = useAuth();
  const [showNewSeriesForm, setShowNewSeriesForm] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  
  // Protect this route - only for creators
  React.useEffect(() => {
    requireCreator();
  }, []);

  // Get all creator's series
  const { data: creatorSeries, isLoading: loadingSeries } = useQuery({
    queryKey: ['/api/series/creator'],
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

  // Get all categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    }
  });

  // New series form
  const newSeriesForm = useForm<z.infer<typeof insertSeriesSchema>>({
    resolver: zodResolver(insertSeriesSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "0.02 ETH",
      creatorId: user?.id || 0,
      categoryId: undefined,
      thumbnailUrl: "",
      isTrending: false,
      isNew: true,
    }
  });

  // Edit series form
  const editSeriesForm = useForm<z.infer<typeof insertSeriesSchema>>({
    resolver: zodResolver(insertSeriesSchema),
    defaultValues: selectedSeries ? {
      title: selectedSeries.title,
      description: selectedSeries.description,
      price: selectedSeries.price,
      creatorId: selectedSeries.creatorId,
      categoryId: selectedSeries.categoryId,
      thumbnailUrl: selectedSeries.thumbnailUrl || "",
      isTrending: selectedSeries.isTrending,
      isNew: selectedSeries.isNew,
    } : {}
  });

  // Create series mutation
  const createSeriesMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertSeriesSchema>) => {
      const res = await apiRequest('POST', '/api/series', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Series created successfully" });
      setShowNewSeriesForm(false);
      newSeriesForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/series/creator'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create series", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  });

  // Update series mutation
  const updateSeriesMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<z.infer<typeof insertSeriesSchema>> }) => {
      const res = await apiRequest('PATCH', `/api/series/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Series updated successfully" });
      setSelectedSeries(null);
      queryClient.invalidateQueries({ queryKey: ['/api/series/creator'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update series", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive" 
      });
    }
  });

  // Delete series mutation
  const deleteSeriesMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/series/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Series deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/series/creator'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete series", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive" 
      });
    }
  });

  // Handle new series submission
  const onSubmitNewSeries = (values: z.infer<typeof insertSeriesSchema>) => {
    createSeriesMutation.mutate({
      ...values,
      creatorId: user?.id || 0
    });
  };

  // Handle edit series submission
  const onSubmitEditSeries = (values: z.infer<typeof insertSeriesSchema>) => {
    if (!selectedSeries) return;
    
    updateSeriesMutation.mutate({
      id: selectedSeries.id,
      data: values
    });
  };

  // Initialize edit form when a series is selected
  React.useEffect(() => {
    if (selectedSeries) {
      editSeriesForm.reset({
        title: selectedSeries.title,
        description: selectedSeries.description,
        price: selectedSeries.price,
        creatorId: selectedSeries.creatorId,
        categoryId: selectedSeries.categoryId,
        thumbnailUrl: selectedSeries.thumbnailUrl || "",
        isTrending: selectedSeries.isTrending,
        isNew: selectedSeries.isNew,
      });
    }
  }, [selectedSeries]);

  // Filter series based on search
  const filteredSeries = React.useMemo(() => {
    if (!creatorSeries) return [];
    
    let filtered = creatorSeries;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((series: Series) => 
        series.title.toLowerCase().includes(query) ||
        series.description.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    return [...filtered].sort((a: Series, b: Series) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return b.subscriberCount - a.subscriberCount;
      }
    });
  }, [creatorSeries, searchQuery, sortBy]);

  // Handle delete confirmation
  const handleDelete = (seriesId: number) => {
    if (confirm("Are you sure you want to delete this series? This action cannot be undone.")) {
      deleteSeriesMutation.mutate(seriesId);
    }
  };

  // Handle edit click
  const handleEdit = (series: Series) => {
    setSelectedSeries(series);
  };

  // Handle manage modules click
  const handleManageModules = (seriesId: number) => {
    navigate(`/creator/series/modules/${seriesId}`);
  };

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
      <div className="flex justify-between items-start mb-8">
        <SectionHeading 
          title="Manage Your Series"
          subtitle="Create and manage your educational content series"
        />
        
        <Button 
          className="cyberpunk-btn bg-primary hover:bg-secondary"
          onClick={() => setShowNewSeriesForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Create New Series
        </Button>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search your series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border-primary/30"
          />
          <Button 
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-primary hover:text-secondary transition-colors"
          >
            <Search size={18} />
          </Button>
        </div>
        
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'popular')}>
          <SelectTrigger className="w-[180px] bg-card border-primary/30">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Series List */}
      {loadingSeries ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="cyberpunk-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-card/50 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-card/50 rounded w-3/4 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-card/50 rounded w-1/4"></div>
                  <div className="h-4 bg-card/50 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSeries.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredSeries.map((series: Series) => (
            <motion.div key={series.id} variants={itemVariants}>
              <Card className="cyberpunk-card hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-grow">
                      <Link href={`/series/${series.id}`}>
                        <a className="text-xl font-semibold font-rajdhani hover:text-primary transition-colors">
                          {series.title}
                        </a>
                      </Link>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {series.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <div className="text-sm flex items-center text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 mr-1" /> {timeAgo(series.updatedAt)}
                        </div>
                        <div className="text-sm flex items-center text-muted-foreground">
                          <Users className="h-3.5 w-3.5 mr-1" /> {series.subscriberCount} subscribers
                        </div>
                        <div className="text-sm flex items-center text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5 mr-1" /> {series.moduleCount} modules
                        </div>
                        <div className="text-sm flex items-center text-muted-foreground">
                          <Tag className="h-3.5 w-3.5 mr-1" /> {series.price}
                        </div>
                        {series.isTrending && (
                          <Badge variant="default" className="bg-primary/80 text-white">
                            <TrendingUp className="h-3 w-3 mr-1" /> Trending
                          </Badge>
                        )}
                        {series.isNew && (
                          <Badge variant="default" className="bg-accent/80 text-black">
                            <Sparkles className="h-3 w-3 mr-1" /> New
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-primary hover:text-secondary border-primary/30"
                        onClick={() => handleEdit(series)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-primary hover:text-secondary border-primary/30"
                        onClick={() => navigate(`/creator/series/${series.id}`)}
                      >
                        <BookOpen className="h-4 w-4 mr-2" /> Modules
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => navigate(`/series/${series.id}`)}
                            className="cursor-pointer"
                          >
                            View Series
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate(`/creator/series/${series.id}`)}
                            className="cursor-pointer"
                          >
                            Manage Modules
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(series.id)}
                            className="text-destructive cursor-pointer"
                          >
                            Delete Series
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12 border border-dashed border-muted rounded-lg">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
          <h3 className="text-xl font-semibold mb-2">No Series Found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? `No series matching "${searchQuery}". Try a different search term.` 
              : "You haven't created any series yet. Start by creating your first series!"}
          </p>
          <Button 
            className="cyberpunk-btn bg-primary hover:bg-secondary"
            onClick={() => setShowNewSeriesForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Create New Series
          </Button>
        </div>
      )}
      
      {/* New Series Dialog */}
      <Dialog open={showNewSeriesForm} onOpenChange={setShowNewSeriesForm}>
        <DialogContent className="sm:max-w-[700px] cyberpunk-card">
          <DialogHeader>
            <DialogTitle>Create New Series</DialogTitle>
            <DialogDescription>
              Create a new educational series to share your knowledge
            </DialogDescription>
          </DialogHeader>
          
          <Form {...newSeriesForm}>
            <form onSubmit={newSeriesForm.handleSubmit(onSubmitNewSeries)} className="space-y-6">
              <FormField
                control={newSeriesForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter series title" {...field} className="bg-card border-primary/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newSeriesForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what subscribers will learn" 
                        {...field} 
                        className="min-h-[100px] bg-card border-primary/30" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={newSeriesForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (ETH)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 0.05 ETH" {...field} className="bg-card border-primary/30" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newSeriesForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-card border-primary/30">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={newSeriesForm.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter image URL" {...field} className="bg-card border-primary/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={newSeriesForm.control}
                  name="isNew"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-muted">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mark as New</FormLabel>
                        <FormDescription>
                          Display a "New" badge on this series
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newSeriesForm.control}
                  name="isTrending"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-muted">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mark as Trending</FormLabel>
                        <FormDescription>
                          Display a "Trending" badge on this series
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowNewSeriesForm(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="cyberpunk-btn bg-primary hover:bg-secondary"
                  disabled={createSeriesMutation.isPending}
                >
                  {createSeriesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create Series</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Series Dialog */}
      <Dialog open={!!selectedSeries} onOpenChange={(open) => !open && setSelectedSeries(null)}>
        <DialogContent className="sm:max-w-[700px] cyberpunk-card">
          <DialogHeader>
            <DialogTitle>Edit Series</DialogTitle>
            <DialogDescription>
              Update the details of your series
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editSeriesForm}>
            <form onSubmit={editSeriesForm.handleSubmit(onSubmitEditSeries)} className="space-y-6">
              <FormField
                control={editSeriesForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter series title" {...field} className="bg-card border-primary/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editSeriesForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what subscribers will learn" 
                        {...field} 
                        className="min-h-[100px] bg-card border-primary/30" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editSeriesForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (ETH)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 0.05 ETH" {...field} className="bg-card border-primary/30" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editSeriesForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-card border-primary/30">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editSeriesForm.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter image URL" {...field} className="bg-card border-primary/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editSeriesForm.control}
                  name="isNew"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-muted">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mark as New</FormLabel>
                        <FormDescription>
                          Display a "New" badge on this series
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editSeriesForm.control}
                  name="isTrending"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-muted">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mark as Trending</FormLabel>
                        <FormDescription>
                          Display a "Trending" badge on this series
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-between">
                <Button 
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (selectedSeries) {
                      handleDelete(selectedSeries.id);
                      setSelectedSeries(null);
                    }
                  }}
                  disabled={deleteSeriesMutation.isPending}
                >
                  {deleteSeriesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Series
                    </>
                  )}
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setSelectedSeries(null)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="cyberpunk-btn bg-primary hover:bg-secondary"
                    disabled={updateSeriesMutation.isPending}
                  >
                    {updateSeriesMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>Update Series</>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
