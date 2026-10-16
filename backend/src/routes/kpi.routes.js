const router = require('express').Router();
const c = require('../controllers/kpi.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, selfOrRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const v = require('../validators/attendance.validator');

router.use(authenticate);

router.get('/employee/:employeeId', selfOrRoles('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getByEmployee);
router.get('/', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getAll);
router.get('/:id', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getById);
router.post('/', authorize('ADMIN', 'HR', 'MANAGER'), validate(v.kpiSchema), c.create);
router.put('/:id', authorize('ADMIN', 'HR', 'MANAGER'), validate(v.updateKpiSchema), c.update);
router.delete('/:id', authorize('ADMIN', 'HR'), c.remove);

module.exports = router;
