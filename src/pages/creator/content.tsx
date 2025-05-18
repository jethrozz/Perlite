import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeading } from '@/components/ui/section-heading';
import { ContentHierarchy } from '@/components/content-hierarchy';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { KnowledgeBase, ContentFile, Folder } from '@shared/schema';
import { 
  Plus, 
  Folder as FolderIcon, 
  FileText, 
  Loader2, 
  ArrowLeft, 
  ArrowRight,
  PenSquare,
  FolderTree,
  FolderKanban
} from 'lucide-react';
import { motion } from 'framer-motion';

// Schema for knowledge base creation/editing
const knowledgeBaseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  creatorId: z.number()
});

export default function CreatorContent() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, requireCreator } = useAuth();
  const [activeKnowledgeBase, setActiveKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [showNewKBForm, setShowNewKBForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ContentFile | null>(null);
  
  // Extract query parameters
  const params = new URLSearchParams(window.location.search);
  const kbId = params.get('kb');
  const showNewKB = params.get('new') === 'kb';
  
  // Protect this route - only for creators
  React.useEffect(() => {
    requireCreator();
  }, []);
  
  // Show new KB form if query param is present
  React.useEffect(() => {
    if (showNewKB) {
      setShowNewKBForm(true);
    }
  }, [showNewKB]);
  
  // Set active KB from URL param
  React.useEffect(() => {
    if (kbId && knowledgeBases) {
      const kb = knowledgeBases.find((kb: KnowledgeBase) => kb.id.toString() === kbId);
      if (kb) {
        setActiveKnowledgeBase(kb);
      }
    }
  }, [kbId, knowledgeBases]);

  // Get all knowledge bases for this creator
  const { data: knowledgeBases, isLoading: loadingKBs } = useQuery({
    queryKey: ['/api/knowledgebases'],
    queryFn: async () => {
      const res = await fetch('/api/knowledgebases');
      if (!res.ok) throw new Error('Failed to fetch knowledge bases');
      return await res.json();
    }
  });

  // KB creation form
  const newKBForm = useForm<z.infer<typeof knowledgeBaseSchema>>({
    resolver: zodResolver(knowledgeBaseSchema),
    defaultValues: {
      title: "",
      description: "",
      creatorId: user?.id || 0
    }
  });

  // Create knowledge base mutation
  const createKBMutation = useMutation({
    mutationFn: async (data: z.infer<typeof knowledgeBaseSchema>) => {
      const res = await apiRequest('POST', '/api/knowledgebases', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Knowledge base created successfully" });
      setShowNewKBForm(false);
      newKBForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/knowledgebases'] });
      setActiveKnowledgeBase(data);
      
      // Update URL
      navigate(`/creator/content?kb=${data.id}`);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create knowledge base", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive" 
      });
    }
  });

  // Handle file selection
  const handleSelectFile = (file: ContentFile) => {
    setSelectedFile(file);
    navigate(`/creator/editor/${file.id}`);
  };

  // Handle folder selection
  const handleSelectFolder = (folder: Folder) => {
    // Maybe use this later for folder operations
  };

  // Handle knowledge base selection
  const handleSelectKB = (kb: KnowledgeBase) => {
    setActiveKnowledgeBase(kb);
    navigate(`/creator/content?kb=${kb.id}`);
  };

  // Handle new KB submission
  const onSubmitNewKB = (values: z.infer<typeof knowledgeBaseSchema>) => {
    createKBMutation.mutate({
      ...values,
      creatorId: user?.id || 0
    });
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
          title="Content Manager"
          subtitle="Organize your educational content hierarchically"
        />
        <Button 
          className="cyberpunk-btn bg-primary hover:bg-secondary"
          onClick={() => setShowNewKBForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> New Knowledge Base
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Knowledge Base List */}
        <div className="md:col-span-1">
          <Card className="cyberpunk-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Knowledge Bases</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingKBs ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-3 border border-primary/10 rounded-md animate-pulse">
                      <div className="h-5 bg-card/50 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-card/50 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : knowledgeBases && knowledgeBases.length > 0 ? (
                <div className="space-y-2">
                  {knowledgeBases.map((kb: KnowledgeBase) => (
                    <button
                      key={kb.id}
                      className={`w-full text-left p-3 border rounded-md transition-colors ${
                        activeKnowledgeBase?.id === kb.id
                          ? 'border-primary bg-primary/10'
                          : 'border-primary/10 hover:border-primary/30 hover:bg-card/50'
                      }`}
                      onClick={() => handleSelectKB(kb)}
                    >
                      <div className="flex items-start">
                        <FolderKanban className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium">{kb.title}</div>
                          {kb.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {kb.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderKanban className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                  <p className="text-muted-foreground mb-4">No knowledge bases yet</p>
                  <Button 
                    onClick={() => setShowNewKBForm(true)} 
                    className="cyberpunk-btn bg-primary hover:bg-secondary"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create First KB
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Content Hierarchy */}
        <div className="md:col-span-2 lg:col-span-3">
          {activeKnowledgeBase ? (
            <Card className="cyberpunk-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{activeKnowledgeBase.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-primary border-primary/30"
                    >
                      <Link href={`/creator/editor?kb=${activeKnowledgeBase.id}`}>
                        <a className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" /> New File
                        </a>
                      </Link>
                    </Button>
                  </div>
                </div>
                {activeKnowledgeBase.description && (
                  <p className="text-muted-foreground text-sm">{activeKnowledgeBase.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <ContentHierarchy 
                  knowledgeBaseId={activeKnowledgeBase.id} 
                  onSelectFile={handleSelectFile}
                  onSelectFolder={handleSelectFolder}
                  showAssociations={true}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="cyberpunk-card h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <FolderTree className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">Select a Knowledge Base</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Choose a knowledge base from the left panel or create a new one to manage your content hierarchy
                </p>
                <Button 
                  onClick={() => setShowNewKBForm(true)}
                  className="cyberpunk-btn bg-primary hover:bg-secondary"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Knowledge Base
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* File Preview - disabled in favor of direct navigation to editor */}
      {/* {selectedFile && (
        <div className="mt-8">
          <Card className="cyberpunk-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  {selectedFile.title}
                </CardTitle>
                <Button 
                  variant="outline"
                  asChild
                  className="text-primary border-primary/30"
                >
                  <Link href={`/creator/editor/${selectedFile.id}`}>
                    <a className="flex items-center">
                      <PenSquare className="h-4 w-4 mr-2" /> Edit Content
                    </a>
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm lg:prose-base max-w-none">
                <pre className="font-mono text-sm bg-card/50 p-4 rounded-md border border-primary/10 overflow-auto">
                  {selectedFile.content.substring(0, 500)}
                  {selectedFile.content.length > 500 ? '...' : ''}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )} */}
      
      {/* New Knowledge Base Dialog */}
      <Dialog open={showNewKBForm} onOpenChange={setShowNewKBForm}>
        <DialogContent className="sm:max-w-[500px] cyberpunk-card">
          <DialogHeader>
            <DialogTitle>Create New Knowledge Base</DialogTitle>
            <DialogDescription>
              Create a new knowledge base to organize your content
            </DialogDescription>
          </DialogHeader>
          
          <Form {...newKBForm}>
            <form onSubmit={newKBForm.handleSubmit(onSubmitNewKB)} className="space-y-6">
              <FormField
                control={newKBForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter knowledge base title" {...field} className="bg-card border-primary/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newKBForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a brief description" 
                        {...field} 
                        className="bg-card border-primary/30" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowNewKBForm(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="cyberpunk-btn bg-primary hover:bg-secondary"
                  disabled={createKBMutation.isPending}
                >
                  {createKBMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create Knowledge Base</>
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
