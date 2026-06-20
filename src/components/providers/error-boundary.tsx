"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    hasError: false,
  };

  static defaultProps = {
    resetOnPropsChange: false,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, hasError: true };
  }

  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: ErrorBoundaryState) {
    if (props.resetOnPropsChange && state.hasError) {
      return { error: null, hasError: false };
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by boundary:", error);
    console.error("Error info:", errorInfo);

    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    this.setState({ error: null, hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-opacity-95 bg-primary-50 fixed top-0 left-0 z-50 grid h-screen w-screen place-items-center">
          <div
            role="alert"
            className="flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-xs border border-neutral-400 bg-white p-6 shadow-lg"
          >
            <svg
              className="h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-center text-xl font-medium">
              Something went wrong. Our developers are working on fixing this
            </h2>
            <p className="text-center text-sm text-neutral-600">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <div className="mt-2 flex gap-4">
              <button
                className="rounded-xs bg-neutral-200 px-4 py-2 transition-colors hover:bg-neutral-300"
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
              <button
                className="rounded-xs bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                onClick={this.resetErrorBoundary}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, "children"> = {},
): React.FC<P> => {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${Component.displayName || Component.name || "Component"})`;
  return WithErrorBoundary;
};
