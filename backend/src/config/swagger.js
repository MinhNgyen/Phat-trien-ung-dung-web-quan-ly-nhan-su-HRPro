/**
 * Cấu hình OpenAPI 3 cho Swagger UI (mount tại /api-docs trong app.js).
 * Mô tả từng endpoint nằm ngay trên dòng router.xxx(...) trong src/routes/*.js (khối @openapi).
 * Schema dùng chung định nghĩa ở đây, tham chiếu bằng $ref: '#/components/schemas/<Tên>'.
 */
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const str = (extra = {}) => ({ type: 'string', ...extra });
const num = (extra = {}) => ({ type: 'number', ...extra });
const int = (extra = {}) => ({ type: 'integer', ...extra });
const nullable = (schema) => ({ ...schema, nullable: true });
const HHMM = '^([01]\\d|2[0-3]):[0-5]\\d$';
const YYYYMM = '^\\d{4}-\\d{2}$';

const schemas = {
  SuccessResponse: {
    type: 'object',
    properties: { success: { type: 'boolean', example: true }, message: str({ example: 'Thành công' }), data: { nullable: true } },
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: str({ example: 'Dữ liệu không hợp lệ' }),
      errors: { type: 'array', items: { type: 'object', properties: { field: str(), message: str() } } },
    },
  },

  // ---------- Auth ----------
  LoginRequest: { type: 'object', required: ['username', 'password'], properties: { username: str({ minLength: 3, example: 'admin' }), password: str({ minLength: 6, example: 'admin123' }) } },
  User: {
    type: 'object',
    properties: {
      id: int(), username: str(), fullName: nullable(str()), role: str({ enum: ['ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER', 'EMPLOYEE'] }),
      isActive: { type: 'boolean' }, createdAt: str({ format: 'date-time' }),
      employee: nullable({ type: 'object', properties: { id: int(), employeeCode: str(), name: str(), department: nullable({ type: 'object', properties: { id: int(), name: str() } }) } }),
    },
  },
  LoginResult: { type: 'object', properties: { token: str({ description: 'JWT, gửi kèm header Authorization: Bearer <token>' }), user: ref('User') } },
  RegisterRequest: {
    type: 'object', required: ['username', 'password'],
    properties: { username: str({ minLength: 3 }), password: str({ minLength: 6 }), fullName: str(), role: str({ enum: ['ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER', 'EMPLOYEE'], default: 'EMPLOYEE' }), employeeId: int({ description: 'Gắn tài khoản vào nhân viên này' }) },
  },
  ChangePasswordRequest: { type: 'object', required: ['oldPassword', 'newPassword'], properties: { oldPassword: str({ minLength: 6 }), newPassword: str({ minLength: 6 }) } },

  // ---------- Employee ----------
  EmployeeShiftInfo: { type: 'object', properties: { id: int(), code: str(), name: str(), startTime: str({ example: '08:00' }), endTime: str({ example: '17:00' }), isPrimary: { type: 'boolean' } } },
  Employee: {
    type: 'object',
    properties: {
      id: int(), employeeCode: str({ example: 'NV001' }), name: str(), email: str({ format: 'email' }), phone: nullable(str()), position: nullable(str()),
      salary: num({ example: 15000000 }), joinedAt: str({ format: 'date-time' }), status: str({ enum: ['ACTIVE', 'INACTIVE', 'LEAVE'] }),
      departmentId: nullable(int()), userId: nullable(int()), createdAt: str({ format: 'date-time' }), updatedAt: str({ format: 'date-time' }),
      department: nullable({ type: 'object', properties: { id: int(), code: str(), name: str(), color: nullable(str()) } }),
      shifts: { type: 'array', items: ref('EmployeeShiftInfo') },
    },
  },
  EmployeeInput: {
    type: 'object', required: ['employeeCode', 'name', 'email', 'joinedAt'],
    properties: {
      employeeCode: str({ maxLength: 20 }), name: str({ maxLength: 120 }), email: str({ format: 'email' }), phone: nullable(str({ maxLength: 20 })), position: nullable(str()),
      salary: num({ minimum: 0, default: 0 }), joinedAt: str({ format: 'date', example: '2026-01-15' }), status: str({ enum: ['ACTIVE', 'INACTIVE', 'LEAVE'], default: 'ACTIVE' }),
      departmentId: nullable(int()),
    },
  },
  EmployeeList: { type: 'object', properties: { items: { type: 'array', items: ref('Employee') }, total: int() } },
  AssignShiftRequest: { type: 'object', required: ['shiftId'], properties: { shiftId: int(), isPrimary: { type: 'boolean', default: false } } },
  EmployeeShift: { type: 'object', properties: { id: int(), employeeId: int(), shiftId: int(), isPrimary: { type: 'boolean' }, shift: ref('Shift') } },

  // ---------- Department / Shift ----------
  Department: {
    type: 'object',
    properties: { id: int(), code: str(), name: str(), description: nullable(str()), head: nullable(str()), color: nullable(str({ example: '#2563eb' })), employeeCount: int(), createdAt: str({ format: 'date-time' }), updatedAt: str({ format: 'date-time' }) },
  },
  DepartmentInput: { type: 'object', required: ['code', 'name'], properties: { code: str({ maxLength: 20 }), name: str({ maxLength: 120 }), description: nullable(str()), head: nullable(str()), color: nullable(str()) } },
  Shift: {
    type: 'object',
    properties: {
      id: int(), code: str({ example: 'HC' }), name: str({ example: 'Hành chính' }), startTime: str({ example: '08:00' }), endTime: str({ example: '17:00' }), description: nullable(str()),
      graceMinutes: int({ description: 'Số phút cho phép đi muộn' }), overtimeRate: str({ example: '1.5', description: 'Hệ số OT (Prisma Decimal → chuỗi JSON)' }), employeeCount: int(),
    },
  },
  ShiftInput: {
    type: 'object', required: ['code', 'name', 'startTime', 'endTime'],
    properties: { code: str({ maxLength: 20 }), name: str(), startTime: str({ pattern: HHMM, example: '08:00' }), endTime: str({ pattern: HHMM, example: '17:00' }), description: nullable(str()), graceMinutes: int({ minimum: 0, maximum: 180, default: 10 }), overtimeRate: num({ minimum: 1, maximum: 5, default: 1.5 }) },
  },

  // ---------- Attendance ----------
  Attendance: {
    type: 'object',
    properties: {
      id: int(), employeeId: int(), shiftId: nullable(int()), date: str({ format: 'date', example: '2026-10-11' }), checkIn: nullable(str({ example: '08:05' })), checkOut: nullable(str({ example: '17:00' })),
      workHours: num({ example: 8.92 }), lateMinutes: int({ description: 'Đã trừ số phút cho phép đi muộn của ca' }),
      status: str({ enum: ['PRESENT', 'LATE', 'ABSENT', 'LEAVE'], description: 'LATE = vào trễ quá thời gian cho phép HOẶC về sớm' }),
      type: str({ enum: ['NORMAL', 'OVERTIME', 'REMOTE', 'BUSINESS_TRIP'] }), note: nullable(str()),
      employee: { type: 'object', properties: { id: int(), employeeCode: str(), name: str(), department: nullable({ type: 'object', properties: { id: int(), name: str() } }) } },
      shift: nullable({ type: 'object', properties: { id: int(), code: str(), name: str(), startTime: str(), endTime: str() } }),
    },
  },
  AttendanceInput: {
    type: 'object', required: ['employeeId', 'date'],
    properties: {
      employeeId: int(), shiftId: nullable(int()), date: str({ format: 'date' }), checkIn: nullable(str({ pattern: HHMM })), checkOut: nullable(str({ pattern: HHMM })),
      status: str({ enum: ['PRESENT', 'LATE', 'ABSENT', 'LEAVE'], description: 'Bỏ trống để backend tự tính từ giờ vào/ra và quy định của ca' }),
      type: str({ enum: ['NORMAL', 'OVERTIME', 'REMOTE', 'BUSINESS_TRIP'], default: 'NORMAL' }), note: nullable(str()),
    },
  },
  CheckRequest: { type: 'object', properties: { employeeId: int({ description: 'Bị bỏ qua với role EMPLOYEE (luôn là chính mình)' }), shiftId: int(), date: str({ format: 'date' }), checkIn: str({ pattern: HHMM }), checkOut: str({ pattern: HHMM }) } },

  // ---------- Payroll ----------
  Payroll: {
    type: 'object',
    properties: {
      id: int(), employeeId: int(), month: str({ example: '2026-10' }), baseSalary: num(), workDays: int(), standardDays: int(), overtime: num(), allowance: num(), deduction: num(),
      grossSalary: num({ description: 'baseSalary + overtime + allowance - deduction' }), tax: num(), netSalary: num({ description: 'grossSalary - tax' }), note: nullable(str()),
      employee: { type: 'object', properties: { id: int(), employeeCode: str(), name: str(), position: nullable(str()), department: nullable({ type: 'object', properties: { id: int(), name: str() } }) } },
    },
  },
  PayrollMonth: { type: 'object', properties: { month: str(), isLocked: { type: 'boolean' }, items: { type: 'array', items: ref('Payroll') }, totalNet: num() } },
  PayrollCalculateRequest: {
    type: 'object', required: ['month'],
    properties: { month: str({ pattern: YYYYMM, example: '2026-10' }), employeeId: int({ description: 'Bỏ trống = tính cho mọi nhân viên đang làm' }), allowance: num({ minimum: 0 }), deduction: num({ minimum: 0 }), overtimeRate: num({ minimum: 0 }) },
  },
  PayrollUpdateRequest: { type: 'object', properties: { allowance: num(), deduction: num(), overtime: num(), workDays: int(), baseSalary: num(), note: str() } },
  MonthRequest: { type: 'object', required: ['month'], properties: { month: str({ pattern: YYYYMM, example: '2026-10' }) } },
  SalaryLock: { type: 'object', properties: { id: int(), month: str(), isLocked: { type: 'boolean' }, lockedBy: nullable(int()), lockedAt: str({ format: 'date-time' }) } },

  // ---------- Tasks & KPI (KPI tính tự động từ đầu việc) ----------
  Task: {
    type: 'object',
    properties: {
      id: int(), employeeId: int(), title: str({ maxLength: 200 }), description: nullable(str()),
      status: str({ enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'], description: 'TODO → IN_PROGRESS → REVIEW (nhân viên báo xong) → DONE (quản lý duyệt + chấm chất lượng)' }),
      weight: int({ minimum: 1, maximum: 5, description: 'Trọng số / độ khó' }), dueDate: str({ format: 'date', description: 'Tháng của hạn quyết định kỳ KPI' }),
      completedAt: nullable(str({ format: 'date' })), quality: nullable(int({ minimum: 0, maximum: 100, description: 'Bắt buộc khi DONE' })), assignedBy: nullable(str()),
      employee: { type: 'object', properties: { id: int(), employeeCode: str(), name: str(), department: nullable({ type: 'object', properties: { id: int(), name: str() } }) } },
    },
  },
  TaskInput: {
    type: 'object', required: ['employeeId', 'title', 'dueDate'],
    properties: { employeeId: int(), title: str({ maxLength: 200 }), description: nullable(str()), dueDate: str({ format: 'date', example: '2026-10-25' }), weight: int({ minimum: 1, maximum: 5, default: 1 }) },
  },
  TaskUpdate: {
    type: 'object', description: 'Mọi field đều tùy chọn',
    properties: {
      employeeId: int(), title: str(), description: nullable(str()), dueDate: str({ format: 'date' }), weight: int({ minimum: 1, maximum: 5 }),
      status: str({ enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'] }), quality: nullable(int({ minimum: 0, maximum: 100, description: 'Bắt buộc khi status = DONE' })), completedAt: nullable(str({ format: 'date', description: 'Mặc định hôm nay khi DONE' })),
    },
  },
  TaskStatusRequest: { type: 'object', required: ['status'], properties: { status: str({ enum: ['TODO', 'IN_PROGRESS', 'REVIEW'] }) } },
  Kpi: {
    type: 'object',
    properties: {
      id: int(), employeeId: int(), period: str({ example: '2026-10' }), totalTasks: int({ description: 'Số việc trong kỳ (không tính việc đã hủy)' }), doneTasks: int(), onTimeTasks: int({ description: 'Việc xong đúng hạn' }),
      completionRate: num({ description: '% hoàn thành = Σ trọng số việc DONE / Σ trọng số mọi việc' }), onTimeRate: num({ description: '% đúng hạn trong số việc đã xong' }), qualityScore: num({ description: 'Điểm chất lượng trung bình (theo trọng số)' }),
      total: num({ description: '40% completionRate + 30% onTimeRate + 30% qualityScore' }),
      employee: { type: 'object', properties: { id: int(), employeeCode: str(), name: str(), position: nullable(str()), department: nullable({ type: 'object', properties: { id: int(), name: str() } }) } },
    },
  },
  KpiRecalcRequest: { type: 'object', required: ['period'], properties: { period: str({ pattern: YYYYMM, example: '2026-10' }), employeeId: int({ description: 'Bỏ trống = tính lại cả kỳ' }) } },

  // ---------- Settings ----------
  PayrollSetting: {
    type: 'object',
    properties: {
      id: int({ example: 1 }), company: nullable(str()), email: nullable(str()), lunch: num({ description: 'Phụ cấp ăn trưa / tháng' }), fuel: num(), phoneAllow: num(), ot: num({ description: 'Hệ số OT mặc định' }),
      bhxh: num({ description: '% BHXH nhân viên đóng' }), bhyt: num(), bhtn: num(), personalRelief: num({ description: 'Giảm trừ gia cảnh bản thân' }), standardDays: int(), latePenalty: num({ description: 'Phạt mỗi LẦN đi muộn' }),
      updatedAt: str({ format: 'date-time' }),
    },
  },
  PayrollSettingInput: {
    type: 'object', description: 'Mọi field đều tùy chọn; chỉ gửi field cần sửa',
    properties: { company: nullable(str({ maxLength: 200 })), email: str({ format: 'email' }), lunch: num({ minimum: 0 }), fuel: num({ minimum: 0 }), phoneAllow: num({ minimum: 0 }), ot: num({ minimum: 1, maximum: 5 }), bhxh: num({ minimum: 0, maximum: 100 }), bhyt: num({ minimum: 0, maximum: 100 }), bhtn: num({ minimum: 0, maximum: 100 }), personalRelief: num({ minimum: 0 }), standardDays: int({ minimum: 1, maximum: 31 }), latePenalty: num({ minimum: 0 }) },
  },

  // ---------- Reports ----------
  Dashboard: {
    type: 'object',
    properties: { totalEmployees: int(), activeEmployees: int(), departments: int(), presentToday: int(), lateToday: int(), absentToday: int(), onLeaveToday: int(), monthlyPayroll: num(), month: str(), date: str({ format: 'date' }) },
  },
  EmployeeReport: {
    type: 'object',
    properties: {
      total: int(), averageSalary: num(), totalSalary: num(),
      byDepartment: { type: 'array', items: { type: 'object', properties: { id: int(), code: str(), name: str(), color: nullable(str()), employees: int() } } },
      byStatus: { type: 'array', items: { type: 'object', properties: { status: str(), count: int() } } },
    },
  },
  AttendanceReport: {
    type: 'object',
    properties: {
      month: str(), totalRecords: int(), byStatus: { type: 'array', items: { type: 'object', properties: { status: str(), count: int() } } },
      employees: { type: 'array', items: { type: 'object', properties: { employeeId: int(), employeeCode: str(), name: str(), present: int(), late: int(), absent: int(), leave: int(), workHours: num(), lateMinutes: int() } } },
    },
  },
  PayrollReport: {
    type: 'object',
    properties: { month: str(), isLocked: { type: 'boolean' }, totalRecords: int(), totalGross: num(), totalNet: num(), totalTax: num(), totalOvertime: num(), totalDeduction: num(), averageNet: num(), items: { type: 'array', items: ref('Payroll') } },
  },
  KpiReport: {
    type: 'object',
    properties: { period: str(), totalRecords: int(), average: num(), top5: { type: 'array', items: ref('Kpi') }, distribution: { type: 'object', additionalProperties: int(), example: { 'Xuat sac': 2, Tot: 5 } }, items: { type: 'array', items: ref('Kpi') } },
  },
};

const errorResponse = (description) => ({ description, content: { 'application/json': { schema: ref('ErrorResponse') } } });

module.exports = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'HRPro API',
      version: '1.0.0',
      description: [
        'REST API cho hệ thống quản lý nhân sự HRPro (Node.js + Express + Prisma + MySQL).',
        '',
        '**Cách dùng:** gọi `POST /auth/login` để lấy token, bấm nút **Authorize** ở góc trên bên phải và dán token (không cần chữ "Bearer").',
        '',
        'Mọi response có dạng `{ success, message, data }`; lỗi có dạng `{ success: false, message, errors: [] }`.',
      ].join('\n'),
    },
    servers: [{ url: '/api', description: 'Server hiện tại' }],
    tags: [
      { name: 'System' }, { name: 'Auth', description: 'Đăng nhập và tài khoản' }, { name: 'Employees' }, { name: 'Departments' }, { name: 'Shifts' },
      { name: 'Attendance', description: 'Chấm công' }, { name: 'Payroll', description: 'Tính lương và chốt lương' }, { name: 'Tasks', description: 'Đầu việc — nguồn tính KPI' }, { name: 'KPI', description: 'KPI tính tự động từ đầu việc (chỉ đọc)' }, { name: 'Settings', description: 'Cấu hình lương' }, { name: 'Reports' },
    ],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas,
      responses: {
        ValidationError: errorResponse('400 - Dữ liệu không hợp lệ (errors liệt kê từng trường)'),
        Unauthorized: errorResponse('401 - Thiếu/sai/hết hạn token'),
        Forbidden: errorResponse('403 - Không đủ quyền'),
        NotFound: errorResponse('404 - Không tìm thấy'),
        Conflict: errorResponse('409 - Dữ liệu bị trùng'),
      },
    },
  },
  apis: [path.join(__dirname, '../routes/*.js')],
});
