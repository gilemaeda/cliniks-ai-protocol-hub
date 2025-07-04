import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  navigate: NavigateFunction;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AnamnesisErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Anamnesis Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Erro na Anamnese
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Ocorreu um erro inesperado. Tente recarregar a página ou voltar ao dashboard.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recarregar
                </Button>
                <Button
                  onClick={() => this.props.navigate('/dashboard')}
                >
                  Voltar ao Dashboard
                </Button>
              </div>
              {this.state.error && (
                <details className="mt-4 text-xs text-gray-500">
                  <summary>Detalhes do erro</summary>
                  <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component que usa o hook useNavigate e passa para o ErrorBoundary
const AnamnesisErrorBoundaryWithRouter: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  return <AnamnesisErrorBoundary navigate={navigate}>{children}</AnamnesisErrorBoundary>;
};

export default AnamnesisErrorBoundaryWithRouter;
