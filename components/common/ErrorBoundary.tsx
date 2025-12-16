// components/common/ErrorBoundary.tsx
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "./ui/Button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Here you could send error logs to Supabase via RPC if needed
    // logErrorToService(error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center bg-white dark:bg-gray-900 rounded-lg">
          <div className="mb-4 rounded-full bg-red-50 p-4 dark:bg-red-900/20">
            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">
            {this.state.error?.message || "An unexpected error occurred while rendering this component."}
          </p>
          <div className="flex gap-3">
            <Button
                variant="secondary"
                onClick={this.handleGoHome}
                leftIcon={<Home size={16} />}
            >
                Dashboard
            </Button>
            <Button 
                variant="primary" 
                onClick={this.handleReload}
                leftIcon={<RefreshCw size={16} />}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}