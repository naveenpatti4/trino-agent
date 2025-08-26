import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain } from 'lucide-react';
import clsx from 'clsx';

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[95%] rounded-2xl px-6 py-4 text-base",
          isUser ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"
        )}
      >
        {content ? (
          <div className={clsx(
            "prose max-w-none",
            isUser ? "prose-invert" : "prose-slate"
          )}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom table styling
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-slate-200 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 border-b-2 border-slate-300">
                    {children}
                  </th>
                ),
                tbody: ({ children }) => (
                  <tbody className="bg-white">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
                    {children}
                  </tr>
                ),
                td: ({ children }) => (
                  <td className="px-6 py-4 text-slate-900 font-medium">
                    {children}
                  </td>
                ),
                // Custom code styling
                code: ({ children, ...props }) => {
                  const isInline = !String(children).includes('\n');
                  if (isInline) {
                    return (
                      <code className={clsx(
                        "px-1.5 py-0.5 rounded text-sm font-mono",
                        isUser 
                          ? "bg-slate-700 text-slate-200" 
                          : "bg-slate-200 text-slate-800"
                      )} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className={clsx(
                      "block p-4 rounded-lg font-mono text-sm overflow-x-auto",
                      isUser 
                        ? "bg-slate-800 text-slate-200" 
                        : "bg-slate-100 text-slate-900"
                    )} {...props}>
                      {children}
                    </code>
                  );
                },
                // Custom list styling
                ul: ({ children }) => (
                  <ul className="space-y-1 ml-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="space-y-1 ml-4">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">
                    {children}
                  </li>
                ),
                // Custom heading styling
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold text-slate-800 mt-4 first:mt-0 mb-3">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-bold text-slate-800 mt-4 first:mt-0 mb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-bold text-slate-800 mt-3 first:mt-0 mb-2">
                    {children}
                  </h3>
                ),
                // Custom paragraph styling
                p: ({ children }) => (
                  <p className="leading-relaxed mb-2 last:mb-0">
                    {children}
                  </p>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
            <div className="flex items-center gap-3 text-slate-600">
                <Brain className="size-5 animate-pulse text-blue-500" />
                <span className="font-medium text-base">Thinking...</span>
            </div>
        )}
      </div>
    </div>
  );
}