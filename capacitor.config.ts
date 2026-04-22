import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.evernow.app',
  appName: 'EverNOW',
  webDir: 'out',
  server: {
    // Para desenvolvimento (ajustes de UI no emulador):
    // Descomente as linhas abaixo para ver as mudanças em tempo real!
    url: 'http://192.168.0.251:3000',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
