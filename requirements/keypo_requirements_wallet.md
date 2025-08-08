---
kip: <to be assigned>
title: WebAuthn-Based Keyring with EOA Private Key Management
description: A secure keyring system using WebAuthn biometric authentication for EOA private key storage and message signing
author: <to be assigned>
discussions-to: <URL>
status: Draft
type: Standards Track
category: Core
created: 2025-08-08
requires: N/A
---

## Abstract

This specification defines a Next.js-based keyring system that uses WebAuthn biometric authentication to securely manage Ethereum Externally Owned Account (EOA) private keys. The system employs server-side key derivation using HKDF, JWT-based session management, and provides secure message signing capabilities. Users register with biometric authentication, receive an encrypted keyring containing their EOA private key, and can perform signing operations through authenticated API endpoints.

## Motivation

Current wallet management solutions often require users to manually handle private keys, leading to security vulnerabilities and poor user experience. This specification addresses the need for a secure, user-friendly keyring system that:

- Eliminates the need for users to directly manage private keys
- Provides biometric authentication for enhanced security
- Offers server-side signing capabilities while maintaining key security
- Demonstrates a foundation for delegation-based wallet management

The system provides a secure foundation for future enhancements including multi-user delegation and advanced permission management.

## Specification

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.

### System Architecture

The system MUST implement the following core components:

#### 1. Authentication System
- MUST use SimpleWebAuthn libraries for client and server-side WebAuthn implementation
- MUST support only biometric authentication methods (fingerprint, Face ID, etc.)
- MUST NOT allow fallback authentication methods (passwords, SMS, etc.)

#### 2. User Registration Flow
- User MUST provide a username during registration
- System MUST generate a new EOA private key using Viem libraries
- System MUST create a unique salt for the user
- System MUST encrypt the private key using HKDF-derived encryption key
- System MUST store encrypted keyring data in database

#### 3. Key Derivation
- System MUST use HKDF (HMAC-based Key Derivation Function) for all key derivation
- Master key MUST be stored as environment variable (.env)
- User encryption key derivation: `HKDF(master_key, userID + salt, "keyring_encryption_v1")`
- Derived keys MUST NOT be stored anywhere in the system
- Keys MUST be derived fresh for each operation

#### 4. Database Schema
```
users:
  id (primary key)
  username (unique, unencrypted)
  webauthn_credential_id
  webauthn_public_key
  salt (unique per user, unencrypted)
  encrypted_private_key (encrypted with derived key)
  created_at
  updated_at
```

#### 5. JWT Session Management
- System MUST issue short-lived JWT tokens (15-30 minutes) after successful authentication
- JWT payload MUST include:
  - `sub`: user ID
  - `iat`: issued at timestamp
  - `exp`: expiration timestamp
  - `scope`: "keyring:sign"
- JWT MUST be signed with server secret key

#### 6. Message Signing Endpoint
- Endpoint MUST validate JWT token before processing
- System MUST derive user's decryption key using HKDF
- System MUST decrypt EOA private key
- System MUST sign provided message using Viem wallet utilities
- Response MUST include signed message data
- Private key MUST be cleared from memory after operation

### Technical Requirements

#### Technology Stack
- MUST use Next.js framework
- MUST use SimpleWebAuthn library (`@simplewebauthn/server`, `@simplewebauthn/browser`)
- MUST use Viem library for wallet operations (`viem`)
- MUST use a SQL database (PostgreSQL recommended)
- MUST use Node.js crypto module for HKDF implementation

#### API Endpoints
The system MUST implement the following endpoints:

1. `POST /api/auth/register` - WebAuthn registration
2. `POST /api/auth/authenticate` - WebAuthn authentication
3. `POST /api/keyring/sign` - Message signing (requires JWT)

#### Security Requirements
- All communication MUST use HTTPS in production
- Master key MUST be stored securely in environment variables
- WebAuthn ceremonies MUST include proper challenge validation
- JWT tokens MUST include proper expiration and validation
- Private keys MUST never be logged or stored in plaintext

## Rationale

### WebAuthn for Authentication
WebAuthn provides strong, phishing-resistant authentication that eliminates password-based vulnerabilities. By requiring biometric authentication, we ensure that only the authorized user can access their keyring.

### Server-Side Key Derivation
Using HKDF with a master key allows for deterministic key generation without storing user keys. This approach provides:
- Consistent key derivation across sessions
- No key storage requirements
- Ability to add delegation features in the future

### EOA Private Key Management
Starting with EOA private keys provides a foundation for Ethereum wallet functionality while keeping the implementation simple. Viem library offers robust wallet utilities and signing capabilities.

### Short-Lived JWT Tokens
Short token lifespans limit the impact of token compromise while maintaining good user experience for typical session lengths.

## Backwards Compatibility

This is an initial implementation with no backwards compatibility requirements. Future versions MUST maintain compatibility with the keyring data format and encryption scheme defined in this specification.

## Test Cases

The implementation MUST include test cases covering:

1. **Registration Flow**
   - Successful user registration with biometric authentication
   - Username uniqueness validation
   - Private key generation and encryption

2. **Authentication Flow**
   - Successful WebAuthn authentication
   - JWT token generation and validation
   - Invalid credential handling

3. **Signing Operations**
   - Valid message signing with proper JWT
   - JWT validation and expiration handling
   - Key derivation and decryption accuracy

4. **Security Tests**
   - Proper key derivation with different salts
   - JWT expiration enforcement
   - WebAuthn challenge validation

## Reference Implementation

A reference implementation will be provided that demonstrates:
- Complete Next.js application structure
- Database setup and migrations
- WebAuthn integration with biometric requirements
- Secure key derivation and signing workflows
- Proper error handling and validation

## Security Considerations

### Key Management
- The master key stored in environment variables represents a single point of failure. In production, this SHOULD be migrated to a Hardware Security Module (HSM) or Key Management Service (KMS).
- Key derivation using HKDF provides cryptographic separation between users, but the master key compromise would affect all users.

### Authentication Security
- WebAuthn biometric authentication provides strong security, but device compromise could lead to unauthorized access.
- The system does not implement account recovery mechanisms, which may lead to permanent account loss if biometric data is unavailable.

### Signing Operations
- Server-side signing means the server has temporary access to private keys during operations. This is acceptable for the current scope but should be considered for future threat modeling.
- Message signing operations should implement rate limiting to prevent abuse.

### Session Management
- JWT tokens provide stateless session management but cannot be revoked before expiration. Consider implementing a token blacklist for enhanced security.

### Data Protection
- Encrypted private keys in the database are protected by the key derivation scheme, but database compromise combined with master key access would expose all keys.
- The system should implement proper database encryption at rest and in transit.

### Future Considerations
- The current architecture supports future delegation features by design.
- Consider implementing audit logging for all keyring operations.
- Rate limiting should be implemented on authentication and signing endpoints.

## Copyright
Copyright and related rights waived via [CC0](../LICENSE.md).