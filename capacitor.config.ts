import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'wellman',
  webDir: 'out',
  server: {
    url: 'https://wellmen-git-main-ajaybkaravyasolutions-3883s-projects.vercel.app', // 👈 YOUR LIVE URL
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash_logo_inset",
      showSpinner: false,
    },
  },
};

export default config;
