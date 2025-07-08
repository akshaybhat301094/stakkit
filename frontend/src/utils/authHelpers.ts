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
 * Validates if a user is properly authenticated with a valid UUID
 */
export const isValidAuthenticatedUser = (userId: string): boolean => {
  return isValidUUID(userId);
};

/**
 * Gets a safe user ID for database operations
 * Returns the user ID only if it's a valid authenticated user
 * Returns null if the user ID is invalid or missing
 */
export const getSafeUserId = (userId: string | undefined | null): string | null => {
  if (!userId) return null;
  
  // Only allow valid UUIDs for authenticated users
  if (isValidUUID(userId)) {
    return userId;
  }
  
  return null;
}; 