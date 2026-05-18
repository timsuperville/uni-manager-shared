# Multi-Factor Authentication (MFA) Examples

This guide provides practical examples for implementing MFA in your application.

## Setting Up TOTP MFA

### 1. Enable MFA

```javascript
import { useState } from 'react';
import { useMFA } from '@shared/auth';

function MFASetup() {
  const { setupMFA } = useMFA();
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');

  const initiateMFASetup = async () => {
    try {
      const result = await setupMFA('totp');
      setQrCode(result.qrCode);
      setSecret(result.secret);
    } catch (error) {
      console.error('MFA setup error:', error);
    }
  };

  const verifyAndEnable = async () => {
    try {
      await verifyMFA(verificationCode);
      alert('MFA enabled successfully!');
    } catch (error) {
      alert('Invalid code. Please try again.');
    }
  };

  return (
    <div>
      <button onClick={initiateMFASetup}>Enable MFA</button>

      {qrCode && (
        <div>
          <img src={qrCode} alt="MFA QR Code" />
          <p>Secret: {secret}</p>
          <input
            type="text"
            value={verificationCode}
            onChange={e => setVerificationCode(e.value)}
            placeholder="Enter 6-digit code"
            maxLength="6"
          />
          <button onClick={verifyAndEnable}>Verify</button>
        </div>
      )}
    </div>
  );
}
```

## MFA Login Flow

```javascript
function LoginWithMFA() {
  const [step, setStep] = useState('credentials'); // 'credentials' | 'mfa'
  const [mfaCode, setMfaCode] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const { login } = useAuth();

  const handleInitialLogin = async e => {
    e.preventDefault();

    try {
      const result = await login(credentials);

      if (result.mfaRequired) {
        setStep('mfa');
      } else {
        // Login successful without MFA
        window.location.href = '/dashboard';
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const handleMFAVerification = async e => {
    e.preventDefault();

    try {
      await verifyMFA(mfaCode);
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Invalid MFA code');
    }
  };

  if (step === 'mfa') {
    return (
      <form onSubmit={handleMFAVerification}>
        <h2>Enter Verification Code</h2>
        <input
          type="text"
          value={mfaCode}
          onChange={e => setMfaCode(e.target.value)}
          placeholder="6-digit code"
          maxLength="6"
          autoFocus
        />
        <button type="submit">Verify</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleInitialLogin}>
      <input
        type="email"
        value={credentials.email}
        onChange={e =>
          setCredentials({ ...credentials, email: e.target.value })
        }
        placeholder="Email"
      />
      <input
        type="password"
        value={credentials.password}
        onChange={e =>
          setCredentials({ ...credentials, password: e.target.value })
        }
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Managing MFA Methods

```javascript
function MFAManagement() {
  const { user, disableMFA, setupMFA } = useMFA();
  const [methods, setMethods] = useState([]);

  useEffect(() => {
    // Fetch enabled MFA methods
    const fetchMethods = async () => {
      const response = await fetch('/api/auth/mfa/methods', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      setMethods(data.methods);
    };

    fetchMethods();
  }, []);

  const handleDisable = async method => {
    if (confirm(`Are you sure you want to disable ${method} MFA?`)) {
      try {
        await disableMFA(method);
        setMethods(methods.filter(m => m !== method));
        alert('MFA disabled successfully');
      } catch (error) {
        alert('Failed to disable MFA');
      }
    }
  };

  return (
    <div>
      <h3>MFA Security</h3>

      {methods.length === 0 && (
        <p>MFA is not enabled. Enable it for better security.</p>
      )}

      <div>
        {['totp', 'sms', 'email'].map(method => {
          const isEnabled = methods.includes(method);

          return (
            <div key={method}>
              <span>{method.toUpperCase()}</span>
              {isEnabled ? (
                <button onClick={() => handleDisable(method)}>Disable</button>
              ) : (
                <button onClick={() => setupMFA(method)}>Enable</button>
              )}
            </div>
          );
        })}
      </div>

      {methods.length > 0 && (
        <button onClick={() => generateBackupCodes()}>
          Generate Backup Codes
        </button>
      )}
    </div>
  );
}
```

## Backup Codes

```javascript
function BackupCodes() {
  const [codes, setCodes] = useState([]);
  const [showCodes, setShowCodes] = useState(false);

  const generateCodes = async () => {
    try {
      const response = await fetch('/api/auth/mfa/backup-codes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();
      setCodes(data.codes);
      setShowCodes(true);
    } catch (error) {
      alert('Failed to generate backup codes');
    }
  };

  const downloadCodes = () => {
    const text = codes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    a.click();
  };

  return (
    <div>
      <button onClick={generateCodes}>Generate Backup Codes</button>

      {showCodes && (
        <div>
          <h4>Your Backup Codes</h4>
          <p>Save these codes in a secure location. Each can be used once.</p>

          <ul>
            {codes.map((code, index) => (
              <li key={index}>
                <code>{code}</code>
              </li>
            ))}
          </ul>

          <button onClick={downloadCodes}>Download Codes</button>
        </div>
      )}
    </div>
  );
}
```

## SMS MFA

```javascript
function SMSSetup() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'verify'

  const sendCode = async () => {
    try {
      await fetch('/api/auth/mfa/sms/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ phoneNumber })
      });

      setStep('verify');
      alert('Verification code sent to ' + phoneNumber);
    } catch (error) {
      alert('Failed to send code');
    }
  };

  const verifyCode = async () => {
    try {
      await fetch('/api/auth/mfa/sms/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ code: verificationCode })
      });

      alert('SMS MFA enabled successfully!');
    } catch (error) {
      alert('Invalid verification code');
    }
  };

  if (step === 'verify') {
    return (
      <div>
        <input
          type="text"
          value={verificationCode}
          onChange={e => setVerificationCode(e.target.value)}
          placeholder="Enter code"
          maxLength="6"
        />
        <button onClick={verifyCode}>Verify</button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="tel"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        placeholder="+1 234 567 8900"
      />
      <button onClick={sendCode}>Send Code</button>
    </div>
  );
}
```

## Best Practices

1. **Always offer backup codes** - Users can lose access to their MFA device
2. **Support multiple MFA methods** - Give users flexibility
3. **Rate limit verification attempts** - Prevent brute force attacks
4. **Clear error messages** - Help users troubleshoot issues
5. **Allow account recovery** - Provide secure recovery options
6. **Time-limited codes** - Use short expiration times (5-10 minutes)
7. **Secure code transmission** - Use HTTPS for all MFA operations
