import {
  startRegistration,
  startAuthentication
} from '@simplewebauthn/browser';
import { getApiClient } from '../../api';

/**
 * Service for handling WebAuthn (Passkey / Biometric Anchor) flows.
 * Uses @simplewebauthn/browser to interact with the authenticator.
 */
export class WebAuthnService {
  // Lazy getter — defer resolution until a method is called so that
  // ApiProvider's initializeApiClient() has had time to run first.
  private get apiClient() {
    return getApiClient();
  }

  /**
   * Registers a new biometric anchor (Passkey) for the authenticated user.
   */
  public async registerBiometricAnchor(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // 1. Get registration options from the server
      const { data: optionsData } = await this.apiClient.post<any>(
        '/auth/webauthn/register/generate-options'
      );
      const options = optionsData.data;

      // 2. Pass options to the browser's WebAuthn API
      let registrationResponse;
      try {
        registrationResponse = await startRegistration({
          optionsJSON: options
        });
      } catch (error: any) {
        if (error.name === 'InvalidStateError') {
          throw new Error(
            'Error: Authenticator was probably already registered by user'
          );
        }
        throw new Error(`Local authenticator error: ${error.message}`);
      }

      // 3. Send the registration response back to the server for verification
      const { data: verificationData } = await this.apiClient.post<any>(
        '/auth/webauthn/register/verify',
        registrationResponse
      );

      return verificationData.data;
    } catch (error: any) {
      console.error('WebAuthn Registration Error:', error);
      throw error;
    }
  }

  /**
   * Authenticates the user using a registered biometric anchor.
   */
  public async authenticateWithBiometricAnchor(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // 1. Get authentication options from the server
      const { data: optionsData } = await this.apiClient.post<any>(
        '/auth/webauthn/authenticate/generate-options'
      );
      const options = optionsData.data;

      // 2. Pass options to the browser's WebAuthn API
      let authenticationResponse;
      try {
        authenticationResponse = await startAuthentication({
          optionsJSON: options
        });
      } catch (error: any) {
        throw new Error(`Local authenticator error: ${error.message}`);
      }

      // 3. Send the authentication response back to the server for verification
      const { data: verificationData } = await this.apiClient.post<any>(
        '/auth/webauthn/authenticate/verify',
        authenticationResponse
      );

      return verificationData.data;
    } catch (error: any) {
      console.error('WebAuthn Authentication Error:', error);
      throw error;
    }
  }
}

export const webAuthnService = new WebAuthnService();
