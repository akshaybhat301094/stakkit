# Share Extension Setup Guide

This guide explains how to set up the share extension feature that allows users to share links from other apps directly to Stakkit with collection selection.

## Features Implemented

✅ **Cross-Platform Support**: Works on both iOS and Android  
✅ **Collection Selection**: Choose existing collections or create new ones  
✅ **Automatic Metadata Extraction**: Extracts title, description, and images  
✅ **Background Completion**: Share process completes in background  
✅ **Deep Linking**: Uses deep links to navigate to share screen  
✅ **URL Validation**: Validates and cleans shared URLs  

## Architecture Overview

### Components Created

1. **ShareLinkScreen.tsx** - Main screen for handling shared URLs
2. **CollectionSelector.tsx** - Reusable component for collection selection
3. **DeepLinkService.ts** - Service for handling deep link routing
4. **iOS Share Extension** - Native iOS extension for sharing
5. **Android Share Intent** - Native Android intent handling

### Flow

1. User shares from another app (e.g., YouTube)
2. Native extension/intent captures the shared content
3. Deep link is created with URL and metadata
4. App opens to ShareLinkScreen with pre-filled data
5. User selects collection or creates new one
6. Link is saved and user returns to previous app

## iOS Setup

### 1. Add Share Extension Target in Xcode

1. Open your iOS project in Xcode
2. Right-click on your project in the navigator
3. Select "Add Target"
4. Choose "Share Extension" template
5. Name it "ShareExtension"
6. Set bundle identifier to `com.stakkit.app.ShareExtension`

### 2. Configure Target Settings

- **Deployment Target**: iOS 14.0 or later
- **Bundle Identifier**: `com.stakkit.app.ShareExtension`
- **App Groups**: `group.com.stakkit.app`

### 3. Add Files

The following files have been created in `/ios/ShareExtension/`:

- `ShareViewController.swift` - Main share extension logic
- `Info.plist` - Extension configuration
- `MainInterface.storyboard` - UI layout
- `ShareExtension.entitlements` - App group permissions

### 4. Update iOS App Target

Add the following to your main app's Info.plist:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.stakkit.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>stakkit</string>
        </array>
    </dict>
</array>
```

## Android Setup

### 1. Update Dependencies

The Android implementation uses standard Android components - no additional dependencies required.

### 2. Files Created

The following files have been created:

- `android/app/src/main/AndroidManifest.xml` - App and share activity declarations
- `android/app/src/main/java/com/stakkit/app/ShareActivity.java` - Share intent handler
- `android/app/src/main/java/com/stakkit/app/MainActivity.java` - Main activity with share handling
- `android/app/src/main/java/com/stakkit/app/MainApplication.java` - Application class
- `android/app/src/main/res/values/styles.xml` - Share activity styling
- `android/app/src/main/res/values/strings.xml` - String resources

### 3. Manifest Configuration

The AndroidManifest.xml includes:

- Main activity with deep link support
- Share activity for handling `ACTION_SEND` intents
- Intent filters for text and URL sharing

## React Native Integration

### 1. Deep Link Setup

The app uses the `stakkit://share` URL scheme with the following parameters:

- `url` (required) - The shared URL
- `title` (optional) - Extracted or provided title
- `description` (optional) - Extracted or provided description

Example: `stakkit://share?url=https%3A//youtube.com/watch%3Fv%3DdQw4w9WgXcQ&title=Rick%20Roll`

### 2. Navigation Configuration

The MainNavigator includes a new `ShareLink` route that accepts the following parameters:

```typescript
ShareLink: {
  url: string;
  title?: string;
  description?: string;
}
```

### 3. Services Integration

- **LinksService**: Used for saving links and managing collections
- **CollectionsService**: Used for loading and creating collections
- **LinkMetadataService**: Used for extracting metadata from URLs
- **DeepLinkService**: Handles deep link routing and navigation

## Usage

### For Users

1. **On any app** (YouTube, Twitter, Safari, etc.)
2. **Tap the Share button**
3. **Select "Save to Stakkit"** from the share sheet
4. **Choose a collection** or create a new one
5. **Tap Save** - the link is saved and you return to the original app

### For Developers

The share functionality is automatically available once the extensions are properly configured. No additional code is needed in the React Native layer.

## Testing

### iOS Testing

1. Build and run the app with the ShareExtension target
2. Open Safari and go to any website
3. Tap the Share button
4. Look for "Save to Stakkit" in the share sheet
5. Tap it to test the sharing flow

### Android Testing

1. Build and install the app
2. Open any app with sharing capability
3. Share text or a URL
4. Select "Save to Stakkit" from the share options
5. Test the sharing flow

## Troubleshooting

### iOS Issues

- **Extension doesn't appear**: Check bundle identifier and app groups configuration
- **App doesn't open**: Verify URL scheme registration in Info.plist
- **Deep link fails**: Check DeepLinkService initialization in App.tsx

### Android Issues

- **Share option doesn't appear**: Verify intent filters in AndroidManifest.xml
- **App doesn't open**: Check deep link handling in MainActivity.java
- **Share fails**: Check ShareActivity implementation and error logs

### Common Issues

- **Metadata not extracting**: Check LinkMetadataService implementation
- **Collections not loading**: Verify authentication state and Supabase connection
- **Navigation errors**: Check navigation reference setup in AppNavigator

## Security Considerations

- Share extensions run in a sandboxed environment
- No persistent storage in extensions - all data is passed via deep links
- URL validation prevents malicious content injection
- Authentication is handled in the main app, not the extension

## Performance Notes

- Share extensions should complete quickly (< 2 seconds)
- Metadata extraction happens after navigation to avoid blocking
- Background completion ensures smooth user experience
- Deep links are preferred over complex data passing

## Future Enhancements

Potential improvements for the share extension:

1. **Rich previews** in the share extension itself
2. **Quick collection switching** without opening main app
3. **Batch sharing** for multiple URLs
4. **Custom notes** during sharing
5. **Tag support** for better organization
6. **Sharing analytics** and usage tracking
