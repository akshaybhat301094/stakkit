import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../services/supabase';
import { User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Configure web browser for Google OAuth
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
          const redirectTo = makeRedirectUri({
            scheme: 'stakkit',
            preferLocalhost: true,
          });

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
            return { error: { status: 'CUSTOM_ERROR', error: error.message } };
          }

          // For web/mobile, we need to handle the redirect flow
          if (data.url) {
            const result = await WebBrowser.openAuthSessionAsync(
              data.url,
              redirectTo
            );

            if (result.type === 'success') {
              // The callback will be handled by the auth state listener
              return { data: { user: null } };
            } else {
              return { error: { status: 'CUSTOM_ERROR', error: 'Google sign-in was cancelled' } };
            }
          }

          return { data: { user: null } };
        } catch (error) {
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