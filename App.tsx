import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Stakkit</Text>
      <Text style={styles.subtitle}>Hello World! App is working!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
}); 