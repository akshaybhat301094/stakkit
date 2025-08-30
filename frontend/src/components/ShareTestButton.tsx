import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, BorderRadius } from './DesignSystem';

type ShareTestNavigationProp = StackNavigationProp<MainStackParamList>;

interface ShareTestButtonProps {
  style?: any;
}

const ShareTestButton: React.FC<ShareTestButtonProps> = ({ style }) => {
  const navigation = useNavigation<ShareTestNavigationProp>();
  const { colors } = useTheme();

  const testShareFeature = () => {
    Alert.alert(
      'Test Share Feature',
      'Choose a test URL to share:',
      [
        {
          text: 'YouTube Video',
          onPress: () => navigation.navigate('ShareLink', {
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
            description: 'The official video for "Never Gonna Give You Up" by Rick Astley'
          })
        },
        {
          text: 'Article',
          onPress: () => navigation.navigate('ShareLink', {
            url: 'https://www.example.com/article',
            title: 'How to Build Great Apps',
            description: 'A comprehensive guide to building amazing mobile applications'
          })
        },
        {
          text: 'URL Only',
          onPress: () => navigation.navigate('ShareLink', {
            url: 'https://www.github.com/stakkit/stakkit'
          })
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.accent },
        style
      ]}
      onPress={testShareFeature}
    >
      <Text style={[styles.buttonText, { color: 'white' }]}>
        🧪 Test Share Feature
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});

export default ShareTestButton;
