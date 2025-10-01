import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ArticleMarkdownRendererProps = {
  content: string;
  className?: string;
};

export default function ArticleMarkdownRenderer({
  content,
  className,
}: ArticleMarkdownRendererProps) {
  return (
    <div className={`prose prose-lg dark:prose-invert max-w-none ${className || ""}`}>
      <div className="text-foreground leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-foreground mb-4">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold text-foreground/80 mb-3 mt-6">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-bold text-foreground/70 mb-2 mt-5">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-lg font-bold text-foreground/70 mb-2 mt-4">{children}</h4>
            ),
            p: ({ children }) => (
              <p className="mb-4 text-foreground/70 leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-4 space-y-1 text-foreground/70">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground/70">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="text-foreground/70">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-main-accent pl-4 py-2 mb-4 bg-muted rounded-r">
                <p className="text-muted-foreground italic">{children}</p>
              </blockquote>
            ),
            code: ({ children, className }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">
                    {children}
                  </code>
                );
              }

              return (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                  <code className="text-sm font-mono text-foreground">{children}</code>
                </pre>
              );
            },
            a: ({ children, href }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-main-accent hover:text-main-accent-dark underline"
              >
                {children}
              </a>
            ),
            img: ({ src, alt }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src || ""}
                alt={alt || ""}
                className="max-w-full h-auto rounded-lg shadow-lg my-4"
              />
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-border">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border px-4 py-2 bg-muted text-left font-bold">
                {children}
              </th>
            ),
            td: ({ children }) => <td className="border border-border px-4 py-2">{children}</td>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
