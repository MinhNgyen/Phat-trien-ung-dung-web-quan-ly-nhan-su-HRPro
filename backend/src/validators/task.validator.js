const { z } = require('zod');

const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];

const createTaskSchema = z.object({
  employeeId: z.coerce.number().int().positive('Nhân viên không hợp lệ'),
  title: z.string().trim().min(1, 'Tiêu đề việc là bắt buộc').max(200),
  description: z.string().optional().nullable(),
  dueDate: z.coerce.date({ invalid_type_error: 'Hạn hoàn thành không hợp lệ', required_error: 'Hạn hoàn thành là bắt buộc' }),
  weight: z.coerce.number().int().min(1, 'Trọng số từ 1 đến 5').max(5, 'Trọng số từ 1 đến 5').default(1),
});

// Quản lý/HR/Admin sửa: mọi field tùy chọn. DONE bắt buộc có điểm chất lượng (kiểm tra thêm trong controller).
const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(STATUSES).optional(),
  quality: z.coerce.number().int().min(0, 'Điểm chất lượng 0-100').max(100, 'Điểm chất lượng 0-100').optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
});

// Nhân viên tự cập nhật tiến độ: chỉ 3 trạng thái, KHÔNG được tự đặt DONE
const taskStatusSchema = z.object({ status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW'], { errorMap: () => ({ message: 'Trạng thái chỉ được là TODO, IN_PROGRESS hoặc REVIEW' }) }) });

const recalcSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Kỳ phải có dạng YYYY-MM'),
  employeeId: z.coerce.number().int().positive().optional(),
});

module.exports = { createTaskSchema, updateTaskSchema, taskStatusSchema, recalcSchema, STATUSES };
