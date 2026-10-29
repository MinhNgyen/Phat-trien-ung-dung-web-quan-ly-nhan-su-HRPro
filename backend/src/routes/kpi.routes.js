const router = require('express').Router();
const c = require('../controllers/kpi.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, selfOrRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { recalcSchema } = require('../validators/task.validator');

router.use(authenticate);

// KPI chỉ đọc: được tính tự động từ đầu việc (POST/api/tasks ...). Muốn dựng lại thì dùng /recalculate.
/**
 * @openapi
 * /kpi/employee/{employeeId}:
 *   get:
 *     tags:
 *     - KPI
 *     summary: KPI của một nhân viên (mọi kỳ)
 *     description: '**Quyền:** ADMIN, HR, ACCOUNTANT, MANAGER hoặc chính nhân viên đó.'
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
 *                       $ref: '#/components/schemas/Kpi'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/employee/:employeeId', selfOrRoles('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getByEmployee);
/**
 * @openapi
 * /kpi:
 *   get:
 *     tags:
 *     - KPI
 *     summary: Danh sách KPI
 *     description: 'KPI **chỉ đọc**: được tính tự động từ đầu việc. `total = 40% hoàn thành + 30% đúng hạn + 30% chất lượng` (theo trọng số việc).
 *
 *
 *       **Quyền:** ADMIN, HR, ACCOUNTANT, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: query
 *       name: period
 *       required: false
 *       description: Kỳ, dạng YYYY-MM (theo tháng của hạn hoàn thành)
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
 *                       $ref: '#/components/schemas/Kpi'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getAll);
/**
 * @openapi
 * /kpi/recalculate:
 *   post:
 *     tags:
 *     - KPI
 *     summary: Tính lại KPI từ đầu việc
 *     description: 'Thường không cần gọi vì KPI tự cập nhật mỗi khi việc thay đổi; dùng để dựng lại cả kỳ (vd. sau khi nhập dữ liệu hàng loạt).
 *
 *
 *       **Quyền:** ADMIN, HR, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KpiRecalcRequest'
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
 *                       $ref: '#/components/schemas/Kpi'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/recalculate', authorize('ADMIN', 'HR', 'MANAGER'), validate(recalcSchema), c.recalculate);
/**
 * @openapi
 * /kpi/{id}:
 *   get:
 *     tags:
 *     - KPI
 *     summary: Chi tiết một KPI
 *     description: '**Quyền:** ADMIN, HR, ACCOUNTANT, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID KPI
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
 *                     $ref: '#/components/schemas/Kpi'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getById);

module.exports = router;
