import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

// Types for the storage provider
export interface StorageProvider {
  upload(file: File, folder: string, customName?: string): Promise<string>;
  delete(url: string): Promise<void>;
}

// Supabase Storage Implementation
class SupabaseStorageProvider implements StorageProvider {
  private client;
  private bucket: string;

  constructor(url: string, key: string, bucket: string) {
    this.client = createClient(url, key);
    this.bucket = bucket;
  }

  async upload(file: File, folder: string, customName?: string): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileName = customName || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error("Supabase Storage Error:", error);
      throw error;
    }

    // Manual public URL construction to ensure it works even if getPublicUrl has issues
    const projectRef = this.client.storage.from('').getPublicUrl('').data.publicUrl.split('/storage/v1')[0];
    return `${projectRef}/storage/v1/object/public/${this.bucket}/${filePath}`;
  }

  async delete(url: string): Promise<void> {
    // Extract path from public URL
    // Format usually: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const parts = url.split(`/public/${this.bucket}/`);
    if (parts.length < 2) return;
    
    const filePath = parts[1];
    await this.client.storage.from(this.bucket).remove([filePath]);
  }
}

// Local Storage Implementation (Fallback for Dev)
class LocalStorageProvider implements StorageProvider {
  async upload(file: File, folder: string, customName?: string): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    await mkdir(uploadDir, { recursive: true }).catch(() => {});

    const fileName = customName || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);
    return `/uploads/${folder}/${fileName}`;
  }

  async delete(url: string): Promise<void> {
    if (!url.startsWith('/uploads/')) return;
    const filePath = path.join(process.cwd(), 'public', url);
    await unlink(filePath).catch(() => {});
  }
}

// Factory to get the appropriate provider
export function getStorageProvider(): StorageProvider {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'profiles';

  if (supabaseUrl && supabaseKey) {
    return new SupabaseStorageProvider(supabaseUrl, supabaseKey, bucket);
  }

  console.warn('⚠️ Storage: Missing Supabase credentials. Falling back to local storage (not for production).');
  return new LocalStorageProvider();
}

// Export a default instance
export const storage = getStorageProvider();
