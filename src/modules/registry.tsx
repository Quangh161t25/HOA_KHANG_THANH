import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const MODULE_PAGES: Record<string, LazyExoticComponent<ComponentType>> = {
  dashboard: lazy(() => import('./dashboard/DashboardPage')),
  donHang: lazy(() => import('./don-hang/DonHangPage')),
  donHangNCC: lazy(() => import('./don-hang-ncc/DonHangNCCPage')),
  hoa: lazy(() => import('./hoa/HoaPage')),
  tonKho: lazy(() => import('./ton-kho/TonKhoPage')),
  ncc: lazy(() => import('./ncc/NCCPage')),
  npp: lazy(() => import('./npp/NPPPage')),
  congNo: lazy(() => import('./cong-no/CongNoPage')),
  thuChi: lazy(() => import('./thu-chi/ThuChiPage')),
  nhanVien: lazy(() => import('./nhan-vien/NhanVienPage')),
  phanQuyen: lazy(() => import('./phan-quyen/PhanQuyenPage')),
};
