import { supabase } from './supabase';
import { Link, InsertLink, UpdateLink, Collection } from '../types/database';

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
    image_url?: string;
    platform?: string;
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

      // Create the link record
      const linkInsert: InsertLink = {
        user_id: userIdToUse,
        url: linkData.url,
        title: linkData.title,
        description: linkData.description,
        image_url: linkData.image_url,
        platform: linkData.platform,
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
      throw error;
    }
  }

  /**
   * Add a link to one or more collections
   */
  static async addLinkToCollections(linkId: string, collectionIds: string[]): Promise<void> {
    try {
      // First check if any of these relationships already exist to avoid duplicates
      const { data: existingLinks, error: checkError } = await supabase
        .from('collection_links')
        .select('collection_id')
        .eq('link_id', linkId)
        .in('collection_id', collectionIds);

      if (checkError) {
        throw checkError;
      }

      const existingCollectionIds = existingLinks?.map(item => item.collection_id) || [];
      const newCollectionIds = collectionIds.filter(id => !existingCollectionIds.includes(id));

      if (newCollectionIds.length === 0) {
        // All collections already contain this link
        return;
      }

      const collectionLinks = newCollectionIds.map(collectionId => ({
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
   * Remove a link from a specific collection
   */
  static async removeLinkFromCollection(linkId: string, collectionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('collection_links')
        .delete()
        .eq('link_id', linkId)
        .eq('collection_id', collectionId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error removing link from collection:', error);
      throw error;
    }
  }

  /**
   * Remove a link from all collections
   */
  static async removeLinkFromAllCollections(linkId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('collection_links')
        .delete()
        .eq('link_id', linkId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error removing link from all collections:', error);
      throw error;
    }
  }

  /**
   * Get all collections that contain a specific link
   */
  static async getLinkCollections(linkId: string): Promise<Collection[]> {
    try {
      const { data, error } = await supabase
        .from('collection_links')
        .select(`
          collections (*)
        `)
        .eq('link_id', linkId);

      if (error) {
        throw error;
      }

      // Extract collections from the join result
      const collections = data?.map((item: any) => item.collections).filter(Boolean) || [];
      return collections;
    } catch (error) {
      console.error('Error fetching link collections:', error);
      throw error;
    }
  }

  /**
   * Check if a link is in a specific collection
   */
  static async isLinkInCollection(linkId: string, collectionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('collection_links')
        .select('id')
        .eq('link_id', linkId)
        .eq('collection_id', collectionId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if link is in collection:', error);
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
      throw error;
    }
  }

  /**
   * Get links in a specific collection
   */
  static async getLinksInCollection(collectionId: string): Promise<Link[]> {
    try {
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
      throw error;
    }
  }
}

export default LinksService; 