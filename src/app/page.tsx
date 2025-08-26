import Chat from "@/components/Chat";
export default function Home() {
  return (
    <main className="h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col max-w-none px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <span className="bg-blue-100 text-blue-600 rounded-full p-3 shadow-lg">
              {/* Simple robot SVG icon */}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="8" width="16" height="10" rx="4" fill="#3B82F6"/>
                <rect x="7" y="4" width="10" height="6" rx="3" fill="#60A5FA"/>
                <circle cx="9" cy="13" r="1.5" fill="#fff"/>
                <circle cx="15" cy="13" r="1.5" fill="#fff"/>
                <rect x="11" y="17" width="2" height="2" rx="1" fill="#2563EB"/>
              </svg>
            </span>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center">
                Trino Agent
                <span className="ml-2 animate-pulse text-blue-500 text-lg font-mono">●</span>
              </h1>
              <p className="mt-1 text-slate-600">
                Ask questions about your data. I can discover catalogs, schemas, and tables, then run SQL via Trino.
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <Chat />
        </div>
      </div>
    </main>
  );
}
