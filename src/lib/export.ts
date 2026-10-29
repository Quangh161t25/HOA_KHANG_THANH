import { todayISODate } from './format';

/** Xuất mảng đối tượng ra file Excel (tải thư viện xlsx khi cần). */
export async function exportToExcel(rows: Record<string, unknown>[], fileName: string) {
  if (!rows.length) return;
  const XLSX = await import('xlsx');
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Data');
  XLSX.writeFile(book, `${fileName}_${todayISODate()}.xlsx`);
}
