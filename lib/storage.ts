// v5: MODO BASE64 UNIVERSAL - ESTÁVEL PARA ENTREVISTA
export interface StorageProvider {
  upload(file: File, folder: string, customName?: string): Promise<string>;
  delete(url: string): Promise<void>;
}

class Base64StorageProvider implements StorageProvider {
  async upload(file: File, _folder: string, _customName?: string): Promise<string> {
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      return `data:${file.type || 'image/png'};base64,${buffer.toString('base64')}`;
    } catch (err) {
      console.error("Erro na conversão Base64:", err);
      return "/placeholder-user.png";
    }
  }

  async delete(_url: string): Promise<void> {
    return Promise.resolve();
  }
}

export const storage = new Base64StorageProvider();
