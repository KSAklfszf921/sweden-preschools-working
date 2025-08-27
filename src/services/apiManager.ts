import { supabase } from '@/integrations/supabase/client';

export interface ApiRequest {
  type: 'google_places' | 'google_maps' | 'street_view';
  endpoint: string;
  params: Record<string, any>;
  cache_duration?: number;
  priority?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp?: string;
}

/**
 * Central API manager that handles all external API calls through Supabase Edge Functions
 * Provides automatic caching and request optimization
 */
export class ApiManager {
  private static readonly FUNCTION_URL = 'api-manager';

  /**
   * Make an API request through the centralized manager
   */
  static async request<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    try {
      console.log(`🌐 API Manager: ${request.type} request to ${request.endpoint}`);

      const { data, error } = await supabase.functions.invoke(this.FUNCTION_URL, {
        body: request
      });

      if (error) {
        console.error('API Manager function error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (data.cached) {
        console.log(`📦 Using cached response for ${request.type}:${request.endpoint}`);
      }

      return data;
    } catch (error) {
      console.error('API Manager client error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Google Places API requests
   */
  static async googlePlaces(endpoint: string, params: Record<string, any>, cacheDuration = 3600) {
    return this.request({
      type: 'google_places',
      endpoint,
      params,
      cache_duration: cacheDuration
    });
  }

  /**
   * Google Maps API requests
   */
  static async googleMaps(endpoint: string, params: Record<string, any>, cacheDuration = 3600) {
    return this.request({
      type: 'google_maps',
      endpoint,
      params,
      cache_duration: cacheDuration
    });
  }


  /**
   * Street View API requests
   */
  static async streetView(endpoint: string, params: Record<string, any>, cacheDuration = 7200) {
    return this.request({
      type: 'street_view',
      endpoint,
      params,
      cache_duration: cacheDuration
    });
  }

  /**
   * Enrich a preschool with Google Places data
   */
  static async enrichPreschool(preschoolId: string, lat: number, lng: number, address: string, name: string, priority = 0) {
    try {
      console.log(`🏫 Enriching preschool ${preschoolId}: ${name}`);

      const { data, error } = await supabase.functions.invoke('google-places-enricher', {
        body: {
          preschoolId,
          lat,
          lng,
          address,
          name,
          priority
        }
      });

      if (error) {
        console.error('Preschool enrichment error:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully enriched preschool ${preschoolId}`);
      return data;
    } catch (error) {
      console.error('Preschool enrichment client error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Download and store images for a preschool
   */
  static async downloadImages(preschoolId: string, images: Array<{ url: string; reference?: string; width?: number; height?: number }>, imageType = 'google_places') {
    try {
      console.log(`🖼️  Downloading ${images.length} images for preschool ${preschoolId}`);

      const { data, error } = await supabase.functions.invoke('image-downloader', {
        body: {
          preschool_id: preschoolId,
          images,
          image_type: imageType
        }
      });

      if (error) {
        console.error('Image download error:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully downloaded ${data.success_count}/${data.processed_count} images for preschool ${preschoolId}`);
      return data;
    } catch (error) {
      console.error('Image download client error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear expired cache entries
   */
  static async clearExpiredCache() {
    try {
      const { error } = await supabase
        .from('api_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Cache cleanup error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Cleared expired cache entries');
      return { success: true };
    } catch (error) {
      console.error('Cache cleanup client error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats() {
    try {
      const { data, error } = await supabase
        .from('api_cache')
        .select('api_type, count(*)')
        .gte('expires_at', new Date().toISOString());

      if (error) {
        console.error('Cache stats error:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data.reduce((acc, item) => {
          acc[item.api_type] = item.count;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Cache stats client error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}