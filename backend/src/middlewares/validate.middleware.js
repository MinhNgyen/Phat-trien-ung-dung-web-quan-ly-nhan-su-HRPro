const { error } = require('../utils/response');

// validate(schema, 'body' | 'query' | 'params') - dung voi Zod
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return error(res, 'Du lieu khong hop le', 400, errors);
    }
    req[source] = result.data; // du lieu da duoc ep kieu + lam sach
    next();
  };
}

module.exports = { validate };
