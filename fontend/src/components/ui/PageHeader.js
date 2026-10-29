export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div><h1>{title}</h1>{subtitle != null && <p>{subtitle}</p>}</div>
      {children && <div style={{ display: 'flex', gap: 10 }}>{children}</div>}
    </div>
  );
}
