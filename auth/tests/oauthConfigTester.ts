/**
 * OAuth Configuration Testing Utility
 * Tests OAuth provider configurations across all applications
 */

import { OAUTH_PROVIDERS } from "../utils/socialAuth.ts";

/**
 * Test OAuth provider configurations for all apps
 */
export const testOAuthConfigurations = () => {
  const results = {
    totalProviders: Object.keys(OAUTH_PROVIDERS).length,
    supportedProviders: Object.keys(OAUTH_PROVIDERS),
    appConfigurations: {},
    issues: [],
    summary: {
      appsWithOAuth: 0,
      totalEnabledProviders: 0,
      uniqueProviders: new Set(),
    },
  };

  // Define app configurations to test
  const appTypes = [
    "church",
    "admin",
    "business",
    "home",
    "personal",
    "playback",
  ];

  appTypes.forEach((appType) => {
    try {
      // Mock app config for testing
      const mockAppConfig = getMockAppConfig(appType);
      const enabledProviders = getEnabledProvidersForApp(mockAppConfig);

      results.appConfigurations[appType] = {
        hasOAuth: mockAppConfig.features?.socialLogin?.enabled || false,
        enabledProviders: enabledProviders.map((p) => p.id),
        providerCount: enabledProviders.length,
        providers: enabledProviders,
      };

      if (enabledProviders.length > 0) {
        results.summary.appsWithOAuth++;
        results.summary.totalEnabledProviders += enabledProviders.length;
        enabledProviders.forEach((p) =>
          results.summary.uniqueProviders.add(p.id),
        );
      }
    } catch (_error) {
      results.issues.push({
        app: appType,
        error: error.message,
        type: "configuration_error",
      });
    }
  });

  // Convert Set to Array for final result
  results.summary.uniqueProviders = Array.from(results.summary.uniqueProviders);

  return results;
};

/**
 * Get mock app configuration for testing
 */
const getMockAppConfig = (appType) => {
  const baseApiUrl = "http://localhost:5000";

  const configs = {
    church: {
      features: {
        socialLogin: {
          enabled: true,
          providers: ["google"],
          googleClientId: "mock-google-client-id",
        },
      },
      apiEndpoints: {
        login: `${baseApiUrl}/church/auth/login`,
      },
    },
    admin: {
      features: {
        socialLogin: {
          enabled: true,
          providers: ["google", "microsoft"],
          googleClientId: "mock-google-client-id",
          microsoftClientId: "mock-microsoft-client-id",
        },
      },
      apiEndpoints: {
        login: `${baseApiUrl}/admin/auth/login`,
      },
    },
    business: {
      features: {
        socialLogin: {
          enabled: true,
          providers: ["google", "linkedin"],
          googleClientId: "mock-google-client-id",
          linkedinClientId: "mock-linkedin-client-id",
        },
      },
      apiEndpoints: {
        login: `${baseApiUrl}/business/auth/login`,
      },
    },
    home: {
      features: {
        socialLogin: {
          enabled: false,
          providers: [],
        },
      },
      apiEndpoints: {
        login: `${baseApiUrl}/home/auth/login`,
      },
    },
    personal: {
      features: {
        socialLogin: {
          enabled: true,
          providers: ["google", "github"],
          googleClientId: "mock-google-client-id",
          githubClientId: "mock-github-client-id",
        },
      },
      apiEndpoints: {
        login: `${baseApiUrl}/personal/auth/login`,
      },
    },
    playback: {
      features: {
        socialLogin: {
          enabled: true,
          providers: ["google", "spotify", "apple"],
          googleClientId: "mock-google-client-id",
          spotifyClientId: "mock-spotify-client-id",
          appleClientId: "mock-apple-client-id",
        },
      },
      apiEndpoints: {
        login: `${baseApiUrl}/playback/auth/login`,
      },
    },
  };

  return (
    configs[appType] || {
      features: { socialLogin: { enabled: false, providers: [] } },
    }
  );
};

/**
 * Get enabled providers for a specific app configuration
 */
const getEnabledProvidersForApp = (appConfig) => {
  if (!appConfig.features?.socialLogin?.enabled) {
    return [];
  }

  return appConfig.features.socialLogin.providers
    .map((providerId) => ({
      id: providerId,
      ...OAUTH_PROVIDERS[providerId],
      clientId: appConfig.features.socialLogin[`${providerId}ClientId`],
    }))
    .filter((provider) => provider.clientId);
};

/**
 * Validate OAuth provider configuration
 */
export const validateOAuthProvider = (providerId) => {
  const provider = OAUTH_PROVIDERS[providerId];

  if (!provider) {
    return {
      valid: false,
      error: `Provider '${providerId}' not found in OAUTH_PROVIDERS`,
    };
  }

  const requiredFields = ["name", "icon", "color", "getAuthUrl", "scopes"];
  const missingFields = requiredFields.filter((field) => !provider[field]);

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Provider '${providerId}' missing required fields: ${missingFields.join(", ")}`,
    };
  }

  return {
    valid: true,
    provider: provider,
  };
};

/**
 * Generate OAuth configuration report
 */
export const generateOAuthReport = () => {
  const testResults = testOAuthConfigurations();

  const report = {
    timestamp: new Date().toISOString(),
    ...testResults,
    recommendations: [],
  };

  // Add recommendations based on test results
  if (report.summary.appsWithOAuth === 0) {
    report.recommendations.push(
      "Consider enabling OAuth for at least one application to improve user experience",
    );
  }

  if (report.issues.length > 0) {
    report.recommendations.push(
      "Fix configuration errors before deploying OAuth functionality",
    );
  }

  if (report.summary.uniqueProviders.length < 3) {
    report.recommendations.push(
      "Consider adding more OAuth providers to give users more login options",
    );
  }

  return report;
};

export default {
  testOAuthConfigurations,
  validateOAuthProvider,
  generateOAuthReport,
};
