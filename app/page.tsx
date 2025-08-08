'use client';

import { useState } from 'react';
import { registerUser, authenticateUser, signMessage } from './utils/webauthn-client';

export default function Home() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [address, setAddress] = useState('');
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await registerUser(username);
      setAddress(result.address);
      alert(`Registration successful! Your wallet address is: ${result.address}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authenticateUser(username);
      setToken(result.token);
      alert('Authentication successful! You can now sign messages.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!message) {
      setError('Please enter a message to sign');
      return;
    }

    if (!token) {
      setError('Please authenticate first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signMessage(message, token);
      setSignature(result.signature);
      setAddress(result.address);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Keypo Wallet</h1>
          <p className="mt-2 text-sm text-gray-600">
            WebAuthn-based wallet with biometric authentication
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleRegister}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Register'}
            </button>

            <button
              onClick={handleAuthenticate}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Authenticate'}
            </button>
          </div>

          {token && (
            <>
              <div className="border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Sign Message</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                      rows={3}
                      placeholder="Enter message to sign"
                      disabled={loading}
                    />
                  </div>

                  <button
                    onClick={handleSign}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing...' : 'Sign Message'}
                  </button>
                </div>
              </div>

              {signature && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900">Signature Result</h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Address:</p>
                      <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all">{address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Signature:</p>
                      <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all">{signature}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}