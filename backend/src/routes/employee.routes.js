const router = require('express').Router();
const c = require('../controllers/employee.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, selfOrRoles } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const v = require('../validators/employee.validator');

router.use(authenticate);

/**
 * @openapi
 * /employees:
 *   get:
 *     tags:
 *     - Employees
 *     summary: Danh sách nhân viên (kèm phòng ban và ca)
 *     description: '**Quyền:** ADMIN, HR, ACCOUNTANT, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: query
 *       name: search
 *       required: false
 *       description: Tìm theo tên, mã, email, chức vụ
 *       schema:
 *         type: string
 *     - in: query
 *       name: departmentId
 *       required: false
 *       description: Lọc theo phòng ban
 *       schema:
 *         type: integer
 *     - in: query
 *       name: status
 *       required: false
 *       description: ACTIVE | INACTIVE | LEAVE
 *       schema:
 *         type: string
 *     - in: query
 *       name: page
 *       required: false
 *       description: Trang (cần kèm limit)
 *       schema:
 *         type: integer
 *     - in: query
 *       name: limit
 *       required: false
 *       description: Số bản ghi / trang
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
 *                     $ref: '#/components/schemas/EmployeeList'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', authorize('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getAll);
/**
 * @openapi
 * /employees/{id}:
 *   get:
 *     tags:
 *     - Employees
 *     summary: Chi tiết một nhân viên
 *     description: '**Quyền:** ADMIN, HR, ACCOUNTANT, MANAGER hoặc chính nhân viên đó.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID nhân viên
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
 *                     $ref: '#/components/schemas/Employee'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', selfOrRoles('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getById);
/**
 * @openapi
 * /employees:
 *   post:
 *     tags:
 *     - Employees
 *     summary: Thêm nhân viên
 *     description: '409 nếu trùng `employeeCode` hoặc `email`; 400 nếu `departmentId` không tồn tại.
 *
 *
 *       **Quyền:** ADMIN, HR.'
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
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
 *                     $ref: '#/components/schemas/Employee'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', authorize('ADMIN', 'HR'), validate(v.createEmployeeSchema), c.create);
/**
 * @openapi
 * /employees/{id}:
 *   put:
 *     tags:
 *     - Employees
 *     summary: Cập nhật nhân viên
 *     description: 'Mọi field đều tùy chọn.
 *
 *
 *       **Quyền:** ADMIN, HR.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID nhân viên
 *       schema:
 *         type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
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
 *                     $ref: '#/components/schemas/Employee'
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
router.put('/:id', authorize('ADMIN', 'HR'), validate(v.updateEmployeeSchema), c.update);
/**
 * @openapi
 * /employees/{id}:
 *   delete:
 *     tags:
 *     - Employees
 *     summary: Xóa nhân viên
 *     description: 'Xóa kèm phân ca, chấm công, lương, KPI của nhân viên (cascade).
 *
 *
 *       **Quyền:** ADMIN, HR.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID nhân viên
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
router.delete('/:id', authorize('ADMIN', 'HR'), c.remove);

// Phan ca cho nhan vien
/**
 * @openapi
 * /employees/{id}/shifts:
 *   get:
 *     tags:
 *     - Employees
 *     summary: Ca được phân công của nhân viên
 *     description: '**Quyền:** ADMIN, HR, ACCOUNTANT, MANAGER hoặc chính nhân viên đó.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID nhân viên
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
 *                       $ref: '#/components/schemas/EmployeeShift'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:id/shifts', selfOrRoles('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER'), c.getShifts);
/**
 * @openapi
 * /employees/{id}/shifts:
 *   post:
 *     tags:
 *     - Employees
 *     summary: Phân ca cho nhân viên
 *     description: '409 nếu nhân viên đã có ca này. `isPrimary=true` sẽ bỏ cờ ca chính của các ca khác.
 *
 *
 *       **Quyền:** ADMIN, HR.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID nhân viên
 *       schema:
 *         type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignShiftRequest'
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
 *                     $ref: '#/components/schemas/EmployeeShift'
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
router.post('/:id/shifts', authorize('ADMIN', 'HR'), validate(v.assignShiftSchema), c.assignShift);
/**
 * @openapi
 * /employees/{id}/shifts/{shiftId}:
 *   delete:
 *     tags:
 *     - Employees
 *     summary: Hủy phân ca
 *     description: '**Quyền:** ADMIN, HR.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID nhân viên
 *       schema:
 *         type: integer
 *     - in: path
 *       name: shiftId
 *       required: true
 *       description: ID ca
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
router.delete('/:id/shifts/:shiftId', authorize('ADMIN', 'HR'), c.removeShift);

module.exports = router;
