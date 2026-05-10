"use client";

import ReactMarkdown from "react-markdown";

interface Props {
  children: string;
}

export function MarkdownMessage({ children }: Props) {
  return (
    <ReactMarkdown
      components={{
        // Párrafos: que no añadan margen extra
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        // Listas
        ul: ({ children }) => (
          <ul className="list-disc ml-4 mb-2 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal ml-4 mb-2 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        // Énfasis
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        // Código inline y bloques
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-slate-200 text-slate-900 rounded px-1 py-0.5 text-xs">
                {children}
              </code>
            );
          }
          return (
            <code className="block bg-slate-200 text-slate-900 rounded p-2 text-xs overflow-x-auto my-2">
              {children}
            </code>
          );
        },
        // Encabezados degradados a texto fuerte (no quieres h1 dentro del chat)
        h1: ({ children }) => (
          <p className="font-semibold mb-1">{children}</p>
        ),
        h2: ({ children }) => (
          <p className="font-semibold mb-1">{children}</p>
        ),
        h3: ({ children }) => (
          <p className="font-semibold mb-1">{children}</p>
        ),
        // Links: que se abran en pestaña nueva
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-700"
          >
            {children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}