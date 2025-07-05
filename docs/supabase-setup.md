# 🔧 Supabase Setup Guide

This guide will help you set up Supabase for your Stakkit development environment.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `stakkit-dev` (or your preferred name)
   - **Database Password**: Generate a secure password
   - **Region**: Choose the closest region to you
6. Click "Create new project"

## 2. Set Up Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy and paste the contents of `supabase/schema.sql` from this project
3. Click "Run" to execute the schema

## 3. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add your development URL (usually `http://localhost:8081`)
3. Under **Auth Providers**, enable:
   - **Email** (should be enabled by default)
   - **Google** (optional, for social login)

### Google OAuth Setup (Optional)
If you want to enable Google login:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add the credentials to Supabase Auth settings

## 4. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 5. Configure Your App

Update the `app.json` file in your project root:

```json
{
  "expo": {
    // ... other config
    "extra": {
      "supabaseUrl": "https://your-project-id.supabase.co",
      "supabaseAnonKey": "your-anon-key-here"
    }
  }
}
```

## 6. Test Your Setup

1. Restart your Expo development server:
   ```bash
   npx expo start --clear
   ```

2. Open your app and try to sign up with an email
3. Check your Supabase dashboard → **Authentication** → **Users** to see if the user was created

## 🔒 Security Notes

- **Never commit your actual keys to version control**
- The anon key is safe to use in client-side code (it's designed for that)
- Use Row Level Security (RLS) policies to protect your data
- For production, set up proper environment variables

## 🚨 Troubleshooting

### "Missing Supabase configuration" Error
- Make sure you've updated `app.json` with your actual credentials
- Restart the Expo development server after making changes
- Check that your project URL and anon key are correct

### Authentication Not Working
- Verify your Site URL in Supabase Auth settings
- Check that email auth is enabled
- Look at the Supabase logs for error details

### Database Errors
- Ensure you've run the schema migration
- Check that RLS policies are properly configured
- Verify your database connection

## 📞 Need Help?

- Check the [Supabase Documentation](https://supabase.com/docs)
- Join the [Supabase Discord](https://discord.supabase.com/)
- Review the [Expo Documentation](https://docs.expo.dev/)

---

Once you've completed this setup, your Stakkit app will be ready for development! 🚀

# Supabase Configuration Guide

## 🔧 Authentication Setup

Your Stakkit app now uses **phone number authentication** and **Google OAuth**. Here's how to configure these features in your Supabase project.

## 📱 Phone Authentication Setup

### 1. Enable Phone Authentication
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication > Providers**
3. Scroll down to **Phone** section
4. Toggle **Enable phone signup** to ON

### 2. Configure SMS Provider
You need an SMS provider to send OTP codes. Choose one of these providers:

#### Option A: Twilio (Recommended)
1. Create a [Twilio account](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a phone number in Twilio
4. In Supabase:
   - Set **SMS provider** to "Twilio"
   - Enter your **Account SID**
   - Enter your **Auth Token** 
   - Enter your **Phone number** (with country code, e.g., +15551234567)

#### Option B: MessageBird
1. Create a [MessageBird account](https://www.messagebird.com/)
2. Get your API key
3. In Supabase:
   - Set **SMS provider** to "MessageBird"
   - Enter your **API key**

#### Option C: Vonage (formerly Nexmo)
1. Create a [Vonage account](https://www.vonage.com/)
2. Get your API key and secret
3. In Supabase:
   - Set **SMS provider** to "Vonage"
   - Enter your **API key**
   - Enter your **API secret**

### 3. Test Phone Authentication
- The phone format should be: `+1234567890` (with country code)
- OTP codes are 6 digits and expire in 60 seconds
- Users can request a new OTP every 60 seconds

## 🔐 Google OAuth Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API** or **Google Identity API**

### 2. Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - App name: "Stakkit"
   - User support email: your email
   - Developer contact email: your email
4. Add scopes: `email`, `profile`, `openid`
5. Save and continue

### 3. Create OAuth Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized redirect URIs:
   ```
   https://hmbakrharqfckivsqvca.supabase.co/auth/v1/callback
   ```
   (Replace `hmbakrharqfckivsqvca` with your actual Supabase project ID)

5. Note down:
   - **Client ID**
   - **Client Secret**

### 4. Configure in Supabase
1. Go to **Authentication > Providers**
2. Find **Google** provider
3. Toggle **Enable sign in with Google** to ON
4. Enter your **Client ID**
5. Enter your **Client Secret**
6. Save configuration

## 🎯 Testing Your Setup

### Test Phone Authentication
1. Run your app: `npm start`
2. Enter a valid phone number (with country code)
3. You should receive an SMS with a 6-digit code
4. Enter the code to complete authentication

### Test Google Authentication  
1. Click "Continue with Google"
2. You should be redirected to Google's OAuth screen
3. After granting permissions, you should be redirected back to the app
4. Check that you're logged in successfully

## 🚨 Troubleshooting

### Phone Auth Issues
- **No SMS received**: Check your SMS provider configuration and credits
- **Invalid phone format**: Use international format `+1234567890`
- **OTP expired**: Request a new code (wait 60 seconds between requests)

### Google OAuth Issues
- **Redirect mismatch**: Ensure redirect URI matches exactly in Google Cloud Console
- **Invalid client**: Double-check Client ID and Secret in Supabase
- **App not verified**: Add test users in Google Cloud Console for development

### General Issues
- **Environment variables**: Ensure `.env` file has correct Supabase URL and keys
- **Network errors**: Check internet connection and Supabase project status

## 📋 Required Environment Variables

Make sure your `.env` file contains:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://hmbakrharqfckivsqvca.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration  
EXPO_PUBLIC_APP_NAME=Stakkit
EXPO_PUBLIC_APP_VERSION=1.0.0

# Development
NODE_ENV=development
```

## 🎉 Next Steps

Once authentication is working:
1. Test both phone and Google login flows
2. Verify user data is stored in Supabase `auth.users` table
3. Check that your app redirects properly after authentication
4. Test logout functionality

Need help? Check the [Supabase Auth Documentation](https://supabase.com/docs/guides/auth) or create an issue in the project repository. 