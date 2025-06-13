import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedStates({ [id]: true })
      setTimeout(() => setCopiedStates({}), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const components = {
    // Enhanced code blocks with copy functionality
    pre: ({ children, ...props }: any) => {
      const code = children?.props?.children || ''
      const codeId = Math.random().toString(36).substr(2, 9)
      const language = children?.props?.className?.replace('language-', '') || 'text'
      
      return (
        <div className="relative group my-6">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/80 border border-border rounded-t-lg">
            <Badge variant="secondary" className="text-xs font-medium bg-background/50 text-foreground border border-border/50">
              {language}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(code, codeId)}
              className="h-8 px-2 text-xs hover:bg-background/80 text-muted-foreground hover:text-foreground"
            >
              {copiedStates[codeId] ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre
            {...props}
            className="overflow-x-auto p-4 bg-muted/50 rounded-b-lg border border-border border-t-0 text-sm text-foreground"
          >
            {children}
          </pre>
        </div>
      )
    },

    // Enhanced code inline
    code: ({ children, className, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      if (match) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        )
      }
      return (
        <code
          className="relative rounded bg-muted/70 border border-border/50 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground"
          {...props}
        >
          {children}
        </code>
      )
    },

    // Enhanced headings with anchor links
    h1: ({ children, ...props }: any) => (
      <h1
        className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mt-8 mb-6 pb-3 border-b border-border text-foreground"
        {...props}
      >
        {children}
      </h1>
    ),

    h2: ({ children, ...props }: any) => (
      <h2
        className="scroll-m-20 text-3xl font-semibold tracking-tight mt-8 mb-4 pb-2 border-b border-border text-foreground"
        {...props}
      >
        {children}
      </h2>
    ),

    h3: ({ children, ...props }: any) => (
      <h3
        className="scroll-m-20 text-2xl font-semibold tracking-tight mt-6 mb-3 text-foreground"
        {...props}
      >
        {children}
      </h3>
    ),

    h4: ({ children, ...props }: any) => (
      <h4
        className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3 text-foreground"
        {...props}
      >
        {children}
      </h4>
    ),

    h5: ({ children, ...props }: any) => (
      <h5
        className="scroll-m-20 text-lg font-semibold tracking-tight mt-4 mb-2 text-foreground"
        {...props}
      >
        {children}
      </h5>
    ),

    h6: ({ children, ...props }: any) => (
      <h6
        className="scroll-m-20 text-base font-semibold tracking-tight mt-4 mb-2 text-foreground"
        {...props}
      >
        {children}
      </h6>
    ),

    // Enhanced paragraphs
    p: ({ children, ...props }: any) => (
      <p
        className="leading-7 [&:not(:first-child)]:mt-6 text-foreground"
        {...props}
      >
        {children}
      </p>
    ),

    // Enhanced lists
    ul: ({ children, ...props }: any) => (
      <ul
        className="my-6 ml-6 list-disc [&>li]:mt-2 text-foreground [&>li]:marker:text-muted-foreground"
        {...props}
      >
        {children}
      </ul>
    ),

    ol: ({ children, ...props }: any) => (
      <ol
        className="my-6 ml-6 list-decimal [&>li]:mt-2 text-foreground [&>li]:marker:text-muted-foreground"
        {...props}
      >
        {children}
      </ol>
    ),

    li: ({ children, ...props }: any) => (
      <li
        className="text-foreground"
        {...props}
      >
        {children}
      </li>
    ),

    // Enhanced links
    a: ({ children, href, ...props }: any) => (
      <a
        href={href}
        className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 inline-flex items-center gap-1 decoration-primary/50 hover:decoration-primary"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
        {href?.startsWith('http') && <ExternalLink className="w-3 h-3" />}
      </a>
    ),

    // Enhanced tables
    table: ({ children, ...props }: any) => (
      <div className="my-6 w-full overflow-y-auto">
        <table
          className="w-full border-collapse border border-border rounded-lg overflow-hidden bg-background"
          {...props}
        >
          {children}
        </table>
      </div>
    ),

    thead: ({ children, ...props }: any) => (
      <thead
        className="bg-muted/70"
        {...props}
      >
        {children}
      </thead>
    ),

    tbody: ({ children, ...props }: any) => (
      <tbody
        className="[&_tr:last-child]:border-0 bg-background"
        {...props}
      >
        {children}
      </tbody>
    ),

    th: ({ children, ...props }: any) => (
      <th
        className="border border-border px-4 py-3 text-left font-bold text-foreground [&[align=center]]:text-center [&[align=right]]:text-right bg-muted/50"
        {...props}
      >
        {children}
      </th>
    ),

    td: ({ children, ...props }: any) => (
      <td
        className="border border-border px-4 py-3 text-left text-foreground [&[align=center]]:text-center [&[align=right]]:text-right"
        {...props}
      >
        {children}
      </td>
    ),

    // Enhanced blockquotes
    blockquote: ({ children, ...props }: any) => (
      <blockquote
        className="mt-6 border-l-4 border-primary pl-6 italic text-foreground bg-muted/30 py-4 rounded-r-lg border border-border border-l-4 border-l-primary"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Enhanced horizontal rules
    hr: ({ ...props }: any) => (
      <hr
        className="my-8 border-border"
        {...props}
      />
    ),

    // Enhanced images
    img: ({ src, alt, ...props }: any) => (
      <img
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg border border-border shadow-sm my-6 bg-background"
        {...props}
      />
    ),

    // Enhanced strong text
    strong: ({ children, ...props }: any) => (
      <strong
        className="font-bold text-foreground"
        {...props}
      >
        {children}
      </strong>
    ),

    // Enhanced emphasis
    em: ({ children, ...props }: any) => (
      <em
        className="italic text-foreground"
        {...props}
      >
        {children}
      </em>
    ),
  }

  return (
    <div className={cn(
      "prose prose-neutral max-w-none dark:prose-invert",
      "prose-headings:text-foreground prose-p:text-foreground",
      "prose-strong:text-foreground prose-code:text-foreground",
      "prose-blockquote:text-foreground prose-pre:bg-transparent",
      "prose-li:text-foreground prose-td:text-foreground prose-th:text-foreground",
      className
    )}>
      <style>{`
        .hljs {
          background: hsl(var(--muted) / 0.5) !important;
          color: hsl(var(--foreground)) !important;
          font-family: ui-monospace, 'JetBrains Mono', 'Fira Code', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        .prose .hljs {
          background: transparent !important;
        }
        
        /* Light mode syntax highlighting */
        .hljs-keyword,
        .hljs-selector-tag,
        .hljs-literal,
        .hljs-title,
        .hljs-section,
        .hljs-doctag,
        .hljs-type,
        .hljs-name {
          color: hsl(221 83% 53%) !important;
          font-weight: 600;
        }
        
        .hljs-string,
        .hljs-title.class_,
        .hljs-title.function_,
        .hljs-symbol {
          color: hsl(142 76% 36%) !important;
        }
        
        .hljs-comment,
        .hljs-quote {
          color: hsl(var(--muted-foreground)) !important;
          font-style: italic;
        }
        
        .hljs-number,
        .hljs-regexp,
        .hljs-link {
          color: hsl(262 83% 58%) !important;
        }
        
        .hljs-variable,
        .hljs-template-variable,
        .hljs-attribute {
          color: hsl(358 75% 59%) !important;
        }
        
        .hljs-tag {
          color: hsl(var(--destructive)) !important;
        }
        
        .hljs-built_in,
        .hljs-builtin-name {
          color: hsl(38 92% 50%) !important;
        }
        
        /* Dark mode overrides */
        html.dark .hljs-keyword,
        html.dark .hljs-selector-tag,
        html.dark .hljs-literal,
        html.dark .hljs-title,
        html.dark .hljs-section,
        html.dark .hljs-doctag,
        html.dark .hljs-type,
        html.dark .hljs-name {
          color: hsl(210 70% 70%) !important;
        }
        
        html.dark .hljs-string,
        html.dark .hljs-title.class_,
        html.dark .hljs-title.function_,
        html.dark .hljs-symbol {
          color: hsl(142 52% 65%) !important;
        }
        
        html.dark .hljs-number,
        html.dark .hljs-regexp,
        html.dark .hljs-link {
          color: hsl(262 60% 75%) !important;
        }
        
        html.dark .hljs-variable,
        html.dark .hljs-template-variable,
        html.dark .hljs-attribute {
          color: hsl(358 60% 70%) !important;
        }
        
        html.dark .hljs-built_in,
        html.dark .hljs-builtin-name {
          color: hsl(38 70% 65%) !important;
        }
        
        /* Ensure all text in dark mode is visible */
        html.dark .prose {
          color: hsl(var(--foreground)) !important;
        }
        
        html.dark .prose h1,
        html.dark .prose h2,
        html.dark .prose h3,
        html.dark .prose h4,
        html.dark .prose h5,
        html.dark .prose h6 {
          color: hsl(var(--foreground)) !important;
        }
        
        html.dark .prose p,
        html.dark .prose li,
        html.dark .prose td,
        html.dark .prose th,
        html.dark .prose strong,
        html.dark .prose em {
          color: hsl(var(--foreground)) !important;
        }
        
        html.dark .prose blockquote {
          color: hsl(var(--foreground)) !important;
          border-left-color: hsl(var(--primary)) !important;
        }
        
        /* Custom scrollbar for code blocks */
        .prose pre::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        
        .prose pre::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 3px;
        }
        
        .prose pre::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 3px;
        }
        
        .prose pre::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          rehypeRaw
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
} 