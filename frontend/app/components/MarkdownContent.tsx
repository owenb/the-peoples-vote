'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
        // Headings
        h1: ({ children }) => (
          <h1
            className="mb-6 mt-8 text-4xl font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            className="mb-4 mt-6 text-3xl font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            className="mb-3 mt-5 text-2xl font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4
            className="mb-2 mt-4 text-xl font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5
            className="mb-2 mt-3 text-lg font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6
            className="mb-2 mt-3 text-base font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </h6>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p
            className="mb-4 leading-relaxed text-white/80"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </p>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FF00FF] underline decoration-[#FF00FF]/50 transition hover:text-[#FF1493] hover:decoration-[#FF1493]"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </a>
        ),

        // Lists
        ul: ({ children }) => (
          <ul
            className="mb-4 ml-6 list-disc space-y-2 text-white/80"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol
            className="mb-4 ml-6 list-decimal space-y-2 text-white/80"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed" style={{ fontFamily: 'Handjet, monospace' }}>
            {children}
          </li>
        ),

        // Code
        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code
                className="rounded bg-[#00FFFF]/20 px-2 py-1 text-[#00FFFF]"
                style={{ fontFamily: 'monospace' }}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className={className}
              style={{ fontFamily: 'monospace' }}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-4 overflow-x-auto rounded-lg border border-[#00FFFF]/30 bg-black/50 p-4 backdrop-blur-sm">
            {children}
          </pre>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="mb-4 border-l-4 border-[#FF00FF] bg-[#FF00FF]/10 py-2 pl-4 pr-2 italic text-white/80">
            {children}
          </blockquote>
        ),

        // Horizontal rule
        hr: () => (
          <hr className="my-8 border-t border-white/20" />
        ),

        // Tables
        table: ({ children }) => (
          <div className="mb-4 overflow-x-auto">
            <table className="min-w-full border-collapse border border-white/20">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-white/10">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody>
            {children}
          </tbody>
        ),
        tr: ({ children }) => (
          <tr className="border-b border-white/10">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th
            className="px-4 py-2 text-left font-bold text-white"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            className="px-4 py-2 text-white/80"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {children}
          </td>
        ),

        // Strong/Bold
        strong: ({ children }) => (
          <strong className="font-bold text-white">
            {children}
          </strong>
        ),

        // Emphasis/Italic
        em: ({ children }) => (
          <em className="italic text-white/90">
            {children}
          </em>
        ),

        // Strikethrough
        del: ({ children }) => (
          <del className="text-white/60 line-through">
            {children}
          </del>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
