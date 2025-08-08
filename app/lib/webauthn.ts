import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';

const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'Keypo Wallet';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

const challengeStore = new Map<string, string>();

export async function generateRegistrationChallenge(username: string) {
  const opts: GenerateRegistrationOptionsOpts = {
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: username,
    userDisplayName: username,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'preferred',
      requireResidentKey: true,
      residentKey: 'required',
    },
    supportedAlgorithmIDs: [-7, -257],
  };

  const options = await generateRegistrationOptions(opts);
  
  challengeStore.set(username, options.challenge);
  
  return options;
}

export async function verifyRegistration(
  username: string,
  response: RegistrationResponseJSON
) {
  const expectedChallenge = challengeStore.get(username);
  
  if (!expectedChallenge) {
    throw new Error('No challenge found for user');
  }

  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: true,
  };

  const verification = await verifyRegistrationResponse(opts);
  
  if (verification.verified && verification.registrationInfo) {
    challengeStore.delete(username);
    
    return {
      verified: true,
      credentialID: Buffer.from(verification.registrationInfo.credential.id).toString('base64'),
      credentialPublicKey: Buffer.from(verification.registrationInfo.credential.publicKey).toString('base64'),
      counter: verification.registrationInfo.credential.counter,
    };
  }

  throw new Error('Registration verification failed');
}

export async function generateAuthenticationChallenge(
  credentialID: string
) {
  const opts: GenerateAuthenticationOptionsOpts = {
    rpID: RP_ID,
    userVerification: 'preferred',
  };

  const options = await generateAuthenticationOptions(opts);
  
  challengeStore.set(credentialID, options.challenge);
  
  return options;
}

export async function verifyAuthentication(
  credentialID: string,
  credentialPublicKey: string,
  response: AuthenticationResponseJSON,
  counter: number
) {
  const expectedChallenge = challengeStore.get(credentialID);
  
  if (!expectedChallenge) {
    console.error('No challenge found for credential:', credentialID);
    throw new Error('No challenge found for credential');
  }

  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: credentialID,
      publicKey: Buffer.from(credentialPublicKey, 'base64'),
      counter,
    },
    requireUserVerification: false,
  };

  const verification = await verifyAuthenticationResponse(opts);
  
  if (verification.verified) {
    challengeStore.delete(credentialID);
    return {
      verified: true,
      newCounter: verification.authenticationInfo ? verification.authenticationInfo.newCounter : counter + 1,
    };
  }

  throw new Error('Authentication verification failed');
}