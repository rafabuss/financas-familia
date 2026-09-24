import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Ops! Algo inesperado aconteceu</h2>
            <p className="text-sm text-slate-500">
              Ocorreu uma falha na interface do aplicativo. Não se preocupe, seus dados locais e na nuvem continuam seguros.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Aplicativo</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
