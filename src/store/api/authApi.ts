import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../services/supabase';
import { User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

// Configure web browser for OAuth
WebBrowser.maybeCompleteAuthSession();

export interface AuthResponse {
  user: User | null;
  error?: string;
}

export interface SignInWithOtpParams {
  phone: string;
}

export interface VerifyOtpParams {
  phone: string;
  token: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    signInWithOtp: builder.mutation<AuthResponse, SignInWithOtpParams>({
      queryFn: async ({ phone }) => {
        try {
          const { error } = await supabase.auth.signInWithOtp({
            phone,
            options: {
              shouldCreateUser: true,
            },
          });

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', error: error.message } };
          }

          return { data: { user: null } };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: 'Failed to send OTP' } };
        }
      },
    }),
    verifyOtp: builder.mutation<AuthResponse, VerifyOtpParams>({
      queryFn: async ({ phone, token }) => {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
          });

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', error: error.message } };
          }

          return { data: { user: data.user } };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: 'Failed to verify OTP' } };
        }
      },
      invalidatesTags: ['User'],
    }),
    signInWithGoogle: builder.mutation<AuthResponse, void>({
      queryFn: async () => {
        try {
          // Create platform-specific redirect URI
          let redirectTo: string;
          
          if (Platform.OS === 'web') {
            // For web, use the current origin + auth callback path
            redirectTo = `${window.location.origin}/auth/callback`;
          } else {
            // For mobile, use the custom scheme
            redirectTo = makeRedirectUri({
              scheme: 'stakkit',
              path: 'auth/callback',
            });
          }

          console.log('Platform:', Platform.OS);
          console.log('OAuth redirect URI:', redirectTo);

          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          });

          if (error) {
            console.error('Supabase OAuth error:', error);
            return { error: { status: 'CUSTOM_ERROR', error: error.message } };
          }

          if (data.url) {
            console.log('Opening OAuth URL:', data.url);
            
            if (Platform.OS === 'web') {
              // For web, redirect to the OAuth URL
              window.location.href = data.url;
              return { data: { user: null } };
            } else {
              // For mobile, open the OAuth URL in the system browser
              const result = await WebBrowser.openAuthSessionAsync(
                data.url,
                redirectTo,
                {
                  showInRecents: true,
                  preferEphemeralSession: true,
                }
              );

              console.log('OAuth result:', result);

              if (result.type === 'success' && result.url) {
                // The URL will contain the auth tokens, but Supabase will handle this automatically
                // via the auth state listener in AppNavigator
                console.log('OAuth success, waiting for auth state change');
                return { data: { user: null } };
              } else if (result.type === 'cancel') {
                return { error: { status: 'CUSTOM_ERROR', error: 'Google sign-in was cancelled' } };
              } else {
                return { error: { status: 'CUSTOM_ERROR', error: 'Google sign-in failed' } };
              }
            }
          }

          return { error: { status: 'CUSTOM_ERROR', error: 'No OAuth URL received' } };
        } catch (error) {
          console.error('Google OAuth error:', error);
          return { error: { status: 'CUSTOM_ERROR', error: 'Failed to sign in with Google' } };
        }
      },
      invalidatesTags: ['User'],
    }),
    signOut: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          const { error } = await supabase.auth.signOut();

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', error: error.message } };
          }

          return { data: undefined };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: 'Failed to sign out' } };
        }
      },
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useSignInWithOtpMutation,
  useVerifyOtpMutation,
  useSignInWithGoogleMutation,
  useSignOutMutation,
} = authApi; 