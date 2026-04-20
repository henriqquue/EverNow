import { createClient } from '@supabase/supabase-js';

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
    // Garantir que a URL comece com https://
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    this.client = createClient(finalUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    this.bucket = bucket;
    console.log(`[Storage] Inicializado com bucket: ${this.bucket}`);
    
    // Tenta listar buckets para conferir conexão
    this.client.storage.listBuckets().then(({ data, error }) => {
      if (error) console.error("[Storage] Erro ao listar buckets:", error);
      else console.log("[Storage] Buckets encontrados:", data?.map(b => b.name));
    });
  }

  async upload(file: File, folder: string, customName?: string): Promise<string> {
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const fileName = customName || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = fileName; // Upload direto para a raiz do bucket

      console.log(`[Storage] Tentando upload de ${file.size} bytes para ${this.bucket}/${filePath}`);

      const { data, error } = await this.client.storage
        .from(this.bucket)
        .upload(filePath, buffer, {
          contentType: file.type || 'image/png',
          upsert: true
        });

      if (error) {
        console.error("[Storage] Erro no upload do Supabase:", error);
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      const { data: { publicUrl } } = this.client.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      console.log(`[Storage] Upload concluído! URL: ${publicUrl}`);
      return publicUrl;
    } catch (err: any) {
      console.error("[Storage] Erro fatal no upload:", err);
      throw err;
    }
  }

  async delete(url: string): Promise<void> {
    try {
      const parts = url.split(`/public/${this.bucket}/`);
      if (parts.length < 2) return;
      
      const filePath = parts[1];
      await this.client.storage.from(this.bucket).remove([filePath]);
    } catch (err) {
      console.error("[Storage] Erro ao deletar:", err);
    }
  }
}

// Factory to get the appropriate provider
export function getStorageProvider(): StorageProvider {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'profiles';

  if (supabaseUrl && supabaseKey) {
    console.log(`[Storage] Inicializando com URL: ${supabaseUrl} e Bucket: ${bucket}`);
    return new SupabaseStorageProvider(supabaseUrl, supabaseKey, bucket);
  }

  // Fallback silencioso (não recomendado para produção)
  return {
    upload: async () => "/placeholder-user.png",
    delete: async () => {}
  };
}

export const storage = getStorageProvider();
