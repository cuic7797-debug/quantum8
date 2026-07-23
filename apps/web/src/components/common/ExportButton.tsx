import { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';

interface Props {
  data: any[];
  filename: string;
  type?: 'csv' | 'json';
}

export default function ExportButton({ data, filename, type = 'csv' }: Props) {
  const [exported, setExported] = useState(false);

  function exportData() {
    if (!data.length) return;
    let content: string;
    let mimeType: string;
    let ext: string;

    if (type === 'csv') {
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(h => {
        const val = row[h];
        if (Array.isArray(val)) return '"' + val.join(',') + '"';
        if (typeof val === 'string' && val.includes(',')) return '"' + val + '"';
        return val;
      }).join(','));
      content = headers.join(',') + '\n' + rows.join('\n');
      mimeType = 'text/csv;charset=utf-8';
      ext = 'csv';
    } else {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    }

    const blob = new Blob(['\uFEFF' + content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.' + ext;
    a.click();
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  return (
    <button onClick={exportData}
      className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 transition-all">
      {exported ? <><FileText size={12} /> 已导出</> : <><Download size={12} /> 导出{type === 'csv' ? 'CSV' : 'JSON'}</>}
    </button>
  );
}
