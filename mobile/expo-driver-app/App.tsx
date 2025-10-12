import React, { Component, ErrorInfo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import RootNavigator from './src/navigation/RootNavigator';

// Global error handling to capture stack traces that otherwise cause silent crashes
// and to print helpful diagnostics to Metro logs.
if ((global as any).ErrorUtils) {
  const defaultHandler = (global as any).ErrorUtils.getGlobalHandler && (global as any).ErrorUtils.getGlobalHandler();
  (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    try {
      console.error('🔴 Global Error Caught:', { message: error?.message, stack: error?.stack, isFatal });
    } catch (e) {
      // ignore
    }
    if (typeof defaultHandler === 'function') {
      defaultHandler(error, isFatal);
    }
  });
}

class RootErrorBoundary extends Component<{ children?: React.ReactNode }, { hasError: boolean; error?: any }>
{
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: ErrorInfo) {
    console.error('🚨 React Error Boundary caught an error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <React.Fragment>
          <StatusBar style="auto" />
          <NavigationContainer>
            {/* Render a very small fallback UI to avoid full crash */}
            <RootNavigator />
          </NavigationContainer>
        </React.Fragment>
      );
    }
    return this.props.children || null;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <RootErrorBoundary>
          <NavigationContainer>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </RootErrorBoundary>
      </LocationProvider>
    </AuthProvider>
  );
}

