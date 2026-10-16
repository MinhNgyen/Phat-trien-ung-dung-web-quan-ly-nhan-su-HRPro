const router = require('express').Router();
const c = require('../controllers/shift.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const v = require('../validators/employee.validator');

router.use(authenticate);

router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', authorize('ADMIN', 'HR'), validate(v.shiftSchema), c.create);
router.put('/:id', authorize('ADMIN', 'HR'), validate(v.updateShiftSchema), c.update);
router.delete('/:id', authorize('ADMIN', 'HR'), c.remove);

module.exports = router;
