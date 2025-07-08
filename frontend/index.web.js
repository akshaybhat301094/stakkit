import { AppRegistry } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('main', () => App);

// Create root only once
let root = null;

const renderApp = () => {
  const rootTag = document.getElementById('root');
  if (!rootTag) {
    console.error('Root element not found');
    return;
  }

  // Initialize the app
  AppRegistry.runApplication('main', {
    initialProps: {},
    rootTag,
  });
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}

// Handle hot reloading
if (module.hot) {
  module.hot.accept();
} 