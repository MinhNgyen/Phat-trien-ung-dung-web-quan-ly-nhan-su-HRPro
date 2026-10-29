// Tạo và tải file CSV ngay trên trình duyệt (có BOM để Excel đọc đúng tiếng Việt)
export function toCsv(rows) {
  return rows.map((r) => r.map((cell) => {
    const s = String(cell == null ? '' : cell);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\r\n');
}

export function downloadCSV(filename, rows) {
  const url = URL.createObjectURL(new Blob(['\ufeff' + toCsv(rows)], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
