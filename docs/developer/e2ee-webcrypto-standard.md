# E2EE WebCrypto Standard (Sovereign Privacy)

> **Status**: 🟢 Active Specification  
> **Audience**: Security Architects, Frontend Engineers (Personal App)  
> **Last Updated**: March 12, 2026

The **Personal Sanctuary** demands absolute, verifiable privacy. Journal entries, biometric capacity scores, and fidicuary goals must be shielded from database breaches, malicious internal actors, and the platform administrators themselves.

To achieve this, Uni-Manager utilizes **End-to-End Encryption (E2EE)** powered by the browser's native `SubtleCrypto` API.

## 1. The Cryptographic Architecture

The backend MongoDB cluster NEVER stores unencrypted Personal Sanctuary content, nor does it hold the keys required to decrypt it.

### 1.1 Key Generation (The Sanctuary Key)

When setting up the Personal Sanctuary, the client browser generates a strong, symmetric AES-GCM encryption key (The **Sanctuary Key**).

```javascript
const sanctuaryKey = await window.crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);
```

### 1.2 Data Encryption Flow (Client-Side)

1. The user writes a journal entry: `"I feel completely burned out today."`
2. The browser generates a unique, random Initialization Vector (IV).
3. The browser encrypts the text using the `Sanctuary Key` and the IV.
4. The client sends the payload to the Node.js backend:
   ```json
   {
     "iv": "base64-string-here",
     "encryptedPayload": "base64-ciphertext-here"
   }
   ```
5. MongoDB stores indistinguishable ciphertext.

## 2. Key Escrow & Secure Recovery

The primary risk of E2EE is data loss. If the user clears their IndexedDB and loses their `Sanctuary Key`, their data is permanently irretrievable. We must balance Sovereign Privacy with usability.

### 2.1 The Key-Wrapping Protocol (KWP)

We cannot store the raw `Sanctuary Key` in the database. Instead, we "wrap" (encrypt) it using a key derived from the user's explicit Sanctuary Password (which is DIFFERENT from their Uni-Manager login password).

1. User creates a strong **Sanctuary Passphrase**.
2. Browser uses PBKDF2 (100,000+ iterations) + salt to derive a **Wrapping Key** from the passphrase.
3. The `Sanctuary Key` is encrypted using the `Wrapping Key`.
4. The resulting **Wrapped Sanctuary Key** is stored in MongoDB.

### 2.2 Device Syncing & Recovery

When the user logs into a new device:

1. They attempt to open the Personal Sanctuary.
2. The server delivers the **Wrapped Sanctuary Key**.
3. The user is prompted: _"Enter your Sanctuary Passphrase."_
4. The browser derives the `Wrapping Key`, decrypts the `Sanctuary Key`, stores it securely in IndexedDB (non-exportable), and can now decrypt journal entries.

_If the user forgets their Sanctuary Passphrase, the data is mathematically destroyed. The UI must explicitly force the user to acknowledge this risk during setup._

## 3. The Cryptographic Panic Switch (Duress Protocol)

To protect against physical device compromise (e.g., a bad actor forcing the user to unlock the device), the UI implements a **Duress Action**.

1. The user configures a specific "Duress PIN" or phrase.
2. If this PIN is entered into the authentication screen, the client instantly executes `window.indexedDB.deleteDatabase("UniManagerLocalSync")`.
3. The `Sanctuary Key` is destroyed from local memory.
4. The app navigates to a "Ghost State" (a generic, empty profile UI) to satisfy the physical observer.
5. Restoration requires navigating to a separate trusted device and initiating a multi-factor unlock to retrieve the Wrapped Key again.

## 4. Search & Indexing Limitations

Because the server only sees ciphertext, **server-side text search (regex or text indexes) is impossible.**

- All searching of journal entries must occur _client-side_.
- For complex Personal dashboards, the client must pull the encrypted data dump, decrypt it locally in a Web Worker, and pipe the plaintext into an in-memory search engine (e.g., MiniSearch).
