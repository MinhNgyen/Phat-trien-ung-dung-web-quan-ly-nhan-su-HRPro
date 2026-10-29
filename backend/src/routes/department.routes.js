const router = require('express').Router();
const c = require('../controllers/department.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const v = require('../validators/employee.validator');

router.use(authenticate);

/**
 * @openapi
 * /departments:
 *   get:
 *     tags:
 *     - Departments
 *     summary: Danh sách phòng ban
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
 *                       $ref: '#/components/schemas/Department'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', c.getAll); // moi role deu xem duoc danh sach phong ban
/**
 * @openapi
 * /departments/{id}:
 *   get:
 *     tags:
 *     - Departments
 *     summary: Chi tiết phòng ban (kèm nhân viên)
 *     description: '**Quyền:** mọi tài khoản đã đăng nhập.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID phòng ban
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
 *                     $ref: '#/components/schemas/Department'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', c.getById);
/**
 * @openapi
 * /departments/{id}/employees:
 *   get:
 *     tags:
 *     - Departments
 *     summary: Nhân viên của phòng ban
 *     description: '**Quyền:** ADMIN, HR, ACCOUNTANT, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID phòng ban
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
 *                       $ref: '#/components/schemas/Employee'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:id/employees', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getEmployees);
/**
 * @openapi
 * /departments:
 *   post:
 *     tags:
 *     - Departments
 *     summary: Thêm phòng ban
 *     description: '**Quyền:** ADMIN, HR.'
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepartmentInput'
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
 *                     $ref: '#/components/schemas/Department'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', authorize('ADMIN', 'HR'), validate(v.departmentSchema), c.create);
/**
 * @openapi
 * /departments/{id}:
 *   put:
 *     tags:
 *     - Departments
 *     summary: Cập nhật phòng ban
 *     description: '**Quyền:** ADMIN, HR.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID phòng ban
 *       schema:
 *         type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepartmentInput'
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
 *                     $ref: '#/components/schemas/Department'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.put('/:id', authorize('ADMIN', 'HR'), validate(v.updateDepartmentSchema), c.update);
/**
 * @openapi
 * /departments/{id}:
 *   delete:
 *     tags:
 *     - Departments
 *     summary: Xóa phòng ban
 *     description: '409 nếu phòng ban còn nhân viên.
 *
 *
 *       **Quyền:** ADMIN, HR.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID phòng ban
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
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.delete('/:id', authorize('ADMIN', 'HR'), c.remove);

module.exports = router;
