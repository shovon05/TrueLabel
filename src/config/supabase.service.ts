import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      this.client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      this.logger.log(`Supabase client successfully initialized for project: ${supabaseUrl}`);
    } else {
      this.logger.warn(
        'Supabase client initialized without SUPABASE_URL and SUPABASE_ANON_KEY. Set these in .env to enable Supabase Storage and features.',
      );
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Upload evidence, label photos, or certificates to Supabase Storage
   */
  async uploadFile(
    bucket: string,
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{ url: string | null; error: string | null }> {
    if (!this.client) {
      return { url: null, error: 'Supabase client is not configured' };
    }

    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        return { url: null, error: error.message };
      }

      const { data: publicUrlData } = this.client.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { url: publicUrlData.publicUrl, error: null };
    } catch (err) {
      return { url: null, error: err.message };
    }
  }
}

