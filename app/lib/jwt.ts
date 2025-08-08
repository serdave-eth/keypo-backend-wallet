import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
  scope: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = '30m';

export function generateJWT(userId: string): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: userId,
    scope: 'keyring:sign'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: 'keypo-wallet',
    algorithm: 'HS256'
  });
}

export function verifyJWT(token: string): JWTPayload {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'keypo-wallet',
      algorithms: ['HS256']
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

export async function validateRequest(request: NextRequest): Promise<string> {
  const token = extractTokenFromRequest(request);
  
  if (!token) {
    throw new Error('No authorization token provided');
  }

  const payload = verifyJWT(token);
  
  if (!payload.scope || !payload.scope.includes('keyring:sign')) {
    throw new Error('Insufficient permissions');
  }

  return payload.sub;
}