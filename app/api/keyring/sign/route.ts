import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { validateRequest } from '@/app/lib/jwt';
import {
  deriveKey,
  decryptPrivateKey,
  clearSensitiveData,
} from '@/app/lib/crypto';
import { privateKeyToAccount } from 'viem/accounts';
import { hashMessage } from 'viem';

const MASTER_KEY = process.env.MASTER_KEY!;

export async function POST(request: NextRequest) {
  try {
    const userId = await validateRequest(request);

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const encryptionKey = await deriveKey(
      MASTER_KEY,
      user.id,
      user.salt,
      'keyring_encryption_v1'
    );

    const privateKey = await decryptPrivateKey(
      user.encryptedPrivateKey,
      encryptionKey
    );

    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const signature = await account.signMessage({
      message,
    });

    const messageHash = hashMessage(message);

    clearSensitiveData(privateKey);
    clearSensitiveData(encryptionKey);

    return NextResponse.json({
      success: true,
      signature,
      messageHash,
      address: account.address,
    });
  } catch (error) {
    console.error('Signing error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Token has expired')) {
        return NextResponse.json(
          { error: 'Token has expired' },
          { status: 401 }
        );
      } else if (error.message.includes('Invalid token')) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      } else if (error.message.includes('No authorization token')) {
        return NextResponse.json(
          { error: 'No authorization token provided' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Signing failed' },
      { status: 500 }
    );
  }
}