/**
 * Test fixtures for members
 */

export const testMembers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    created_at: new Date('2024-01-01'),
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '0987654321',
    created_at: new Date('2024-01-02'),
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    phone: '5555555555',
    created_at: new Date('2024-01-03'),
  },
  {
    id: 4,
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    phone: '4444444444',
    created_at: new Date('2024-01-04'),
  },
  {
    id: 5,
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    phone: '3333333333',
    created_at: new Date('2024-01-05'),
  },
];

export const createMemberPayload = {
  valid: {
    name: 'New Member',
    email: 'new.member@example.com',
    phone: '1111111111',
  },
  validMinimal: {
    name: 'Minimal Member',
    email: 'minimal@example.com',
    phone: '2222222222',
  },
  missingName: {
    email: 'missing.name@example.com',
    phone: '1234567890',
  },
  missingEmail: {
    name: 'No Email',
    phone: '1234567890',
  },
  missingPhone: {
    name: 'No Phone',
    email: 'no.phone@example.com',
  },
  invalidEmail: {
    name: 'Invalid Email',
    email: 'not-an-email',
    phone: '1234567890',
  },
  invalidPhone: {
    name: 'Invalid Phone',
    email: 'valid@example.com',
    phone: 'abc',
  },
  duplicateEmail: {
    name: 'Duplicate Email',
    email: 'john.doe@example.com', // Same as testMembers[0]
    phone: '9999999999',
  },
};

export const updateMemberPayload = {
  valid: {
    name: 'Updated Name',
    email: 'updated@example.com',
    phone: '8888888888',
  },
  partialUpdate: {
    name: 'Only Name Updated',
  },
  updateEmail: {
    email: 'newemail@example.com',
  },
  updatePhone: {
    phone: '7777777777',
  },
};

export const bulkImportCsvData = {
  valid: `name,email,phone
"Alice Johnson","alice.johnson@example.com","1112223333"
"Bob Smith","bob.smith@example.com","4445556666"
"Carol Davis","carol.davis@example.com","7778889999"`,

  withDuplicates: `name,email,phone
"Alice Johnson","alice.johnson@example.com","1112223333"
"John Doe","john.doe@example.com","1234567890"`,

  invalidFormat: `name,email
"Missing Phone","missing@example.com"`,

  empty: '',

  missingHeaders: `Member Name,Member Email,Member Phone
"Member","member@example.com","1234567890"`,

  invalidEmails: `name,email,phone
"Bad Email 1","not-an-email","1234567890"
"Bad Email 2","@example.com","0987654321"`,
};

export const memberSearchQueries = {
  byName: 'John',
  byEmail: 'jane.smith',
  byPhone: '5555',
  noResults: 'NonExistentMember',
};
