import React, { Component } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center text-ink">
          <div className="max-w-md rounded-app border border-line bg-surface p-8 shadow-panel">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
              <AlertCircle className="size-6" />
            </div>
            <h1 className="text-xl font-bold text-ink">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted">
              An unexpected error occurred while loading this page. Please try refreshing.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="primary"
                onClick={this.handleReload}
                icon={RefreshCw}
              >
                Reload App
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
