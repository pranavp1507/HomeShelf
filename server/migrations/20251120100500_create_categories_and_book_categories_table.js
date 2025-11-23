exports.up = (pgm) => {
  pgm.createTable('categories', {
    id: 'id',
    name: {
      type: 'VARCHAR(255)',
      notNull: true,
      unique: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createTable('book_categories', {
    id: 'id',
    book_id: {
      type: 'INTEGER',
      notNull: true,
      references: '"books"',
      onDelete: 'CASCADE',
    },
    category_id: {
      type: 'INTEGER',
      notNull: true,
      references: '"categories"',
      onDelete: 'CASCADE',
    },
  });

  // Add unique constraint to prevent duplicate book-category associations
  pgm.createConstraint('book_categories', 'book_categories_book_id_category_id_unique', {
    unique: ['book_id', 'category_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('book_categories');
  pgm.dropTable('categories');
};