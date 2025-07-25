import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    // Set a timeout to force completion after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        ref={lottieRef}
        source={require('../../assets/splash-animation.json')}
        autoPlay
        loop={false}
        speed={1}
        style={styles.lottie}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // You can change this to match your brand color
  },
  lottie: {
    flex: 1,
  },
});

export default SplashScreen; 