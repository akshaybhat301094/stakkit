/**
 * Authentication helper utilities
 */

/**
 * Validates if a string is a valid UUID v4 format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Checks if a user ID represents a guest user
 */
export const isGuestUser = (userId: string): boolean => {
  return userId.startsWith('guest-user-') || !isValidUUID(userId);
};

/**
 * Validates if a user is properly authenticated with a valid UUID
 */
export const isValidAuthenticatedUser = (userId: string): boolean => {
  return !isGuestUser(userId) && isValidUUID(userId);
};

/**
 * Validates if a user can perform database operations
 * Allows both authenticated users and guest users
 */
export const canPerformDatabaseOperations = (userId: string): boolean => {
  return isValidUUID(userId) || isGuestUser(userId);
};

/**
 * Gets a safe user ID for database operations
 * Returns the user ID for both authenticated and guest users
 * Returns null only if the user ID is completely invalid
 */
export const getSafeUserId = (userId: string | undefined | null): string | null => {
  if (!userId) return null;
  
  // Allow both valid UUIDs and guest user IDs
  if (isValidUUID(userId) || isGuestUser(userId)) {
    return userId;
  }
  
  return null;
};

/**
 * Gets user display info for UI purposes
 */
export const getUserDisplayInfo = (userId: string): { isGuest: boolean; displayText: string } => {
  if (isGuestUser(userId)) {
    return {
      isGuest: true,
      displayText: 'Guest Mode - Sign up to save permanently'
    };
  }
  
  return {
    isGuest: false,
    displayText: 'Signed In'
  };
}; 