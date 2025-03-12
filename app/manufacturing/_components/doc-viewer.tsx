"use client"

import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import { Card } from "@/components/ui/card"

interface DocViewerProps {
  content: string
}

export function DocViewer({ content }: DocViewerProps) {
  return (
    <Card className="prose dark:prose-invert max-w-none p-6">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
        components={{
          a: props => (
            <a
              {...props}
              className="text-primary hover:underline"
              target={props.href?.startsWith("http") ? "_blank" : undefined}
              rel={
                props.href?.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
            />
          ),
          h1: props => (
            <h1 {...props} className="mb-4 mt-6 text-3xl font-bold" />
          ),
          h2: props => (
            <h2 {...props} className="mb-3 mt-5 text-2xl font-bold" />
          ),
          h3: props => (
            <h3 {...props} className="mb-2 mt-4 text-xl font-bold" />
          ),
          ul: props => <ul {...props} className="my-4 list-disc pl-6" />,
          ol: props => <ol {...props} className="my-4 list-decimal pl-6" />,
          li: props => <li {...props} className="mb-1" />,
          table: props => (
            <table
              {...props}
              className="my-4 w-full table-auto border-collapse"
            />
          ),
          th: props => (
            <th
              {...props}
              className="border-muted bg-muted border p-2 font-bold"
            />
          ),
          td: props => <td {...props} className="border-muted border p-2" />,
          blockquote: props => (
            <blockquote
              {...props}
              className="border-muted my-4 border-l-4 pl-4 italic"
            />
          ),
          code: (props: any) => {
            const { inline, className, children, ...rest } = props
            return !inline ? (
              <pre className="bg-muted my-4 overflow-x-auto rounded-md p-4">
                <code className={className} {...rest}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-muted rounded px-1 py-0.5 text-sm" {...rest}>
                {children}
              </code>
            )
          },
          img: props => (
            <img
              {...props}
              className="my-4 h-auto max-w-full rounded-md"
              alt={props.alt || "Documentation image"}
            />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </Card>
  )
}
