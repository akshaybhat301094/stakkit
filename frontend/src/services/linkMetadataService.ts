import { LinkPreview, Platform } from '../types';

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

interface oEmbedData {
  title?: string;
  description?: string;
  thumbnail_url?: string;
  provider_name?: string;
  type?: string;
  html?: string;
}

export class LinkMetadataService {
  private static cache = new Map<string, LinkPreview>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  // Platform detection
  static detectPlatform(url: string): Platform {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      if (hostname.includes('instagram.com')) return 'instagram';
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
      if (hostname.includes('tiktok.com')) return 'tiktok';
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
      
      return 'web';
    } catch {
      return 'other';
    }
  }

  // Get cached metadata or fetch new
  static async getMetadata(url: string): Promise<LinkPreview> {
    try {
      const cached = this.cache.get(url);
      
      // Return cached data if valid and recent
      if (cached && cached.timestamp && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        return cached;
      }

      const metadata = await this.fetchMetadata(url);
      
      // Cache the result with timestamp
      const result: LinkPreview = {
        ...metadata,
        timestamp: Date.now(),
      };
      
      this.cache.set(url, result);
      return result;
    } catch (error) {
      console.warn('Error fetching metadata for', url, error);
      
      // Return basic metadata if fetch fails
      return this.createFallbackPreview(url);
    }
  }

  // Create fallback preview when metadata fetch fails
  private static createFallbackPreview(url: string): LinkPreview {
    const platform = this.detectPlatform(url);
    
    return {
      url,
      title: this.extractTitleFromUrl(url),
      description: this.getplatformDescription(platform),
      platform,
      siteName: this.extractSiteNameFromUrl(url),
      timestamp: Date.now(),
    };
  }

  // Get platform-specific description for fallback
  private static getplatformDescription(platform: Platform): string {
    switch (platform) {
      case 'youtube': return 'YouTube Video';
      case 'instagram': return 'Instagram Post';
      case 'tiktok': return 'TikTok Video';
      case 'twitter': return 'Twitter/X Post';
      case 'web': return 'Website';
      default: return 'Saved Link';
    }
  }

  // Main metadata fetching logic
  private static async fetchMetadata(url: string): Promise<LinkPreview> {
    const platform = this.detectPlatform(url);
    
    // For now, let's use a simpler approach and focus on platform detection
    // and basic metadata extraction rather than complex API calls
    
    let title = this.extractTitleFromUrl(url);
    let description = this.getplatformDescription(platform);
    let siteName = this.extractSiteNameFromUrl(url);
    let image: string | undefined;

    // Try to get better metadata for YouTube
    if (platform === 'youtube') {
      try {
        // First try YouTube oEmbed API (should work without CORS issues)
        const youtubeData = await this.fetchYouTubeMetadata(url);
        if (youtubeData) {
          title = youtubeData.title || title;
          image = youtubeData.thumbnail_url;
          description = 'YouTube Video';
          siteName = 'YouTube';
        } else {
          // Fallback to basic extraction
          const videoData = this.extractYouTubeData(url);
          if (videoData) {
            title = videoData.title || title;
            image = videoData.thumbnail;
            description = 'YouTube Video';
            siteName = 'YouTube';
          }
        }
      } catch (error) {
        console.warn('YouTube metadata fetch failed, using fallback:', error);
        const videoData = this.extractYouTubeData(url);
        if (videoData) {
          title = videoData.title || title;
          image = videoData.thumbnail;
          description = 'YouTube Video';
          siteName = 'YouTube';
        }
      }
    }

    // Try to get better metadata for Twitter/X
    if (platform === 'twitter') {
      try {
        const twitterData = await this.fetchTwitterMetadata(url);
        if (twitterData) {
          title = twitterData.title || title;
          image = twitterData.thumbnail_url;
          description = this.getTwitterContentType(url);
          siteName = twitterData.provider_name || 'Twitter';
        }
      } catch (error) {
        console.warn('Twitter metadata fetch failed, using fallback:', error);
        // Keep the fallback title and description
      }
    }
    
    return {
      url,
      title,
      description,
      image,
      siteName,
      platform,
    };
  }

  // Fetch YouTube metadata using oEmbed API
  static async fetchYouTubeMetadata(url: string): Promise<oEmbedData | null> {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('YouTube oEmbed fetch failed:', error);
      return null;
    }
  }

  // Fetch Twitter/X metadata using oEmbed API
  static async fetchTwitterMetadata(url: string): Promise<oEmbedData | null> {
    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Twitter oEmbed fetch failed:', error);
      return null;
    }
  }

  // Extract YouTube video data from URL
  private static extractYouTubeData(url: string): { title?: string; thumbnail?: string } | null {
    try {
      const urlObj = new URL(url);
      let videoId: string | null = null;

      // Extract video ID from different YouTube URL formats
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      }

      if (videoId) {
        return {
          title: undefined, // Let the system use the URL-based title instead
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        };
      }
    } catch (error) {
      console.warn('Error extracting YouTube data:', error);
    }
    
    return null;
  }

  // Extract a basic title from URL
  static extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./, '');
      const pathname = urlObj.pathname;
      
      // Special handling for different platforms
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        return 'YouTube Video';
      }
      
      if (hostname.includes('instagram.com')) {
        return 'Instagram Post';
      }
      
      if (hostname.includes('tiktok.com')) {
        return 'TikTok Video';
      }
      
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        // Enhanced Twitter URL parsing
        const twitterData = this.extractTwitterData(url);
        if (twitterData.username && twitterData.tweetId) {
          return `Tweet by @${twitterData.username}`;
        } else if (twitterData.username) {
          return `@${twitterData.username} on Twitter`;
        }
        return this.getTwitterContentType(url);
      }
      
      // Extract meaningful part from path
      if (pathname && pathname !== '/') {
        const pathParts = pathname.split('/').filter(part => part.length > 0);
        if (pathParts.length > 0) {
          // Use last meaningful path segment
          const lastPart = pathParts[pathParts.length - 1];
          const cleanPart = lastPart.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, ''); // Remove file extension
          if (cleanPart.length > 2) {
            return `${cleanPart} - ${hostname}`;
          }
        }
      }
      
      return hostname;
    } catch {
      return url;
    }
  }

  // Extract site name from URL
  static extractSiteNameFromUrl(url: string): string {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      
      // Capitalize first letter
      return hostname.charAt(0).toUpperCase() + hostname.slice(1);
    } catch {
      return 'Website';
    }
  }

  // Get Twitter content type for description
  private static getTwitterContentType(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.pathname.includes('/status/')) {
        return 'Twitter Post';
      }
      if (urlObj.pathname.includes('/tweet/')) {
        return 'Twitter Post';
      }
      if (urlObj.pathname.includes('/photo/')) {
        return 'Twitter Photo';
      }
      if (urlObj.pathname.includes('/video/')) {
        return 'Twitter Video';
      }
      return 'Twitter Post';
    } catch {
      return 'Twitter Post';
    }
  }

  // Extract Twitter data from URL
  private static extractTwitterData(url: string): { username?: string; tweetId?: string } {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      
      let username: string | undefined;
      let tweetId: string | undefined;

      // Parse Twitter URL patterns
      // https://twitter.com/username/status/123456789
      // https://x.com/username/status/123456789
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        
        if (part === 'status' && pathParts[i + 1] && pathParts[i - 1]) {
          username = pathParts[i - 1];
          tweetId = pathParts[i + 1];
          break;
        } else if (i === 0 && part !== 'status' && part !== 'i' && part !== 'intent') {
          // First path part is likely a username (excluding special paths)
          username = part;
        }
      }

      return { username, tweetId };
    } catch (error) {
      console.warn('Error parsing Twitter URL:', error);
      return {};
    }
  }

  // Clear cache
  static clearCache(): void {
    this.cache.clear();
  }

  // Get cache size
  static getCacheSize(): number {
    return this.cache.size;
  }

  // Get cache stats
  static getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys()),
    };
  }

  // Debug function to test YouTube metadata fetching
  static async debugYouTubeMetadata(url: string): Promise<void> {
    console.log('🧪 DEBUG: Testing YouTube metadata for:', url);
    
    try {
      const oembedData = await this.fetchYouTubeMetadata(url);
      console.log('📺 YouTube oEmbed response:', oembedData);
      
      if (oembedData) {
        console.log('✅ Title found:', oembedData.title);
        console.log('🖼️ Thumbnail found:', oembedData.thumbnail_url);
      } else {
        console.log('❌ No oEmbed data returned');
      }
    } catch (error) {
      console.error('💥 oEmbed error:', error);
    }
    
    // Test the full metadata flow
    try {
      const fullMetadata = await this.getMetadata(url);
      console.log('📋 Full metadata result:', fullMetadata);
    } catch (error) {
      console.error('💥 Full metadata error:', error);
    }
  }

  // Debug function to test Twitter metadata fetching
  static async debugTwitterMetadata(url: string): Promise<void> {
    console.log('🧪 DEBUG: Testing Twitter metadata for:', url);
    
    try {
      const twitterData = this.extractTwitterData(url);
      console.log('🐦 Twitter URL parsing:', twitterData);
      
      const oembedData = await this.fetchTwitterMetadata(url);
      console.log('🐦 Twitter oEmbed response:', oembedData);
      
      if (oembedData) {
        console.log('✅ Title found:', oembedData.title);
        console.log('🖼️ Thumbnail found:', oembedData.thumbnail_url);
        console.log('📝 Provider found:', oembedData.provider_name);
      } else {
        console.log('❌ No oEmbed data returned');
      }
    } catch (error) {
      console.error('💥 oEmbed error:', error);
    }
    
    // Test the full metadata flow
    try {
      const fullMetadata = await this.getMetadata(url);
      console.log('📋 Full metadata result:', fullMetadata);
    } catch (error) {
      console.error('💥 Full metadata error:', error);
    }
  }
}

export default LinkMetadataService; 