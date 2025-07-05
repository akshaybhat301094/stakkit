import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { registerRootComponent } from 'expo';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-url-polyfill/auto';

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
      <StatusBar style="auto" />
    </Provider>
  );
}

registerRootComponent(App); 