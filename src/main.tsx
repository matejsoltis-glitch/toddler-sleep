import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error in Toddler Sleep Assistant:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('toddler_components_opacity');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-xs flex flex-col items-center gap-3">
            <h2 className="text-base font-bold text-white">Toddler sleep assistant</h2>
            <p className="text-xs text-white/60">
              Vyskytla sa drobná chyba pri vykresľovaní. Nastavenia priehľadnosti boli obnovené.
            </p>
            <button
              onClick={this.handleReset}
              className="mt-2 py-2.5 px-5 rounded-2xl bg-amber-400 text-slate-950 font-bold text-xs active:scale-95 transition-all shadow-lg"
            >
              Obnoviť obrazovku
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
