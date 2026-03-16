import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    package: "com.bhair.app",
    googleServicesFile: "./google-services.json",
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  ios: {
    ...config.ios,
    bundleIdentifier: "com.bhair.app",
    config: {
      ...config.ios?.config,
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
  web: {
    ...config.web,
    config: {
      ...config.web?.config,
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
});
