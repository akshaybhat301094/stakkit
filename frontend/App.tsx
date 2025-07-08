import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { registerRootComponent } from 'expo';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <AppNavigator />
        <StatusBar style="auto" />
      </ErrorBoundary>
    </Provider>
  );
}

// Only register root component for native platforms
if (Platform.OS !== 'web') {
  registerRootComponent(App);
}

export default App; 