import React from 'react';
import { QueryClient } from '@tanstack/react-query';

interface Props {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleRetry = () => {
    // Cache leeren und neu laden
    if (this.props.queryClient) {
      this.props.queryClient.clear();
    }
    // Seite neu laden
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Ein Fehler ist aufgetreten
            </h1>
            <p className="text-gray-600 mb-6">
              Die Anwendung wird automatisch versuchen sich wiederherzustellen.
            </p>
            <button
              onClick={this.handleRetry}
              className="bg-[#023770] text-white px-4 py-2 rounded hover:bg-[#034694] transition-colors"
            >
              Jetzt neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 