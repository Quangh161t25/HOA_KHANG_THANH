import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

/** DD/MM/YYYY */
export function formatDate(value?: string | null) {
  return value == null || value === '' ? '' : dayjs(value).format('DD/MM/YYYY');
}

/** HH:mm - DD/MM/YYYY (định dạng ngày giờ dùng trong bảng của bản gốc) */
export function formatDateTime(value?: string | null) {
  return value == null || value === '' ? '' : dayjs(value).format('HH:mm - DD/MM/YYYY');
}

/** YYYY-MM-DD để gán vào input type=date */
export function toInputDate(value?: string | null) {
  return value == null || value === '' ? '' : dayjs(value).format('YYYY-MM-DD');
}

export function todayISODate() {
  return dayjs().format('YYYY-MM-DD');
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

/** Ngày tương đối so với hôm nay (YYYY-MM-DD), dùng cho dữ liệu mẫu. */
export function relativeDay(offset: number) {
  return dayjs().add(offset, 'day').format('YYYY-MM-DD');
}

/** Giải các mốc thời gian tương đối trong dữ liệu mẫu: __DN(n)__ (ngày), __AGO(n)__ (phút trước), __NOW__. */
export function resolveRelativeDates<T>(data: T): T {
  return JSON.parse(JSON.stringify(data), (_k, v) => {
    if (typeof v !== 'string') return v;
    const dn = v.match(/^__DN\((-?\d+)\)__$/);
    if (dn) return relativeDay(Number(dn[1]));
    const ago = v.match(/^__AGO\((\d+)\)__$/);
    if (ago) return dayjs().subtract(Number(ago[1]), 'minute').toISOString();
    if (v === '__NOW__') return new Date().toISOString();
    return v;
  });
}
