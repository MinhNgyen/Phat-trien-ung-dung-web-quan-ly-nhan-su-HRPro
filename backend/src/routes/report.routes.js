const router = require('express').Router();
const c = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.use(authenticate);

router.get('/dashboard', c.dashboard);
router.get('/employees', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.employees);
router.get('/attendance', authorize('ADMIN', 'HR', 'MANAGER'), c.attendance);
router.get('/payroll', authorize('ADMIN', 'ACCOUNTANT'), c.payroll);
router.get('/kpi', authorize('ADMIN', 'HR', 'MANAGER'), c.kpi);

module.exports = router;
