import { AlertCircle, Zap, Database, Loader2 } from 'lucide-react';
import clsx from 'clsx';

type ConnectionStatus = {
  mode: string;
  status: string;
  message: string;
  endpoint: string | null;
  features: string[];
};

interface ConnectionStatusProps {
  status: ConnectionStatus | null;
}

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusIcon = () => {
    if (!status) return <Loader2 className="h-4 w-4 animate-spin" />;
    
    switch (status.mode) {
      case "direct_trino":
        return <Zap className="h-4 w-4 text-blue-500" />;
      case "error":
      case "disconnected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (!status) return "Checking connection...";
    
    switch (status.mode) {
      case "direct_trino":
        return "Direct Trino";
      case "error":
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = () => {
    if (!status) return "text-gray-500";
    
    switch (status.mode) {
      case "direct_trino":
        return "text-blue-600";
      case "error":
      case "disconnected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-white rounded-t-xl">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={clsx("text-sm font-medium", getStatusColor())}>
          {getStatusText()}
        </span>
        {status?.endpoint && (
          <span className="text-xs text-slate-500">
            • {status.endpoint}
          </span>
        )}
      </div>
      {status && (
        <span className="text-xs text-slate-400" title={status.message}>
          {status.status === "connected" ? "Connected" : "Error"}
        </span>
      )}
    </div>
  );
}