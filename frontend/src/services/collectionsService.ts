import { supabase } from './supabase';
import { Collection, InsertCollection, UpdateCollection } from '../types/database';

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
      throw error;
    }
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
      throw error;
    }
  }

  /**
   * Update an existing collection
   */
  static async updateCollection(id: string, updates: UpdateCollection): Promise<Collection> {
    try {
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
        name: 'Quick Saves',
        description: 'Automatically created for quick link saves',
        is_public: false
      }, userIdToUse);
    } catch (error) {
      console.error('Error getting/creating default collection:', error);
      throw error;
    }
  }
}

export default CollectionsService; 