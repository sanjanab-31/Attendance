import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary captured an unhandled crash:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-2xl shadow-lg text-center space-y-5">
            <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-extrabold text-primary-dark">Something went wrong</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                An unexpected error occurred and the application crashed. Details: {this.state.error?.message || "Unknown error"}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-dark hover:bg-[#163c03] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow"
            >
              <RotateCcw className="w-4 h-4" /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
