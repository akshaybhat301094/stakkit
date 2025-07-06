# OAuth Setup Guide

## Overview

This guide explains how to set up Google OAuth for your Stakkit app. The OAuth flow was previously redirecting to localhost instead of the proper deep link URI. This has been fixed with the new implementation.

## What Was Fixed

The OAuth implementation has been updated to:
1. **Mobile OAuth Flow**: Now uses `WebBrowser.openAuthSessionAsync` for proper mobile OAuth handling
2. **Deep Link Processing**: Improved deep link handling in `AppNavigator.tsx` to properly parse OAuth callbacks
3. **Token Management**: Proper extraction and setting of access/refresh tokens
4. **Error Handling**: Better error messages and handling for OAuth failures

## Required Configuration

### 1. Google OAuth Console Setup

You need to configure the correct redirect URIs in your Google OAuth Console:

**For Mobile (iOS/Android):**
- `stakkit://auth/callback`

**For Web:**
- `http://localhost:3000/auth/callback` (for local development)
- `https://yourdomain.com/auth/callback` (for production)

#### Steps to configure:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable the Google+ API
4. Go to **Credentials** → **OAuth 2.0 Client IDs**
5. For each client ID (Web, iOS, Android), add the appropriate redirect URIs above

### 2. Supabase Configuration

Enable Google OAuth in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Google**
4. Add your Google OAuth Client ID and Client Secret
5. Set the redirect URL to match your app's URL scheme

### 3. App Configuration

The app is already configured with the correct URL scheme (`stakkit://`) in `app.json`.

## Testing the OAuth Flow

### Mobile Testing
1. Run the app on a physical device or simulator
2. Tap "Sign in with Google"
3. Complete the Google OAuth flow
4. Verify you're redirected back to the app and signed in

### Web Testing
1. Run the app in a web browser
2. Click "Sign in with Google" 
3. Complete the Google OAuth flow
4. Verify you're redirected back to the app and signed in

## Common Issues and Solutions

### Issue: "redirect_uri_mismatch"
**Solution:** Ensure the redirect URI in Google OAuth Console exactly matches what the app is sending:
- Mobile: `stakkit://auth/callback`
- Web: `http://localhost:3000/auth/callback` or your domain

### Issue: OAuth completes but user not signed in
**Solution:** Check the browser/device console for errors. The issue is likely:
- Tokens not being extracted properly from the callback URL
- Supabase session not being set correctly
- Auth state listener not updating the Redux store

### Issue: "localhost" error page
**Solution:** This was the original issue - the OAuth flow was redirecting to localhost instead of the proper deep link. This has been fixed with the new implementation.

## Implementation Details

### Mobile OAuth Flow
```typescript
// 1. Get OAuth URL from Supabase
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'stakkit://auth/callback',
  },
});

// 2. Open OAuth URL in browser
const result = await WebBrowser.openAuthSessionAsync(
  data.url,
  'stakkit://auth/callback'
);

// 3. Extract tokens from result URL
const accessToken = urlParams.searchParams.get('access_token');
const refreshToken = urlParams.searchParams.get('refresh_token');

// 4. Set session with tokens
await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken || '',
});
```

### Deep Link Handling
The `AppNavigator.tsx` now properly handles OAuth callback URLs:
- Parses the deep link URL for tokens
- Sets the Supabase session with the tokens
- Updates the Redux auth state

## Next Steps

1. **Configure Google OAuth Console** with the correct redirect URIs
2. **Enable Google OAuth in Supabase** with your client credentials
3. **Test the OAuth flow** on both mobile and web
4. **Verify error handling** works correctly for edge cases

The OAuth implementation is now robust and should handle the authentication flow properly without redirecting to localhost.

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