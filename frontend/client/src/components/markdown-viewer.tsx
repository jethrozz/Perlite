import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div className={cn("prose prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={cn("bg-cyber-surface px-1 py-0.5 rounded text-cyber-cyan", className)} {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-3xl font-rajdhani font-bold text-cyber-text border-b border-cyber-purple pb-2 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-rajdhani font-bold text-cyber-text border-b border-cyber-purple pb-1 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-rajdhani font-bold text-cyber-text mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-rajdhani font-bold text-cyber-text mb-2">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-cyber-text mb-4 leading-relaxed">
              {children}
            </p>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyber-cyan hover:text-cyber-magenta transition-colors"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-cyber-purple pl-4 py-1 italic text-cyber-text bg-cyber-surface rounded-r">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 text-cyber-text">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 text-cyber-text">
              {children}
            </ol>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-md border border-cyber-purple my-4"
            />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-cyber-purple">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-cyber-purple px-4 py-2 bg-cyber-surface text-cyber-cyan">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-cyber-purple px-4 py-2 text-cyber-text">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-6 border-t border-cyber-purple" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
