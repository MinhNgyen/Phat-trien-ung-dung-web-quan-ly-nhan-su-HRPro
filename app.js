/*
1. CONSTANTS + SEED DATA
     Khai báo dữ liệu mẫu: nhân viên, phòng ban, ca làm, cài đặt lương, user.

  2. STATE LAYER
     Tạo DB mặc định, load/save localStorage và migration dữ liệu cũ. Đây là
     nơi quan trọng nhất khi thay đổi cấu trúc dữ liệu.

  3. HELPERS
     Các hàm nhỏ dùng chung: format tiền, tìm nhân viên, tìm ca, escape HTML,
     xử lý bảng quan hệ nhân viên - ca.

  4. ATTENDANCE ENGINE
     Logic chấm công. Bản mới hỗ trợ 1 nhân viên có nhiều ca trong cùng ngày,
     nên dữ liệu công là mảng record theo từng ca thay vì object đơn.

  5. RENDER + CRUD
     Các hàm render UI và xử lý thao tác trên từng màn. Mỗi màn thường có cặp
     renderX/openXModal/saveX/deleteX.
*/

/* ===================== CONSTANTS ===================== */
const LS_KEY = 'hrpro_db_v1';
const AVC = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#0ea5e9','#06b6d4','#6366f1','#ec4899','#14b8a6','#f97316','#84cc16','#a855f7','#fb923c','#22d3ee','#e879f9','#4ade80','#f43f5e','#60a5fa','#fbbf24','#34d399','#818cf8','#fb7185','#2dd4bf','#c084fc'];

// Trọng số tiêu chí KPI (tổng = 100%)
const KPI_CRITERIA = [
  {key:'sales',    label:'Doanh số / kết quả',   weight:0.25},
  {key:'attend',   label:'Chuyên cần',           weight:0.20},
  {key:'task',     label:'Hoàn thành công việc', weight:0.25},
  {key:'deadline', label:'Đúng deadline',        weight:0.15},
  {key:'quality',  label:'Chất lượng',           weight:0.15},
];

// Định nghĩa vai trò
const ROLES = {
  admin:      {label:'Quản trị viên', scope:'Toàn hệ thống'},
  hr:         {label:'Nhân sự (HR)',  scope:'Nhân viên, phòng ban, chấm công'},
  accountant: {label:'Kế toán',       scope:'Tính lương, chốt lương'},
  manager:    {label:'Quản lý',       scope:'Nhân viên, KPI, chấm công'},
  employee:   {label:'Nhân viên',     scope:'Xem thông tin cá nhân'},
};

/* ===================== SEED DATA ===================== */
const SEED_EMP = [
  {id:'NV001',name:'Nguyễn Thị Hoa',pos:'Senior Developer',dept:'Kỹ thuật',joined:'2021-03-01',salary:25000000,shift:'Hành chính',status:'active',kpi:91,email:'hoa@co.vn',phone:'0901000001'},
  {id:'NV002',name:'Trần Minh Đức',pos:'Sales Manager',dept:'Kinh doanh',joined:'2020-06-15',salary:22000000,shift:'Hành chính',status:'active',kpi:98,email:'duc@co.vn',phone:'0901000002'},
  {id:'NV003',name:'Lê Thị Hoàng',pos:'Marketing Lead',dept:'Marketing',joined:'2022-01-10',salary:18000000,shift:'Hành chính',status:'leave',kpi:78,email:'hoang@co.vn',phone:'0901000003'},
  {id:'NV004',name:'Phạm Văn Long',pos:'HR Specialist',dept:'Hành chính',joined:'2021-09-20',salary:15000000,shift:'Hành chính',status:'active',kpi:82,email:'long@co.vn',phone:'0901000004'},
  {id:'NV005',name:'Bùi Thị Mai',pos:'Accountant',dept:'Kế toán',joined:'2020-04-05',salary:16000000,shift:'Hành chính',status:'active',kpi:94,email:'mai@co.vn',phone:'0901000005'},
  {id:'NV006',name:'Vũ Hoàng Anh',pos:'Backend Developer',dept:'Kỹ thuật',joined:'2022-11-12',salary:22000000,shift:'Hành chính',status:'active',kpi:87,email:'anh@co.vn',phone:'0901000006'},
  {id:'NV007',name:'Đặng Thu Hương',pos:'Sales Executive',dept:'Kinh doanh',joined:'2023-07-03',salary:14000000,shift:'Ca Sáng',status:'active',kpi:76,email:'huong@co.vn',phone:'0901000007'},
  {id:'NV008',name:'Ngô Văn Khoa',pos:'DevOps Engineer',dept:'Kỹ thuật',joined:'2021-02-18',salary:24000000,shift:'Hành chính',status:'active',kpi:89,email:'khoa@co.vn',phone:'0901000008'},
  {id:'NV009',name:'Hoàng Thị Lan',pos:'Content Creator',dept:'Marketing',joined:'2023-03-01',salary:13000000,shift:'Ca Sáng',status:'active',kpi:80,email:'lan@co.vn',phone:'0901000009'},
  {id:'NV010',name:'Đinh Văn Minh',pos:'Sales Executive',dept:'Kinh doanh',joined:'2022-08-22',salary:15000000,shift:'Ca Chiều',status:'active',kpi:85,email:'minh@co.vn',phone:'0901000010'},
  {id:'NV011',name:'Cao Thị Nhung',pos:'UI/UX Designer',dept:'Kỹ thuật',joined:'2023-01-15',salary:17000000,shift:'Hành chính',status:'active',kpi:83,email:'nhung@co.vn',phone:'0901000011'},
  {id:'NV012',name:'Lý Văn Phong',pos:'Senior Accountant',dept:'Kế toán',joined:'2019-09-10',salary:20000000,shift:'Hành chính',status:'active',kpi:92,email:'phong@co.vn',phone:'0901000012'},
  {id:'NV013',name:'Trịnh Thị Quỳnh',pos:'Office Manager',dept:'Hành chính',joined:'2020-12-01',salary:14000000,shift:'Hành chính',status:'active',kpi:88,email:'quynh@co.vn',phone:'0901000013'},
  {id:'NV014',name:'Dương Văn Sơn',pos:'Frontend Developer',dept:'Kỹ thuật',joined:'2022-05-20',salary:19000000,shift:'Ca Sáng',status:'active',kpi:84,email:'son@co.vn',phone:'0901000014'},
  {id:'NV015',name:'Phan Thị Thảo',pos:'Digital Marketing',dept:'Marketing',joined:'2023-09-01',salary:12000000,shift:'Hành chính',status:'active',kpi:72,email:'thao@co.vn',phone:'0901000015'},
  {id:'NV016',name:'Vũ Minh Tuấn',pos:'Sales Executive',dept:'Kinh doanh',joined:'2024-01-15',salary:13000000,shift:'Ca Chiều',status:'active',kpi:70,email:'tuan@co.vn',phone:'0901000016'},
  {id:'NV017',name:'Nguyễn Văn Uy',pos:'System Admin',dept:'Kỹ thuật',joined:'2021-07-12',salary:20000000,shift:'Ca Đêm',status:'active',kpi:86,email:'uy@co.vn',phone:'0901000017'},
  {id:'NV018',name:'Lê Thị Vân',pos:'Payroll Specialist',dept:'Kế toán',joined:'2022-04-08',salary:15000000,shift:'Hành chính',status:'active',kpi:90,email:'van@co.vn',phone:'0901000018'},
  {id:'NV019',name:'Hồ Văn Xuân',pos:'Business Dev',dept:'Kinh doanh',joined:'2023-06-01',salary:16000000,shift:'Hành chính',status:'leave',kpi:77,email:'xuan@co.vn',phone:'0901000019'},
  {id:'NV020',name:'Bùi Thị Yến',pos:'HR Assistant',dept:'Hành chính',joined:'2024-03-01',salary:11000000,shift:'Hành chính',status:'active',kpi:73,email:'yen@co.vn',phone:'0901000020'},
  {id:'NV021',name:'Trần Văn Zung',pos:'Full Stack Dev',dept:'Kỹ thuật',joined:'2023-11-01',salary:21000000,shift:'Hành chính',status:'active',kpi:88,email:'zung@co.vn',phone:'0901000021'},
  {id:'NV022',name:'Nguyễn Thị An',pos:'Marketing Exec',dept:'Marketing',joined:'2024-01-10',salary:12000000,shift:'Ca Sáng',status:'active',kpi:74,email:'an@co.vn',phone:'0901000022'},
  {id:'NV023',name:'Phạm Minh Bảo',pos:'Junior Dev',dept:'Kỹ thuật',joined:'2024-04-01',salary:13000000,shift:'Hành chính',status:'active',kpi:71,email:'bao@co.vn',phone:'0901000023'},
  {id:'NV024',name:'Lê Văn Châu',pos:'Sales Intern',dept:'Kinh doanh',joined:'2024-05-01',salary:10000000,shift:'Ca Sáng',status:'active',kpi:68,email:'chau@co.vn',phone:'0901000024'},
  {id:'NV025',name:'Đỗ Thị Diệu',pos:'Financial Analyst',dept:'Kế toán',joined:'2023-08-15',salary:18000000,shift:'Hành chính',status:'active',kpi:93,email:'dieu@co.vn',phone:'0901000025'},
];
const SEED_DEPTS = [
  {code:'KT', name:'Kỹ thuật',   head:'Nguyễn Thị Hoa', desc:'Phát triển sản phẩm, hệ thống', color:'#3b82f6'},
  {code:'KD', name:'Kinh doanh', head:'Trần Minh Đức',   desc:'Bán hàng, phát triển khách hàng', color:'#10b981'},
  {code:'MK', name:'Marketing',  head:'Lê Thị Hoàng',    desc:'Truyền thông, thương hiệu',     color:'#f59e0b'},
  {code:'HC', name:'Hành chính', head:'Trịnh Thị Quỳnh', desc:'Nhân sự, hành chính văn phòng', color:'#8b5cf6'},
  {code:'KE', name:'Kế toán',    head:'Lý Văn Phong',    desc:'Tài chính, kế toán, lương',     color:'#ef4444'},
];

const SEED_SHIFTS = [
  {code:'HC', name:'Hành chính', start:'08:00', end:'17:00', grace:10, ot:1.5},
  {code:'CS', name:'Ca Sáng',    start:'06:00', end:'14:00', grace:10, ot:1.5},
  {code:'CC', name:'Ca Chiều',   start:'14:00', end:'22:00', grace:10, ot:1.5},
  {code:'CD', name:'Ca Đêm',     start:'22:00', end:'06:00', grace:15, ot:2.0},
];

const SEED_SETTINGS = {
  company:'Công ty TNHH HRPro Demo',
  email:'hr@hrpro.vn',
  lunch:730000,          // phụ cấp ăn trưa / tháng
  fuel:500000,           // phụ cấp xăng xe / tháng
  phoneAllow:300000,     // phụ cấp điện thoại / tháng
  ot:1.5,                // hệ số OT mặc định
  bhxh:8, bhyt:1.5, bhtn:1,   // % bảo hiểm NV đóng
  personalRelief:11000000,    // giảm trừ gia cảnh bản thân
  standardDays:22,            // công chuẩn / tháng
  latePenalty:50000,          // phạt mỗi lần đi muộn (VNĐ)
};

