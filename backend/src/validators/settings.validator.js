const { z } = require('zod');

const payrollSettingSchema = z.object({
  company: z.string().max(200).optional().nullable(),
  email: z.union([z.string().email('Email không hợp lệ'), z.literal('')]).optional().nullable(),
  lunch: z.coerce.number().min(0, 'Phụ cấp ăn trưa phải >= 0').default(0),
  fuel: z.coerce.number().min(0, 'Phụ cấp xăng xe phải >= 0').default(0),
  phoneAllow: z.coerce.number().min(0, 'Phụ cấp điện thoại phải >= 0').default(0),
  ot: z.coerce.number().min(1, 'Hệ số OT tối thiểu 1').max(5, 'Hệ số OT tối đa 5').default(1.5),
  bhxh: z.coerce.number().min(0).max(100, 'Tỉ lệ % không hợp lệ').default(8),
  bhyt: z.coerce.number().min(0).max(100, 'Tỉ lệ % không hợp lệ').default(1.5),
  bhtn: z.coerce.number().min(0).max(100, 'Tỉ lệ % không hợp lệ').default(1),
  personalRelief: z.coerce.number().min(0, 'Giảm trừ gia cảnh phải >= 0').default(11000000),
  standardDays: z.coerce.number().int().min(1).max(31, 'Công chuẩn phải từ 1-31 ngày').default(26),
  latePenalty: z.coerce.number().min(0, 'Mức phạt phải >= 0').default(50000),
});

// Cho phép sửa từng phần (PUT nhưng không bắt buộc gửi đủ mọi field)
const updatePayrollSettingSchema = payrollSettingSchema.partial();

module.exports = { payrollSettingSchema, updatePayrollSettingSchema };
