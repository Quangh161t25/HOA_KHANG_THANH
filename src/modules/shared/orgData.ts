import { useQuery } from '@tanstack/react-query';
import positionsSeed from '@/data/positions.json';
import departmentsSeed from '@/data/departments.json';
import phongBanMapSeed from '@/data/phongBanMap.json';
import { createMockTable } from '@/lib/mockService';

export interface Position {
  id: string;
  ma_chuc_vu: string;
  ten_chuc_vu: string;
  cap_bac_id?: string;
  ten_cap_bac?: string;
  phong_ban_id?: string;
  id_phong_ban?: string;
  ten_phong_ban?: string;
  mo_ta?: string | null;
  thu_tu?: number;
  trang_thai: string;
  tg_tao?: string;
  tg_cap_nhat?: string;
}

export interface Department {
  id: string;
  ma_phong_ban: string;
  ten_phong_ban: string;
  cha_id: string | null;
  cap_do: number;
  trang_thai: string;
  thu_tu?: number;
}

/** Bảng tên phòng ban dùng trong module Tài liệu (giữ nguyên danh sách của bản gốc). */
export const PHONG_BAN_MAP = phongBanMapSeed as Record<string, string>;

const positionsTable = createMockTable<Position>('positions', positionsSeed as Position[], 400);
const departmentsTable = createMockTable<Department>('departments', departmentsSeed as Department[], 400);

export async function getPositions() {
  const rows = await positionsTable.getAll({ orderBy: 'thu_tu', ascending: true });
  // Bản gốc nhóm chức vụ theo id_phong_ban; dữ liệu mẫu lưu ở phong_ban_id.
  return rows.map((p) => ({ ...p, id_phong_ban: p.id_phong_ban ?? p.phong_ban_id }));
}

export const usePositions = () => useQuery({ queryKey: ['positions'], queryFn: getPositions, staleTime: 5 * 60 * 1000 });
export const useDepartments = () => useQuery({ queryKey: ['departments'], queryFn: () => departmentsTable.getAll(), staleTime: 5 * 60 * 1000 });
