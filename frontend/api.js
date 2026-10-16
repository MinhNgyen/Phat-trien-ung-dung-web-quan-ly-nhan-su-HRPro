/**
 * HRPro - Lớp gọi API dùng chung cho frontend
 * Nạp file này TRƯỚC app.js:
 *   <script src="api.js"></script>
 *   <script src="app.js"></script>
 *
 * Mọi hàm đều trả về phần `data` của response, hoặc throw Error với message tiếng Việt từ backend.
 */


(function(){
const API_URL = "http://localhost:5000/api";
const TOKEN_KEY = "hrpro_token";
const USER_KEY = "hrpro_user";

/* ------------------------- Quản lý token ------------------------- */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/* ------------------------- Hàm request lõi ------------------------- */
async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (e) {
    throw new Error("Không kết nối được tới server. Kiểm tra backend đã chạy chưa?");
  }

  let json = {};
  try {
    json = await res.json();
  } catch (e) {
    /* response rỗng */
  }

  if (res.status === 401) {
    clearAuth();
    const authErr = new Error(json.message || "Phiên đăng nhập đã hết hạn");
    authErr.status = 401;
    throw authErr;
  }
  if (!res.ok || json.success === false) {
    const err = new Error(json.message || `Lỗi ${res.status}`);
    err.errors = json.errors || [];
    err.status = res.status;
    throw err;
  }
  return json.data;
}

const get = (p) => request(p);
const post = (p, body) => request(p, { method: "POST", body: JSON.stringify(body) });
const put = (p, body) => request(p, { method: "PUT", body: JSON.stringify(body) });
const del = (p) => request(p, { method: "DELETE" });

// Ghép query string, bỏ qua giá trị rỗng
function qs(params = {}) {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return usable.length ? `?${new URLSearchParams(usable).toString()}` : "";
}

/* ------------------------- Auth ------------------------- */
async function login(username, password) {
  const data = await post("/auth/login", { username, password });
  setToken(data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}
const logout = () => clearAuth();
const getMe = () => get("/auth/me");
const changePassword = (oldPassword, newPassword) =>
  put("/auth/change-password", { oldPassword, newPassword });
const isLoggedIn = () => !!getToken();

/* ------------------------- Employees ------------------------- */
const getEmployees = (filters = {}) => get(`/employees${qs(filters)}`);
const getEmployee = (id) => get(`/employees/${id}`);
const createEmployee = (data) => post("/employees", data);
const updateEmployee = (id, data) => put(`/employees/${id}`, data);
const deleteEmployee = (id) => del(`/employees/${id}`);

const getEmployeeShifts = (id) => get(`/employees/${id}/shifts`);
const assignShift = (id, shiftId, isPrimary = false) =>
  post(`/employees/${id}/shifts`, { shiftId, isPrimary });
const unassignShift = (id, shiftId) => del(`/employees/${id}/shifts/${shiftId}`);

/* ------------------------- Departments ------------------------- */
const getDepartments = () => get("/departments");
const getDepartment = (id) => get(`/departments/${id}`);
const getDepartmentEmployees = (id) => get(`/departments/${id}/employees`);
const createDepartment = (data) => post("/departments", data);
const updateDepartment = (id, data) => put(`/departments/${id}`, data);
const deleteDepartment = (id) => del(`/departments/${id}`);

/* ------------------------- Shifts ------------------------- */
const getShifts = () => get("/shifts");
const getShift = (id) => get(`/shifts/${id}`);
const createShift = (data) => post("/shifts", data);
const updateShift = (id, data) => put(`/shifts/${id}`, data);
const deleteShift = (id) => del(`/shifts/${id}`);

/* ------------------------- Attendance ------------------------- */
const getAttendance = (filters = {}) => get(`/attendance${qs(filters)}`);
const getAttendanceById = (id) => get(`/attendance/${id}`);
const getAttendanceByEmployee = (employeeId, month) =>
  get(`/attendance/employee/${employeeId}${qs({ month })}`);
const getAttendanceByDate = (date) => get(`/attendance/date/${date}`);
const createAttendance = (data) => post("/attendance", data);
const updateAttendance = (id, data) => put(`/attendance/${id}`, data);
const deleteAttendance = (id) => del(`/attendance/${id}`);
const checkIn = (employeeId, shiftId) => post("/attendance/check-in", { employeeId, shiftId });
const checkOut = (employeeId) => post("/attendance/check-out", { employeeId });

/* ------------------------- Payroll ------------------------- */
const getPayroll = (filters = {}) => get(`/payroll${qs(filters)}`);
const getPayrollByMonth = (month) => get(`/payroll/${month}`);
const getPayrollByEmployee = (employeeId) => get(`/payroll/employee/${employeeId}`);
const calculatePayroll = (month, options = {}) => post("/payroll/calculate", { month, ...options });
const updatePayroll = (id, data) => put(`/payroll/${id}`, data);
const deletePayroll = (id) => del(`/payroll/${id}`);
const lockPayroll = (month) => post("/payroll/lock", { month });
const unlockPayroll = (month) => post("/payroll/unlock", { month });
const getSalaryLocks = () => get("/payroll/locks");

/* ------------------------- KPI ------------------------- */
const getKPI = (filters = {}) => get(`/kpi${qs(filters)}`);
const getKPIById = (id) => get(`/kpi/${id}`);
const getKPIByEmployee = (employeeId) => get(`/kpi/employee/${employeeId}`);
const createKPI = (data) => post("/kpi", data);
const updateKPI = (id, data) => put(`/kpi/${id}`, data);
const deleteKPI = (id) => del(`/kpi/${id}`);

/* ------------------------- Reports ------------------------- */
const getDashboard = () => get("/reports/dashboard");
const getEmployeeReport = () => get("/reports/employees");
const getAttendanceReport = (month) => get(`/reports/attendance${qs({ month })}`);
const getPayrollReport = (month) => get(`/reports/payroll${qs({ month })}`);
const getKPIReport = (period) => get(`/reports/kpi${qs({ period })}`);

/* ------------------------- Users & Settings ------------------------- */
const getUsers = () => get("/auth/users");
const getPayrollSettings = () => get("/settings/payroll");
const updatePayrollSettings = (data) => put("/settings/payroll", data);

/* ------------------------- Health ------------------------- */
const healthCheck = () => get("/health").catch(() => null);

// Gom tất cả vào một object để app.js dùng: API.getEmployees(...)
const API = {
  API_URL,
  getToken, setToken, getCurrentUser, clearAuth, isLoggedIn,
  login, logout, getMe, changePassword,
  getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee,
  getEmployeeShifts, assignShift, unassignShift,
  getDepartments, getDepartment, getDepartmentEmployees, createDepartment, updateDepartment, deleteDepartment,
  getShifts, getShift, createShift, updateShift, deleteShift,
  getAttendance, getAttendanceById, getAttendanceByEmployee, getAttendanceByDate,
  createAttendance, updateAttendance, deleteAttendance, checkIn, checkOut,
  getPayroll, getPayrollByMonth, getPayrollByEmployee, calculatePayroll,
  updatePayroll, deletePayroll, lockPayroll, unlockPayroll, getSalaryLocks,
  getKPI, getKPIById, getKPIByEmployee, createKPI, updateKPI, deleteKPI,
  getDashboard, getEmployeeReport, getAttendanceReport, getPayrollReport, getKPIReport,
  getUsers, getPayrollSettings, updatePayrollSettings,
  healthCheck,
};

window.API = API;
})();
