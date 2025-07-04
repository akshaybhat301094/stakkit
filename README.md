# 📱 Stakkit

**A universal content organizer for the mobile-first generation**

Stakkit is a visual bookmark manager and notes app that lets you save links with rich previews, organize them into collections, share curated collections with friends, and add personal context. Think Pinterest meets Apple Notes for short-form content.

## 🎯 What Problem Does Stakkit Solve?

Users currently save interesting content by:
- 📸 Taking screenshots (hard to organize)
- 🔖 Bookmarking (no visual previews)
- 💬 Sending links to themselves (gets lost in messages)
- 📝 Copy-pasting into notes (no rich previews)

**Stakkit provides a better way** to save, organize, and share content from Instagram, YouTube, TikTok, Twitter, and any website.

## ✨ Core Features

### 📎 Link Saving & Previews
- Save links from any app via share sheet
- Automatic rich previews with thumbnails, titles, and descriptions
- Support for Instagram, YouTube, TikTok, Twitter, and general web links
- Manual link paste option

### 📁 Collections Management
- Create unlimited custom collections ("Weekend Plans", "Recipe Ideas", "Gift Ideas")
- Visual grid/list view with preview thumbnails
- Add items to multiple collections
- Reorder and organize items within collections

### 🔗 Collection Sharing
- Generate shareable links for any collection
- Public/private collection settings
- View-only access for shared collections
- Native sharing integration (WhatsApp, Messages, etc.)

### 📝 Notes & Context
- Add personal notes to any saved item
- Rich text support (bold, italics, bullets)
- Custom tagging and labeling
- Pin important items to top
- Search across all content and notes

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React Native | Cross-platform mobile app |
| **Backend** | Node.js/Express | REST API and link processing |
| **Database** | Supabase | Database and authentication |
| **Auth** | Supabase Auth | Email/password and social login |
| **Link Previews** | Open Graph/oEmbed | Rich preview generation |
| **Hosting** | Vercel | Simple deployment |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- React Native development environment
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stakkit.git
   cd stakkit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your Supabase URL and API keys
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations (coming soon)
   - Configure authentication providers

5. **Start the development server**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## 📦 Project Structure

```
stakkit/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens and navigation
│   ├── services/           # API calls and business logic
│   ├── utils/              # Helper functions
│   └── types/              # TypeScript type definitions
├── assets/                 # Images, fonts, and static files
├── docs/                   # Project documentation
└── tests/                  # Test files
```

## 🗓️ Development Roadmap

### Phase 1: MVP (Weeks 1-8)
- [x] Project setup and architecture
- [ ] User authentication (Supabase Auth)
- [ ] Link saving and preview generation
- [ ] Collections CRUD operations
- [ ] Share sheet integration
- [ ] Collection sharing functionality
- [ ] Notes and tagging system
- [ ] Search implementation
- [ ] Basic UI/UX

### Phase 2: Enhanced Features
- [ ] AI-powered content summarization
- [ ] Auto-categorization
- [ ] Browser extension
- [ ] Advanced export options
- [ ] Collaborative collections

### Phase 3: Platform Expansion
- [ ] Web application
- [ ] Premium features
- [ ] Analytics and insights

## 📊 Success Metrics

**MVP Goals:**
- 1,000+ app downloads in first month
- 60%+ user retention after 7 days
- Average 20+ saves per active user
- 30%+ of users create 3+ collections
- 20%+ of users share at least 1 collection

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and confidential.

## 🔗 Links

- [Product Requirements Document](PRD.md)
- [Development Tasks](tasks.md)
- [Design System](docs/design-system.md) (coming soon)
- [API Documentation](docs/api.md) (coming soon)

---

**Built with ❤️ for content curators everywhere** 