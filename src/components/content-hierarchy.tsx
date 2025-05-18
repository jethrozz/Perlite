import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { KnowledgeBase, Folder, ContentFile } from '@shared/schema';
import {
  Folder as FolderIcon,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash,
  Plus,
  Link as LinkIcon
} from 'lucide-react';

interface ContentHierarchyProps {
  knowledgeBaseId: number;
  onSelectFile?: (file: ContentFile) => void;
  onSelectFolder?: (folder: Folder) => void;
  showAssociations?: boolean;
}

interface FolderNodeProps {
  folder: Folder;
  level: number;
  knowledgeBaseId: number;
  onSelectFile?: (file: ContentFile) => void;
  onSelectFolder?: (folder: Folder) => void;
  showAssociations?: boolean;
}

interface FileNodeProps {
  file: ContentFile;
  level: number;
  onSelectFile?: (file: ContentFile) => void;
  showAssociations?: boolean;
}

// File Node Component
function FileNode({ file, level, onSelectFile, showAssociations }: FileNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  // Get associations data if needed
  const { data: associations } = useQuery({
    queryKey: ['/api/files', file.id, 'associations'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/files/${file.id}/associations`);
        if (!res.ok) throw new Error('Failed to fetch associations');
        return await res.json();
      } catch (error) {
        console.error('Error fetching file associations:', error);
        return [];
      }
    },
    enabled: showAssociations === true
  });

  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 hover:bg-card/40 rounded group",
        { "ml-6": level > 0 }
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelectFile && onSelectFile(file)}
    >
      <div className="flex items-center">
        <FileText className="text-accent/70 mr-3 h-4 w-4" />
        <span className="text-sm">{file.title}</span>
      </div>
      
      <div className={cn(
        "opacity-0 transition-opacity text-sm text-muted-foreground space-x-1",
        { "opacity-100": isHovered }
      )}>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Edit className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// Folder Node Component with Expandable Children
function FolderNode({ folder, level, knowledgeBaseId, onSelectFile, onSelectFolder, showAssociations }: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  // Get sub-folders
  const { data: subFolders } = useQuery({
    queryKey: ['/api/folders', folder.id, 'subfolders'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/folders/${folder.id}/subfolders`);
        if (!res.ok) throw new Error('Failed to fetch subfolders');
        return await res.json();
      } catch (error) {
        console.error('Error fetching subfolders:', error);
        return [];
      }
    },
    enabled: isExpanded
  });

  // Get files in this folder
  const { data: files } = useQuery({
    queryKey: ['/api/folders', folder.id, 'files'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/folders/${folder.id}/files`);
        if (!res.ok) throw new Error('Failed to fetch folder files');
        return await res.json();
      } catch (error) {
        console.error('Error fetching folder files:', error);
        return [];
      }
    },
    enabled: isExpanded
  });

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between p-2 hover:bg-card/40 rounded group",
          { "ml-6": level > 0, "bg-card/20": isExpanded }
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSelectFolder && onSelectFolder(folder)}
      >
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 p-0 mr-1" 
            onClick={toggleExpand}
          >
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
          </Button>
          {isExpanded ? 
            <FolderOpen className="text-secondary mr-3 h-4 w-4" /> : 
            <FolderIcon className="text-primary mr-3 h-4 w-4" />
          }
          <span className="text-sm">{folder.title}</span>
        </div>
        
        <div className={cn(
          "opacity-0 transition-opacity text-sm text-muted-foreground space-x-1",
          { "opacity-100": isHovered }
        )}>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-1 space-y-1">
          {/* Render sub-folders */}
          {subFolders && subFolders.map((subfolder: Folder) => (
            <FolderNode
              key={subfolder.id}
              folder={subfolder}
              level={level + 1}
              knowledgeBaseId={knowledgeBaseId}
              onSelectFile={onSelectFile}
              onSelectFolder={onSelectFolder}
              showAssociations={showAssociations}
            />
          ))}
          
          {/* Render files */}
          {files && files.map((file: ContentFile) => (
            <FileNode
              key={file.id}
              file={file}
              level={level + 1}
              onSelectFile={onSelectFile}
              showAssociations={showAssociations}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main Content Hierarchy Component
export function ContentHierarchy({ knowledgeBaseId, onSelectFile, onSelectFolder, showAssociations }: ContentHierarchyProps) {
  const [activeView, setActiveView] = useState<'folders' | 'files'>('folders');
  const { toast } = useToast();

  // Get knowledge base info
  const { data: knowledgeBase, isLoading: loadingKb } = useQuery({
    queryKey: ['/api/knowledgebases', knowledgeBaseId],
    queryFn: async () => {
      const res = await fetch(`/api/knowledgebases/${knowledgeBaseId}`);
      if (!res.ok) throw new Error('Failed to fetch knowledge base details');
      return await res.json();
    }
  });

  // Get root level folders
  const { data: rootFolders, isLoading: loadingFolders } = useQuery({
    queryKey: ['/api/knowledgebases', knowledgeBaseId, 'folders'],
    queryFn: async () => {
      const res = await fetch(`/api/knowledgebases/${knowledgeBaseId}/folders`);
      if (!res.ok) throw new Error('Failed to fetch folders');
      return await res.json();
    }
  });

  // Get root level files
  const { data: rootFiles, isLoading: loadingFiles } = useQuery({
    queryKey: ['/api/knowledgebases', knowledgeBaseId, 'files'],
    queryFn: async () => {
      const res = await fetch(`/api/knowledgebases/${knowledgeBaseId}/files`);
      if (!res.ok) throw new Error('Failed to fetch files');
      return await res.json();
    }
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: { title: string, parentFolderId?: number }) => {
      const res = await apiRequest('POST', '/api/folders', {
        ...data,
        knowledgeBaseId
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Folder created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/knowledgebases', knowledgeBaseId, 'folders'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create folder", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive" 
      });
    }
  });

  // Create file mutation
  const createFileMutation = useMutation({
    mutationFn: async (data: { title: string, content: string, folderId?: number }) => {
      const res = await apiRequest('POST', '/api/files', {
        ...data,
        knowledgeBaseId,
        content: data.content || '# New Content\n\nStart writing here...'
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "File created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/knowledgebases', knowledgeBaseId, 'files'] });
      if (onSelectFile) onSelectFile(data);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create file", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive" 
      });
    }
  });

  // Create new folder handler
  const handleCreateFolder = (title: string, parentFolderId?: number) => {
    createFolderMutation.mutate({ title, parentFolderId });
  };

  // Create new file handler
  const handleCreateFile = (title: string, folderId?: number) => {
    createFileMutation.mutate({ title, content: '', folderId });
  };

  const isLoading = loadingKb || loadingFolders || loadingFiles;

  if (isLoading) {
    return (
      <div className="bg-dark/50 p-4 rounded">
        <div className="flex items-center text-sm mb-4">
          <Button variant="outline" size="sm" className="px-3 py-1 h-auto">
            <FolderIcon className="mr-2 h-4 w-4" /> Loading...
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark/50 p-4 rounded">
      <div className="flex items-center text-sm mb-4">
        <Button 
          variant={activeView === 'folders' ? "default" : "outline"} 
          size="sm" 
          className="px-3 py-1 h-auto rounded-l flex items-center"
          onClick={() => setActiveView('folders')}
        >
          <FolderIcon className="mr-2 h-4 w-4" /> Folders
        </Button>
        <Button 
          variant={activeView === 'files' ? "default" : "outline"}
          size="sm" 
          className="px-3 py-1 h-auto rounded-r flex items-center"
          onClick={() => setActiveView('files')}
        >
          <FileText className="mr-2 h-4 w-4" /> Files
        </Button>
        
        <div className="ml-auto space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7">
                <Plus className="h-3.5 w-3.5 mr-1" /> New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                if (title) handleCreateFolder(title);
                (e.target as HTMLFormElement).reset();
                (document.activeElement as HTMLElement)?.blur();
              }}>
                <Input name="title" placeholder="Folder name" className="mb-4" autoFocus />
                <Button type="submit">Create Folder</Button>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7">
                <Plus className="h-3.5 w-3.5 mr-1" /> New File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New File</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                if (title) handleCreateFile(title);
                (e.target as HTMLFormElement).reset();
                (document.activeElement as HTMLElement)?.blur();
              }}>
                <Input name="title" placeholder="File name" className="mb-4" autoFocus />
                <Button type="submit">Create File</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="space-y-1 custom-scrollbar max-h-64 overflow-y-auto pr-2">
        {activeView === 'folders' ? (
          <div>
            {rootFolders && rootFolders.length > 0 ? (
              rootFolders.map((folder: Folder) => (
                <FolderNode
                  key={folder.id}
                  folder={folder}
                  level={0}
                  knowledgeBaseId={knowledgeBaseId}
                  onSelectFile={onSelectFile}
                  onSelectFolder={onSelectFolder}
                  showAssociations={showAssociations}
                />
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No folders found. Create a new folder to get started.
              </div>
            )}
          </div>
        ) : (
          <div>
            {rootFiles && rootFiles.length > 0 ? (
              rootFiles.map((file: ContentFile) => (
                <FileNode
                  key={file.id}
                  file={file}
                  level={0}
                  onSelectFile={onSelectFile}
                  showAssociations={showAssociations}
                />
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No files found. Create a new file to get started.
              </div>
            )}
          </div>
        )}
      </div>
      
      {showAssociations && (
        <div className="mt-6 pt-4 border-t border-primary/10">
          <h4 className="font-rajdhani font-medium mb-3 flex items-center justify-between">
            <span>Series Association</span>
            <Button variant="link" size="sm" className="text-xs text-accent p-0">
              Manage Associations
            </Button>
          </h4>
          
          <div className="space-y-2">
            <div className="p-2 border border-primary/30 rounded flex items-center justify-between">
              <div className="flex items-center">
                <LinkIcon className="text-primary mr-2 h-4 w-4" />
                <span className="text-sm">Quantum Computing Basics</span>
              </div>
              <div className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                Module 1
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
