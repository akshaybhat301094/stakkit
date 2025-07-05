import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useSignInWithOtpMutation, useSignInWithGoogleMutation } from '../../store/api/authApi';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [phone, setPhone] = useState('');
  const [signInWithOtp, { isLoading: isOtpLoading }] = useSignInWithOtpMutation();
  const [signInWithGoogle, { isLoading: isGoogleLoading }] = useSignInWithGoogleMutation();

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as +1 (XXX) XXX-XXXX for US numbers
    if (digits.length <= 10) {
      if (digits.length >= 6) {
        return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else if (digits.length >= 3) {
        return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else if (digits.length > 0) {
        return `+1 (${digits}`;
      }
    }
    return digits.length > 0 ? `+1 ${digits}` : '';
  };

  const validatePhoneNumber = (phone: string) => {
    // Extract digits only
    const digits = phone.replace(/\D/g, '');
    // Check if it's a valid US phone number (10 digits)
    return digits.length === 10 || digits.length === 11;
  };

  const getCleanPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    // Return with country code +1
    return digits.length === 10 ? `+1${digits}` : `+${digits}`;
  };

  const handlePhoneChange = (value: string) => {
    // Allow only digits, spaces, parentheses, hyphens, and plus
    const cleanValue = value.replace(/[^0-9\s\(\)\-\+]/g, '');
    setPhone(cleanValue);
  };

  const handlePhoneSignIn = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      const cleanPhone = getCleanPhoneNumber(phone);
      await signInWithOtp({ phone: cleanPhone }).unwrap();
      navigation.navigate('Otp', { phone: cleanPhone });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google OAuth flow...');
      
      await signInWithGoogle().unwrap();
      console.log('Google OAuth flow initiated');
      
      // The auth state listener will handle the user sign-in
      // No need to manually check for user here
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      
      let errorMessage = 'Failed to sign in with Google';
      
      if (error.message?.includes('cancelled') || error.message?.includes('OAuth cancelled')) {
        errorMessage = 'Google sign-in was cancelled. Please try again.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('redirect_uri_mismatch')) {
        errorMessage = 'OAuth configuration error. Please check your Google OAuth console settings.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Sign In Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Stakkit</Text>
            <Text style={styles.subtitle}>
              Save, organize, and share your favorite content
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#8E8E93"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
            <Text style={styles.helperText}>
              We'll send you a verification code via SMS
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handlePhoneSignIn}
              disabled={isOtpLoading}
            >
              {isOtpLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.secondaryButtonText}>Continue with Google</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9F9FB',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F9F9FB',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#8E8E93',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginScreen; 