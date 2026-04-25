import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'wellman',
  webDir: 'out',
  server: {
    url: 'https://wellmen-git-main-ajaybkaravyasolutions-3883s-projects.vercel.app', // 👈 YOUR LIVE URL
    cleartext: false
  }
};

export default config;
