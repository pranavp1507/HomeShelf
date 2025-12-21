exports.up = (pgm) => {
  pgm.addColumn('books', {
    description: {
      type: 'TEXT',
      notNull: false, // Allow null initially, as not all books will have descriptions
      defaultValue: null,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('books', 'description');
};
