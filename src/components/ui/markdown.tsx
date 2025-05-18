import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn('markdown-content prose prose-invert prose-sm lg:prose-base max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl md:text-3xl font-bold font-rajdhani text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl md:text-2xl font-bold font-rajdhani border-b border-primary/30 pb-2 mt-6" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg md:text-xl font-semibold font-rajdhani text-accent mt-4" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-md md:text-lg font-semibold font-rajdhani text-primary/90 mt-4" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="my-4 text-muted-foreground" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-accent hover:text-accent/80 transition-colors underline" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <div className="bg-muted/60 p-4 rounded-lg my-6 border-l-4 border-accent">
              <blockquote className="m-0" {...props} />
            </div>
          ),
          ul: ({ node, ...props }) => (
            <ul className="my-4 list-disc list-inside" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-4 list-decimal list-inside" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-muted-foreground my-1" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                language={match[1]}
                style={atomDark}
                className="rounded border border-muted"
                customStyle={{
                  background: 'rgba(36, 26, 54, 0.7)',
                  borderLeft: '3px solid var(--primary)',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-muted/70 px-1.5 py-0.5 rounded text-accent font-mono text-sm" {...props}>
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted/50 border-b border-muted" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="p-2 text-left font-rajdhani font-semibold text-accent" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="p-2 border-b border-muted/30" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-muted" {...props} />
          ),
          img: ({ node, ...props }) => (
            <img className="max-w-full h-auto rounded my-4" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
