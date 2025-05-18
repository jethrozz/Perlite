import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useLocation, useRoute } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentHierarchy } from '@/components/content-hierarchy';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Markdown } from '@/components/ui/markdown';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ContentFile, KnowledgeBase, Folder, Series, Module } from '@shared/schema';
import { 
  Save, 
  ArrowLeft, 
  FileText, 
  Loader2, 
  Link as LinkIcon,
  ExternalLink,
  Trash,
  Eye,
  CheckCircle,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

// Schema for file content
const fileContentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(1, "Content cannot be empty"),
  knowledgeBaseId: z.number(),
  folderId: z.number().optional().nullable(),
});

// Schema for file to module association
const associationSchema = z.object({
  moduleId: z.string().min(1, "Please select a module"),
  seriesId: z.string().min(1, "Please select a series"),
});

export default function ContentEditor() {
  const [, params] = useRoute('/creator/editor/:id');
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, requireCreator } = useAuth();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isAssociating, setIsAssociating] = useState(false);
  
  // Extract file ID from params or knowledge base ID from query
  const fileId = params?.id ? parseInt(params.id) : undefined;
  const qParams = new URLSearchParams(window.location.search);
  const knowledgeBaseId = qParams.get('kb') ? parseInt(qParams.get('kb')!) : undefined;
  const folderId = qParams.get('folder') ? parseInt(qParams.get('folder')!) : undefined;
  
  // Protect this route - only for creators
  React.useEffect(() => {
    requireCreator();
  }, []);

  // Fetch content file if editing existing file
  const { data: contentFile, isLoading: loadingFile } = useQuery({
    queryKey: ['/api/files', fileId],
    queryFn: async () => {
      const res = await fetch(`/api/files/${fileId}`);
      if (!res.ok) throw new Error('Failed to fetch file');
      return await res.json();
    },
    enabled: !!fileId
  });

  // Fetch knowledge bases
  const { data: knowledgeBases, isLoading: loadingKBs } = useQuery({
    queryKey: ['/api/knowledgebases'],
    queryFn: async () => {
      const res = await fetch('/api/knowledgebases');
      if (!res.ok) throw new Error('Failed to fetch knowledge bases');
      return await res.json();
    },
    enabled: !fileId
  });

  // Get creator's series
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
    enabled: !!user?.id && isAssociating
  });

  // Get modules for selected series
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");
  const { data: seriesModules, isLoading: loadingModules } = useQuery({
    queryKey: ['/api/series', selectedSeriesId, 'modules'],
    queryFn: async () => {
      const res = await fetch(`/api/series/${selectedSeriesId}/modules`);
      if (!res.ok) throw new Error('Failed to fetch modules');
      return await res.json();
    },
    enabled: !!selectedSeriesId && selectedSeriesId !== ""
  });

  // Editor form
  const editorForm = useForm<z.infer<typeof fileContentSchema>>({
    resolver: zodResolver(fileContentSchema),
    defaultValues: contentFile ? {
      title: contentFile.title,
      content: contentFile.content,
      knowledgeBaseId: contentFile.knowledgeBaseId,
      folderId: contentFile.folderId,
    } : {
      title: "",
      content: "# New Content\n\nStart writing here...",
      knowledgeBaseId: knowledgeBaseId || 0,
      folderId: folderId || null,
    }
  });

  // Association form
  const associationForm = useForm<z.infer<typeof associationSchema>>({
    resolver: zodResolver(associationSchema),
    defaultValues: {
      seriesId: "",
      moduleId: "",
    }
  });

  // Create/update file mutation
  const fileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fileContentSchema>) => {
      if (fileId) {
        // Update existing file
        const res = await apiRequest('PATCH', `/api/files/${fileId}`, data);
        return res.json();
      } else {
        // Create new file
        const res = await apiRequest('POST', '/api/files', data);
        return res.json();
      }
    },
    onSuccess: (data) => {
      toast({ 
        title: fileId ? "File updated successfully" : "File created successfully",
        description: "Your content has been saved"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files', fileId] });
      queryClient.invalidateQueries({ queryKey: ['/api/knowledgebases'] });
      
      // Redirect to the file edit page if creating new file
      if (!fileId) {
        navigate(`/creator/editor/${data.id}`);
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to save file", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive" 
      });
    }
  });

  // Associate file with module mutation
  const associateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof associationSchema>) => {
      const moduleId = parseInt(data.moduleId);
      const res = await apiRequest('PATCH', `/api/modules/${moduleId}`, {
        contentFileId: fileId
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Content associated with module successfully" });
      setIsAssociating(false);
      associationForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to associate content", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive" 
      });
    }
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', `/api/files/${fileId}`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "File deleted successfully" });
      navigate('/creator/content');
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete file", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive" 
      });
    }
  });

  // Update form values when content file is loaded
  useEffect(() => {
    if (contentFile) {
      editorForm.reset({
        title: contentFile.title,
        content: contentFile.content,
        knowledgeBaseId: contentFile.knowledgeBaseId,
        folderId: contentFile.folderId,
      });
    }
  }, [contentFile, editorForm]);

  // Handle form submission
  const onSubmit = (values: z.infer<typeof fileContentSchema>) => {
    fileMutation.mutate(values);
  };

  // Handle association form submission
  const onSubmitAssociation = (values: z.infer<typeof associationSchema>) => {
    associateMutation.mutate(values);
  };

  // Handle deleting a file
  const handleDeleteFile = () => {
    if (confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  // Handle series selection in association form
  const handleSeriesChange = (value: string) => {
    setSelectedSeriesId(value);
    associationForm.setValue("seriesId", value);
    associationForm.setValue("moduleId", "");
  };

  if (!isAuthenticated || (user && !user.isCreator)) {
    return null; // Will be redirected by requireCreator
  }

  const isNew = !fileId;
  const loadingInitial = isNew ? loadingKBs : loadingFile;

  // If we're creating a new file and don't have a knowledge base ID, show KB selection
  if (isNew && !knowledgeBaseId && knowledgeBases) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-screen">
        <Card className="cyberpunk-card max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Select Knowledge Base</CardTitle>
            <CardDescription>
              Choose a knowledge base to create content in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {knowledgeBases.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {knowledgeBases.map((kb: KnowledgeBase) => (
                    <Button
                      key={kb.id}
                      variant="outline"
                      className="h-auto py-4 px-6 flex justify-between items-center border-primary/30 hover:border-primary hover:bg-card/50"
                      onClick={() => navigate(`/creator/editor?kb=${kb.id}`)}
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-primary mr-3" />
                        <div className="text-left">
                          <div className="font-medium">{kb.title}</div>
                          {kb.description && (
                            <div className="text-sm text-muted-foreground mt-1">{kb.description}</div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 ml-2 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
                
                <div className="text-center pt-4 border-t border-border">
                  <p className="text-muted-foreground mb-4">
                    Need to create a new knowledge base?
                  </p>
                  <Button 
                    className="cyberpunk-btn bg-primary hover:bg-secondary"
                    asChild
                  >
                    <Link href="/creator/content?new=kb">
                      <a>Create New Knowledge Base</a>
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                <p className="text-muted-foreground mb-4">
                  You don't have any knowledge bases yet. Create one first.
                </p>
                <Button 
                  className="cyberpunk-btn bg-primary hover:bg-secondary"
                  asChild
                >
                  <Link href="/creator/content?new=kb">
                    <a>Create Knowledge Base</a>
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 min-h-screen">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          size="sm"
          asChild
          className="text-primary hover:text-secondary border-primary/30"
        >
          <Link href={`/creator/content${contentFile ? `?kb=${contentFile.knowledgeBaseId}` : ''}`}>
            <a className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Content Manager
            </a>
          </Link>
        </Button>
        
        <div className="flex gap-2">
          {fileId && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                className="text-primary hover:text-secondary border-primary/30"
                onClick={() => setIsAssociating(true)}
              >
                <LinkIcon className="mr-2 h-4 w-4" /> Associate with Module
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteFile}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash className="mr-2 h-4 w-4" /> Delete
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editing Area */}
        <div className="lg:col-span-2">
          <Card className="cyberpunk-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {isNew ? "Create New Content" : `Editing: ${contentFile?.title}`}
                </CardTitle>
                
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
                  <TabsList>
                    <TabsTrigger value="edit" className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" /> Edit
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" /> Preview
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {loadingInitial ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-card/50 rounded w-1/2"></div>
                  <div className="h-64 bg-card/50 rounded w-full"></div>
                </div>
              ) : (
                <Form {...editorForm}>
                  <form onSubmit={editorForm.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={editorForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter content title" 
                              {...field} 
                              className="bg-card border-primary/30"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editorForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Content (Markdown)</FormLabel>
                            <div className="text-xs text-muted-foreground">
                              {activeTab === 'edit' ? 'Editing Mode' : 'Preview Mode'}
                            </div>
                          </div>
                          <FormControl>
                            {activeTab === 'edit' ? (
                              <textarea
                                {...field}
                                className="font-mono text-sm w-full h-[60vh] p-4 bg-card border border-primary/30 rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary transition-all resize-none"
                                placeholder="Write your markdown content here..."
                              />
                            ) : (
                              <div className="border border-primary/30 rounded-md p-6 h-[60vh] overflow-y-auto bg-card">
                                <Markdown content={field.value} />
                              </div>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Hidden fields */}
                    <input type="hidden" {...editorForm.register("knowledgeBaseId")} />
                    <input type="hidden" {...editorForm.register("folderId")} />
                    
                    <Button 
                      type="submit"
                      className="cyberpunk-btn bg-primary hover:bg-secondary"
                      disabled={fileMutation.isPending}
                    >
                      {fileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save Content
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar/Knowledge Base Structure */}
        <div className="lg:col-span-1">
          <Card className="cyberpunk-card">
            <CardHeader>
              <CardTitle>Content Structure</CardTitle>
            </CardHeader>
            <CardContent>
              {contentFile?.knowledgeBaseId ? (
                <ContentHierarchy 
                  knowledgeBaseId={contentFile.knowledgeBaseId} 
                  onSelectFile={(file) => navigate(`/creator/editor/${file.id}`)}
                />
              ) : knowledgeBaseId ? (
                <ContentHierarchy 
                  knowledgeBaseId={knowledgeBaseId} 
                  onSelectFile={(file) => navigate(`/creator/editor/${file.id}`)}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Select a knowledge base to view content structure
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Association Dialog */}
      <Dialog open={isAssociating} onOpenChange={setIsAssociating}>
        <DialogContent className="sm:max-w-[500px] cyberpunk-card">
          <DialogHeader>
            <DialogTitle>Associate with Module</DialogTitle>
          </DialogHeader>
          
          <Form {...associationForm}>
            <form onSubmit={associationForm.handleSubmit(onSubmitAssociation)} className="space-y-6">
              <FormField
                control={associationForm.control}
                name="seriesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Series</FormLabel>
                    <Select 
                      onValueChange={handleSeriesChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-card border-primary/30">
                          <SelectValue placeholder="Select a series" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingSeries ? (
                          <SelectItem value="loading" disabled>Loading series...</SelectItem>
                        ) : creatorSeries?.length > 0 ? (
                          creatorSeries.map((series: Series) => (
                            <SelectItem key={series.id} value={series.id.toString()}>
                              {series.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No series found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={associationForm.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Module</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedSeriesId}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-card border-primary/30">
                          <SelectValue placeholder={selectedSeriesId ? "Select a module" : "Select a series first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingModules ? (
                          <SelectItem value="loading" disabled>Loading modules...</SelectItem>
                        ) : seriesModules?.length > 0 ? (
                          seriesModules.map((module: Module) => (
                            <SelectItem key={module.id} value={module.id.toString()}>
                              {module.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No modules found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This will link this content file to the selected module.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsAssociating(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="cyberpunk-btn bg-primary hover:bg-secondary"
                  disabled={associateMutation.isPending}
                >
                  {associateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Associating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" /> Associate Content
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
