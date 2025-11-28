/**
 * Test fixtures for users
 */

export const testUsers = {
  admin: {
    id: 1,
    username: 'testadmin',
    password: 'Admin123!',
    // Pre-hashed password for "Admin123!" using bcrypt
    password_hash: '$2a$10$YourHashedPasswordHere', // This will be replaced with actual hash in tests
    role: 'admin' as const,
  },
  member: {
    id: 2,
    username: 'testmember',
    password: 'Member123!',
    // Pre-hashed password for "Member123!" using bcrypt
    password_hash: '$2a$10$YourHashedPasswordHere', // This will be replaced with actual hash in tests
    role: 'member' as const,
  },
  anotherMember: {
    id: 3,
    username: 'anothermember',
    password: 'Member456!',
    password_hash: '$2a$10$YourHashedPasswordHere', // This will be replaced with actual hash in tests
    role: 'member' as const,
  },
};

export const createUserPayload = {
  valid: {
    username: 'newuser',
    password: 'NewUser123!',
    role: 'member' as const,
  },
  validAdmin: {
    username: 'newadmin',
    password: 'NewAdmin123!',
    role: 'admin' as const,
  },
  missingUsername: {
    password: 'Password123!',
    role: 'member' as const,
  },
  missingPassword: {
    username: 'nopassword',
    role: 'member' as const,
  },
  invalidRole: {
    username: 'invalidrole',
    password: 'Password123!',
    role: 'superadmin' as any,
  },
  weakPassword: {
    username: 'weakpass',
    password: '123',
    role: 'member' as const,
  },
};

export const loginPayload = {
  validAdmin: {
    username: 'testadmin',
    password: 'Admin123!',
  },
  validMember: {
    username: 'testmember',
    password: 'Member123!',
  },
  invalidPassword: {
    username: 'testadmin',
    password: 'WrongPassword',
  },
  nonExistentUser: {
    username: 'nonexistent',
    password: 'Password123!',
  },
  missingUsername: {
    password: 'Password123!',
  },
  missingPassword: {
    username: 'testadmin',
  },
};
