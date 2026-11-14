import type { ComponentType } from 'react';

type PageModule = { default: ComponentType };
type PageLoader = () => Promise<PageModule>;

export const pageLoaders = {
  dashboard: () => import('./dashboard/DashboardPage'),
  donHang: () => import('./don-hang/DonHangPage'),
  donHangNcc: () => import('./don-hang-ncc/DonHangNCCPage'),
  hoa: () => import('./hoa/HoaPage'),
  tonKho: () => import('./ton-kho/TonKhoPage'),
  tonNgay: () => import('./ton-ngay/TonNgayPage'),
  ncc: () => import('./ncc/NCCPage'),
  npp: () => import('./npp/NPPPage'),
  congNo: () => import('./cong-no/CongNoPage'),
  congNoNcc: () => import('./cong-no-ncc/CongNoNCCPage'),
  thuChi: () => import('./thu-chi/ThuChiPage'),
  nhanVien: () => import('./nhan-vien/NhanVienPage'),
  phanQuyen: () => import('./phan-quyen/PhanQuyenPage'),
} satisfies Record<string, PageLoader>;

const loadersByPath: Record<string, PageLoader> = {
  '/': pageLoaders.dashboard,
  '/dashboard': pageLoaders.dashboard,
  '/don-hang': pageLoaders.donHang,
  '/don-hang-ncc': pageLoaders.donHangNcc,
  '/don-hang-nha-cung-cap': pageLoaders.donHangNcc,
  '/hoa': pageLoaders.hoa,
  '/danh-sach-hoa': pageLoaders.hoa,
  '/ton-kho': pageLoaders.tonKho,
  '/ton-ngay': pageLoaders.tonNgay,
  '/kiem-ton-ngay': pageLoaders.tonNgay,
  '/nha-cung-cap': pageLoaders.ncc,
  '/ncc': pageLoaders.ncc,
  '/nha-phan-phoi': pageLoaders.npp,
  '/npp': pageLoaders.npp,
  '/cong-no': pageLoaders.congNo,
  '/quan-ly-cong-no': pageLoaders.congNo,
  '/cong-no-ncc': pageLoaders.congNoNcc,
  '/quan-ly-cong-no-ncc': pageLoaders.congNoNcc,
  '/thu-chi': pageLoaders.thuChi,
  '/nhan-vien': pageLoaders.nhanVien,
  '/phan-quyen': pageLoaders.phanQuyen,
};

export function preloadRoute(path: string) {
  return loadersByPath[path]?.();
}
