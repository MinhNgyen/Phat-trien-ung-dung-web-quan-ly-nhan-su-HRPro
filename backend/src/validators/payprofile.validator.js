const { z } = require('zod');

// Cấu hình lương riêng của 1 nhân viên
const payConfigSchema = z.object({
  allowance: z.coerce.number().min(0, 'Phụ cấp riêng phải >= 0').default(0),
  allowanceNote: z.string().trim().max(200).optional().nullable(),
  dependents: z.coerce.number().int('Số người phụ thuộc phải là số nguyên').min(0, 'Số người phụ thuộc phải >= 0').max(20, 'Số người phụ thuộc tối đa 20').default(0),
});

// Thưởng / phạt của 1 nhân viên trong 1 tháng
const adjustmentSchema = z.object({
  employeeId: z.coerce.number().int().positive('Nhân viên không hợp lệ'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Tháng phải có dạng YYYY-MM'),
  type: z.enum(['BONUS', 'PENALTY'], { errorMap: () => ({ message: 'Loại phải là BONUS (thưởng) hoặc PENALTY (phạt)' }) }),
  amount: z.coerce.number().positive('Số tiền phải lớn hơn 0'),
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do').max(200),
});

module.exports = { payConfigSchema, adjustmentSchema };
