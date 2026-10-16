const router = require('express').Router();

router.get('/health', (req, res) =>
  res.json({ success: true, message: 'HRPro Backend is running' })
);

router.use('/auth', require('./auth.routes'));
router.use('/employees', require('./employee.routes'));
router.use('/departments', require('./department.routes'));
router.use('/shifts', require('./shift.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/payroll', require('./payroll.routes'));
router.use('/kpi', require('./kpi.routes'));
router.use('/reports', require('./report.routes'));
router.use('/settings', require('./settings.routes'));

module.exports = router;
