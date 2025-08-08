# Keypo Wallet - WebAuthn-Based Keyring System

A secure keyring system using WebAuthn biometric authentication for Ethereum EOA private key management. This system provides server-side key derivation using HKDF, JWT-based session management, and secure message signing capabilities.

## Features

- **Biometric Authentication**: Uses WebAuthn for fingerprint/Face ID authentication
- **Secure Key Management**: HKDF-based key derivation with encrypted storage
- **EOA Wallet Support**: Generates and manages Ethereum private keys
- **JWT Sessions**: Short-lived tokens (15-30 minutes) for authenticated operations
- **Message Signing**: Secure server-side message signing with user's private key

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Docker for local development)
- A device with biometric authentication support (fingerprint reader, Face ID, etc.)

## Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd keypo-backend-wallet
```

2. Start PostgreSQL with Docker Compose:
```bash
docker-compose up -d
```

3. Run the setup script:
```bash
./setup.sh
```

4. Update the `.env.local` file with secure keys:
   - Generate a secure MASTER_KEY (minimum 32 characters)
   - Generate a secure JWT_SECRET (minimum 32 characters)

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Start the development server:
```bash
npm run dev
```

## Manual Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd keypo-backend-wallet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and configure:
- `MASTER_KEY`: A secure master key (minimum 32 characters)
- `JWT_SECRET`: A secure JWT secret (minimum 32 characters)
- `DATABASE_URL`: Your PostgreSQL connection string
- WebAuthn settings (RP_NAME, RP_ID, ORIGIN)

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Registration Flow

1. Enter a unique username
2. Click "Register"
3. Complete biometric authentication when prompted
4. Receive your wallet address

### Authentication Flow

1. Enter your registered username
2. Click "Authenticate"
3. Complete biometric authentication
4. Receive a JWT token for signing operations

### Message Signing

1. Authenticate first to get a JWT token
2. Enter a message to sign
3. Click "Sign Message"
4. Receive the signature and message hash

## API Endpoints

### POST /api/auth/register
Register a new user with WebAuthn credentials.

**Request Body:**
```json
{
  "action": "start" | "complete",
  "username": "string",
  "response": "WebAuthn response (for complete action)"
}
```

### POST /api/auth/authenticate
Authenticate an existing user.

**Request Body:**
```json
{
  "action": "start" | "complete",
  "username": "string",
  "response": "WebAuthn response (for complete action)"
}
```

### POST /api/keyring/sign
Sign a message with the user's private key.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "message": "string"
}
```

**Response:**
```json
{
  "success": true,
  "signature": "0x...",
  "messageHash": "0x...",
  "address": "0x..."
}
```

## Security Considerations

1. **Master Key Security**: Store the master key securely. In production, consider using HSM or KMS.
2. **HTTPS Required**: Always use HTTPS in production environments.
3. **Database Security**: Ensure database encryption at rest and in transit.
4. **Rate Limiting**: Implement rate limiting on authentication and signing endpoints.
5. **Token Expiration**: JWT tokens expire after 30 minutes by default.
6. **No Recovery**: No account recovery mechanism - biometric data loss means permanent account loss.

## Database Schema

```prisma
model User {
  id                    String   @id @default(uuid())
  username              String   @unique
  webauthnCredentialId  String   @unique
  webauthnPublicKey     String
  salt                  String   @unique
  encryptedPrivateKey   String
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

## Project Structure

```
keypo-backend-wallet/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts    # Registration endpoint
│   │   │   └── authenticate/route.ts # Authentication endpoint
│   │   └── keyring/
│   │       └── sign/route.ts        # Message signing endpoint
│   ├── lib/
│   │   ├── crypto.ts                # HKDF and encryption utilities
│   │   ├── jwt.ts                   # JWT management
│   │   ├── webauthn.ts              # WebAuthn server utilities
│   │   └── db.ts                    # Database client
│   ├── utils/
│   │   └── webauthn-client.ts       # WebAuthn client utilities
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Main UI page
├── prisma/
│   └── schema.prisma                # Database schema
├── middleware.ts                    # Security middleware
├── requirements/                    # Project requirements
└── README.md                        # This file
```

## Development

### Run development server:
```bash
npm run dev
```

### Run database migrations:
```bash
npm run prisma:migrate
```

### Open Prisma Studio:
```bash
npm run prisma:studio
```

### Build for production:
```bash
npm run build
```

## Testing

The system includes the following test scenarios:

1. **Registration Flow**: User registration with biometric authentication
2. **Authentication Flow**: User login and JWT generation
3. **Message Signing**: Authenticated message signing operations
4. **Security Tests**: Token validation, expiration, and WebAuthn challenge verification

## Future Enhancements

- Multi-user delegation support
- Advanced permission management
- Hardware Security Module (HSM) integration
- Account recovery mechanisms
- Audit logging system
- Enhanced rate limiting

## License

ISC

## Support

For issues and questions, please refer to the requirements document in the `requirements/` directory.