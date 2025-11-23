exports.up = pgm => {
  pgm.createTable('loans', {
    id: 'id',
    book_id: {
      type: 'integer',
      notNull: true,
      references: '"books"(id)',
      onDelete: 'CASCADE',
    },
    member_id: {
      type: 'integer',
      notNull: true,
      references: '"members"(id)',
      onDelete: 'CASCADE',
    },
    borrow_date: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    due_date: {
      type: 'timestamp with time zone',
    },
    return_date: {
      type: 'timestamp with time zone',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = pgm => {
  pgm.dropTable('loans');
};
