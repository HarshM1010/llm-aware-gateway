import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-zinc-100" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-zinc-100" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-zinc-100" {...props} />,
        p: ({ node, ...props }) => <p className="leading-relaxed mb-4" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2 opacity-90" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2 opacity-90" {...props} />,
        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
        a: ({ node, ...props }) => <a className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4" target="_blank" rel="noopener noreferrer" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-semibold text-zinc-100" {...props} />,
        code: ({ node, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !className?.includes("language-");
          return isInline ? (
            <code className="bg-zinc-800/80 text-cyan-300 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-zinc-700/50 flex-none" {...props}>
              {children}
            </code>
          ) : (
            <div className="relative group my-4 rounded-xl border border-zinc-800/80 bg-zinc-950/80 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
                <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
                  {match?.[1] || "text"}
                </span>
              </div>
              <div className="p-4 overflow-x-auto custom-scrollbar">
                <code className="text-[13px] font-mono leading-relaxed text-zinc-300" {...props}>
                  {children}
                </code>
              </div>
            </div>
          );
        },
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-2 border-cyan-500/50 pl-4 py-1 my-4 bg-cyan-500/5 rounded-r-lg italic text-zinc-400" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
