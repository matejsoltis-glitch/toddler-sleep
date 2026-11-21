import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// One-time reset to fresh-install state as requested
try {
  const RESET_KEY = 'toddler_fresh_install_reset_v5';
  if (!localStorage.getItem(RESET_KEY)) {
    const keysToClear = [
      'toddler_lang_configured',
      'toddler_lang',
      'toddler_baby_name',
      'toddler_baby_birth_date',
      'toddler_lockscreen_sleep_enabled',
      'toddler_active_sleep_start',
      'toddler_sleep_sessions',
      'toddler_sleep_schedule_bounds',
      'toddler_night_mode',
      'toddler_color_mode',
      'toddler_components_opacity',
      'toddler_day_brightness',
      'toddler_night_brightness',
      'toddler_day_opacity',
      'toddler_night_opacity',
      'toddler_active_palette_id',
      'toddler_custom_light_palette',
    ];
    keysToClear.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(RESET_KEY, '1');
  }
} catch {
  // ignore
}


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
