import { MulterError } from 'multer';

export const notFoundError = (req, res) => {
  return res.status(404).json({ message: 'Endpoint is not found' });
};

export const serverError = (err, req, res, next) => {
  if (err) {
    if (err instanceof SyntaxError && /JSON/i.test(err.message)) {
      return res.status(400).json({ message: 'Invalid JSON format' });
    } else if (err instanceof MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Invalid file field' });
    } else if (err instanceof MulterError && err.code === 'LIMIT_FILE_TYPE') {
      return res.status(400).json({
        message: 'Invalid file format - only JPG, JPEG and PNG are allowed'
      });
    } else if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Invalid file size - max 5MB' });
    } else {
      console.error(err);

      return res.status(500).json({
        message: 'Something went wrong. Please try again later'
      });
    }
  }
  next();
};
