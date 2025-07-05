import React, { useState, useRef, useEffect } from 'react';
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
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useVerifyOtpMutation, useSignInWithOtpMutation } from '../../store/api/authApi';
import { useAppDispatch } from '../../store/hooks';
import { setUser } from '../../store/slices/authSlice';

type OtpScreenRouteProp = RouteProp<AuthStackParamList, 'Otp'>;
type OtpScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Otp'>;

const OtpScreen: React.FC = () => {
  const route = useRoute<OtpScreenRouteProp>();
  const navigation = useNavigation<OtpScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { phone } = route.params;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useSignInWithOtpMutation();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const formatPhoneNumber = (phone: string) => {
    // Remove + and country code for display
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      const usDigits = digits.slice(1);
      return `(${usDigits.slice(0, 3)}) ${usDigits.slice(3, 6)}-${usDigits.slice(6)}`;
    }
    return phone;
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    try {
      const result = await verifyOtp({ phone, token: code }).unwrap();
      if (result.user) {
        dispatch(setUser(result.user));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid verification code');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOtp = async () => {
    try {
      await resendOtp({ phone }).unwrap();
      setCountdown(60);
      setCanResend(false);
      Alert.alert('Success', 'A new verification code has been sent to your phone');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend verification code');
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify Your Phone</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to{'\n'}
              <Text style={styles.phone}>{formatPhoneNumber(phone)}</Text>
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                autoFocus={index === 0}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => handleVerify()}
            disabled={isVerifying || otp.some(digit => !digit)}
          >
            {isVerifying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp} disabled={isResending}>
                {isResending ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Text style={styles.resendText}>Resend Code</Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.countdownText}>
                Resend code in {countdown}s
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
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
  phone: {
    fontWeight: '600',
    color: '#1C1C1E',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    backgroundColor: '#F9F9FB',
  },
  otpInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
});

export default OtpScreen; 