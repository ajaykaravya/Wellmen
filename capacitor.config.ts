import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'nextjs-capacitor',
  webDir: 'out',
   server: {
    url: 'https://nextjs-capacitor-puce.vercel.app/', // 👈 YOUR LIVE URL
    cleartext: false
  }
};

export default config;
