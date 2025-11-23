exports.up = (pgm) => {
  pgm.addColumn('books', {
    cover_image_path: {
      type: 'VARCHAR(255)',
      notNull: false, // Allow null initially, as not all books will have covers
      defaultValue: null,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('books', 'cover_image_path');
};