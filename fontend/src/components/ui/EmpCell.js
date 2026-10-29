import EmpAvatar from './EmpAvatar';

// Ô "avatar + tên + mã/email" dùng trong bảng
export default function EmpCell({ employee, sub }) {
  return (
    <div className="emp-cell">
      <EmpAvatar employee={employee} />
      <div>
        <div className="emp-name">{employee.name}</div>
        <div className="emp-sub">{sub !== undefined ? sub : employee.employeeCode || ''}</div>
      </div>
    </div>
  );
}
