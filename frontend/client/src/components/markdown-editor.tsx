import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { useToast } from "@/hooks/use-toast";
import { Bold, Italic, List, ListOrdered, Image, Link as LinkIcon, Code } from "lucide-react";

interface MarkdownEditorProps {
  initialValue?: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  height?: string;
}

export function MarkdownEditor({ 
  initialValue = '', 
  onChange, 
  onSave, 
  height = '500px' 
}: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(initialValue);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMarkdown(newValue);
    onChange(newValue);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    const newText = beforeText + prefix + selectedText + suffix + afterText;
    textarea.value = newText;
    
    // Update state
    setMarkdown(newText);
    onChange(newText);
    
    // Set cursor position after inserted text
    const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  };

  const toolbarItems = [
    { icon: <Bold size={16} />, action: () => insertMarkdown('**', '**'), tooltip: '加粗' },
    { icon: <Italic size={16} />, action: () => insertMarkdown('*', '*'), tooltip: '斜体' },
    { icon: <ListOrdered size={16} />, action: () => insertMarkdown('\n1. '), tooltip: '有序列表' },
    { icon: <List size={16} />, action: () => insertMarkdown('\n- '), tooltip: '无序列表' },
    { icon: <LinkIcon size={16} />, action: () => insertMarkdown('[', '](url)'), tooltip: '链接' },
    { icon: <Image size={16} />, action: () => insertMarkdown('![alt text](', ')'), tooltip: '图片' },
    { icon: <Code size={16} />, action: () => insertMarkdown('\n```\n', '\n```'), tooltip: '代码块' }
  ];

  return (
    <Card className="cyber-border">
      <Tabs defaultValue="write" className="w-full">
        <div className="flex items-center justify-between p-2 border-b border-cyber-purple">
          <TabsList className="bg-cyber-surface grid grid-cols-2 w-40">
            <TabsTrigger 
              value="write" 
              className="data-[state=active]:bg-cyber-purple data-[state=active]:text-white"
            >
              编辑
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="data-[state=active]:bg-cyber-purple data-[state=active]:text-white"
            >
              预览
            </TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-1">
            {toolbarItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-cyber-text hover:text-cyber-purple"
                onClick={item.action}
                title={item.tooltip}
              >
                {item.icon}
              </Button>
            ))}
          </div>
          
          {onSave && (
            <Button 
              onClick={onSave}
              className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani"
            >
              保存
            </Button>
          )}
        </div>
        
        <CardContent className="p-0">
          <TabsContent value="write" className="p-0 m-0">
            <textarea 
              className="markdown-textarea w-full p-4 bg-cyber-dark border-0 text-cyber-text font-mono focus:outline-none focus:ring-0"
              style={{ height, resize: 'vertical' }}
              value={markdown}
              onChange={handleChange}
              placeholder="在此处编写 Markdown 内容..."
            />
          </TabsContent>
          
          <TabsContent value="preview" className="p-4 m-0 bg-cyber-dark" style={{ height, overflowY: 'auto' }}>
            <MarkdownViewer content={markdown} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
