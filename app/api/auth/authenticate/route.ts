import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import {
  generateAuthenticationChallenge,
  verifyAuthentication,
} from '@/app/lib/webauthn';
import { generateJWT } from '@/app/lib/jwt';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';

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

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'start') {
      const options = await generateAuthenticationChallenge(
        user.webauthnCredentialId
      );

      return NextResponse.json({ options });
    } else if (action === 'complete') {
      if (!response) {
        return NextResponse.json(
          { error: 'Authentication response is required' },
          { status: 400 }
        );
      }

      const verification = await verifyAuthentication(
        user.webauthnCredentialId,
        user.webauthnPublicKey,
        response as AuthenticationResponseJSON,
        0
      );

      if (!verification.verified) {
        return NextResponse.json(
          { error: 'Authentication verification failed' },
          { status: 401 }
        );
      }

      const token = generateJWT(user.id);

      return NextResponse.json({
        success: true,
        token,
        userId: user.id,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}