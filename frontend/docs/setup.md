# Stakkit Phase 1 Setup Guide

## 🚀 Development Environment Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio with Android SDK (for Android development)

### 1. Project Installation

```bash
# Clone the repository
git clone https://github.com/akshaybhat301094/stakkit.git
cd stakkit

# Install dependencies
npm install

# Copy environment variables
cp env.example .env
```

### 2. Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Configure Environment Variables**
   - Open `.env` file
   - Replace the placeholder values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Set up Database Schema**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the SQL script to create tables and policies

4. **Configure Authentication**
   - Go to Authentication > Settings
   - Enable Email authentication
   - Configure social providers (Google, Apple) if needed

### 3. Development Server

```bash
# Start the development server
npm start

# For specific platforms
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser
```

### 4. Code Quality Tools

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

## 📱 Testing the Setup

1. **Start the app** using `npm start`
2. **Open in simulator** - should see "Welcome to Stakkit" screen
3. **Check console** - no errors should appear
4. **Test navigation** - basic app structure should work

## 🔧 Project Structure

```
stakkit/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Main app layout
│   └── index.tsx          # Home screen
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   ├── services/         # API and business logic
│   │   └── supabase.ts   # Supabase client
│   ├── types/            # TypeScript definitions
│   │   ├── database.ts   # Database types
│   │   └── index.ts      # General types
│   └── utils/            # Helper functions
├── assets/               # Images, fonts, etc.
├── supabase/
│   └── schema.sql        # Database schema
├── docs/                 # Documentation
└── tests/                # Test files
```

## 🎯 Next Steps

After completing Phase 1 setup, you're ready to move on to:

1. **Phase 2**: Authentication & User Management
2. **Phase 3**: Core Link Saving Functionality
3. **Phase 4**: Collections Management

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **iOS Simulator not opening**
   - Ensure Xcode is installed
   - Open Xcode and accept license agreements

3. **Android emulator issues**
   - Ensure Android Studio is properly configured
   - Create an AVD (Android Virtual Device)

4. **Supabase connection errors**
   - Check your environment variables
   - Verify your Supabase project is active
   - Check network connectivity

### Getting Help

- Check the [Expo documentation](https://docs.expo.dev/)
- Review [Supabase documentation](https://supabase.com/docs)
- Open an issue in the project repository 