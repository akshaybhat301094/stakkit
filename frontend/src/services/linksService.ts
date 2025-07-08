import { supabase } from './supabase';
import { Link, InsertLink, UpdateLink, Collection } from '../types/database';
import { isGuestUser } from '../utils/authHelpers';

/**
 * Links service for managing user saved links
 */
export class LinksService {
  /**
   * Save a new link to the database
   */
  static async saveLink(linkData: {
    url: string;
    title?: string;
    description?: string;
    notes?: string;
    collectionIds?: string[];
  }, userId?: string): Promise<Link> {
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
        return this.saveGuestLink(linkData, userIdToUse);
      }

      // Create the link record
      const linkInsert: InsertLink = {
        user_id: userIdToUse,
        url: linkData.url,
        title: linkData.title,
        description: linkData.description,
        notes: linkData.notes,
        is_pinned: false,
      };

      const { data: link, error: linkError } = await supabase
        .from('links')
        .insert([linkInsert])
        .select()
        .single();

      if (linkError) {
        throw linkError;
      }

      // Add to collections if specified
      if (linkData.collectionIds && linkData.collectionIds.length > 0) {
        await this.addLinkToCollections(link.id, linkData.collectionIds);
      }

      return link;
    } catch (error) {
      console.error('Error saving link:', error);
      
      // Fallback for guest users
      if (userId && isGuestUser(userId)) {
        return this.saveGuestLink(linkData, userId);
      }
      
      throw error;
    }
  }

  /**
   * Save a link for guest users (local/temporary)
   */
  private static saveGuestLink(linkData: {
    url: string;
    title?: string;
    description?: string;
    notes?: string;
    collectionIds?: string[];
  }, userId: string): Link {
         const guestLink: Link = {
       id: `guest-link-${Date.now()}`,
       user_id: userId,
       url: linkData.url,
       title: linkData.title,
       description: linkData.description,
       notes: linkData.notes,
       image_url: undefined,
       platform: undefined,
       tags: undefined,
       is_pinned: false,
       created_at: new Date().toISOString(),
       updated_at: new Date().toISOString(),
     };

    console.log('Guest link created locally:', guestLink);
    return guestLink;
  }

  /**
   * Add a link to one or more collections
   */
  static async addLinkToCollections(linkId: string, collectionIds: string[]): Promise<void> {
    try {
      // Skip for guest links
      if (linkId.startsWith('guest-link-')) {
        console.log('Guest link collection association skipped:', linkId);
        return;
      }

      const collectionLinks = collectionIds.map(collectionId => ({
        link_id: linkId,
        collection_id: collectionId,
      }));

      const { error } = await supabase
        .from('collection_links')
        .insert(collectionLinks);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error adding link to collections:', error);
      throw error;
    }
  }

  /**
   * Get all links for a specific user
   */
  static async getUserLinks(userId?: string): Promise<Link[]> {
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
        return this.getGuestLinks(userIdToUse);
      }

      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', userIdToUse)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching links:', error);
      
      // Fallback for guest users
      if (userId && isGuestUser(userId)) {
        return this.getGuestLinks(userId);
      }
      
      throw error;
    }
  }

  /**
   * Get links for guest users (local/temporary)
   */
  private static getGuestLinks(userId: string): Link[] {
    // In a real implementation, you might store these in AsyncStorage
    // For now, return empty array
    console.log('Getting guest links for:', userId);
    return [];
  }

  /**
   * Get links in a specific collection
   */
  static async getLinksInCollection(collectionId: string): Promise<Link[]> {
    try {
      // For guest collections, return empty array
      if (collectionId.startsWith('guest-collection-')) {
        return [];
      }

      const { data, error } = await supabase
        .from('collection_links')
        .select(`
          links (*)
        `)
        .eq('collection_id', collectionId);

      if (error) {
        throw error;
      }

      // Extract links from the join result
      const links = data?.map((item: any) => item.links).filter(Boolean) || [];
      return links;
    } catch (error) {
      console.error('Error fetching collection links:', error);
      throw error;
    }
  }

  /**
   * Update an existing link
   */
  static async updateLink(id: string, updates: UpdateLink): Promise<Link> {
    try {
      // For guest links, return a mock updated link
      if (id.startsWith('guest-link-')) {
        return {
          id,
          user_id: updates.user_id || '',
          url: updates.url || '',
          title: updates.title,
          description: updates.description,
          image_url: updates.image_url,
          platform: updates.platform,
          notes: updates.notes,
          tags: updates.tags,
          is_pinned: updates.is_pinned || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase
        .from('links')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating link:', error);
      throw error;
    }
  }

  /**
   * Delete a link
   */
  static async deleteLink(id: string): Promise<void> {
    try {
      // For guest links, just ignore the delete operation
      if (id.startsWith('guest-link-')) {
        console.log('Guest link delete ignored:', id);
        return;
      }

      // First delete from collection_links (due to foreign key constraints)
      await supabase
        .from('collection_links')
        .delete()
        .eq('link_id', id);

      // Then delete the link itself
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      throw error;
    }
  }

  /**
   * Check if a URL already exists for a specific user
   */
  static async checkDuplicateURL(url: string, userId?: string): Promise<Link | null> {
    try {
      let userIdToUse = userId;
      
      if (!userIdToUse) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error('User not authenticated');
        }
        
        userIdToUse = user.id;
      }

      // For guest users, skip duplicate check or implement local check
      if (isGuestUser(userIdToUse)) {
        console.log('Skipping duplicate check for guest user');
        return null;
      }

      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', userIdToUse)
        .eq('url', url)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error checking duplicate URL:', error);
      
      // For guest users, always return null (no duplicates)
      if (userId && isGuestUser(userId)) {
        return null;
      }
      
      throw error;
    }
  }
}

export default LinksService; 