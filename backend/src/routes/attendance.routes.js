const router = require("express").Router();
const c = require("../controllers/attendance.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize, selfOrRoles } = require("../middlewares/role.middleware");
const { validate } = require("../middlewares/validate.middleware");
const v = require("../validators/attendance.validator");

router.use(authenticate);

// Dat route tinh dat truoc route dong de tranh xung dot
/**
 * @openapi
 * /attendance/employee/{employeeId}:
 *   get:
 *     tags:
 *     - Attendance
 *     summary: Chấm công của một nhân viên
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
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Attendance'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  "/employee/:employeeId",
  selfOrRoles("ADMIN", "HR", "ACCOUNTANT", "MANAGER"),
  c.getByEmployee,
);
/**
 * @openapi
 * /attendance/date/{date}:
 *   get:
 *     tags:
 *     - Attendance
 *     summary: Chấm công của mọi nhân viên trong một ngày
 *     description: '**Quyền:** ADMIN, HR, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: date
 *       required: true
 *       description: Ngày, dạng YYYY-MM-DD
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
 *                       $ref: '#/components/schemas/Attendance'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/date/:date", authorize("ADMIN", "HR", "MANAGER"), c.getByDate);
/**
 * @openapi
 * /attendance:
 *   get:
 *     tags:
 *     - Attendance
 *     summary: Danh sách chấm công (có lọc)
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
 *       name: date
 *       required: false
 *       description: YYYY-MM-DD
 *       schema:
 *         type: string
 *     - in: query
 *       name: month
 *       required: false
 *       description: YYYY-MM
 *       schema:
 *         type: string
 *     - in: query
 *       name: status
 *       required: false
 *       description: PRESENT | LATE | ABSENT | LEAVE
 *       schema:
 *         type: string
 *     - in: query
 *       name: from
 *       required: false
 *       description: Từ ngày
 *       schema:
 *         type: string
 *     - in: query
 *       name: to
 *       required: false
 *       description: Đến ngày
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
 *                       $ref: '#/components/schemas/Attendance'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/", authorize("ADMIN", "HR", "ACCOUNTANT", "MANAGER"), c.getAll);
/**
 * @openapi
 * /attendance/{id}:
 *   get:
 *     tags:
 *     - Attendance
 *     summary: Chi tiết một bản ghi chấm công
 *     description: '**Quyền:** ADMIN, HR, ACCOUNTANT, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID bản ghi
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
 *                     $ref: '#/components/schemas/Attendance'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  authorize("ADMIN", "HR", "ACCOUNTANT", "MANAGER"),
  c.getById,
);

/**
 * @openapi
 * /attendance/check-in:
 *   post:
 *     tags:
 *     - Attendance
 *     summary: Chấm công vào (giờ hiện tại)
 *     description: 'Role EMPLOYEE luôn chấm cho chính mình (employeeId trong body bị bỏ qua).
 *
 *
 *       **Quyền:** ADMIN, HR, EMPLOYEE.'
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckRequest'
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
 *                     $ref: '#/components/schemas/Attendance'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post(
  "/check-in",
  authorize("ADMIN", "HR", "MANAGER", "ACCOUNTANT", "EMPLOYEE"),
  c.checkIn,
);
/**
 * @openapi
 * /attendance/check-out:
 *   post:
 *     tags:
 *     - Attendance
 *     summary: Chấm công ra (giờ hiện tại)
 *     description: 'Cập nhật bản ghi vào của hôm nay; tính lại giờ làm và trạng thái (về sớm → LATE).
 *
 *
 *       **Quyền:** ADMIN, HR, EMPLOYEE.'
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckRequest'
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
 *                     $ref: '#/components/schemas/Attendance'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/check-out",
  authorize("ADMIN", "HR", "MANAGER", "ACCOUNTANT", "EMPLOYEE"),
  c.checkOut,
);
/**
 * @openapi
 * /attendance:
 *   post:
 *     tags:
 *     - Attendance
 *     summary: Tạo bản ghi chấm công
 *     description: 'Backend tự tính `workHours`, `lateMinutes` và `status` (bỏ trống `status`). Vào muộn hơn giờ ca + thời gian cho phép, hoặc về sớm → `LATE`; không có giờ vào → `ABSENT`. 409 nếu trùng nhân viên + ca + ngày.
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
 *             $ref: '#/components/schemas/AttendanceInput'
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
 *                     $ref: '#/components/schemas/Attendance'
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
router.post(
  "/",
  authorize("ADMIN", "HR", "MANAGER"),
  validate(v.createAttendanceSchema),
  c.create,
);
/**
 * @openapi
 * /attendance/{id}:
 *   put:
 *     tags:
 *     - Attendance
 *     summary: Cập nhật chấm công (vd. thêm giờ ra)
 *     description: '**Quyền:** ADMIN, HR, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID bản ghi
 *       schema:
 *         type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttendanceInput'
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
 *                     $ref: '#/components/schemas/Attendance'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  "/:id",
  authorize("ADMIN", "HR", "MANAGER"),
  validate(v.updateAttendanceSchema),
  c.update,
);
/**
 * @openapi
 * /attendance/{id}:
 *   delete:
 *     tags:
 *     - Attendance
 *     summary: Xóa bản ghi chấm công
 *     description: '**Quyền:** ADMIN, HR, MANAGER.'
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID bản ghi
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
router.delete("/:id", authorize("ADMIN", "HR", "MANAGER"), c.remove);

module.exports = router;
