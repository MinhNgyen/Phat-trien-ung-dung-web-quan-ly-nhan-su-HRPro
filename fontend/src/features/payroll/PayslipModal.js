'use client';
import Modal from '@/components/ui/Modal';
import { fmt } from '@/lib/format';
import { incomeOf } from './payrollUtils';

const Row = ({ label, children, style }) => <div className="ps-row" style={style}><span>{label}</span>{children}</div>;

export default function PayslipModal({ payslip: p, company, onClose }) {
  return (
    <Modal
      title="📄 Phiếu lương"
      width={480}
      onClose={onClose}
      footer={<button type="button" className="btn btn-outline" onClick={onClose}>Đóng</button>}
    >
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{company}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Phiếu lương kỳ {p.month}</div>
      </div>
      <Row label="Nhân viên"><strong>{p.employee.name} ({p.employee.employeeCode})</strong></Row>
      <Row label="Phòng ban / Chức vụ"><span>{(p.employee.department || {}).name || ''} · {p.employee.position || ''}</span></Row>
      <Row label="Công thực tế"><span>{p.workDays}/{p.standardDays} công</span></Row>
      <hr className="ps-hr" />
      <Row label="Lương theo công"><strong>{fmt(p.baseSalary)}</strong></Row>
      <Row label="Phụ cấp (ăn trưa + xăng + điện thoại)"><span style={{ color: 'var(--success)' }}>+{fmt(p.allowance)}</span></Row>
      {p.overtime ? <Row label="Tăng ca (OT)"><span style={{ color: 'var(--success)' }}>+{fmt(p.overtime)}</span></Row> : null}
      <Row label="Tổng thu nhập"><strong>{fmt(incomeOf(p))}</strong></Row>
      <hr className="ps-hr" />
      <Row label="Khấu trừ (BHXH+BHYT+BHTN, phạt đi muộn...)"><span style={{ color: 'var(--danger)' }}>-{fmt(p.deduction)}</span></Row>
      <Row label="Thu nhập tính thuế"><span>{fmt(p.grossSalary)}</span></Row>
      <Row label="Thuế TNCN"><span style={{ color: 'var(--danger)' }}>-{fmt(p.tax)}</span></Row>
      <hr className="ps-hr" />
      <div className="ps-row" style={{ fontSize: 16 }}>
        <span><strong>Thực nhận</strong></span><strong style={{ color: 'var(--primary)' }}>{fmt(p.netSalary)} đ</strong>
      </div>
      {p.note && <div className="ci-preview" style={{ marginTop: 10 }}>{p.note}</div>}
    </Modal>
  );
}
