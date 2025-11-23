exports.up = pgm => {
  pgm.createTable('books', {
    id: 'id',
    title: { type: 'varchar(255)', notNull: true },
    author: { type: 'varchar(255)', notNull: true },
    isbn: { type: 'varchar(20)', unique: true },
    available: { type: 'boolean', default: true },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = pgm => {
  pgm.dropTable('books');
};
