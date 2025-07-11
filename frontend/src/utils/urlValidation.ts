/**
 * URL validation utilities for link saving functionality
 */

export interface URLValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Validates and normalizes a URL
 * @param url - The URL string to validate
 * @returns Validation result with normalized URL if valid
 */
export const validateURL = (url: string): URLValidationResult => {
  // Trim whitespace
  const trimmedUrl = url.trim();
  
  if (!trimmedUrl) {
    return {
      isValid: false,
      error: 'URL cannot be empty'
    };
  }

  // Add protocol if missing
  let normalizedUrl = trimmedUrl;
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  try {
    const urlObj = new URL(normalizedUrl);
    
    // Check for valid protocol
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'URL must use HTTP or HTTPS protocol'
      };
    }

    // Check for valid hostname
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return {
        isValid: false,
        error: 'Invalid domain name'
      };
    }

    // Check for localhost or IP addresses (optional - you might want to allow these)
    if (urlObj.hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(urlObj.hostname)) {
      // Allow localhost for development, but you might want to restrict this in production
    }

    return {
      isValid: true,
      normalizedUrl: urlObj.toString()
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
};

/**
 * Extracts URLs from clipboard text
 * @param text - The clipboard text
 * @returns Array of detected URLs
 */
export const extractURLsFromText = (text: string): string[] => {
  if (!text) return [];
  
  // Simple URL regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlPattern);
  
  if (!matches) {
    // Try to detect if it might be a URL without protocol
    const potentialUrl = text.trim();
    if (potentialUrl && !potentialUrl.includes(' ') && potentialUrl.includes('.')) {
      return [potentialUrl];
    }
    return [];
  }
  
  return matches;
};

/**
 * Gets domain name from URL for display purposes
 * @param url - The URL string
 * @returns Domain name or the original URL if invalid
 */
export const getDomainFromURL = (url: string): string => {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}; 