import { supabase } from './supabase';
import { Collection, InsertCollection, UpdateCollection } from '../types/database';
import { isGuestUser } from '../utils/authHelpers';

/**
 * Collections service for managing user collections
 */
export class CollectionsService {
  /**
   * Fetch all collections for a specific user
   */
  static async getUserCollections(userId?: string): Promise<Collection[]> {
    try {
      let userIdToUse = userId;
      
      if (!userIdToUse) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error('User not authenticated');
        }
        
        userIdToUse = user.id;
      }

      // Handle guest users differently
      if (isGuestUser(userIdToUse)) {
        return this.getGuestCollections(userIdToUse);
      }

      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', userIdToUse)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching collections:', error);
      
      // Fallback for guest users if database fails
      if (userId && isGuestUser(userId)) {
        return this.getGuestCollections(userId);
      }
      
      throw error;
    }
  }

  /**
   * Get collections for guest users (local/temporary)
   */
  private static getGuestCollections(userId: string): Collection[] {
    return [
      {
        id: `guest-collection-${userId}`,
        user_id: userId,
        name: 'My Links',
        description: 'Temporary collection for guest user',
        is_public: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
  }

  /**
   * Create a new collection
   */
  static async createCollection(collection: Omit<InsertCollection, 'user_id'>, userId?: string): Promise<Collection> {
    try {
      let userIdToUse = userId;
      
      if (!userIdToUse) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error('User not authenticated');
        }
        
        userIdToUse = user.id;
      }

      // Handle guest users differently
      if (isGuestUser(userIdToUse)) {
        return this.createGuestCollection(collection, userIdToUse);
      }

      const { data, error } = await supabase
        .from('collections')
        .insert([{
          ...collection,
          user_id: userIdToUse
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating collection:', error);
      
      // Fallback for guest users
      if (userId && isGuestUser(userId)) {
        return this.createGuestCollection(collection, userId);
      }
      
      throw error;
    }
  }

  /**
   * Create a collection for guest users (local/temporary)
   */
  private static createGuestCollection(collection: Omit<InsertCollection, 'user_id'>, userId: string): Collection {
    return {
      id: `guest-collection-${Date.now()}`,
      user_id: userId,
      name: collection.name,
      description: collection.description,
      is_public: collection.is_public || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Update an existing collection
   */
  static async updateCollection(id: string, updates: UpdateCollection): Promise<Collection> {
    try {
      // For guest collections, just return a mock updated collection
      if (id.startsWith('guest-collection-')) {
        return {
          id,
          user_id: updates.user_id || '',
          name: updates.name || 'Updated Collection',
          description: updates.description,
          is_public: updates.is_public || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  /**
   * Delete a collection
   */
  static async deleteCollection(id: string): Promise<void> {
    try {
      // For guest collections, just ignore the delete operation
      if (id.startsWith('guest-collection-')) {
        console.log('Guest collection delete ignored:', id);
        return;
      }

      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  /**
   * Get a default collection for quick saves
   * Creates one if it doesn't exist
   */
  static async getOrCreateDefaultCollection(userId?: string): Promise<Collection> {
    try {
      let userIdToUse = userId;
      
      if (!userIdToUse) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error('User not authenticated');
        }
        
        userIdToUse = user.id;
      }

      const collections = await this.getUserCollections(userIdToUse);
      
      // Look for existing default collection
      const defaultCollection = collections.find(c => c.name === 'Quick Saves' || c.name === 'Default' || c.name === 'My Links');
      
      if (defaultCollection) {
        return defaultCollection;
      }

      // Create default collection if none exists
      return await this.createCollection({
        name: isGuestUser(userIdToUse) ? 'My Links' : 'Quick Saves',
        description: isGuestUser(userIdToUse) 
          ? 'Temporary collection for guest user' 
          : 'Automatically created for quick link saves',
        is_public: false
      }, userIdToUse);
    } catch (error) {
      console.error('Error getting/creating default collection:', error);
      throw error;
    }
  }
}

export default CollectionsService; 