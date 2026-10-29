const router = require('express').Router();
const c = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.use(authenticate);

/**
 * @openapi
 * /reports/dashboard:
 *   get:
 *     tags:
 *     - Reports
 *     summary: Số liệu dashboard
 *     description: '**Quyền:** mọi tài khoản đã đăng nhập.'
 *     security:
 *     - bearerAuth: []
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
 *                     $ref: '#/components/schemas/Dashboard'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/dashboard', c.dashboard);
/**
 * @openapi
 * /reports/employees:
 *   get:
 *     tags:
 *     - Reports
 *     summary: Báo cáo nhân sự
 *     description: '**Quyền:** ADMIN, HR, ACCOUNTANT, MANAGER.'
 *     security:
 *     - bearerAuth: []
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
 *                     $ref: '#/components/schemas/EmployeeReport'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/employees', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.employees);
/**
 * @openapi
 * /reports/attendance:
 *   get:
 *     tags:
 *     - Reports
 *     summary: Báo cáo chấm công theo tháng
 *     description: '**Quyền:** ADMIN, HR, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: query
 *       name: month
 *       required: false
 *       description: Tháng, dạng YYYY-MM
 *       schema:
 *         type: string
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
 *                     $ref: '#/components/schemas/AttendanceReport'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/attendance', authorize('ADMIN', 'HR', 'MANAGER'), c.attendance);
/**
 * @openapi
 * /reports/payroll:
 *   get:
 *     tags:
 *     - Reports
 *     summary: Báo cáo lương theo tháng
 *     description: '**Quyền:** ADMIN, ACCOUNTANT.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: query
 *       name: month
 *       required: false
 *       description: Tháng, dạng YYYY-MM
 *       schema:
 *         type: string
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
 *                     $ref: '#/components/schemas/PayrollReport'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/payroll', authorize('ADMIN', 'ACCOUNTANT'), c.payroll);
/**
 * @openapi
 * /reports/kpi:
 *   get:
 *     tags:
 *     - Reports
 *     summary: Báo cáo KPI theo kỳ
 *     description: '**Quyền:** ADMIN, HR, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: query
 *       name: period
 *       required: false
 *       description: Kỳ, dạng YYYY-MM
 *       schema:
 *         type: string
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
 *                     $ref: '#/components/schemas/KpiReport'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/kpi', authorize('ADMIN', 'HR', 'MANAGER'), c.kpi);

module.exports = router;
