import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { registerRootComponent } from 'expo';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
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
      <ErrorBoundary>
        {isLoading ? (
          <SplashScreen onComplete={handleSplashComplete} />
        ) : (
          <>
            <AppNavigator />
            <StatusBar style="auto" />
          </>
        )}
      </ErrorBoundary>
    </Provider>
  );
}

// Only register root component for native platforms
if (Platform.OS !== 'web') {
  registerRootComponent(App);
}

export default App; 