// Tài khoản đăng nhập (demo). Mỗi user gắn 1 vai trò + (tuỳ chọn) mã NV.
const SEED_USERS = [
  {user:'admin',  pass:'admin123', name:'Quản trị viên', role:'admin',      empId:null},
  {user:'hr',     pass:'hr123',    name:'Phạm Văn Long',  role:'hr',         empId:'NV004'},
  {user:'ketoan', pass:'kt123',    name:'Bùi Thị Mai',    role:'accountant', empId:'NV005'},
  {user:'quanly', pass:'ql123',    name:'Trần Minh Đức',  role:'manager',    empId:'NV002'},
  {user:'nhanvien',pass:'nv123',   name:'Nguyễn Thị Hoa', role:'employee',   empId:'NV001'},
];

// Bảng quan hệ nhân viên - ca làm việc (many-to-many).
// Source of truth mới: DB.employeeShifts = [{empId, shiftCode, isPrimary}]
// Hàm này chỉ dùng cho dữ liệu seed ban đầu: đọc field shift cũ trong SEED_EMP,
// tìm mã ca tương ứng và tạo link nhân viên-ca.
function seedEmployeeShiftLinks(){
  return SEED_EMP.map(e=>{
    const sh = SEED_SHIFTS.find(s=>s.name===e.shift || s.code===e.shift) || SEED_SHIFTS[0];
    return {empId:e.id, shiftCode:sh.code, isPrimary:true};
  });
}

/* ===================== STATE LAYER (localStorage) ===================== */
let DB = null;       // toàn bộ dữ liệu
let SESSION = null;  // user đang đăng nhập

/**
 * Tạo database mặc định cho lần chạy đầu tiên.
 *
 * Lưu ý thiết kế mới:
 * - employee.shift bị loại khỏi object nhân viên để tránh mô hình 1 nhân viên = 1 ca.
 * - Ca được lưu trong employeeShifts để sau này 1 nhân viên có thể làm sáng + tối,
 *   hoặc đổi ca linh hoạt mà không cần sửa schema employees.
 */
function defaultDB(){
  // employees không còn lưu ca trực tiếp; ca được tách sang bảng employeeShifts.
  const employees = JSON.parse(JSON.stringify(SEED_EMP)).map(e=>{
    const {shift, ...rest} = e;
    return rest;
  });
  return {
    employees,
    depts:     JSON.parse(JSON.stringify(SEED_DEPTS)),
    shifts:    JSON.parse(JSON.stringify(SEED_SHIFTS)),
    employeeShifts: JSON.parse(JSON.stringify(seedEmployeeShiftLinks())),
    settings:  JSON.parse(JSON.stringify(SEED_SETTINGS)),
    users:     JSON.parse(JSON.stringify(SEED_USERS)),
    attendance: {},   // { 'YYYY-MM-DD': { empId: [ {id, shiftCode, in,out,type,note,status} ] } }
    kpi: {},          // { period: { empId: {sales,attend,task,deadline,quality,total,by} } }
    salaryLock: {},   // { 'YYYY-MM': true/false }
  };
}

/**
 * Load DB từ localStorage.
 * Nếu chưa có dữ liệu thì tạo DB seed. Nếu đã có dữ liệu cũ thì vẫn load trước,
 * sau đó gọi migrateDB() để tự nâng cấp schema mà không làm mất dữ liệu người dùng.
 */
function loadDB(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if(raw){ DB = JSON.parse(raw); }
    else { DB = defaultDB(); saveDB(); }
  } catch(e){ DB = defaultDB(); }
  // đảm bảo đủ field nếu DB cũ thiếu
  const d = defaultDB();
  for(const k in d){ if(DB[k]===undefined && k!=='employeeShifts') DB[k]=d[k]; }
  migrateDB();
  saveDB();
}

// Migration để dữ liệu localStorage phiên bản cũ vẫn chạy được:
// - Chuyển employee.shift sang bảng employeeShifts.
// - Chuyển attendance từ object đơn sang mảng records theo từng ca.
/**
 * Migration dữ liệu cũ sang schema mới.
 *
 * Vì localStorage có thể đang chứa bản cũ của app, hàm này xử lý 2 việc:
 * 1. Chuyển employee.shift sang employeeShifts.
 * 2. Chuyển attendance[date][empId] từ object đơn thành array records.
 *
 * Hàm được thiết kế idempotent: chạy nhiều lần không tạo trùng dữ liệu.
 */
function migrateDB(){
  if(!Array.isArray(DB.employeeShifts)) DB.employeeShifts = [];

  EMP().forEach(e=>{
    if(e.shift){
      const sh = shiftByName(e.shift) || shiftByCode(e.shift) || SHIFTS()[0];
      if(sh && !DB.employeeShifts.some(x=>x.empId===e.id && x.shiftCode===sh.code)){
        DB.employeeShifts.push({empId:e.id, shiftCode:sh.code, isPrimary:true});
      }
      delete e.shift;
    }
  });

  // Nếu NV chưa có phân ca thì gán ca đầu tiên để UI không bị trống.
  EMP().forEach(e=>{
    if(!DB.employeeShifts.some(x=>x.empId===e.id) && SHIFTS()[0]){
      DB.employeeShifts.push({empId:e.id, shiftCode:SHIFTS()[0].code, isPrimary:true});
    }
  });

  // Dọn link không còn hợp lệ + đảm bảo mỗi NV có một ca primary.
  const empIds = new Set(EMP().map(e=>e.id));
  const shiftCodes = new Set(SHIFTS().map(s=>s.code));
  const seen = new Set();
  DB.employeeShifts = DB.employeeShifts.filter(x=>{
    const key=x.empId+'|'+x.shiftCode;
    if(!empIds.has(x.empId) || !shiftCodes.has(x.shiftCode) || seen.has(key)) return false;
    seen.add(key); return true;
  });
  EMP().forEach(e=>{
    const links = DB.employeeShifts.filter(x=>x.empId===e.id);
    if(links.length && !links.some(x=>x.isPrimary)) links[0].isPrimary=true;
  });

  Object.keys(DB.attendance||{}).forEach(date=>{
    const day=DB.attendance[date]||{};
    Object.keys(day).forEach(empId=>{
      const emp=empById(empId); if(!emp) return;
      day[empId]=normalizeAttendanceEntry(date, empId, day[empId]);
    });
  });
}

/**
 * Ghi toàn bộ DB vào localStorage.
 * App demo này không có API/backend nên mọi CRUD đều kết thúc bằng saveDB().
 */
function saveDB(){
  try { localStorage.setItem(LS_KEY, JSON.stringify(DB)); }
  catch(e){ console.warn('Không lưu được localStorage', e); }
}

// Shortcuts
// Các hàm viết tắt này giúp code render ngắn hơn, đồng thời gom điểm truy cập DB.
// Khi đổi tên bảng trong DB, ưu tiên sửa tại đây để giảm số chỗ phải sửa.
function EMP(){ return DB.employees; }
function DEPTS(){ return DB.depts; }
function SHIFTS(){ return DB.shifts; }
function EMP_SHIFTS(){ if(!DB.employeeShifts) DB.employeeShifts=[]; return DB.employeeShifts; }
function CFG(){ return DB.settings; }

