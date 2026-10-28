export const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (error) {
    if (error.errors) {
      const formatted = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return res.status(400).json({
        success: false,
        message: formatted[0]?.message || 'Validation error',
        errors: formatted
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Invalid request body'
    });
  }
};
