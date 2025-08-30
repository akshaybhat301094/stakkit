import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

export interface ShareLinkParams {
  url: string;
  title?: string;
  description?: string;
}

export class DeepLinkService {
  private static navigationRef: NavigationContainerRef<any> | null = null;

  /**
   * Set the navigation reference for routing
   */
  static setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
  }

  /**
   * Handle incoming URLs
   */
  static async handleURL(url: string): Promise<boolean> {
    try {
      console.log('Handling deep link URL:', url);
      
      const parsedUrl = new URL(url);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());

      // Handle share URLs: stakkit://share?url=...&title=...&description=...
      if (pathSegments[0] === 'share' || parsedUrl.pathname === '/share') {
        return this.handleShareLink(queryParams);
      }

      // Handle other deep link patterns here
      console.log('Unhandled deep link pattern:', url);
      return false;
    } catch (error) {
      console.error('Error handling deep link:', error);
      return false;
    }
  }

  /**
   * Handle share link deep links
   */
  private static handleShareLink(params: Record<string, string>): boolean {
    const { url, title, description } = params;

    if (!url) {
      console.error('Share link missing required URL parameter');
      return false;
    }

    if (!this.navigationRef) {
      console.error('Navigation ref not set');
      return false;
    }

    try {
      // Navigate to ShareLink screen with parameters
      this.navigationRef.navigate('ShareLink', {
        url: decodeURIComponent(url),
        title: title ? decodeURIComponent(title) : undefined,
        description: description ? decodeURIComponent(description) : undefined,
      });

      return true;
    } catch (error) {
      console.error('Error navigating to ShareLink:', error);
      return false;
    }
  }

  /**
   * Generate a share URL for the app
   */
  static generateShareURL(params: ShareLinkParams): string {
    const baseUrl = 'stakkit://share';
    const urlParams = new URLSearchParams();

    urlParams.append('url', encodeURIComponent(params.url));
    
    if (params.title) {
      urlParams.append('title', encodeURIComponent(params.title));
    }
    
    if (params.description) {
      urlParams.append('description', encodeURIComponent(params.description));
    }

    return `${baseUrl}?${urlParams.toString()}`;
  }

  /**
   * Initialize deep linking listeners
   */
  static initialize() {
    // Handle app launch from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('App launched with URL:', url);
        // Delay handling to ensure navigation is ready
        setTimeout(() => {
          this.handleURL(url);
        }, 1000);
      }
    });

    // Handle deep links when app is already running
    const handleDeepLink = (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      this.handleURL(event.url);
    };

    Linking.addEventListener('url', handleDeepLink);

    // Return cleanup function
    return () => {
      Linking.removeAllListeners('url');
    };
  }

  /**
   * Test if the app can handle a specific URL scheme
   */
  static async canHandleURL(url: string): Promise<boolean> {
    try {
      return await Linking.canOpenURL(url);
    } catch (error) {
      console.error('Error checking if URL can be handled:', error);
      return false;
    }
  }
}

export default DeepLinkService;
