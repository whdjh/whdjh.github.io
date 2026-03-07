"use client";

import ReactMarkdown from "react-markdown";

function transformImageSrc(src: string | undefined): string {
  if (!src) return "";
  if (src.startsWith("/assets/") || src.startsWith("http")) return src;
  if (src.startsWith("../assets/")) return src.replace("../assets/", "/assets/");
  if (src.startsWith("assets/")) return `/${src}`;
  return src;
}

function transformHref(href: string | undefined): string {
  if (!href) return "";
  if (href.startsWith("/pages/")) return href.replace("/pages/", "/dev/");
  if (href.startsWith("/others/")) return href.replace("/others/", "/dev/");
  return href;
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="mt-8 mb-4 text-2xl font-bold text-dark-brown">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-6 mb-3 text-xl font-semibold text-dark-brown">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-4 mb-2 text-lg font-semibold text-dark-brown">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 leading-7 text-foreground">{children}</p>
        ),
        a: ({ href, children }) => (
          <a
            href={transformHref(href)}
            className="text-light-brown underline underline-offset-4 hover:text-dark-brown"
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {children}
          </a>
        ),
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={transformImageSrc(typeof src === "string" ? src : undefined)}
            alt={alt || ""}
            className="my-4 max-w-full rounded-md"
          />
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className={`${className} block`}>
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-dark-brown">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="my-4 overflow-x-auto rounded-lg bg-[#2d2015] p-4 text-sm text-cream font-mono">
            {children}
          </pre>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 ml-6 list-disc space-y-1 text-foreground">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-1 text-foreground">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-7">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-4 border-light-brown pl-4 italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-6 border-border" />,
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-muted px-3 py-2 text-left font-semibold text-dark-brown">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-3 py-2">{children}</td>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-dark-brown">{children}</strong>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
