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
import { useSignInWithOtpMutation, useSignInAsGuestMutation } from '../../store/api/authApi';
import { useDispatch } from 'react-redux';
import { setUser, setSession } from '../../store/slices/authSlice';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../services/supabase';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [signInWithOtp, { isLoading: isOtpLoading }] = useSignInWithOtpMutation();
  const [signInAsGuest, { isLoading: isGuestLoading }] = useSignInAsGuestMutation();
  const [isGoogleLoading, setGoogleLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value.trim());
  };

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await signInWithOtp({ email }).unwrap();
      navigation.navigate('Otp', { email });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    }
  };

  const handleGuestSignIn = async () => {
    try {
      const result = await signInAsGuest().unwrap();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Set the user and session in the auth state
      if (result.session) {
        dispatch(setSession(result.session));
      }
      
      // The auth state listener will handle the navigation automatically
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in as guest');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const redirectTo = Platform.OS === 'web'
        ? window.location.origin + '/auth/callback'
        : 'stakkit://auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo,
          scopes: 'email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      if (data?.url && Platform.OS !== 'web') {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
          {
            showInRecents: true,
            dismissButtonStyle: 'done',
            preferEphemeralSession: true
          }
        );

        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const fragment = url.hash.substring(1);
          const params = new URLSearchParams(fragment);
          
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });

            if (sessionError) throw sessionError;

            if (sessionData.session) {
              dispatch(setSession(sessionData.session));
              return;
            }
          }
        }

        // Fallback session checks
        for (let i = 0; i < 3; i++) {
          const { data: sessionData } = await supabase.auth.getSession();

          if (sessionData?.session) {
            dispatch(setSession(sessionData.session));
            break;
          }

          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Google Sign-In Error', error.message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
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
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor="#8E8E93"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              We'll send you a verification code via email
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleEmailSignIn}
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
              style={[styles.button, { backgroundColor: '#4285F4', marginBottom: 8 }]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 17 }}>Login with Google</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.guestButton]}
              onPress={handleGuestSignIn}
              disabled={isGuestLoading}
            >
              {isGuestLoading ? (
                <ActivityIndicator color="#8E8E93" />
              ) : (
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.developmentNote}>
              Development Mode: Guest access will be removed in production
            </Text>
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
    color: '#1D1D1F',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 48,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    backgroundColor: '#F2F2F7',
    color: '#1D1D1F',
  },
  helperText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E7',
  },
  dividerText: {
    fontSize: 15,
    color: '#8E8E93',
    marginHorizontal: 16,
  },
  guestButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    marginBottom: 8,
  },
  guestButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
  },
  developmentNote: {
    fontSize: 12,
    color: '#FF9500',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen; 