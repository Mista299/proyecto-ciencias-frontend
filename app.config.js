const appJson = require('./app.json');

// app.config.js reads environment variables at build time and injects them into expo.extra
module.exports = () => {
  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      extra: {
        // Public variables (safe to expose to the client) should be prefixed with EXPO_PUBLIC_
        API_URL: process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || "",
        // Add other public keys here, e.g.:
        // STRIPE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY || "",
      },
    },
  };
};
