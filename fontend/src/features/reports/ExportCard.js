export default function ExportCard({ icon, title, desc, buttonLabel, onClick }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 12px' }}>{desc}</div>
      <button type="button" className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px' }} onClick={onClick}>{buttonLabel}</button>
    </div>
  );
}
