# OAuth Authentication Examples

This guide provides practical examples for implementing OAuth authentication in your application using the auth system.

## Basic OAuth Flow

### 1. Starting OAuth Authentication

```javascript
import { useAuth } from '@shared/auth';
import { OAuthAuthService } from '@shared/auth/services';

function LoginWithGoogle() {
  const { login } = useAuth();
  const oauthService = new OAuthAuthService({
    apiBaseUrl: process.env.VITE_API_URL,
    appType: 'web'
  });

  const handleGoogleLogin = async () => {
    try {
      // Start OAuth flow
      const { authUrl } = await oauthService.startOAuthFlow('google');

      // Redirect user to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error('OAuth error:', error.message);
    }
  };

  return <button onClick={handleGoogleLogin}>Sign in with Google</button>;
}
```

### 2. Handling OAuth Callback

```javascript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OAuthAuthService } from '@shared/auth/services';

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth_failed');
        return;
      }

      try {
        const oauthService = new OAuthAuthService({
          apiBaseUrl: process.env.VITE_API_URL,
          appType: 'web'
        });

        const result = await oauthService.handleOAuthCallback(code, state);

        // Store tokens and redirect
        localStorage.setItem('accessToken', result.accessToken);
        navigate('/dashboard');
      } catch (err) {
        console.error('Callback error:', err.message);
        navigate('/login?error=oauth_callback_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return <div>Completing OAuth login...</div>;
}
```

## Multiple OAuth Providers

```javascript
function SocialLogin() {
  const providers = [
    { id: 'google', name: 'Google', icon: GoogleIcon },
    { id: 'github', name: 'GitHub', icon: GitHubIcon },
    { id: 'microsoft', name: 'Microsoft', icon: MicrosoftIcon }
  ];

  const handleSocialLogin = async providerId => {
    const oauthService = new OAuthAuthService({
      apiBaseUrl: process.env.VITE_API_URL
    });

    try {
      const { authUrl } = await oauthService.startOAuthFlow(providerId);
      window.location.href = authUrl;
    } catch (error) {
      alert(`Failed to start ${providerId} login`);
    }
  };

  return (
    <div className="social-login">
      {providers.map(provider => (
        <button
          key={provider.id}
          onClick={() => handleSocialLogin(provider.id)}
          className="provider-button"
        >
          <provider.icon />
          Continue with {provider.name}
        </button>
      ))}
    </div>
  );
}
```

## Linking OAuth Accounts

```javascript
function AccountSettings() {
  const [linkedProviders, setLinkedProviders] = useState([]);
  const { user } = useAuth();

  const oauthService = new OAuthAuthService({
    apiBaseUrl: process.env.VITE_API_URL
  });

  useEffect(() => {
    const fetchLinkedProviders = async () => {
      const token = localStorage.getItem('accessToken');
      const providers = await oauthService.getLinkedProviders(token);
      setLinkedProviders(providers);
    };

    fetchLinkedProviders();
  }, []);

  const linkAccount = async providerId => {
    const token = localStorage.getItem('accessToken');
    const { authUrl } = await oauthService.linkOAuthAccount(providerId, token);
    window.location.href = authUrl;
  };

  const unlinkAccount = async providerId => {
    const token = localStorage.getItem('accessToken');
    await oauthService.unlinkOAuthAccount(providerId, token);
    setLinkedProviders(providers => providers.filter(p => p.id !== providerId));
  };

  return (
    <div>
      <h3>Linked Accounts</h3>
      {['google', 'github', 'microsoft'].map(providerId => {
        const isLinked = linkedProviders.some(p => p.provider === providerId);

        return (
          <div key={providerId}>
            <span>{providerId}</span>
            {isLinked ? (
              <button onClick={() => unlinkAccount(providerId)}>Unlink</button>
            ) : (
              <button onClick={() => linkAccount(providerId)}>Link</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

## Error Handling

```javascript
function OAuthLogin() {
  const [error, setError] = useState(null);

  const handleOAuthLogin = async provider => {
    try {
      setError(null);
      const oauthService = new OAuthAuthService({
        apiBaseUrl: process.env.VITE_API_URL
      });

      const { authUrl } = await oauthService.startOAuthFlow(provider);
      window.location.href = authUrl;
    } catch (err) {
      // Handle specific error cases
      if (err.message.includes('not supported')) {
        setError(`${provider} authentication is not available`);
      } else if (err.message.includes('network')) {
        setError('Network error. Please check your connection');
      } else {
        setError('Failed to start OAuth login. Please try again');
      }
    }
  };

  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      <button onClick={() => handleOAuthLogin('google')}>
        Sign in with Google
      </button>
    </div>
  );
}
```

## Best Practices

1. **Always validate state parameter** - Prevents CSRF attacks
2. **Store sensitive data securely** - Use sessionStorage for PKCE verifier
3. **Handle errors gracefully** - Show user-friendly messages
4. **Clear OAuth session data** - After successful callback
5. **Use HTTPS** - Required for production OAuth flows
6. **Configure redirect URI** - Must match exactly in OAuth settings
