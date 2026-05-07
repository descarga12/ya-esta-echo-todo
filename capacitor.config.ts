import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qrinventario.app',
  appName: 'SBH Huancayo',
  webDir: 'dist/spa',
  server: {
    androidScheme: 'http'
  },
  android: {
    buildOptions: {
      keystorePath: '',
      keystoreAlias: '',
      keystorePassword: '',
      keystoreAliasPassword: '',
      releaseType: 'APK'
    }
  }
};

export default config;
