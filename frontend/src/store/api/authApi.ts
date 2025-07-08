import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../services/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error?: string;
}

export interface SignInWithOtpParams {
  email: string;
}

export interface VerifyOtpParams {
  email: string;
  token: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    signInWithOtp: builder.mutation<AuthResponse, SignInWithOtpParams>({
      queryFn: async ({ email }) => {
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: true,
            },
          });

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', error: error.message } };
          }

          return { data: { user: null, session: null } };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: 'Failed to send OTP' } };
        }
      },
    }),
    verifyOtp: builder.mutation<AuthResponse, VerifyOtpParams>({
      queryFn: async ({ email, token }) => {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
          });

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', error: error.message } };
          }

          return { data: { user: data.user, session: data.session } };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: 'Failed to verify OTP' } };
        }
      },
      invalidatesTags: ['User'],
    }),
    signInAsGuest: builder.mutation<AuthResponse, void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.auth.signInAnonymously();

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', error: error.message } };
          }

          return { data: { user: data.user, session: data.session } };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message || 'Failed to sign in as guest' } };
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
    getSession: builder.query<AuthResponse, void>({
      queryFn: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', error: error.message } };
          }

          return { data: { user: session?.user ?? null, session } };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message || 'Failed to get session' } };
        }
      },
    }),
  }),
});

export const {
  useSignInWithOtpMutation,
  useVerifyOtpMutation,
  useSignInAsGuestMutation,
  useSignOutMutation,
  useGetSessionQuery,
} = authApi; 