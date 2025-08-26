import { useState } from 'react';
import { Cog, ChevronDown, ChevronRight } from 'lucide-react';

type ToolEvent =
  | { type: "tool_call"; name?: string; input?: Record<string, unknown> }
  | { type: "tool_result"; name?: string; output?: string };

interface ToolActivityProps {
  events: ToolEvent[];
}

export default function ToolActivity({ events }: ToolActivityProps) {
  const [showActivity, setShowActivity] = useState(false);

  if (events.length === 0) return null;

  return (
    <div className="rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 max-w-6xl mx-auto overflow-hidden">
      <button
        onClick={() => setShowActivity(!showActivity)}
        className="w-full flex items-center justify-between p-4 text-slate-700 hover:bg-blue-100/50 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Cog className="size-4 text-blue-600" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-base">Tool Execution</span>
            <div className="text-sm text-slate-500">{events.length} operations completed</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            {showActivity ? 'Hide' : 'Show'} Details
          </span>
          {showActivity ? (
            <ChevronDown className="size-5 text-slate-400" />
          ) : (
            <ChevronRight className="size-5 text-slate-400" />
          )}
        </div>
      </button>
      
      {showActivity && (
        <div className="border-t border-blue-200 bg-white">
          <div className="p-4 space-y-4 max-h-96 overflow-auto">
            {events.map((event, idx) => (
              <div key={idx} className="border-l-4 border-slate-200 pl-4">
                {event.type === "tool_call" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-blue-700">Executing: {event.name}</span>
                    </div>
                    {event.input && (
                      <div className="ml-6">
                        <div className="text-xs text-slate-500 mb-1">Parameters:</div>
                        <code className="block bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg text-sm text-blue-800 font-mono">
                          {JSON.stringify(event.input, null, 2)}
                        </code>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-semibold text-green-700">Completed: {event.name}</span>
                    </div>
                    {event.output && (
                      <div className="ml-6">
                        <div className="text-xs text-slate-500 mb-2">Result:</div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <pre className="text-sm text-green-800 font-mono whitespace-pre-wrap overflow-auto max-h-32">
                            {event.output}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}