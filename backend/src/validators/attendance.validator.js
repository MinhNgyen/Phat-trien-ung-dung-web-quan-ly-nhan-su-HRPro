const { z } = require('zod');

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const createAttendanceSchema = z.object({
  employeeId: z.coerce.number().int().positive('Nhan vien khong hop le'),
  shiftId: z.coerce.number().int().positive().optional().nullable(),
  date: z.coerce.date({ invalid_type_error: 'Ngay khong hop le' }),
  checkIn: z.string().regex(timeRegex, 'Gio vao phai dang HH:mm').optional().nullable(),
  checkOut: z.string().regex(timeRegex, 'Gio ra phai dang HH:mm').optional().nullable(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'LEAVE']).optional(),
  type: z.enum(['NORMAL', 'OVERTIME', 'REMOTE', 'BUSINESS_TRIP']).default('NORMAL'),
  note: z.string().optional().nullable(),
});

const updateAttendanceSchema = createAttendanceSchema.partial();


const calculatePayrollSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Thang phai dang YYYY-MM'),
  employeeId: z.coerce.number().int().positive().optional(),
  allowance: z.coerce.number().min(0).optional(),
  deduction: z.coerce.number().min(0).optional(),
  overtimeRate: z.coerce.number().min(0).optional(),
});

const lockSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Thang phai dang YYYY-MM'),
});

module.exports = {
  createAttendanceSchema, updateAttendanceSchema,
  calculatePayrollSchema, lockSchema,
};
