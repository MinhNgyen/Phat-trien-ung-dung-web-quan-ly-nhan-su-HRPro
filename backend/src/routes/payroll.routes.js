const router = require('express').Router();
const c = require('../controllers/payroll.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, selfOrRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const v = require('../validators/attendance.validator');

router.use(authenticate);

/**
 * @openapi
 * /payroll:
 *   get:
 *     tags:
 *     - Payroll
 *     summary: Danh sách bảng lương
 *     description: '**Quyền:** ADMIN, ACCOUNTANT, HR.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: query
 *       name: month
 *       required: false
 *       description: Tháng, dạng YYYY-MM
 *       schema:
 *         type: string
 *     - in: query
 *       name: employeeId
 *       required: false
 *       description: Lọc theo nhân viên
 *       schema:
 *         type: integer
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
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Payroll'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', authorize('ADMIN', 'ACCOUNTANT', 'HR'), c.getAll);
/**
 * @openapi
 * /payroll/locks:
 *   get:
 *     tags:
 *     - Payroll
 *     summary: Các tháng đã chốt lương
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
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/SalaryLock'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/locks', c.getLocks); // moi role dang nhap deu xem duoc trang thai chot luong
/**
 * @openapi
 * /payroll/employee/{employeeId}:
 *   get:
 *     tags:
 *     - Payroll
 *     summary: Bảng lương của một nhân viên
 *     description: '**Quyền:** ADMIN, ACCOUNTANT, HR hoặc chính nhân viên đó.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: employeeId
 *       required: true
 *       description: ID nhân viên (số, không phải mã NV)
 *       schema:
 *         type: integer
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
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Payroll'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/employee/:employeeId', selfOrRoles('ADMIN', 'ACCOUNTANT', 'HR'), c.getByEmployee);
/**
 * @openapi
 * /payroll/calculate:
 *   post:
 *     tags:
 *     - Payroll
 *     summary: Tính lương
 *     description: 'Tính từ chấm công thật + cấu hình ở `/settings/payroll`. Tính lại cùng tháng sẽ cập nhật (không tạo trùng). 403 nếu tháng đã chốt.
 *
 *
 *       `gross = lương theo công + OT + phụ cấp − khấu trừ (bảo hiểm + phạt đi muộn)`; `net = gross − thuế TNCN`.
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
 *             $ref: '#/components/schemas/PayrollCalculateRequest'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *               - $ref: '#/components/schemas/SuccessResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Payroll'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/calculate', authorize('ADMIN', 'ACCOUNTANT'), validate(v.calculatePayrollSchema), c.calculate);
/**
 * @openapi
 * /payroll/lock:
 *   post:
 *     tags:
 *     - Payroll
 *     summary: Chốt bảng lương tháng
 *     description: 'Sau khi chốt: không sửa, không xóa, không tính lại.
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
 *             $ref: '#/components/schemas/MonthRequest'
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
 *                     $ref: '#/components/schemas/SalaryLock'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/lock', authorize('ADMIN', 'ACCOUNTANT'), validate(v.lockSchema), c.lock);
/**
 * @openapi
 * /payroll/unlock:
 *   post:
 *     tags:
 *     - Payroll
 *     summary: Mở khóa bảng lương tháng
 *     description: 'Chỉ ADMIN.
 *
 *
 *       **Quyền:** ADMIN.'
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MonthRequest'
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
 *                     $ref: '#/components/schemas/SalaryLock'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/unlock', authorize('ADMIN'), validate(v.lockSchema), c.unlock); // chi ADMIN mo khoa
/**
 * @openapi
 * /payroll/{idOrMonth}:
 *   put:
 *     tags:
 *     - Payroll
 *     summary: Sửa một bảng lương (tính lại gross/thuế/net)
 *     description: '403 nếu tháng đã chốt.
 *
 *
 *       **Quyền:** ADMIN, ACCOUNTANT.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: idOrMonth
 *       required: true
 *       description: ID bảng lương (số)
 *       schema:
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayrollUpdateRequest'
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
 *                     $ref: '#/components/schemas/Payroll'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authorize('ADMIN', 'ACCOUNTANT'), c.update);
/**
 * @openapi
 * /payroll/{idOrMonth}:
 *   delete:
 *     tags:
 *     - Payroll
 *     summary: Xóa một bảng lương
 *     description: '403 nếu tháng đã chốt.
 *
 *
 *       **Quyền:** ADMIN.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: idOrMonth
 *       required: true
 *       description: ID bảng lương (số)
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
 *                     nullable: true
 *                     example: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authorize('ADMIN'), c.remove);
// Dat cuoi cung: /api/payroll/2026-09
/**
 * @openapi
 * /payroll/{idOrMonth}:
 *   get:
 *     tags:
 *     - Payroll
 *     summary: Bảng lương cả tháng
 *     description: '**Quyền:** ADMIN, ACCOUNTANT, HR.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: idOrMonth
 *       required: true
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
 *                     $ref: '#/components/schemas/PayrollMonth'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:month', authorize('ADMIN', 'ACCOUNTANT', 'HR'), c.getByMonth);

module.exports = router;
