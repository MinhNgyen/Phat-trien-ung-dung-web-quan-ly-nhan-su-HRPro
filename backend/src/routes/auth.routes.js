const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const v = require('../validators/auth.validator');

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *     - Auth
 *     summary: Đăng nhập
 *     description: 'Trả về JWT. Gửi kèm mọi request sau đó: `Authorization: Bearer <token>`.
 *
 *
 *       **Quyền:** công khai (không cần đăng nhập).'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
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
 *                     $ref: '#/components/schemas/LoginResult'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/login', validate(v.loginSchema), c.login);
/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags:
 *     - Auth
 *     summary: Thông tin tài khoản đang đăng nhập
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authenticate, c.me);
/**
 * @openapi
 * /auth/change-password:
 *   put:
 *     tags:
 *     - Auth
 *     summary: Đổi mật khẩu
 *     description: 'Sai mật khẩu cũ trả 400.
 *
 *
 *       **Quyền:** mọi tài khoản đã đăng nhập.'
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/change-password', authenticate, validate(v.changePasswordSchema), c.changePassword);
/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *     - Auth
 *     summary: Tạo tài khoản mới
 *     description: '**Quyền:** ADMIN.'
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
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
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/register', authenticate, authorize('ADMIN'), validate(v.registerSchema), c.register);
/**
 * @openapi
 * /auth/users:
 *   get:
 *     tags:
 *     - Auth
 *     summary: Danh sách tài khoản
 *     description: '**Quyền:** ADMIN.'
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
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/users', authenticate, authorize('ADMIN'), c.listUsers);

module.exports = router;
