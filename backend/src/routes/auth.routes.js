const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const v = require('../validators/auth.validator');

router.post('/login', validate(v.loginSchema), c.login);
router.get('/me', authenticate, c.me);
router.put('/change-password', authenticate, validate(v.changePasswordSchema), c.changePassword);
router.post('/register', authenticate, authorize('ADMIN'), validate(v.registerSchema), c.register);
router.get('/users', authenticate, authorize('ADMIN'), c.listUsers);

module.exports = router;
