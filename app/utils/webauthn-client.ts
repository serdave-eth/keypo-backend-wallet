import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export async function registerUser(username: string) {
  try {
    const startResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', username }),
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(error.error || 'Registration failed');
    }

    const { options } = await startResponse.json();

    const attResp = await startRegistration(options);

    const completeResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        username,
        response: attResp,
      }),
    });

    if (!completeResponse.ok) {
      const error = await completeResponse.json();
      throw new Error(error.error || 'Registration failed');
    }

    return await completeResponse.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function authenticateUser(username: string) {
  try {
    const startResponse = await fetch('/api/auth/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', username }),
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(error.error || 'Authentication failed');
    }

    const { options } = await startResponse.json();

    const attResp = await startAuthentication(options);

    const completeResponse = await fetch('/api/auth/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        username,
        response: attResp,
      }),
    });

    if (!completeResponse.ok) {
      const error = await completeResponse.json();
      throw new Error(error.error || 'Authentication failed');
    }

    return await completeResponse.json();
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

export async function signMessage(message: string, token: string) {
  try {
    const response = await fetch('/api/keyring/sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signing failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Signing error:', error);
    throw error;
  }
}