/**
 * Migration: Add password reset token fields to users table
 */

exports.up = (pgm) => {
  pgm.addColumns('users', {
    reset_token: {
      type: 'VARCHAR(255)',
      notNull: false,
    },
    reset_token_expires: {
      type: 'timestamp',
      notNull: false,
    },
  });

  // Add index for faster token lookup
  pgm.createIndex('users', 'reset_token');
};

exports.down = (pgm) => {
  pgm.dropIndex('users', 'reset_token');
  pgm.dropColumns('users', ['reset_token', 'reset_token_expires']);
};
