const router = require('express').Router();
const c = require('../controllers/attendance.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, selfOrRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const v = require('../validators/attendance.validator');

router.use(authenticate);

// Dat route tinh dat truoc route dong de tranh xung dot
router.get('/employee/:employeeId', selfOrRoles('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getByEmployee);
router.get('/date/:date', authorize('ADMIN', 'HR', 'MANAGER'), c.getByDate);
router.get('/', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getAll);
router.get('/:id', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getById);

router.post('/check-in', authorize('ADMIN', 'HR', 'EMPLOYEE'), c.checkIn);
router.post('/check-out', authorize('ADMIN', 'HR', 'EMPLOYEE'), c.checkOut);
router.post('/', authorize('ADMIN', 'HR', 'MANAGER'), validate(v.createAttendanceSchema), c.create);
router.put('/:id', authorize('ADMIN', 'HR', 'MANAGER'), validate(v.updateAttendanceSchema), c.update);
router.delete('/:id', authorize('ADMIN', 'HR', 'MANAGER'), c.remove);

module.exports = router;
