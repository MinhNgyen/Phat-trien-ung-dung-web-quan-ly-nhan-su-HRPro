const router = require('express').Router();
const c = require('../controllers/settings.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { updatePayrollSettingSchema } = require('../validators/settings.validator');

router.use(authenticate);

// ADMIN, HR, ACCOUNTANT đều cần xem cấu hình lương để hiểu cách tính
/**
 * @openapi
 * /settings/payroll:
 *   get:
 *     tags:
 *     - Settings
 *     summary: Xem cấu hình lương
 *     description: 'Tự tạo bản ghi mặc định nếu chưa có.
 *
 *
 *       **Quyền:** ADMIN, HR, ACCOUNTANT.'
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
 *                     $ref: '#/components/schemas/PayrollSetting'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/payroll', authorize('ADMIN', 'HR', 'ACCOUNTANT'), c.getPayrollSettings);
// Chỉ ADMIN, ACCOUNTANT được sửa cấu hình lương
/**
 * @openapi
 * /settings/payroll:
 *   put:
 *     tags:
 *     - Settings
 *     summary: Sửa cấu hình lương
 *     description: 'Áp dụng từ lần tính lương tiếp theo; bảng lương đã tính trước đó giữ nguyên.
 *
 *
 *       **Quyền:** ADMIN, ACCOUNTANT.'
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayrollSettingInput'
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
 *                     $ref: '#/components/schemas/PayrollSetting'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/payroll', authorize('ADMIN', 'ACCOUNTANT'), validate(updatePayrollSettingSchema), c.updatePayrollSettings);

module.exports = router;
