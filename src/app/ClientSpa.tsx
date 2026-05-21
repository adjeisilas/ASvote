"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import dynamic from 'next/dynamic';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ClientSpaErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical rendering exception:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
          <div className="p-8 bg-slate-950 border border-red-500/30 rounded-xl max-w-2xl w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-3 text-red-400 flex items-center gap-2">
              <span className="p-1 px-2 border border-red-500/50 bg-red-500/10 rounded text-xs">CRASH</span>
              ASVote Core Engine Runtime Exception
            </h2>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              An unexpected rendering exception was caught. Development console error outputs are logged below. Try refreshing the browser tab or clearing localStorage.
            </p>
            <div className="bg-black/50 border border-slate-800 p-4 rounded-lg">
              <pre className="text-red-300 text-xs overflow-auto font-mono max-h-72 whitespace-pre-wrap leading-tight">
                {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
              </pre>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-5 px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppWithNoSSR = dynamic(
  () => import('../App').catch((err) => {
    console.error("Dynamic import rejection:", err);
    return {
      default: () => (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
          <div className="p-8 bg-slate-950 border border-amber-500/30 rounded-xl max-w-2xl w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-3 text-amber-400 flex items-center gap-2">
              <span className="p-1 px-2 border border-amber-500/50 bg-amber-500/10 rounded text-xs">IMPORT_FAILED</span>
              ASVote Module Resolution Failure
            </h2>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              The application failed to resolve or compile client bundles. This usually happens when index components or views have broken exports, syntax errors, or unhandled file lookups.
            </p>
            <div className="bg-black/50 border border-slate-800 p-4 rounded-lg">
              <pre className="text-amber-300 text-xs overflow-auto font-mono max-h-72 whitespace-pre-wrap leading-tight">
                {err instanceof Error ? err.stack || err.message : String(err)}
              </pre>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-5 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
            >
              Retry Loading Core
            </button>
          </div>
        </div>
      )
    };
  }),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-4">
          {/* Custom blue spinner loading state */}
          <div className="w-10 h-10 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }
);

export default function ClientSpa() {
  return (
    <ClientSpaErrorBoundary>
      <AppWithNoSSR />
    </ClientSpaErrorBoundary>
  );
}