/* ===================== HELPERS ===================== */
function fmt(n){ return Number(Math.round(n)).toLocaleString('vi-VN'); }
function initials(name){ const p=name.trim().split(/\s+/); return (p[0][0]+(p[p.length-1][0]||'')).toUpperCase(); }
function avColor(idx){ return AVC[idx % AVC.length]; }
function deptColor(name){ const d=DEPTS().find(x=>x.name===name); return d?d.color:'#94a3b8'; }
function empById(id){ return EMP().find(e=>e.id===id); }
function shiftByName(name){ return SHIFTS().find(s=>s.name===name); }
function shiftByCode(code){ return SHIFTS().find(s=>s.code===code); }
function shiftCodeByName(name){ const s=shiftByName(name) || shiftByCode(name); return s?s.code:''; }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function curMonth(){ return new Date().toISOString().slice(0,7); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/**
 * Lấy danh sách link ca của một nhân viên từ bảng employeeShifts.
 * Link được sort để ca primary đứng trước, giúp UI hiển thị ca chính trước các ca phụ.
 */
function getEmpShiftLinks(empId){
  return EMP_SHIFTS().filter(x=>x.empId===empId)
    .sort((a,b)=>(b.isPrimary?1:0)-(a.isPrimary?1:0));
}
// Trả về danh sách mã ca của nhân viên, dùng để set selected values cho <select multiple>.
function getEmpShiftCodes(empId){ return getEmpShiftLinks(empId).map(x=>x.shiftCode); }
// Trả về object ca đầy đủ từ danh sách mã ca; filter(Boolean) bỏ link lỗi nếu ca đã bị xóa.
function getEmpShifts(empId){ return getEmpShiftCodes(empId).map(shiftByCode).filter(Boolean); }
function getEmpShiftLabel(empId){
  const names=getEmpShifts(empId).map(s=>s.name);
  return names.length ? names.join(', ') : 'Chưa phân ca';
}
function shiftBadgeList(empId){
  const shifts=getEmpShifts(empId);
  return shifts.length ? shifts.map(s=>`<span class="shift-chip">${esc(s.name)}</span>`).join('') : '<span class="badge badge-gray">Chưa phân ca</span>';
}
/**
 * Ghi lại toàn bộ ca của nhân viên.
 * Cách làm hiện tại là xóa link cũ rồi insert link mới để logic đơn giản, phù hợp localStorage.
 * Phần tử đầu tiên trong codes được xem là ca chính (isPrimary=true).
 */
function setEmpShiftCodes(empId, codes){
  const unique=[...new Set((codes||[]).filter(Boolean))];
  DB.employeeShifts = EMP_SHIFTS().filter(x=>x.empId!==empId);
  unique.forEach((code,idx)=>DB.employeeShifts.push({empId, shiftCode:code, isPrimary:idx===0}));
}
function removeEmpShiftLinks(empId){ DB.employeeShifts = EMP_SHIFTS().filter(x=>x.empId!==empId); }
function firstEmpShift(empId){ return getEmpShifts(empId)[0] || SHIFTS()[0]; }
// Helper đọc các option đang chọn trong <select multiple>.
function selectValues(sel){ return [...(sel?.selectedOptions||[])].map(o=>o.value); }
// Helper set selected cho <select multiple>, dùng khi mở modal sửa nhân viên.
function setSelectValues(sel, values){
  const set=new Set(values||[]);
  [...(sel?.options||[])].forEach(o=>o.selected=set.has(o.value));
}

function getDeptStats(){
  const s={};
  EMP().forEach(e=>{
    if(!s[e.dept]) s[e.dept]={count:0,salarySum:0,kpiSum:0};
    s[e.dept].count++; s[e.dept].salarySum+=e.salary; s[e.dept].kpiSum+=e.kpi;
  });
  Object.keys(s).forEach(d=>{ s[d].avgKpi=Math.round(s[d].kpiSum/s[d].count); s[d].avgSalary=Math.round(s[d].salarySum/s[d].count); });
  return s;
}
function totalSalary(){ return EMP().reduce((a,e)=>a+e.salary,0); }
function avgKpi(){ const a=EMP(); return a.length?Math.round(a.reduce((s,e)=>s+e.kpi,0)/a.length):0; }

// minutes from "HH:MM"
// Chuyển HH:MM thành tổng số phút từ 00:00 để so sánh giờ vào/ra dễ hơn.
function toMin(t){ if(!t) return null; const [h,m]=t.split(':').map(Number); return h*60+m; }

/* ===================== ATTENDANCE ENGINE ===================== */
// Tạo id ổn định cho record công theo ngày + nhân viên + ca.
// idx dùng để tránh trùng nếu sau này cho phép nhiều record cùng một ca trong ngày.
function makeAttRecId(date, empId, shiftCode, idx=0){
  return `${date}_${empId}_${shiftCode||'NA'}_${idx}`;
}

/**
 * Tính độ khớp giữa một record công và một ca.
 * Dùng khi record cũ chưa có shiftCode: app sẽ đo giờ vào/ra gần ca nào nhất để đoán ca.
 */
function scoreShiftByTime(sh, rec){
  if(!sh || !rec?.in) return 0;
  const inM=toMin(rec.in), startM=toMin(sh.start);
  if(inM==null || startM==null) return 0;
  return Math.min(
    Math.abs(inM-startM),
    Math.abs(inM+1440-startM),
    Math.abs(inM-(startM+1440))
  );
}

/**
 * Chọn ca phù hợp cho một bản ghi công.
 * Ưu tiên rec.shiftCode nếu có. Nếu không có, đoán dựa trên giờ vào/ra so với các ca của nhân viên.
 */
function pickShiftForAttendance(emp, rec){
  if(rec?.shiftCode){ const sh=shiftByCode(rec.shiftCode); if(sh) return sh; }
  if(rec?.shift){ const sh=shiftByName(rec.shift) || shiftByCode(rec.shift); if(sh) return sh; }
  const shifts=getEmpShifts(emp.id);
  if(rec?.in && shifts.length){
    return shifts.slice().sort((a,b)=>scoreShiftByTime(a,rec)-scoreShiftByTime(b,rec))[0];
  }
  return shifts[0] || SHIFTS()[0];
}

/**
 * Trả về thông tin diễn giải trạng thái công.
 * Ngoài status ngắn (present/late/leave/absent), hàm này tính số phút đi muộn/về sớm
 * để hiển thị trong cột chi tiết và modal chi tiết công.
 */
function attendanceMeta(emp, rec){
  const sh=pickShiftForAttendance(emp, rec||{});
  if(!sh) return {shift:null, lateMinutes:0, earlyMinutes:0, reason:'Chưa phân ca'};
  if(rec?.type==='leave') return {shift:sh, lateMinutes:0, earlyMinutes:0, reason:'Nghỉ phép'};
  if(rec?.type==='absent') return {shift:sh, lateMinutes:0, earlyMinutes:0, reason:'Vắng không phép'};

  const startM=toMin(sh.start), endM=toMin(sh.end);
  const inM=toMin(rec?.in), outM=toMin(rec?.out);
  const grace=Number(sh.grace)||0;
  let lateMinutes=0, earlyMinutes=0;

  if(inM!=null && startM!=null) lateMinutes=Math.max(0, inM-(startM+grace));

  if(outM!=null && endM!=null && startM!=null){
    const overnight=endM<=startM;
    let outAdj=outM, endAdj=endM;
    if(overnight){
      endAdj=endM+1440;
      if(outM<startM) outAdj=outM+1440;
    }
    earlyMinutes=Math.max(0, endAdj-outAdj);
  }

  const parts=[];
  if(lateMinutes>0) parts.push(`Đi muộn ${lateMinutes} phút`);
  if(earlyMinutes>0) parts.push(`Về sớm ${earlyMinutes} phút`);
  return {shift:sh, lateMinutes, earlyMinutes, reason:parts.join(' · ') || 'Đúng ca'};
}

// Tính trạng thái 1 bản ghi chấm công dựa trên ca làm + giờ vào/ra
/**
 * Tính trạng thái chấm công cho một record.
 * Quy tắc:
 * - leave: nghỉ phép.
 * - absent: vắng không phép.
 * - work: so sánh giờ vào với start + grace, giờ ra với end.
 * - ca đêm có end < start nên bỏ kiểm tra về sớm trong cùng ngày để tránh sai logic qua ngày.
 */
function computeAttStatus(emp, rec){
  if(rec.type==='leave')  return 'leave';
  if(rec.type==='absent') return 'absent';
  const meta=attendanceMeta(emp,rec);
  if(!meta.shift || !rec.in) return 'absent';
  if(meta.lateMinutes>0 || meta.earlyMinutes>0) return 'late';
  return 'present';
}

/**
 * Tạo record công mặc định cho một nhân viên trong ngày.
 * Nếu nhân viên có nhiều ca, mỗi ca sinh một record riêng. Đây là phần giúp màn chấm công
 * scale tốt hơn khi nhân viên làm cả ca chiều và ca tối.
 */
function createDefaultAttendanceRecords(date, emp){
  if(emp.status==='leave'){
    return [{id:makeAttRecId(date,emp.id,'LEAVE',0), shiftCode:'', in:'', out:'', type:'leave', note:'Nghỉ phép', status:'leave'}];
  }
  const shifts=getEmpShifts(emp.id);
  if(!shifts.length){
    return [{id:makeAttRecId(date,emp.id,'NA',0), shiftCode:'', in:'', out:'', type:'absent', note:'Chưa phân ca', status:'absent'}];
  }
  return shifts.map((sh,idx)=>{
    const rec={id:makeAttRecId(date,emp.id,sh.code,idx), shiftCode:sh.code, in:sh.start, out:sh.end, type:'work', note:''};
    rec.status=computeAttStatus(emp,rec);
    return rec;
  });
}

/**
 * Chuẩn hóa dữ liệu công cũ/mới về dạng mảng records.
 * entry có thể là object đơn ở bản cũ hoặc array ở bản mới. Hàm này luôn trả về array.
 */
function normalizeAttendanceEntry(date, empId, entry){
  const emp=empById(empId);
  const arr=Array.isArray(entry) ? entry : (entry ? [entry] : []);
  return arr.map((rec,idx)=>{
    const r={...rec};
    if(!r.shiftCode && r.shift) r.shiftCode=shiftCodeByName(r.shift);
    if(!r.shiftCode && emp){ const sh=pickShiftForAttendance(emp,r); if(sh) r.shiftCode=sh.code; }
    if(!r.id) r.id=makeAttRecId(date,empId,r.shiftCode,idx);
    if(emp) r.status=computeAttStatus(emp,r);
    return r;
  });
}

// Lấy bản ghi chấm công 1 ngày cho toàn bộ NV (auto-fill nếu chưa có)
/**
 * Lấy toàn bộ bảng công của một ngày.
 * Hàm này vừa đọc vừa auto-fill record còn thiếu, giúp UI luôn có dòng để hiển thị.
 */
function getDayAttendance(date){
  if(!DB.attendance[date]) DB.attendance[date] = {};
  const day = DB.attendance[date];
  EMP().forEach(e=>{
    if(!day[e.id]) day[e.id]=createDefaultAttendanceRecords(date,e);
    else day[e.id]=normalizeAttendanceEntry(date,e.id,day[e.id]);
  });
  return day;
}

// Lấy danh sách record công của một nhân viên trong object day đã load.
function dayRecordsForEmp(day, empId){
  const entry=day?.[empId];
  return Array.isArray(entry) ? entry : (entry ? [entry] : []);
}

// Tìm một record công cụ thể để mở modal chi tiết.
function findAttendanceRecord(date, empId, recId){
  const day=getDayAttendance(date);
  return dayRecordsForEmp(day,empId).find(r=>r.id===recId);
}

// Đếm số công thực tế trong 1 tháng. Một ngày có nhiều ca vẫn chỉ tính tối đa 1 công.
/**
 * Đếm công theo tháng để tính lương.
 * Vì một ngày có thể có nhiều record ca, hiện tại chỉ tính tối đa 1 công/ngày nếu có ít nhất
 * một record present/late. Nếu sau này muốn tính theo ca, có thể đổi logic tại đây.
 */
function countWorkDays(empId, month){
  let work=0, late=0, leave=0, absent=0;
  Object.keys(DB.attendance).forEach(date=>{
    if(!date.startsWith(month)) return;
    const records=dayRecordsForEmp(DB.attendance[date], empId);
    if(!records.length) return;
    const statuses=records.map(r=>r.status);
    if(statuses.includes('present') || statuses.includes('late')){
      work++;
      if(statuses.includes('late')) late++;
    } else if(statuses.every(s=>s==='leave')) leave++;
    else if(statuses.every(s=>s==='absent')) absent++;
  });
  return {work, late, leave, absent};
}

/* ===================== PAYROLL ENGINE ===================== */
// Thuế TNCN luỹ tiến từng phần (biểu thuế tháng VN)
function pit(taxable){
  if(taxable<=0) return 0;
  const b=[ [5000000,0.05],[5000000,0.10],[8000000,0.15],[14000000,0.20],
            [20000000,0.25],[28000000,0.30],[Infinity,0.35] ];
  let tax=0, rem=taxable;
  for(const [amt,rate] of b){ const part=Math.min(rem,amt); tax+=part*rate; rem-=part; if(rem<=0) break; }
  return tax;
}

// Tính lương chi tiết 1 NV theo tháng
/**
 * Tính lương chi tiết theo tháng.
 * Input chính là nhân viên + tháng, output là object đủ thành phần để render bảng lương
 * và phiếu lương: công thực tế, phụ cấp, phạt muộn/vắng, bảo hiểm, thuế, thực nhận.
 */
function calcSalary(emp, month){
  const c = CFG();
  const std = c.standardDays || 22;
  const att = countWorkDays(emp.id, month);
  // nếu tháng chưa có dữ liệu chấm công -> coi như đủ công chuẩn (demo)
  const hasData = (att.work+att.leave+att.absent) > 0;
  const actualWork = hasData ? att.work : std;
  const lateCount = hasData ? att.late : 0;
  const absentCount = hasData ? att.absent : 0;

  const perDay = emp.salary / std;
  const earnedBase = Math.round(perDay * Math.min(actualWork, std));

  const allowance = (c.lunch||0)+(c.fuel||0)+(c.phoneAllow||0);

  // OT: demo lấy 0 trừ khi có ghi nhận (giữ field để mở rộng) -> tính từ thưởng riêng
  const otPay = 0;

  // Trừ đi muộn + vắng không phép
  const lateDeduct = lateCount * (c.latePenalty||0);
  const absentDeduct = Math.round(perDay * absentCount);
  const penalty = lateDeduct + absentDeduct;

  // Thưởng/phạt thủ công (lưu trên emp.bonus nếu có)
  const bonus = emp.bonus || 0;

  // Thu nhập chịu BH = lương cơ bản (đơn giản hoá)
  const insBase = emp.salary;
  const bh = Math.round(insBase * ((c.bhxh||0)+(c.bhyt||0)+(c.bhtn||0))/100);

  // Thu nhập tính thuế = (lương thực + phụ cấp + thưởng) - BH - giảm trừ bản thân
  const grossBeforeTax = earnedBase + allowance + otPay + bonus - penalty;
  const taxable = Math.max(0, grossBeforeTax - bh - (c.personalRelief||0));
  const tax = Math.round(pit(taxable));

  const net = grossBeforeTax - bh - tax;

  return {
    emp, month, std, actualWork, lateCount, absentCount,
    base: emp.salary, earnedBase, allowance, otPay,
    penalty, lateDeduct, absentDeduct, bonus, bh, tax, net,
  };
}

function isSalaryLocked(month){ return !!DB.salaryLock[month]; }

/* ===================== AUTH & ROLES ===================== */
function role(){ return SESSION ? SESSION.role : null; }
function can(roleList){ return roleList.split(',').map(s=>s.trim()).includes(role()); }

// Đăng nhập demo: kiểm tra user/pass trong DB.users, không gọi API thật.
function doLogin(){
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  const found = DB.users.find(x=>x.user===u && x.pass===p);
  const errEl = document.getElementById('login-error');
  if(!found){ errEl.textContent = 'Sai tên đăng nhập hoặc mật khẩu.'; return; }
  errEl.textContent='';
  SESSION = found;
  sessionStorage.setItem('hrpro_session', JSON.stringify(found));
  showApp();
}

function doLogout(){
  SESSION=null;
  sessionStorage.removeItem('hrpro_session');
  document.getElementById('app-shell').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('login-pass').value='';
}

// Sau khi login, hiển thị layout chính, apply quyền và render trang đầu tiên user được phép xem.
function showApp(){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app-shell').style.display='flex';
  // header user
  document.getElementById('user-name').textContent = SESSION.name;
  document.getElementById('user-role').textContent = ROLES[SESSION.role].label;
  document.getElementById('user-avatar').textContent = initials(SESSION.name);
  applyRolePermissions();
  // điều hướng tới trang đầu tiên mà role được phép
  const first = document.querySelector('#sidebar .nav-item:not([style*="display: none"])');
  if(first) navigate(first.getAttribute('data-page'), first);
  refreshAll();
}

// Ẩn/hiện mọi phần tử có data-roles theo vai trò hiện tại
// Ẩn/hiện các phần tử có data-roles theo vai trò hiện tại.
function applyRolePermissions(){
  const r = role();
  document.querySelectorAll('[data-roles]').forEach(el=>{
    const allowed = el.getAttribute('data-roles').split(',').map(s=>s.trim());
    el.style.display = allowed.includes(r) ? '' : 'none';
  });
}

/* ===================== NAVIGATION ===================== */
const PAGE_TITLES = {
  dashboard:'Dashboard', employees:'Quản lý Nhân viên', departments:'Phòng ban',
  shifts:'Ca làm việc', attendance:'Chấm công', salary:'Tính lương',
  performance:'Hiệu suất & KPI', reports:'Báo cáo & Thống kê', settings:'Cài đặt',
};

// Điều hướng SPA: chỉ đổi class active và gọi hàm render tương ứng, không reload trang.
function navigate(page, el){
  // chặn truy cập trang ngoài quyền
  const navEl = el || document.querySelector(`#sidebar .nav-item[data-page="${page}"]`);
  if(navEl){
    const allowed = (navEl.getAttribute('data-roles')||'').split(',').map(s=>s.trim());
    if(!allowed.includes(role())) return;
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg = document.getElementById('page-'+page);
  if(pg) pg.classList.add('active');
  document.querySelectorAll('#sidebar .nav-item').forEach(n=>n.classList.remove('active'));
  if(navEl) navEl.classList.add('active');
  document.getElementById('header-title').textContent = PAGE_TITLES[page]||'HRPro';
  // render trang tương ứng
  const map = {
    dashboard:renderDashboard, employees:renderEmployeeTable, departments:renderDepartments,
    shifts:renderShifts, attendance:renderAttendance, salary:renderSalary,
    performance:renderPerformance, reports:renderReports, settings:renderSettings,
  };
  if(map[page]) map[page]();
}

function switchTab(el, paneId){
  el.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  const wrap = el.closest('.page');
  wrap.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  wrap.querySelector('#'+paneId).classList.add('active');
  if(paneId==='tab-cards') renderEmployeeCards();
}

function handleGlobalSearch(v){
  const inp = document.getElementById('emp-search');
  if(inp){ inp.value=v; }
  navigate('employees', document.querySelector('#sidebar .nav-item[data-page="employees"]'));
}

/* ===================== CHARTS ===================== */
/**
 * Vẽ bar chart bằng HTML/CSS thuần.
 * Không dùng thư viện chart để file demo gọn nhẹ. data gồm label/value/color.
 */
function renderBarChart(el, data, opts = {}) {
  if (!el) return;

  const maxVal = Math.max(1, ...data.map(d => Number(d.value) || 0));

  // Lấy chiều cao của khung chart, nếu chưa lấy được thì dùng mặc định 150px
  const wrapHeight =
    el.clientHeight ||
    parseInt(el.style.height, 10) ||
    opts.maxH ||
    150;

  // Chừa chỗ cho số phía trên + nhãn phía dưới
  const maxBarHeight = Math.max(50, wrapHeight - 42);

  el.innerHTML = data.map((d, i) => {
    const value = Number(d.value) || 0;
    const height = Math.max(8, Math.round(value / maxVal * maxBarHeight));
    const color = d.color || avColor(i);
    const label = d.label || '';
    const showValue = opts.fmtValue ? opts.fmtValue(value) : (d.sub || value);
    const title = d.fullLabel || label;

    const clickAttr = opts.clickable
      ? `onclick="${opts.onClick}(${i})"`
      : '';

    return `
      <div class="bar-col" title="${esc(title)}: ${esc(showValue)}">
        <div class="bar-value">${esc(showValue)}</div>
        <div class="bar" style="height:${height}px;background:${color}" ${clickAttr}></div>
        <div class="bar-label">${esc(label)}</div>
      </div>
    `;
  }).join('');
}

/**
 * Vẽ donut chart bằng SVG.
 * Mỗi lát là một circle dùng stroke-dasharray, legend render bằng HTML bên cạnh.
 */
function renderDonut(svg, legend, data) {
  if (!svg) return;

  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const R = 50;
  const C = 2 * Math.PI * R;
  let off = 0;

  svg.innerHTML =
    `<circle cx="60" cy="60" r="${R}" fill="none" stroke="#eef2f7" stroke-width="16"/>` +
    data.map((d, i) => {
      const frac = d.value / total;
      const len = frac * C;
      const color = d.color || avColor(i);

      const c = `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${color}" stroke-width="16"
        stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}"
        transform="rotate(-90 60 60)"/>`;

      off += len;
      return c;
    }).join('') +
    `<text x="60" y="58" text-anchor="middle" font-size="20" font-weight="700" fill="#1e293b">${total}</text>
     <text x="60" y="74" text-anchor="middle" font-size="9" fill="#94a3b8">nhân viên</text>`;

  if (legend) {
    legend.innerHTML = data.map((d, i) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${d.color || avColor(i)}"></span>
        ${esc(d.label)} <strong>${d.value}</strong>
      </div>
    `).join('');
  }
}

/* ===================== DASHBOARD ===================== */
function statusBadge(status){
  return status==='active'
    ? '<span class="badge badge-success">Đang làm</span>'
    : '<span class="badge badge-warning">Nghỉ phép</span>';
}
function kpiBadge(kpi){
  const cls = kpi>=90?'badge-success':kpi>=75?'badge-info':kpi>=60?'badge-warning':'badge-danger';
  return `<span class="badge ${cls}">${kpi}</span>`;
}
function empAvatar(e, idx){
  return `<div class="emp-avatar" style="background:${avColor(idx)}">${initials(e.name)}</div>`;
}

// Render dashboard tổng quan: số nhân viên, tỷ lệ đi làm hôm nay, quỹ lương, KPI và chart.
function renderDashboard(){
  const emps = EMP();
  const active = emps.filter(e=>e.status==='active').length;
  document.getElementById('stat-total').textContent = emps.length;
  document.getElementById('stat-active-lbl').textContent = active+' đang làm việc';

  // tỷ lệ đi làm hôm nay
  const day = getDayAttendance(todayStr());
  let present=0, total=0;
  emps.forEach(e=>{
    total++;
    const statuses=dayRecordsForEmp(day,e.id).map(r=>r.status);
    if(statuses.includes('present') || statuses.includes('late')) present++;
  });
  const rate = total?Math.round(present/total*100):0;
  document.getElementById('stat-attend').textContent = rate+'%';
  document.getElementById('stat-attend-lbl').textContent = present+'/'+total+' có mặt';

  document.getElementById('stat-salary-lbl').textContent = fmt(totalSalary());
  document.getElementById('stat-salary-sub').textContent = 'Lương cơ bản';
  document.getElementById('stat-kpi-lbl').textContent = avgKpi();

  // badge số bản ghi đi muộn / về sớm hôm nay
  const late = Object.values(day).reduce((sum,entry)=>sum + dayRecordsForEmp({tmp:entry},'tmp').filter(r=>r.status==='late').length,0);
  const lb=document.getElementById('late-badge'); if(lb){ lb.textContent=late; lb.style.display=late?'':'none'; }

  // charts
  const ds = getDeptStats();
  const deptNames = Object.keys(ds);
  renderBarChart(document.getElementById('chart-dept-salary'),
    deptNames.map(d=>({label:d, value:ds[d].salarySum, color:deptColor(d)})),
    {fmtValue:v=>fmt(v/1e6)+'tr'});
  renderDonut(document.getElementById('donut-svg'), document.getElementById('donut-legend'),
    deptNames.map(d=>({label:d, value:ds[d].count, color:deptColor(d)})));

  // bảng gần đây
  const tb = document.getElementById('dash-table');
  tb.innerHTML = emps.slice(0,6).map((e,i)=>`<tr>
    <td><div class="emp-cell">${empAvatar(e,i)}<div><div class="emp-name">${esc(e.name)}</div><div class="emp-sub">${esc(e.pos)}</div></div></div></td>
    <td><span class="dept-tag" style="background:${deptColor(e.dept)}22;color:${deptColor(e.dept)}">${esc(e.dept)}</span></td>
    <td>${fmt(e.salary)}</td><td>${kpiBadge(e.kpi)}</td><td>${statusBadge(e.status)}</td>
  </tr>`).join('');
}

/* ===================== EMPLOYEES ===================== */
function populateDeptFilters(){
  const opts = '<option value="">Tất cả phòng ban</option>'+DEPTS().map(d=>`<option>${esc(d.name)}</option>`).join('');
  ['emp-dept-filter','sal-dept-filter'].forEach(id=>{
    const el=document.getElementById(id); if(el){ const v=el.value; el.innerHTML=opts; el.value=v; }
  });
}
function filteredEmployees(){
  const q=(document.getElementById('emp-search')?.value||'').toLowerCase().trim();
  const dept=document.getElementById('emp-dept-filter')?.value||'';
  const st=document.getElementById('emp-status-filter')?.value||'';
  return EMP().filter(e=>{
    if(dept && e.dept!==dept) return false;
    if(st && e.status!==st) return false;
    if(q && !(e.name.toLowerCase().includes(q)||e.id.toLowerCase().includes(q)||(e.pos||'').toLowerCase().includes(q))) return false;
    return true;
  });
}
// Render bảng nhân viên. Cột ca làm lấy từ employeeShifts thay vì employee.shift.
function renderEmployeeTable(){
  populateDeptFilters();
  const list=filteredEmployees();
  const cnt=document.getElementById('emp-count-lbl'); if(cnt) cnt.textContent=EMP().length+' nhân viên';
  const canEdit = can('admin,hr');
  const tb=document.getElementById('emp-table-body');
  tb.innerHTML = list.length? list.map((e,i)=>`<tr>
    <td><strong>${esc(e.id)}</strong></td>
    <td><div class="emp-cell">${empAvatar(e,EMP().indexOf(e))}<div><div class="emp-name">${esc(e.name)}</div><div class="emp-sub">${esc(e.email||'')}</div></div></div></td>
    <td>${esc(e.pos||'')}</td>
    <td><span class="dept-tag" style="background:${deptColor(e.dept)}22;color:${deptColor(e.dept)}">${esc(e.dept)}</span></td>
    <td><div class="shift-chip-list">${shiftBadgeList(e.id)}</div></td>
    <td>${esc(e.joined||'')}</td><td>${fmt(e.salary)}</td><td>${kpiBadge(e.kpi)}</td><td>${statusBadge(e.status)}</td>
    <td>${canEdit?`<button class="icon-btn" title="Sửa" onclick="openEditModal('${e.id}')">✏️</button>
        <button class="icon-btn" title="Xóa" onclick="deleteEmp('${e.id}')">🗑️</button>`:'<span style="color:var(--text-muted);font-size:12px">—</span>'}</td>
  </tr>`).join('') : `<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:30px">Không có nhân viên phù hợp</td></tr>`;
}
// Render dạng card nhân viên, dùng chung dữ liệu filter với bảng danh sách.
function renderEmployeeCards(){
  const grid=document.getElementById('emp-cards-grid'); if(!grid) return;
  grid.innerHTML = filteredEmployees().map((e)=>`<div class="emp-card">
    <div class="emp-card-top">${empAvatar(e,EMP().indexOf(e))}
      <div><div class="emp-name">${esc(e.name)}</div><div class="emp-sub">${esc(e.pos||'')}</div></div></div>
    <div class="emp-card-body">
      <div class="ec-row"><span>Mã NV</span><strong>${esc(e.id)}</strong></div>
      <div class="ec-row"><span>Phòng ban</span><span class="dept-tag" style="background:${deptColor(e.dept)}22;color:${deptColor(e.dept)}">${esc(e.dept)}</span></div>
      <div class="ec-row"><span>Ca làm</span><div class="shift-chip-list">${shiftBadgeList(e.id)}</div></div>
      <div class="ec-row"><span>Lương CB</span><strong>${fmt(e.salary)}</strong></div>
      <div class="ec-row"><span>KPI</span>${kpiBadge(e.kpi)}</div>
      <div class="ec-row"><span>Trạng thái</span>${statusBadge(e.status)}</div>
    </div>
  </div>`).join('');
}

/* ===================== EMPLOYEE CRUD ===================== */
// Nạp option cho các select trong modal nhân viên: phòng ban và danh sách ca multiple.
function fillEmpSelects(){
  const dsel=document.getElementById('f-dept');
  if(dsel) dsel.innerHTML=DEPTS().map(d=>`<option>${esc(d.name)}</option>`).join('');
  const ssel=document.getElementById('f-shift');
  if(ssel) ssel.innerHTML=SHIFTS().map(s=>`<option value="${esc(s.code)}">${esc(s.name)} (${esc(s.start)}–${esc(s.end)})</option>`).join('');
}
// Mở modal thêm nhân viên, reset form và chọn mặc định ca đầu tiên.
function openAddModal(){
  if(!can('admin,hr')) return;
  fillEmpSelects();
  document.getElementById('emp-modal-title').textContent='👤 Thêm nhân viên mới';
  document.getElementById('f-edit-id').value='';
  ['f-name','f-email','f-phone','f-pos','f-joined'].forEach(id=>document.getElementById(id).value='');
  // gợi ý mã NV kế tiếp
  const maxN = EMP().reduce((m,e)=>{ const n=parseInt((e.id||'').replace(/\D/g,''))||0; return Math.max(m,n); },0);
  document.getElementById('f-id').value = 'NV'+String(maxN+1).padStart(3,'0');
  document.getElementById('f-id').readOnly=false;
  document.getElementById('f-salary').value='';
  document.getElementById('f-kpi').value='80';
  document.getElementById('f-status').value='active';
  const first=SHIFTS()[0]?.code;
  setSelectValues(document.getElementById('f-shift'), first?[first]:[]);
  openModal('emp-modal');
}
// Mở modal sửa nhân viên, đồng thời set nhiều ca đang chọn bằng setSelectValues().
function openEditModal(id){
  if(!can('admin,hr')) return;
  const e=empById(id); if(!e) return;
  fillEmpSelects();
  document.getElementById('emp-modal-title').textContent='✏️ Sửa thông tin nhân viên';
  document.getElementById('f-edit-id').value=e.id;
  document.getElementById('f-name').value=e.name;
  document.getElementById('f-id').value=e.id;
  document.getElementById('f-id').readOnly=true;
  document.getElementById('f-email').value=e.email||'';
  document.getElementById('f-phone').value=e.phone||'';
  document.getElementById('f-dept').value=e.dept;
  document.getElementById('f-pos').value=e.pos||'';
  document.getElementById('f-joined').value=e.joined||'';
  document.getElementById('f-salary').value=e.salary;
  setSelectValues(document.getElementById('f-shift'), getEmpShiftCodes(e.id));
  document.getElementById('f-status').value=e.status;
  document.getElementById('f-kpi').value=e.kpi;
  openModal('emp-modal');
}
/**
 * Lưu nhân viên thêm/sửa.
 * Sau khi lưu thông tin cơ bản vào employees, gọi setEmpShiftCodes() để cập nhật bảng quan hệ ca.
 */
function saveEmployee(){
  const editId=document.getElementById('f-edit-id').value;
  const name=document.getElementById('f-name').value.trim();
  const id=document.getElementById('f-id').value.trim();
  const email=document.getElementById('f-email').value.trim();
  const phone=document.getElementById('f-phone').value.trim();
  const salary=parseInt(document.getElementById('f-salary').value)||0;
  const shiftCodes=selectValues(document.getElementById('f-shift'));
  if(!name){ alert('Vui lòng nhập họ tên'); return; }
  if(!id){ alert('Vui lòng nhập mã nhân viên'); return; }
  if(!shiftCodes.length){ alert('Vui lòng chọn ít nhất một ca làm việc'); return; }
  if(salary<1000000){ alert('Lương cơ bản không hợp lệ (tối thiểu 1.000.000đ)'); return; }
  // kiểm tra trùng mã/email/phone
  const dupId=EMP().find(e=>e.id===id && e.id!==editId);
  if(dupId){ alert('Mã nhân viên "'+id+'" đã tồn tại!'); return; }
  if(email){ const d=EMP().find(e=>e.email===email && e.id!==editId); if(d){ alert('Email đã được dùng bởi '+d.id); return; } }
  if(phone){ const d=EMP().find(e=>e.phone===phone && e.id!==editId); if(d){ alert('SĐT đã được dùng bởi '+d.id); return; } }
  const data={
    id, name, email, phone,
    dept:document.getElementById('f-dept').value,
    pos:document.getElementById('f-pos').value.trim(),
    joined:document.getElementById('f-joined').value||todayStr(),
    salary,
    status:document.getElementById('f-status').value,
    kpi:Math.max(0,Math.min(100,parseInt(document.getElementById('f-kpi').value)||0)),
  };
  if(editId){ const e=empById(editId); Object.assign(e,data); }
  else { EMP().push(data); }
  setEmpShiftCodes(id, shiftCodes);
  saveDB(); closeModal('emp-modal'); refreshAll();
}
// Xóa nhân viên và xóa luôn link ca để tránh dữ liệu rác trong employeeShifts.
function deleteEmp(id){
  if(!can('admin,hr')) return;
  const e=empById(id); if(!e) return;
  if(!confirm('Xóa nhân viên '+e.name+' ('+id+')?')) return;
  DB.employees = EMP().filter(x=>x.id!==id);
  removeEmpShiftLinks(id);
  Object.keys(DB.attendance||{}).forEach(date=>{ delete DB.attendance[date][id]; });
  saveDB(); refreshAll();
}

/* ===================== DEPARTMENTS ===================== */
function renderDepartments(){
  const ds=getDeptStats();
  const canEdit=can('admin,hr');
  document.getElementById('dept-cards').innerHTML = DEPTS().map(d=>{
    const st=ds[d.name]||{count:0,salarySum:0,avgKpi:0};
    return `<div class="card dept-detail-card" style="border-top:3px solid ${d.color}">
      <div class="card-body">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div><div class="dept-badge" style="background:${d.color}">${esc(d.code)}</div>
            <h3 style="margin:10px 0 2px">${esc(d.name)}</h3>
            <p style="font-size:12.5px;color:var(--text-muted);margin:0">${esc(d.desc||'')}</p></div>
          ${canEdit?`<div style="display:flex;gap:4px"><button class="icon-btn" onclick="openDeptModal('${esc(d.code)}')">✏️</button>
            <button class="icon-btn" onclick="deleteDept('${esc(d.code)}')">🗑️</button></div>`:''}
        </div>
        <div class="dept-stats">
          <div><div class="ds-num">${st.count}</div><div class="ds-lbl">Nhân viên</div></div>
          <div><div class="ds-num">${st.avgKpi||0}</div><div class="ds-lbl">KPI TB</div></div>
          <div><div class="ds-num">${fmt((st.salarySum||0)/1e6)}tr</div><div class="ds-lbl">Quỹ lương</div></div>
        </div>
        <div style="margin-top:12px;font-size:13px"><span style="color:var(--text-muted)">Trưởng phòng:</span> <strong>${esc(d.head||'—')}</strong></div>
      </div></div>`;
  }).join('');
}
function openDeptModal(code){
  if(!can('admin,hr')) return;
  document.getElementById('d-head').innerHTML='<option value="">—</option>'+EMP().map(e=>`<option>${esc(e.name)}</option>`).join('');
  if(code){
    const d=DEPTS().find(x=>x.code===code);
    document.getElementById('dept-modal-title').textContent='✏️ Sửa phòng ban';
    document.getElementById('d-edit-name').value=d.code;
    document.getElementById('d-code').value=d.code; document.getElementById('d-code').readOnly=true;
    document.getElementById('d-name').value=d.name;
    document.getElementById('d-head').value=d.head||'';
    document.getElementById('d-desc').value=d.desc||'';
    document.getElementById('d-color').value=d.color||'#3b82f6';
  } else {
    document.getElementById('dept-modal-title').textContent='🏢 Thêm phòng ban';
    document.getElementById('d-edit-name').value='';
    ['d-code','d-name','d-desc'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('d-code').readOnly=false;
    document.getElementById('d-color').value='#3b82f6';
  }
  openModal('dept-modal');
}
function saveDept(){
  const editCode=document.getElementById('d-edit-name').value;
  const code=document.getElementById('d-code').value.trim();
  const name=document.getElementById('d-name').value.trim();
  if(!code||!name){ alert('Nhập mã và tên phòng ban'); return; }
  const dup=DEPTS().find(d=>d.code===code && d.code!==editCode);
  if(dup){ alert('Mã phòng ban đã tồn tại'); return; }
  const data={code,name,head:document.getElementById('d-head').value,
    desc:document.getElementById('d-desc').value.trim(),color:document.getElementById('d-color').value};
  if(editCode){
    const d=DEPTS().find(x=>x.code===editCode);
    const oldName=d.name; Object.assign(d,data);
    // đổi tên phòng ban -> cập nhật NV
    if(oldName!==name) EMP().forEach(e=>{ if(e.dept===oldName) e.dept=name; });
  } else { DEPTS().push(data); }
  saveDB(); closeModal('dept-modal'); refreshAll();
}
function deleteDept(code){
  if(!can('admin,hr')) return;
  const d=DEPTS().find(x=>x.code===code); if(!d) return;
  const cnt=EMP().filter(e=>e.dept===d.name).length;
  if(cnt){ alert('Không thể xóa: còn '+cnt+' nhân viên thuộc phòng "'+d.name+'". Hãy chuyển họ sang phòng khác trước.'); return; }
  if(!confirm('Xóa phòng ban '+d.name+'?')) return;
  DB.depts=DEPTS().filter(x=>x.code!==code);
  saveDB(); refreshAll();
}

/* ===================== SHIFTS ===================== */
// Render danh mục ca và chart số nhân viên/ca. Số NV được đếm từ employeeShifts.
function renderShifts(){
  const canEdit=can('admin,hr');
  const countSets={};
  SHIFTS().forEach(s=>countSets[s.code]=new Set());
  EMP_SHIFTS().forEach(x=>{ if(countSets[x.shiftCode]) countSets[x.shiftCode].add(x.empId); });
  document.getElementById('shift-tbody').innerHTML = SHIFTS().map(s=>`<tr>
    <td><strong>${esc(s.code)}</strong></td><td>${esc(s.name)}</td>
    <td>${esc(s.start)}</td><td>${esc(s.end)}</td>
    <td>${s.grace} phút</td><td>×${s.ot}</td><td>${countSets[s.code]?.size||0}</td>
    <td>${canEdit?`<button class="icon-btn" onclick="openShiftModal('${esc(s.code)}')">✏️</button>
      <button class="icon-btn" onclick="deleteShift('${esc(s.code)}')">🗑️</button>`:'—'}</td>
  </tr>`).join('');
  renderBarChart(document.getElementById('chart-shift'),
    SHIFTS().map((s,i)=>({label:s.name, value:countSets[s.code]?.size||0, color:avColor(i)})));
}
function openShiftModal(code){
  if(!can('admin,hr')) return;
  if(code){
    const s=SHIFTS().find(x=>x.code===code);
    document.getElementById('shift-modal-title').textContent='✏️ Sửa ca làm việc';
    document.getElementById('s-edit-name').value=s.code;
    document.getElementById('s-code').value=s.code; document.getElementById('s-code').readOnly=true;
    document.getElementById('s-name').value=s.name;
    document.getElementById('s-start').value=s.start;
    document.getElementById('s-end').value=s.end;
    document.getElementById('s-grace').value=s.grace;
    document.getElementById('s-ot').value=s.ot;
  } else {
    document.getElementById('shift-modal-title').textContent='📅 Thêm ca làm việc';
    document.getElementById('s-edit-name').value='';
    document.getElementById('s-code').value=''; document.getElementById('s-code').readOnly=false;
    document.getElementById('s-name').value='';
    document.getElementById('s-start').value='08:00'; document.getElementById('s-end').value='17:00';
    document.getElementById('s-grace').value='10'; document.getElementById('s-ot').value='1.5';
  }
  openModal('shift-modal');
}
// Lưu ca làm. Nếu đổi mã ca khi sửa, cần cập nhật lại employeeShifts và attendance liên quan.
function saveShift(){
  const editCode=document.getElementById('s-edit-name').value;
  const code=document.getElementById('s-code').value.trim();
  const name=document.getElementById('s-name').value.trim();
  if(!code||!name){ alert('Nhập mã và tên ca'); return; }
  const dup=SHIFTS().find(s=>s.code===code && s.code!==editCode);
  if(dup){ alert('Mã ca đã tồn tại'); return; }
  const data={code,name,start:document.getElementById('s-start').value,end:document.getElementById('s-end').value,
    grace:parseInt(document.getElementById('s-grace').value)||0,ot:parseFloat(document.getElementById('s-ot').value)||1};
  if(editCode){ const s=SHIFTS().find(x=>x.code===editCode); Object.assign(s,data); }
  else { SHIFTS().push(data); }
  saveDB(); closeModal('shift-modal'); refreshAll();
}
// Xóa ca làm và dọn link ca khỏi employeeShifts; nhân viên thiếu ca sẽ được migration/fallback xử lý.
function deleteShift(code){
  if(!can('admin,hr')) return;
  const s=SHIFTS().find(x=>x.code===code); if(!s) return;
  const cnt=new Set(EMP_SHIFTS().filter(x=>x.shiftCode===code).map(x=>x.empId)).size;
  if(cnt){ alert('Không thể xóa: còn '+cnt+' nhân viên được phân ca "'+s.name+'".'); return; }
  if(!confirm('Xóa ca '+s.name+'?')) return;
  DB.shifts=SHIFTS().filter(x=>x.code!==code);
  saveDB(); refreshAll();
}

/* ===================== ATTENDANCE ===================== */
const ATT_STATUS = {
  present:{lbl:'Đúng giờ', cls:'badge-success'},
  late:{lbl:'Muộn / về sớm', cls:'badge-warning'},
  absent:{lbl:'Vắng', cls:'badge-danger'},
  leave:{lbl:'Nghỉ phép', cls:'badge-info'},
};
// Render màn chấm công ngày. Mỗi nhân viên có thể có nhiều dòng nếu được gán nhiều ca.
function renderAttendance(){
  const dateEl=document.getElementById('att-date');
  if(!dateEl.value) dateEl.value=todayStr();
  const date=dateEl.value;
  document.getElementById('att-date-lbl').textContent=date;
  const day=getDayAttendance(date);
  saveDB();
  // nếu là nhân viên thường -> chỉ xem bản thân
  let emps=EMP();
  if(role()==='employee' && SESSION.empId) emps=emps.filter(e=>e.id===SESSION.empId);
  let p=0,l=0,a=0,lv=0;
  const rows=[];
  emps.forEach(e=>{
    dayRecordsForEmp(day,e.id).forEach(r=>{
      if(r.status==='present')p++;else if(r.status==='late')l++;else if(r.status==='absent')a++;else if(r.status==='leave')lv++;
      const st=ATT_STATUS[r.status]||ATT_STATUS.absent;
      const meta=attendanceMeta(e,r);
      rows.push(`<tr>
        <td><div class="emp-cell">${empAvatar(e,EMP().indexOf(e))}<div><div class="emp-name">${esc(e.name)}</div><div class="emp-sub">${esc(e.id)}</div></div></div></td>
        <td><span class="dept-tag" style="background:${deptColor(e.dept)}22;color:${deptColor(e.dept)}">${esc(e.dept)}</span></td>
        <td>${meta.shift?`<strong>${esc(meta.shift.name)}</strong><div class="att-sub">${esc(meta.shift.start)}–${esc(meta.shift.end)} · grace ${meta.shift.grace}p</div>`:'<span class="badge badge-gray">Chưa phân ca</span>'}</td>
        <td>${esc(r.in||'—')}</td><td>${esc(r.out||'—')}</td>
        <td><span class="badge ${st.cls}">${st.lbl}</span><div class="att-reason">${esc(meta.reason)}</div></td>
        <td style="font-size:12.5px;color:var(--text-muted)">${esc(r.note||'')}</td>
        <td><button class="btn btn-outline btn-xs" onclick="openAttendanceDetail('${esc(date)}','${esc(e.id)}','${esc(r.id)}')">Chi tiết</button></td>
      </tr>`);
    });
  });
  document.getElementById('att-p').textContent=p;
  document.getElementById('att-l').textContent=l;
  document.getElementById('att-a').textContent=a;
  document.getElementById('att-lv').textContent=lv;
  document.getElementById('att-tbody').innerHTML = rows.length ? rows.join('') : `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:30px">Chưa có bản ghi chấm công</td></tr>`;
}

// Khi chọn nhân viên trong modal chấm công, dropdown ca chỉ hiện các ca đã gán cho nhân viên đó.
function fillCheckinShiftSelect(){
  const emp=empById(document.getElementById('ci-emp')?.value);
  const sel=document.getElementById('ci-shift'); if(!sel || !emp) return;
  const shifts=getEmpShifts(emp.id);
  sel.innerHTML=(shifts.length?shifts:SHIFTS()).map(s=>`<option value="${esc(s.code)}">${esc(s.name)} (${esc(s.start)}–${esc(s.end)})</option>`).join('');
  const first=shifts[0] || SHIFTS()[0];
  if(first) sel.value=first.code;
  if(first){ document.getElementById('ci-in').value=first.start; document.getElementById('ci-out').value=first.end; }
  toggleCheckinType();
}
// Mở modal chấm công thủ công, default ngày đang chọn ở màn attendance.
function openCheckinModal(){
  if(!can('admin,hr,manager')) return;
  document.getElementById('ci-emp').innerHTML=EMP().map(e=>`<option value="${e.id}">${esc(e.id)} – ${esc(e.name)}</option>`).join('');
  document.getElementById('ci-date').value=document.getElementById('att-date').value||todayStr();
  document.getElementById('ci-type').value='work';
  document.getElementById('ci-note').value='';
  fillCheckinShiftSelect();
  openModal('checkin-modal');
}
// Cập nhật preview trạng thái trong modal chấm công khi đổi loại/giờ/ca.
function toggleCheckinType(){
  const t=document.getElementById('ci-type').value;
  const show = t==='work';
  document.getElementById('ci-in').closest('.form-grid-2').style.display = show?'':'none';
  // preview
  const emp=empById(document.getElementById('ci-emp').value);
  if(emp){
    const rec={shiftCode:document.getElementById('ci-shift').value,in:document.getElementById('ci-in').value,out:document.getElementById('ci-out').value,type:t};
    const status=computeAttStatus(emp,rec);
    const st=ATT_STATUS[status];
    const meta=attendanceMeta(emp,rec);
    document.getElementById('ci-preview').innerHTML=`Kết quả tự động: <span class="badge ${st.cls}">${st.lbl}</span> · <strong>${esc(meta.shift?.name||'Chưa phân ca')}</strong><br><span style="color:var(--text-muted)">${esc(meta.reason)}</span>`;
  }
}
// Lưu một record công thủ công vào đúng ngày + nhân viên + ca.
function saveCheckin(){
  if(!can('admin,hr,manager')) return;
  const empId=document.getElementById('ci-emp').value;
  const date=document.getElementById('ci-date').value;
  const emp=empById(empId);
  if(!emp||!date){ alert('Chọn nhân viên và ngày'); return; }
  const type=document.getElementById('ci-type').value;
  const shiftCode=document.getElementById('ci-shift').value;
  const rec={id:makeAttRecId(date,empId,shiftCode,0), shiftCode,
             in:type==='work'?document.getElementById('ci-in').value:'',
             out:type==='work'?document.getElementById('ci-out').value:'',
             type, note:document.getElementById('ci-note').value.trim()};
  rec.status=computeAttStatus(emp,rec);
  if(!DB.attendance[date]) DB.attendance[date]={};
  const records=normalizeAttendanceEntry(date,empId,DB.attendance[date][empId]||[]);
  const idx=records.findIndex(x=>(x.shiftCode||'')===(shiftCode||''));
  if(idx>=0){ rec.id=records[idx].id; records[idx]=rec; }
  else { rec.id=makeAttRecId(date,empId,shiftCode,records.length); records.push(rec); }
  DB.attendance[date][empId]=records;
  saveDB(); closeModal('checkin-modal');
  document.getElementById('att-date').value=date;
  renderAttendance();
}

// Modal chi tiết công: giải thích vì sao record bị late/present/leave/absent.
function openAttendanceDetail(date, empId, recId){
  const emp=empById(empId);
  const rec=findAttendanceRecord(date, empId, recId);
  if(!emp||!rec) return;
  const st=ATT_STATUS[rec.status]||ATT_STATUS.absent;
  const meta=attendanceMeta(emp,rec);
  const shift=meta.shift;
  document.getElementById('att-detail-body').innerHTML=`
    <div class="detail-hero">
      ${empAvatar(emp,EMP().indexOf(emp))}
      <div><div class="emp-name">${esc(emp.name)}</div><div class="emp-sub">${esc(emp.id)} · ${esc(emp.dept)}</div></div>
      <span class="badge ${st.cls}" style="margin-left:auto">${st.lbl}</span>
    </div>
    <div class="detail-grid">
      <div><span>Ngày</span><strong>${esc(date)}</strong></div>
      <div><span>Ca áp dụng</span><strong>${esc(shift?.name||'Chưa phân ca')}</strong></div>
      <div><span>Giờ ca</span><strong>${shift?esc(shift.start+'–'+shift.end):'—'}</strong></div>
      <div><span>Cho phép muộn</span><strong>${shift?shift.grace+' phút':'—'}</strong></div>
      <div><span>Giờ vào</span><strong>${esc(rec.in||'—')}</strong></div>
      <div><span>Giờ ra</span><strong>${esc(rec.out||'—')}</strong></div>
      <div><span>Đi muộn</span><strong>${meta.lateMinutes} phút</strong></div>
      <div><span>Về sớm</span><strong>${meta.earlyMinutes} phút</strong></div>
    </div>
    <div class="ci-preview"><strong>Kết luận:</strong> ${esc(meta.reason)}${rec.note?`<br><strong>Ghi chú:</strong> ${esc(rec.note)}`:''}</div>
  `;
  openModal('att-detail-modal');
}

/* ===================== SALARY ===================== */
let SAL_FILTER_BUCKET = null;  // lọc theo cột phân phối lương

function curSalMonth(){
  const el=document.getElementById('sal-month');
  if(el && !el.value) el.value=curMonth();
  return el? el.value : curMonth();
}
function allSalaries(month){
  let emps=EMP();
  if(role()==='employee' && SESSION.empId) emps=emps.filter(e=>e.id===SESSION.empId);
  return emps.map(e=>calcSalary(e,month));
}
// Render tổng quan lương theo tháng và chart phân phối thực nhận.
function renderSalary(){
  const month=curSalMonth();
  const rows=allSalaries(month);
  const nets=rows.map(r=>r.net);
  const total=nets.reduce((a,b)=>a+b,0);
  document.getElementById('sal-total').textContent=fmt(total);
  document.getElementById('sal-avg').textContent=rows.length?fmt(total/rows.length):0;
  document.getElementById('sal-max').textContent=nets.length?fmt(Math.max(...nets)):0;
  document.getElementById('sal-min').textContent=nets.length?fmt(Math.min(...nets)):0;
  // phân phối theo bucket triệu
  const buckets=[
    {label:'<10tr',min:0,max:10e6},{label:'10–15tr',min:10e6,max:15e6},
    {label:'15–20tr',min:15e6,max:20e6},{label:'20–25tr',min:20e6,max:25e6},{label:'≥25tr',min:25e6,max:Infinity},
  ];
  const counts=buckets.map(b=>rows.filter(r=>r.net>=b.min && r.net<b.max).length);
  renderBarChart(document.getElementById('chart-salary-dist'),
    buckets.map((b,i)=>({label:b.label,value:counts[i],color:SAL_FILTER_BUCKET===i?'#1d4ed8':avColor(i)})),
    {clickable:true,onClick:'filterSalaryByBucket'});
  // badge trạng thái chốt
  const locked=isSalaryLocked(month);
  const badge=document.getElementById('sal-status-badge');
  badge.className='badge '+(locked?'badge-success':'badge-warning');
  badge.textContent=locked?'✓ Đã chốt':'Chưa chốt';
  const btn=document.getElementById('sal-confirm-btn');
  if(btn){ btn.textContent=locked?'🔓 Mở khóa bảng lương':'🔒 Kế toán chốt lương'; }
  document.getElementById('salary-period-lbl').textContent='Bảng lương kỳ '+month+' — tính từ bảng công thật + cấu hình ở trang Cài đặt';
  populateDeptFilters();
  renderSalaryTable();
}
function filterSalaryByBucket(i){
  SAL_FILTER_BUCKET = (SAL_FILTER_BUCKET===i)?null:i;
  renderSalary();
}
// Render bảng lương chi tiết, có filter phòng ban và filter theo bucket chart.
function renderSalaryTable(){
  const month=curSalMonth();
  let rows=allSalaries(month);
  const dept=document.getElementById('sal-dept-filter')?.value||'';
  if(dept) rows=rows.filter(r=>r.emp.dept===dept);
  const buckets=[[0,10e6],[10e6,15e6],[15e6,20e6],[20e6,25e6],[25e6,Infinity]];
  if(SAL_FILTER_BUCKET!=null){ const[b0,b1]=buckets[SAL_FILTER_BUCKET]; rows=rows.filter(r=>r.net>=b0&&r.net<b1); }
  const locked=isSalaryLocked(month);
  document.getElementById('salary-tbody').innerHTML = rows.map((r,i)=>`<tr>
    <td><div class="emp-cell">${empAvatar(r.emp,EMP().indexOf(r.emp))}<div><div class="emp-name">${esc(r.emp.name)}</div><div class="emp-sub">${esc(r.emp.id)}</div></div></div></td>
    <td><span class="dept-tag" style="background:${deptColor(r.emp.dept)}22;color:${deptColor(r.emp.dept)}">${esc(r.emp.dept)}</span></td>
    <td>${fmt(r.base)}</td>
    <td>${r.actualWork}/${r.std}${r.lateCount?` <span style="color:var(--warning)">(${r.lateCount} muộn)</span>`:''}</td>
    <td style="color:var(--success)">+${fmt(r.allowance)}</td>
    <td>${r.otPay?'+'+fmt(r.otPay):'—'}</td>
    <td style="color:var(--danger)">${r.penalty?'-'+fmt(r.penalty):'—'}</td>
    <td style="color:var(--danger)">-${fmt(r.bh)}</td>
    <td style="color:var(--danger)">${r.tax?'-'+fmt(r.tax):'0'}</td>
    <td>${r.bonus?'<span style="color:var(--success)">+'+fmt(r.bonus)+'</span>':'—'}</td>
    <td><strong style="color:var(--primary)">${fmt(r.net)}</strong></td>
    <td><button class="icon-btn" title="Phiếu lương" onclick="showPayslip('${r.emp.id}')">📄</button></td>
  </tr>`).join('') || `<tr><td colspan="12" style="text-align:center;color:var(--text-muted);padding:24px">Không có dữ liệu</td></tr>`;
}
function toggleSalaryLock(){
  if(!can('admin,accountant')) return;
  const month=curSalMonth();
  const locked=isSalaryLocked(month);
  if(!locked){ if(!confirm('Chốt bảng lương kỳ '+month+'? Sau khi chốt, số liệu được đánh dấu đã duyệt.')) return; }
  DB.salaryLock[month]=!locked;
  saveDB(); renderSalary();
}
// Hiển thị phiếu lương một nhân viên, dùng lại calcSalary() để tránh lệch số liệu.
function showPayslip(empId){
  const month=curSalMonth();
  const e=empById(empId); if(!e) return;
  const r=calcSalary(e,month);
  const gross=r.earnedBase+r.allowance+r.otPay+r.bonus;
  document.getElementById('payslip-body').innerHTML=`
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-weight:700;font-size:16px">${esc(CFG().company)}</div>
      <div style="color:var(--text-muted);font-size:13px">Phiếu lương kỳ ${month}</div></div>
    <div class="ps-row"><span>Nhân viên</span><strong>${esc(e.name)} (${esc(e.id)})</strong></div>
    <div class="ps-row"><span>Phòng ban / Chức vụ</span><span>${esc(e.dept)} · ${esc(e.pos||'')}</span></div>
    <div class="ps-row"><span>Công thực tế</span><span>${r.actualWork}/${r.std} công${r.lateCount?` · ${r.lateCount} lần muộn`:''}${r.absentCount?` · ${r.absentCount} vắng`:''}</span></div>
    <hr class="ps-hr">
    <div class="ps-row"><span>Lương theo công</span><strong>${fmt(r.earnedBase)}</strong></div>
    <div class="ps-row"><span>Phụ cấp (ăn trưa+xăng+ĐT)</span><span style="color:var(--success)">+${fmt(r.allowance)}</span></div>
    ${r.otPay?`<div class="ps-row"><span>Tăng ca (OT)</span><span style="color:var(--success)">+${fmt(r.otPay)}</span></div>`:''}
    ${r.bonus?`<div class="ps-row"><span>Thưởng</span><span style="color:var(--success)">+${fmt(r.bonus)}</span></div>`:''}
    <div class="ps-row"><span>Tổng thu nhập</span><strong>${fmt(gross)}</strong></div>
    <hr class="ps-hr">
    ${r.penalty?`<div class="ps-row"><span>Trừ muộn/vắng</span><span style="color:var(--danger)">-${fmt(r.penalty)}</span></div>`:''}
    <div class="ps-row"><span>BHXH+BHYT+BHTN (10.5%)</span><span style="color:var(--danger)">-${fmt(r.bh)}</span></div>
    <div class="ps-row"><span>Thuế TNCN</span><span style="color:var(--danger)">-${fmt(r.tax)}</span></div>
    <hr class="ps-hr">
    <div class="ps-row" style="font-size:16px"><span><strong>Thực nhận</strong></span><strong style="color:var(--primary)">${fmt(r.net)} đ</strong></div>`;
  openModal('payslip-modal');
}

/* ===================== PERFORMANCE / KPI ===================== */
function kpiPeriods(){
  // các kỳ có sẵn + kỳ hiện tại
  const set=new Set(Object.keys(DB.kpi)); set.add(curMonth());
  return Array.from(set).sort().reverse();
}
function curKpiPeriod(){
  const el=document.getElementById('kpi-period');
  return el && el.value ? el.value : curMonth();
}
function empKpi(empId, period){
  const rec=DB.kpi[period]?.[empId];
  if(rec) return rec.total;
  return empById(empId)?.kpi || 0;  // fallback điểm tổng hợp trên hồ sơ
}
function kpiRank(score){
  if(score>=90) return {lbl:'Xuất sắc', cls:'badge-success'};
  if(score>=80) return {lbl:'Tốt', cls:'badge-info'};
  if(score>=70) return {lbl:'Khá', cls:'badge-warning'};
  return {lbl:'Cần cải thiện', cls:'badge-danger'};
}
// Render KPI theo kỳ: trung bình phòng ban, top 3 và bảng đánh giá từng nhân viên.
function renderPerformance(){
  // populate periods select
  const sel=document.getElementById('kpi-period');
  if(sel){ const cur=sel.value; sel.innerHTML=kpiPeriods().map(p=>`<option>${p}</option>`).join(''); sel.value=cur||curMonth(); }
  const period=curKpiPeriod();
  let emps=EMP();
  if(role()==='employee' && SESSION.empId) emps=emps.filter(e=>e.id===SESSION.empId);
  // KPI TB theo phòng ban
  const byDept={};
  emps.forEach(e=>{ const k=empKpi(e.id,period); (byDept[e.dept]=byDept[e.dept]||[]).push(k); });
  const deptBars=document.getElementById('kpi-dept-bars');
  deptBars.innerHTML=Object.keys(byDept).map(d=>{
    const avg=Math.round(byDept[d].reduce((a,b)=>a+b,0)/byDept[d].length);
    return `<div class="kpi-bar-row"><div class="kpi-bar-lbl">${esc(d)}</div>
      <div class="kpi-bar-track"><div class="kpi-bar-fill" style="width:${avg}%;background:${deptColor(d)}"></div></div>
      <div class="kpi-bar-val">${avg}</div></div>`;
  }).join('');
  // Top 3
  const ranked=EMP().map(e=>({e,k:empKpi(e.id,period)})).sort((a,b)=>b.k-a.k).slice(0,3);
  document.getElementById('kpi-top3').innerHTML=ranked.map((r,i)=>`<div class="top3-row">
    <div class="top3-medal">${['🥇','🥈','🥉'][i]}</div>
    ${empAvatar(r.e,EMP().indexOf(r.e))}
    <div style="flex:1"><div class="emp-name">${esc(r.e.name)}</div><div class="emp-sub">${esc(r.e.dept)}</div></div>
    <div class="top3-score">${r.k}</div></div>`).join('');
  // bảng đầy đủ
  const canEval=can('admin,hr,manager');
  const rows=emps.map(e=>({e,k:empKpi(e.id,period)})).sort((a,b)=>b.k-a.k);
  document.getElementById('kpi-tbody').innerHTML=rows.map((r,i)=>{
    const rk=kpiRank(r.k); const by=DB.kpi[period]?.[r.e.id]?.by||'—';
    return `<tr>
      <td>${i+1}</td>
      <td><div class="emp-cell">${empAvatar(r.e,EMP().indexOf(r.e))}<div><div class="emp-name">${esc(r.e.name)}</div><div class="emp-sub">${esc(r.e.id)}</div></div></div></td>
      <td><span class="dept-tag" style="background:${deptColor(r.e.dept)}22;color:${deptColor(r.e.dept)}">${esc(r.e.dept)}</span></td>
      <td><strong>${r.k}</strong></td>
      <td><div class="kpi-bar-track" style="width:90px"><div class="kpi-bar-fill" style="width:${r.k}%;background:${r.k>=80?'var(--success)':r.k>=70?'var(--warning)':'var(--danger)'}"></div></div></td>
      <td><span class="badge ${rk.cls}">${rk.lbl}</span></td>
      <td style="font-size:12.5px;color:var(--text-muted)">${esc(by)}</td>
      ${canEval?`<td><button class="icon-btn" title="Chấm KPI" onclick="openKpiModal('${r.e.id}')">📝</button></td>`:'<td></td>'}
    </tr>`;
  }).join('');
}
function openKpiModal(empId){
  if(!can('admin,hr,manager')) return;
  const e=empById(empId); if(!e) return;
  const period=curKpiPeriod();
  document.getElementById('kpi-modal-title').textContent='🎯 Đánh giá KPI – '+e.name+' ('+period+')';
  document.getElementById('k-emp-id').value=empId;
  const existing=DB.kpi[period]?.[empId];
  document.getElementById('k-criteria').innerHTML=KPI_CRITERIA.map(c=>{
    const val=existing?existing[c.key]:e.kpi;
    return `<div class="form-group">
      <label class="form-label">${c.label} <span style="color:var(--text-muted);font-weight:400">(trọng số ${Math.round(c.weight*100)}%)</span></label>
      <input class="form-control kpi-input" data-key="${c.key}" data-weight="${c.weight}" type="number" min="0" max="100" value="${val}" oninput="recalcKpiTotal()">
    </div>`;
  }).join('');
  recalcKpiTotal();
  openModal('kpi-modal');
}
function recalcKpiTotal(){
  let total=0;
  document.querySelectorAll('#k-criteria .kpi-input').forEach(inp=>{
    const v=Math.max(0,Math.min(100,parseFloat(inp.value)||0));
    total+=v*parseFloat(inp.dataset.weight);
  });
  document.getElementById('k-total').textContent=Math.round(total);
}
// Lưu điểm KPI theo kỳ và cập nhật emp.kpi để các màn khác dùng số mới nhất.
function saveKpi(){
  if(!can('admin,hr,manager')) return;
  const empId=document.getElementById('k-emp-id').value;
  const period=curKpiPeriod();
  const rec={by:SESSION.name};
  let total=0;
  document.querySelectorAll('#k-criteria .kpi-input').forEach(inp=>{
    const v=Math.max(0,Math.min(100,parseFloat(inp.value)||0));
    rec[inp.dataset.key]=v; total+=v*parseFloat(inp.dataset.weight);
  });
  rec.total=Math.round(total);
  if(!DB.kpi[period]) DB.kpi[period]={};
  DB.kpi[period][empId]=rec;
  // đồng bộ điểm tổng hợp lên hồ sơ NV
  const e=empById(empId); if(e) e.kpi=rec.total;
  saveDB(); closeModal('kpi-modal'); refreshAll();
}

/* ===================== REPORTS ===================== */
// Render trang báo cáo tổng hợp bằng các chart HTML/CSS hiện có.
function renderReports(){
  const ds=getDeptStats(); const names=Object.keys(ds);
  renderBarChart(document.getElementById('chart-report-dept'),
    names.map(d=>({label:d,value:ds[d].count,color:deptColor(d)})));
  const tot=totalSalary()||1;
  document.getElementById('report-salary-share').innerHTML=names.map(d=>{
    const pct=Math.round(ds[d].salarySum/tot*100);
    return `<div class="kpi-bar-row"><div class="kpi-bar-lbl">${esc(d)}</div>
      <div class="kpi-bar-track"><div class="kpi-bar-fill" style="width:${pct}%;background:${deptColor(d)}"></div></div>
      <div class="kpi-bar-val">${pct}%</div></div>`;
  }).join('');
}

/* ===================== SETTINGS ===================== */
function renderSettings(){
  const c=CFG();
  const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.value=v; };
  set('set-company',c.company); set('set-email',c.email);
  set('setting-size',EMP().length+' nhân viên');
  set('set-lunch',c.lunch); set('set-fuel',c.fuel); set('set-phone-allow',c.phoneAllow);
  set('set-ot',c.ot); set('set-bhxh',c.bhxh); set('set-bhyt',c.bhyt); set('set-bhtn',c.bhtn);
  set('set-personal-relief',c.personalRelief); set('set-standard-days',c.standardDays);
  set('set-late-penalty',c.latePenalty);
  // bảng tài khoản (chỉ admin)
  const tb=document.getElementById('users-tbody');
  if(tb) tb.innerHTML=DB.users.map(u=>`<tr>
    <td><strong>${esc(u.user)}</strong></td><td>${esc(u.name)}</td>
    <td><span class="badge badge-info">${ROLES[u.role].label}</span></td>
    <td style="font-size:12.5px;color:var(--text-muted)">${ROLES[u.role].scope}</td></tr>`).join('');
}
// Lưu cấu hình công/lương/phụ cấp/phạt; các kỳ lương sau sẽ dùng cấu hình mới.
function saveSettings(){
  if(!can('admin,accountant')) return;
  const c=CFG();
  const num=(id,def)=>{ const v=parseFloat(document.getElementById(id).value); return isNaN(v)?def:v; };
  c.company=document.getElementById('set-company').value.trim()||c.company;
  c.email=document.getElementById('set-email').value.trim()||c.email;
  c.lunch=num('set-lunch',c.lunch); c.fuel=num('set-fuel',c.fuel); c.phoneAllow=num('set-phone-allow',c.phoneAllow);
  c.ot=num('set-ot',c.ot); c.bhxh=num('set-bhxh',c.bhxh); c.bhyt=num('set-bhyt',c.bhyt); c.bhtn=num('set-bhtn',c.bhtn);
  c.personalRelief=num('set-personal-relief',c.personalRelief);
  c.standardDays=num('set-standard-days',c.standardDays); c.latePenalty=num('set-late-penalty',c.latePenalty);
  saveDB();
  alert('✓ Đã lưu cấu hình. Các tham số được áp dụng ngay khi tính lương.');
  refreshAll();
}

/* ===================== CSV EXPORT ===================== */
// Tạo file CSV phía client bằng Blob, không cần server.
function downloadCSV(filename, rows){
  const csv = rows.map(r=>r.map(cell=>{
    const s=String(cell==null?'':cell);
    return /[",\n;]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
  }).join(',')).join('\r\n');
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
function exportEmployeesCSV(){
  const rows=[['Mã NV','Họ tên','Chức vụ','Phòng ban','Ngày vào','Lương CB','KPI','Ca làm','Email','Điện thoại','Trạng thái']];
  EMP().forEach(e=>rows.push([e.id,e.name,e.pos,e.dept,e.joined,e.salary,e.kpi,getEmpShiftLabel(e.id),e.email,e.phone,
    e.status==='active'?'Đang làm':'Nghỉ phép']));
  downloadCSV('danh_sach_nhan_vien.csv',rows);
}
function exportSalaryCSV(){
  if(!can('admin,accountant')){ alert('Chỉ Kế toán/Admin được xuất bảng lương'); return; }
  const month=curSalMonth();
  const rows=[['Mã NV','Họ tên','Phòng ban','Lương CB','Công TT','Công chuẩn','Số lần muộn','Phụ cấp','OT','Trừ muộn/vắng','BHXH+YT+TN','Thuế TNCN','Thưởng','Thực nhận']];
  allSalaries(month).forEach(r=>rows.push([r.emp.id,r.emp.name,r.emp.dept,r.base,r.actualWork,r.std,r.lateCount,
    r.allowance,r.otPay,r.penalty,r.bh,r.tax,r.bonus,r.net]));
  downloadCSV('bang_luong_'+month+'.csv',rows);
}
function exportKpiCSV(){
  const period=curKpiPeriod();
  const rows=[['Hạng','Mã NV','Họ tên','Phòng ban','Điểm KPI','Xếp loại','Người đánh giá']];
  const ranked=EMP().map(e=>({e,k:empKpi(e.id,period)})).sort((a,b)=>b.k-a.k);
  ranked.forEach((r,i)=>rows.push([i+1,r.e.id,r.e.name,r.e.dept,r.k,kpiRank(r.k).lbl,
    DB.kpi[period]?.[r.e.id]?.by||'—']));
  downloadCSV('bao_cao_kpi_'+period+'.csv',rows);
}
// Xuất CSV chấm công. Với nhiều ca/ngày, mỗi record ca là một dòng CSV riêng.
function exportAttendanceCSV(){
  const date=document.getElementById('att-date').value||todayStr();
  const day=getDayAttendance(date);
  const rows=[['Ngày','Mã NV','Họ tên','Phòng ban','Ca làm','Giờ vào','Giờ ra','Tình trạng','Chi tiết muộn/về sớm','Ghi chú']];
  EMP().forEach(e=>{
    dayRecordsForEmp(day,e.id).forEach(r=>{
      const meta=attendanceMeta(e,r);
      rows.push([date,e.id,e.name,e.dept,meta.shift?.name||'',r.in||'',r.out||'',(ATT_STATUS[r.status]||ATT_STATUS.absent).lbl,meta.reason,r.note||'']);
    });
  });
  downloadCSV('cham_cong_'+date+'.csv',rows);
}

/* ===================== MODAL HELPERS ===================== */
function openModal(id){ const m=document.getElementById(id); if(m) m.classList.add('show'); }
function closeModal(id){ const m=document.getElementById(id); if(m) m.classList.remove('show'); }
function closeModalOnOverlay(ev,id){ if(ev.target.id===id) closeModal(id); }

/* ===================== REFRESH & INIT ===================== */
// Refresh các select/cache UI sau mỗi CRUD để các màn đang mở luôn đồng bộ.
function refreshAll(){
  applyRolePermissions();
  const active=document.querySelector('.page.active');
  if(!active) return;
  const page=active.id.replace('page-','');
  const map={dashboard:renderDashboard,employees:renderEmployeeTable,departments:renderDepartments,
    shifts:renderShifts,attendance:renderAttendance,salary:renderSalary,
    performance:renderPerformance,reports:renderReports,settings:renderSettings};
  if(map[page]) map[page]();
}

function showLoginHint(){
  const hint=document.getElementById('login-hint');
  if(hint) hint.innerHTML='<strong>Tài khoản demo:</strong><br>'+
    DB.users.map(u=>`${esc(u.user)} / ${esc(u.pass)} — ${ROLES[u.role].label}`).join('<br>');
}

// Điểm khởi động app: load DB, restore session, set default date/month và render login/app.
function init(){
  loadDB();
  // tự đăng nhập lại nếu có session
  try{
    const s=sessionStorage.getItem('hrpro_session');
    if(s){ const sv=JSON.parse(s); const ok=DB.users.find(u=>u.user===sv.user); if(ok){ SESSION=ok; } }
  }catch(e){}
  showLoginHint();
  // set ngày/tháng mặc định
  const ad=document.getElementById('att-date'); if(ad) ad.value=todayStr();
  const sm=document.getElementById('sal-month'); if(sm) sm.value=curMonth();
  if(SESSION){ showApp(); }
  else {
    document.getElementById('login-screen').style.display='flex';
    document.getElementById('app-shell').style.display='none';
  }
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
else init();