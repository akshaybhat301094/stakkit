# Google OAuth Setup Guide

## 🔧 Fix "redirect_uri_mismatch" Error

The error you're seeing occurs because the redirect URI configured in your Google OAuth application doesn't match what your app is sending.

## 📋 Step-by-Step Fix

### 1. Get Your Redirect URIs

Your app uses different redirect URIs based on platform:

**For Web Development:**
```
http://localhost:8081/auth/callback
```

**For Mobile Development:**
```
stakkit://auth/callback
```

**For Web Production:**
```
https://yourdomain.com/auth/callback
```

### 2. Configure Google OAuth Console

1. **Go to Google Cloud Console:**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Select your project (or create one if you don't have one)

2. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it

3. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" for user type
   - Fill in required fields:
     - App name: `Stakkit`
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `email`, `profile`
   - Add test users (your email) if in testing mode

4. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Name: `Stakkit Web`
   - Add Authorized JavaScript origins:
     ```
     http://localhost:8081
     https://yourdomain.com (for production)
     ```
   - Add Authorized redirect URIs:
     ```
     http://localhost:8081/auth/callback
     https://yourdomain.com/auth/callback (for production)
     ```

5. **Get Your Client ID:**
   - Copy the Client ID from the created credentials
   - You'll need this for Supabase configuration

### 3. Configure Supabase

1. **Go to Supabase Dashboard:**
   - Visit [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Configure Google OAuth:**
   - Go to "Authentication" → "Providers"
   - Enable Google provider
   - Add your Google Client ID
   - Add your Google Client Secret (from Google Console)

3. **Configure Redirect URLs:**
   - In "Authentication" → "URL Configuration"
   - Add Site URL: `http://localhost:8081` (for development)
   - Add Redirect URLs:
     ```
     http://localhost:8081/auth/callback
     https://yourdomain.com/auth/callback (for production)
     stakkit://auth/callback (for mobile)
     ```

### 4. Test the Setup

1. **Use the Debug Helper:**
   - Run your app: `npm run web`
   - Click "Sign in with Google"
   - Check the debug alert to see the redirect URI
   - Verify it matches what you configured

2. **Test OAuth Flow:**
   - Click "Continue" in the debug alert
   - Complete the Google OAuth flow
   - You should be redirected back to your app

### 5. Remove Debug Code (After Testing)

Once everything works, remove the debug alert from `LoginScreen.tsx` and restore the original `handleGoogleSignIn` function.

## 🔒 Security Notes

- **Never commit** your Google Client Secret to version control
- Use environment variables for sensitive data
- Test with multiple Google accounts
- Enable 2FA on your Google Cloud Console account

## 🐛 Common Issues

1. **"This app isn't verified"** - Add your email as a test user
2. **"redirect_uri_mismatch"** - Double-check all redirect URIs match exactly
3. **"access_denied"** - User cancelled or app isn't approved
4. **"invalid_client"** - Wrong Client ID or Secret

## 📱 Mobile-Specific Setup

For mobile apps, you'll also need to:

1. **Configure Android OAuth:**
   - Get your SHA1 fingerprint: `keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore`
   - Add it to Google Console under "Android" OAuth client

2. **Configure iOS OAuth:**
   - Add your iOS bundle ID to Google Console
   - Configure URL schemes in your iOS app

## 🚀 Production Deployment

When deploying to production:

1. Update redirect URIs to use your production domain
2. Update Supabase Site URL to your production domain
3. Update Google OAuth console with production URIs
4. Test the entire flow in production environment

---

Need help? Check the [Supabase Auth documentation](https://supabase.com/docs/guides/auth) or [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2). 