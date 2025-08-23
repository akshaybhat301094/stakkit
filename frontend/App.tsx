import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { registerRootComponent } from 'expo';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import ThemeProvider from './src/components/ThemeProvider';
import SplashScreen from './src/components/SplashScreen';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleSplashComplete = () => {
    setIsLoading(false);
  };

  return (
    <Provider store={store}>
      <ThemeProvider>
        <ErrorBoundary>
          {isLoading ? (
            <SplashScreen onComplete={handleSplashComplete} />
          ) : (
            <AppNavigator />
          )}
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
}

// Only register root component for native platforms
if (Platform.OS !== 'web') {
  registerRootComponent(App);
}

export default App; 