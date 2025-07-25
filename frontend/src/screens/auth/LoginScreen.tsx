import React, { useState, useEffect } from 'react';
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
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useSignInWithOtpMutation } from '../../store/api/authApi';
import { useDispatch } from 'react-redux';
import { setUser, setSession } from '../../store/slices/authSlice';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../services/supabase';
import StakkitLogo from '../../../assets/stakkitlogo.svg';
import LoginIllustration from '../../../assets/login.svg';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [signInWithOtp, { isLoading: isOtpLoading }] = useSignInWithOtpMutation();
  const [isGoogleLoading, setGoogleLoading] = useState(false);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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

  const keyboardVerticalOffset = Platform.OS === 'ios' ? 
    Dimensions.get('window').height * 0.27 : // Adjust this value for iOS
    -Dimensions.get('window').height * 0.1;  // Adjust this value for Android

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.logoContainer}>
              <StakkitLogo width={100} height={32} opacity={0.3} />
            </View>

            <View style={styles.content}>
              <View style={styles.illustrationContainer}>
                <LoginIllustration width={280} height={200} />
              </View>

              <View style={styles.formContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>Join Stakkit</Text>
                  <Text style={styles.subtitle}>
                    Save • organize • share
                  </Text>
                </View>

                <View style={styles.form}>
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

                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleEmailSignIn}
                    disabled={isOtpLoading}
                  >
                    {isOtpLoading ? (
                      <ActivityIndicator color="#000000" />
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
                    style={[styles.button, styles.googleButton]}
                    onPress={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.googleButtonText}>Login with Google</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    height: Dimensions.get('window').height * 0.08, // 8% of screen height
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end', // This helps with keyboard positioning
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: Dimensions.get('window').height * 0.05, // 5% of screen height
    marginBottom: Dimensions.get('window').height * 0.05, // 5% of screen height
    height: Dimensions.get('window').height * 0.25, // 25% of screen height
    paddingHorizontal: 24,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    paddingHorizontal: 32,
    paddingTop: Dimensions.get('window').height * 0.04, // 4% of screen height
    paddingBottom: 32,
    shadowColor: '#FF69B4',
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    width: '100%',
    flex: 1,
    minHeight: '58%', // Adjusted to better match golden ratio
  },
  header: {
    alignItems: 'center',
    marginBottom: Dimensions.get('window').height * 0.03, // 3% of screen height
  },
  title: {
    fontSize: 28, // Increased from 24 to 28
    fontFamily: 'Poppins_700Bold',
    color: '#000000',
    marginBottom: 2,
    textAlign: 'center',
    lineHeight: 36, // Adjusted line height to match new font size
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16, // Reduced from 20 to 16
    marginBottom: 4, // Reduced from 8 to 4
  },
  form: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: Dimensions.get('window').height * 0.02, // 2% of screen height
  },
  input: {
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#000000',
    marginBottom: Dimensions.get('window').height * 0.03, // 3% of screen height
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Dimensions.get('window').height * 0.02, // 2% of screen height
  },
  primaryButton: {
    backgroundColor: '#FFB5CC', // Light pink color from mockup
    borderRadius: 16, // More rounded corners
    borderWidth: 2, // Adding border
    borderColor: '#FF89A9', // Slightly darker pink for border
    height: 52, // Slightly taller button
  },
  primaryButtonText: {
    color: '#000000', // Changed to black text
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Dimensions.get('window').height * 0.02, // 2% of screen height
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#8E8E93',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
});

export default LoginScreen; 