# 📱 Stakkit – Product Requirements Document (PRD)

## 🧩 Overview

**Stakkit** is a universal content organizer that lets users save links with rich previews (from Instagram, YouTube, TikTok, etc.), organize them into collections, share collections with friends, and add personal notes. Think of it as a **visual bookmark manager + notes app** for short-form content.

---

## 🎯 Problem

Users save interesting videos/posts by bookmarking, screenshotting, or sending to themselves, but have no organized way to:
- View rich previews of saved content
- Organize links into themed collections  
- Share curated collections with friends
- Add personal notes and context

---

## ✅ Solution

A simple, visual content organizer that allows users to:
- Save links from any app with rich previews (thumbnails, titles, descriptions)
- Create custom collections (e.g., "Weekend Plans", "Recipe Ideas", "Gift Ideas")
- Share entire collections with friends via links
- Add personal notes to any saved item
- Use as a replacement for traditional notes app for content-based notes

---

## 🔧 Core MVP Features

### 1. Link Saving & Previews
- Save links from any app via share sheet
- Automatically fetch and display:
  - Thumbnail/preview image
  - Title and description
  - Platform/source info
- Support for major platforms:
  - Instagram (posts, reels, stories)
  - YouTube (videos, shorts)
  - TikTok
  - Twitter/X
  - General web links
- Manual link paste option

### 2. Collections Management
- Create unlimited custom collections
- Add items to multiple collections
- Reorder items within collections
- Rename and delete collections
- Visual grid/list view with previews
- Collection cover image (auto or manual)

### 3. Collection Sharing
- Generate shareable links for any collection
- Public/private collection settings
- View-only access for shared collections
- Share via standard sharing options (WhatsApp, Messages, etc.)

### 4. Notes & Context
- Add personal notes to any saved item
- Rich text support (bold, italics, bullets)
- Tag items with custom labels
- Pin important items to top
- Search across all notes and titles

### 5. Simple Organization
- Recent saves view
- Search across all content
- Filter by collection, platform, or tags
- Bulk operations (move, delete)

---

## ✨ Phase 2 Features (Post-MVP)
- **AI Summary & Extraction** (Premium feature)
- Auto-categorization of content
- Smart collections based on content type
- Export to Notion/PDF
- Collaborative collections (multiple editors)
- Browser extension

---

## 🔐 User Management
- **MVP**: Simple email/password or social login
- **Future**: Free vs Premium tiers
  - Free: Unlimited collections, basic sharing
  - Premium: AI features, advanced export, analytics

---

## 🛠️ Tech Stack (Simplified)

| Component     | Tech           | Notes |
|---------------|----------------|-------|
| Frontend      | React Native   | Cross-platform mobile |
| Backend       | Node.js / Express | Simple REST API |
| Database      | Supabase       | Easy setup, real-time features |
| Auth          | Supabase Auth  | Built-in social login |
| Storage       | None (link previews only) | No file storage needed |
| Link Previews | Open Graph / oEmbed | Standard web preview APIs |
| Hosting       | Vercel         | Simple deployment |

---

## 📦 MVP Scope

**✅ Included:**
- Share sheet integration
- Link preview generation
- Collections CRUD
- Collection sharing
- Personal notes
- Search functionality
- Basic user auth

**❌ Excluded from MVP:**
- AI processing
- Advanced export
- Video transcription
- Auto-tagging
- Analytics
- Monetization features

---

## 💾 Data Architecture

**Per Link Entry:**
- Original URL
- Preview metadata (title, description, image URL)
- Platform/source
- User notes (rich text)
- Tags/labels
- Collection assignments
- Save timestamp

**Collections:**
- Name, description, cover image
- Privacy settings (public/private)
- Share URL/token
- Item order

**Storage Estimate**: ~2-3KB per saved link

---

## 🧪 Validation Strategy

- **Target Users**: People who currently save content via screenshots, bookmarks, or "Send to Self"
- **Key Questions**:
  - How do you currently save interesting content?
  - Do you organize your saved content?
  - Would you share curated collections with friends?
- **Success Metrics**:
  - Users save 5+ items in first session
  - Create 2+ collections in first week
  - Share at least 1 collection

---

## 🎨 User Experience

### Core User Flow:
1. **Discover** interesting content in any app
2. **Share** to Stakkit via share sheet
3. **Organize** into relevant collection
4. **Add notes** with personal context
5. **Share collection** with friends when relevant

### Interface Priorities:
- **Fast saving**: One-tap from share sheet
- **Visual browsing**: Thumbnail-first design
- **Quick organization**: Easy drag-drop to collections
- **Seamless sharing**: One-tap collection sharing

---

## 📣 Go-To-Market

- **Primary Users**: 
  - Content curators (food, travel, fashion enthusiasts)
  - Students organizing research
  - Anyone who sends links to friends regularly

- **Launch Strategy**:
  - Personal network beta
  - Reddit communities (r/organization, r/productivity)
  - Instagram/TikTok posts about organization hacks

---

## 🛠️ Development Roadmap

### Phase 1 (MVP - 8-10 weeks):
- Core app with saving, collections, sharing, notes
- iOS and Android apps
- Basic backend and database

### Phase 2 (3-4 weeks post-MVP):
- AI features as premium add-on
- Advanced sharing options
- Export capabilities

### Phase 3 (Future):
- Web app
- Browser extension
- Collaborative features

---

## 🎯 Success Definition

**MVP Success:**
- 1,000+ app downloads in first month
- 60%+ user retention after 7 days
- Average 20+ saves per active user
- 30%+ of users create 3+ collections
- 20%+ of users share at least 1 collection

**Key Value Props:**
1. **Visual organization** - See all your saved content at a glance
2. **Easy sharing** - Curate and share collections effortlessly  
3. **Contextual notes** - Remember why you saved something
4. **Universal saving** - Works with any app or website

