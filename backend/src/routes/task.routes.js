const router = require('express').Router();
const c = require('../controllers/task.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, selfOrRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const v = require('../validators/task.validator');

router.use(authenticate);

/**
 * @openapi
 * /tasks/employee/{employeeId}:
 *   get:
 *     tags:
 *     - Tasks
 *     summary: Đầu việc của một nhân viên
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
 *     - in: query
 *       name: period
 *       required: false
 *       description: Kỳ, dạng YYYY-MM (theo tháng của hạn hoàn thành)
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
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/employee/:employeeId', selfOrRoles('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getByEmployee);
/**
 * @openapi
 * /tasks:
 *   get:
 *     tags:
 *     - Tasks
 *     summary: Danh sách đầu việc (có lọc)
 *     description: '**Quyền:** ADMIN, HR, ACCOUNTANT, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: query
 *       name: employeeId
 *       required: false
 *       description: Lọc theo nhân viên
 *       schema:
 *         type: integer
 *     - in: query
 *       name: period
 *       required: false
 *       description: Kỳ, dạng YYYY-MM (theo tháng của hạn hoàn thành)
 *       schema:
 *         type: string
 *     - in: query
 *       name: status
 *       required: false
 *       description: TODO | IN_PROGRESS | REVIEW | DONE | CANCELLED
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
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getAll);
/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     tags:
 *     - Tasks
 *     summary: Chi tiết một đầu việc
 *     description: 'Nhân viên chỉ xem được việc của chính mình (403 nếu xem việc người khác).
 *
 *
 *       **Quyền:** mọi tài khoản đã đăng nhập.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID đầu việc
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
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', c.getById); // nhân viên chỉ xem được việc của mình (kiểm tra trong controller)
/**
 * @openapi
 * /tasks:
 *   post:
 *     tags:
 *     - Tasks
 *     summary: Giao việc cho nhân viên
 *     description: 'Việc mới luôn ở trạng thái `TODO`. KPI của nhân viên trong kỳ (tháng của `dueDate`) được **tự tính lại**.
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
 *             $ref: '#/components/schemas/TaskInput'
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
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/', authorize('ADMIN', 'HR', 'MANAGER'), validate(v.createTaskSchema), c.create);
/**
 * @openapi
 * /tasks/{id}:
 *   put:
 *     tags:
 *     - Tasks
 *     summary: Sửa việc / duyệt hoàn thành
 *     description: 'Đặt `status=DONE` bắt buộc kèm `quality` (0-100), nếu thiếu trả 400; `completedAt` mặc định là hôm nay. Đổi sang trạng thái khác sẽ xóa `quality` và `completedAt`. KPI được tự tính lại (cả kỳ cũ lẫn kỳ mới nếu đổi hạn hoặc người nhận).
 *
 *
 *       **Quyền:** ADMIN, HR, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID đầu việc
 *       schema:
 *         type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskUpdate'
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
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authorize('ADMIN', 'HR', 'MANAGER'), validate(v.updateTaskSchema), c.update);
/**
 * @openapi
 * /tasks/{id}/status:
 *   patch:
 *     tags:
 *     - Tasks
 *     summary: Nhân viên tự báo tiến độ
 *     description: 'Chỉ được đặt `TODO`, `IN_PROGRESS`, `REVIEW` (chờ duyệt) — không được tự đặt `DONE`. Nhân viên chỉ đổi được việc của mình; việc đã `DONE`/`CANCELLED` không đổi được (400).
 *
 *
 *       **Quyền:** mọi tài khoản đã đăng nhập.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID đầu việc
 *       schema:
 *         type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskStatusRequest'
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
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/status', validate(v.taskStatusSchema), c.updateStatus); // nhân viên tự báo tiến độ việc của mình
/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     tags:
 *     - Tasks
 *     summary: Xóa đầu việc
 *     description: 'KPI của kỳ tương ứng được tự tính lại.
 *
 *
 *       **Quyền:** ADMIN, HR, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID đầu việc
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
 *                     nullable: true
 *                     example: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authorize('ADMIN', 'HR', 'MANAGER'), c.remove);

module.exports = router;
