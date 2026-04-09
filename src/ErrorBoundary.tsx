import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong. Please try again later.";
      
      try {
        // Check if it's a Firestore error JSON
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.error.includes("permission")) {
          message = "You don't have permission to perform this action. Please check your account status.";
        }
      } catch (e) {
        // Not a JSON error, use default
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
          <div className="p-8 bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-orange-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
