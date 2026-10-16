const router = require('express').Router();
const c = require('../controllers/employee.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, selfOrRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const v = require('../validators/employee.validator');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getAll);
router.get('/:id', selfOrRoles('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getById);
router.post('/', authorize('ADMIN', 'HR'), validate(v.createEmployeeSchema), c.create);
router.put('/:id', authorize('ADMIN', 'HR'), validate(v.updateEmployeeSchema), c.update);
router.delete('/:id', authorize('ADMIN', 'HR'), c.remove);

// Phan ca cho nhan vien
router.get('/:id/shifts', selfOrRoles('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getShifts);
router.post('/:id/shifts', authorize('ADMIN', 'HR'), validate(v.assignShiftSchema), c.assignShift);
router.delete('/:id/shifts/:shiftId', authorize('ADMIN', 'HR'), c.removeShift);

module.exports = router;
