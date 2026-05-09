/**
 * OAuth Configuration Testing Utility
 * Tests OAuth provider configurations across all applications
 */

import { OAUTH_PROVIDERS } from "../utils/socialAuth.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SocialLoginConfig {
  enabled: boolean;
  providers: string[];
  [key: string]: unknown; // clientId fields are dynamic (e.g. googleClientId)
}

interface MockAppConfig {
  features?: {
    socialLogin?: SocialLoginConfig;
  };
  apiEndpoints?: {
    login?: string;
  };
}

interface ProviderResult {
  id: string;
  clientId?: unknown;
  [key: string]: unknown;
}

interface AppConfigResult {
  hasOAuth: boolean;
  enabledProviders: string[];
  providerCount: number;
  providers: ProviderResult[];
}

interface ConfigIssue {
  app: string;
  error: string;
  type: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const getMockAppConfig = (appType: string): MockAppConfig => {
  const baseApiUrl = "http://127.0.0.1:5000";

  const configs: Record<string, MockAppConfig> = {
    church: {
      features: {
        socialLogin: {
          enabled: true,
          providers: ["google"],
          googleClientId: "mock-google-client-id",
        },
      },
      apiEndpoints: { login: `${baseApiUrl}/church/auth/login` },
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
      apiEndpoints: { login: `${baseApiUrl}/admin/auth/login` },
    },
    work: {
      features: {
        socialLogin: {
          enabled: true,
          providers: ["google", "linkedin"],
          googleClientId: "mock-google-client-id",
          linkedinClientId: "mock-linkedin-client-id",
        },
      },
      apiEndpoints: { login: `${baseApiUrl}/business/auth/login` },
    },
    home: {
      features: { socialLogin: { enabled: false, providers: [] } },
      apiEndpoints: { login: `${baseApiUrl}/home/auth/login` },
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
      apiEndpoints: { login: `${baseApiUrl}/personal/auth/login` },
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
      apiEndpoints: { login: `${baseApiUrl}/playback/auth/login` },
    },
  };

  return (
    configs[appType] ?? {
      features: { socialLogin: { enabled: false, providers: [] } },
    }
  );
};

const getEnabledProvidersForApp = (
  appConfig: MockAppConfig,
): ProviderResult[] => {
  const socialLogin = appConfig.features?.socialLogin;
  if (!socialLogin?.enabled) return [];

  const oauthProviders = OAUTH_PROVIDERS as unknown as Record<
    string,
    Record<string, unknown>
  >;

  return socialLogin.providers
    .map((providerId) => ({
      id: providerId,
      ...(oauthProviders[providerId] ?? {}),
      clientId: socialLogin[`${providerId}ClientId`],
    }))
    .filter((provider) => provider.clientId);
};

// ── Exports ───────────────────────────────────────────────────────────────────

export const testOAuthConfigurations = () => {
  const appConfigurations: Record<string, AppConfigResult> = {};
  const issues: ConfigIssue[] = [];
  const uniqueProviderIds = new Set<string>();
  let appsWithOAuth = 0;
  let totalEnabledProviders = 0;

  const appTypes = ["church", "admin", "work", "home", "personal", "playback"];

  for (const appType of appTypes) {
    try {
      const mockAppConfig = getMockAppConfig(appType);
      const enabledProviders = getEnabledProvidersForApp(mockAppConfig);

      appConfigurations[appType] = {
        hasOAuth: mockAppConfig.features?.socialLogin?.enabled ?? false,
        enabledProviders: enabledProviders.map((p) => p.id),
        providerCount: enabledProviders.length,
        providers: enabledProviders,
      };

      if (enabledProviders.length > 0) {
        appsWithOAuth++;
        totalEnabledProviders += enabledProviders.length;
        for (const p of enabledProviders) uniqueProviderIds.add(p.id);
      }
    } catch (err) {
      issues.push({
        app: appType,
        error: err instanceof Error ? err.message : String(err),
        type: "configuration_error",
      });
    }
  }

  return {
    totalProviders: Object.keys(OAUTH_PROVIDERS).length,
    supportedProviders: Object.keys(OAUTH_PROVIDERS),
    appConfigurations,
    issues,
    summary: {
      appsWithOAuth,
      totalEnabledProviders,
      uniqueProviders: Array.from(uniqueProviderIds),
    },
  };
};

export const validateOAuthProvider = (providerId: string) => {
  const oauthProviders = OAUTH_PROVIDERS as unknown as Record<
    string,
    Record<string, unknown> | undefined
  >;
  const provider = oauthProviders[providerId];

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

  return { valid: true, provider };
};

export const generateOAuthReport = () => {
  const testResults = testOAuthConfigurations();
  const recommendations: string[] = [];

  if (testResults.summary.appsWithOAuth === 0) {
    recommendations.push(
      "Consider enabling OAuth for at least one application to improve user experience",
    );
  }

  if (testResults.issues.length > 0) {
    recommendations.push(
      "Fix configuration errors before deploying OAuth functionality",
    );
  }

  if (testResults.summary.uniqueProviders.length < 3) {
    recommendations.push(
      "Consider adding more OAuth providers to give users more login options",
    );
  }

  return {
    timestamp: new Date().toISOString(),
    ...testResults,
    recommendations,
  };
};

export default {
  testOAuthConfigurations,
  validateOAuthProvider,
  generateOAuthReport,
};
