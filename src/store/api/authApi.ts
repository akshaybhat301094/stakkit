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
          // For mobile, we need to handle OAuth differently
          if (Platform.OS === 'web') {
            // Web OAuth flow
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
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

            return { data: { user: null } };
          } else {
            // Mobile OAuth flow using AuthSession
            const redirectUri = makeRedirectUri({
              scheme: 'stakkit',
              path: 'auth/callback',
            });

            console.log('OAuth redirect URI:', redirectUri);

            // Get the OAuth URL from Supabase
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: redirectUri,
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

            if (!data?.url) {
              return { error: { status: 'CUSTOM_ERROR', error: 'No OAuth URL received' } };
            }

            // Open the OAuth URL in the browser
            const result = await WebBrowser.openAuthSessionAsync(
              data.url,
              redirectUri,
              {
                showInRecents: true,
              }
            );

            console.log('OAuth result:', result);

            if (result.type === 'success') {
              // Extract tokens from the result URL
              const { url } = result;
              
              // Parse the URL to extract the tokens
              const urlParams = new URL(url);
              const accessToken = urlParams.searchParams.get('access_token');
              const refreshToken = urlParams.searchParams.get('refresh_token');
              
              if (accessToken) {
                // Set the session with the tokens
                await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || '',
                });

                // Don't return user data here - let the auth state listener handle it
                return { data: { user: null } };
              } else {
                return { error: { status: 'CUSTOM_ERROR', error: 'No access token received' } };
              }
            } else if (result.type === 'cancel') {
              return { error: { status: 'CUSTOM_ERROR', error: 'OAuth cancelled by user' } };
            } else {
              return { error: { status: 'CUSTOM_ERROR', error: 'OAuth failed' } };
            }
          }
        } catch (error: any) {
          console.error('OAuth error:', error);
          return { error: { status: 'CUSTOM_ERROR', error: error.message || 'OAuth failed' } };
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
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message || 'Failed to sign out' } };
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