const router = require('express').Router();
const c = require('../controllers/payroll.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, selfOrRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const v = require('../validators/attendance.validator');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'ACCOUNTANT', 'HR'), c.getAll);
router.get('/locks', c.getLocks); // moi role dang nhap deu xem duoc trang thai chot luong
router.get('/employee/:employeeId', selfOrRoles('ADMIN', 'ACCOUNTANT', 'HR'), c.getByEmployee);
router.post('/calculate', authorize('ADMIN', 'ACCOUNTANT'), validate(v.calculatePayrollSchema), c.calculate);
router.post('/lock', authorize('ADMIN', 'ACCOUNTANT'), validate(v.lockSchema), c.lock);
router.post('/unlock', authorize('ADMIN'), validate(v.lockSchema), c.unlock); // chi ADMIN mo khoa
router.put('/:id', authorize('ADMIN', 'ACCOUNTANT'), c.update);
router.delete('/:id', authorize('ADMIN'), c.remove);
// Dat cuoi cung: /api/payroll/2026-09
router.get('/:month', authorize('ADMIN', 'ACCOUNTANT', 'HR'), c.getByMonth);

module.exports = router;
