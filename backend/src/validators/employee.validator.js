const { z } = require('zod');

const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Ma nhan vien la bat buoc').max(20),
  name: z.string().min(1, 'Ho ten la bat buoc').max(120),
  email: z.string().email('Email khong hop le'),
  phone: z.string().max(20).optional().nullable(),
  position: z.string().max(120).optional().nullable(),
  salary: z.coerce.number().min(0, 'Luong phai >= 0').default(0),
  joinedAt: z.coerce.date({ invalid_type_error: 'Ngay vao lam khong hop le' }),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LEAVE']).default('ACTIVE'),
  departmentId: z.coerce.number().int().positive('Phong ban khong hop le').optional().nullable(),
});

// PUT: tat ca field deu optional
const updateEmployeeSchema = createEmployeeSchema.partial();

const assignShiftSchema = z.object({
  shiftId: z.coerce.number().int().positive('Ca lam khong hop le'),
  isPrimary: z.coerce.boolean().default(false),
});

const departmentSchema = z.object({
  code: z.string().min(1, 'Ma phong ban la bat buoc').max(20),
  name: z.string().min(1, 'Ten phong ban la bat buoc').max(120),
  description: z.string().optional().nullable(),
  head: z.string().max(120).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
});
const updateDepartmentSchema = departmentSchema.partial();

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const shiftSchema = z.object({
  code: z.string().min(1, 'Ma ca la bat buoc').max(20),
  name: z.string().min(1, 'Ten ca la bat buoc').max(120),
  startTime: z.string().regex(timeRegex, 'Gio bat dau phai dang HH:mm'),
  endTime: z.string().regex(timeRegex, 'Gio ket thuc phai dang HH:mm'),
  description: z.string().optional().nullable(),
  graceMinutes: z.coerce.number().int().min(0).max(180).default(10),
  overtimeRate: z.coerce.number().min(1).max(5).default(1.5),
});
const updateShiftSchema = shiftSchema.partial();

module.exports = {
  createEmployeeSchema, updateEmployeeSchema, assignShiftSchema,
  departmentSchema, updateDepartmentSchema, shiftSchema, updateShiftSchema,
};
