const router = require('express').Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *     - System
 *     summary: Kiểm tra server đang chạy
 *     description: '**Quyền:** công khai (không cần đăng nhập).'
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *               - $ref: '#/components/schemas/SuccessResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     nullable: true
 *                     example: null
 */
router.get('/health', (req, res) =>
  res.json({ success: true, message: 'HRPro Backend is running' })
);

router.use('/auth', require('./auth.routes'));
router.use('/employees', require('./employee.routes'));
router.use('/departments', require('./department.routes'));
router.use('/shifts', require('./shift.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/payroll', require('./payroll.routes'));
router.use('/tasks', require('./task.routes'));
router.use('/kpi', require('./kpi.routes'));
router.use('/reports', require('./report.routes'));
router.use('/settings', require('./settings.routes'));

module.exports = router;
