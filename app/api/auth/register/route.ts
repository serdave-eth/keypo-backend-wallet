import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import {
  generateRegistrationChallenge,
  verifyRegistration,
} from '@/app/lib/webauthn';
import {
  generateSalt,
  deriveKey,
  encryptPrivateKey,
  generateEOAPrivateKey,
  getAddressFromPrivateKey,
  clearSensitiveData,
} from '@/app/lib/crypto';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';

const MASTER_KEY = process.env.MASTER_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, response } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (action === 'start') {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }

      const options = await generateRegistrationChallenge(username);

      return NextResponse.json({ options });
    } else if (action === 'complete') {
      if (!response) {
        return NextResponse.json(
          { error: 'Registration response is required' },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }

      const verification = await verifyRegistration(
        username,
        response as RegistrationResponseJSON
      );

      if (!verification.verified) {
        return NextResponse.json(
          { error: 'Registration verification failed' },
          { status: 400 }
        );
      }

      const privateKey = generateEOAPrivateKey();
      const address = getAddressFromPrivateKey(privateKey);
      const salt = generateSalt();

      const user = await prisma.user.create({
        data: {
          username,
          webauthnCredentialId: verification.credentialID,
          webauthnPublicKey: verification.credentialPublicKey,
          salt,
          encryptedPrivateKey: '',
        },
      });

      const encryptionKey = await deriveKey(
        MASTER_KEY,
        user.id,
        salt,
        'keyring_encryption_v1'
      );

      const encryptedPrivateKey = await encryptPrivateKey(
        privateKey,
        encryptionKey
      );

      await prisma.user.update({
        where: { id: user.id },
        data: { encryptedPrivateKey },
      });

      clearSensitiveData(privateKey);
      clearSensitiveData(encryptionKey);

      return NextResponse.json({
        success: true,
        userId: user.id,
        address,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}