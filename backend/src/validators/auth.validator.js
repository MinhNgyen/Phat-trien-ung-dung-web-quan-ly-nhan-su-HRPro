const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().min(3, 'Ten dang nhap toi thieu 3 ky tu'),
  password: z.string().min(6, 'Mat khau toi thieu 6 ky tu'),
});

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z.string().optional(),
  role: z.enum(['ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
  employeeId: z.coerce.number().int().positive().optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

module.exports = { loginSchema, registerSchema, changePasswordSchema };
