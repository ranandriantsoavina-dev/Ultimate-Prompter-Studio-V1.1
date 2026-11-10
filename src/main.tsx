import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Scroll Auto-Fade Listener
if (typeof window !== 'undefined') {
  const activeTimers = new WeakMap<Element, number>();

  window.addEventListener(
    'scroll',
    (event) => {
      const target = event.target;
      if (target && (target instanceof Element || target === document || target === document.body)) {
        const el = target === document || target === document.body ? document.documentElement : (target as Element);

        el.classList.add('is-scrolling');

        const existingTimer = activeTimers.get(el);
        if (existingTimer) {
          window.clearTimeout(existingTimer);
        }

        const timer = window.setTimeout(() => {
          el.classList.remove('is-scrolling');
          activeTimers.delete(el);
        }, 750);

        activeTimers.set(el, timer);
      }
    },
    { capture: true, passive: true }
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0a0a0d',
          color: '#f4efe8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: '#121116',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff6600', marginBottom: '12px' }}>
              Workstation Encountered an Error
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '16px', wordBreak: 'break-word' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                backgroundColor: '#ff6600',
                color: '#000',
                fontWeight: 'bold',
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Reload Workstation
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
