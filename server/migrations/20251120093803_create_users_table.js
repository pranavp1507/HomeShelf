exports.up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    username: {
      type: 'VARCHAR(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    role: {
      type: 'VARCHAR(50)',
      notNull: true,
      default: 'member', // Default role for new users
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};