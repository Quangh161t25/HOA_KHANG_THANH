import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Feedback';
import { useAuthStore } from '@/stores/auth';
import LoginPage from '@/modules/auth/LoginPage';

const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'));
const DonHangPage = lazy(() => import('@/modules/don-hang/DonHangPage'));
const DonHangNCCPage = lazy(() => import('@/modules/don-hang-ncc/DonHangNCCPage'));
const HoaPage = lazy(() => import('@/modules/hoa/HoaPage'));
const TonKhoPage = lazy(() => import('@/modules/ton-kho/TonKhoPage'));
const NCCPage = lazy(() => import('@/modules/ncc/NCCPage'));
const NPPPage = lazy(() => import('@/modules/npp/NPPPage'));
const CongNoPage = lazy(() => import('@/modules/cong-no/CongNoPage'));
const ThuChiPage = lazy(() => import('@/modules/thu-chi/ThuChiPage'));
const NhanVienPage = lazy(() => import('@/modules/nhan-vien/NhanVienPage'));

const PAGE_FALLBACK = (
  <div className="flex-1 flex items-center justify-center py-20">
    <Spinner text="Đang tải dữ liệu..." />
  </div>
);

export default function App() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <>
        <LoginPage />
        <ConfirmDialog />
      </>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppLayout>
        <Suspense fallback={PAGE_FALLBACK}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/don-hang" element={<DonHangPage />} />
            <Route path="/don-hang-ncc" element={<DonHangNCCPage />} />
            <Route path="/don-hang-nha-cung-cap" element={<DonHangNCCPage />} />
            <Route path="/hoa" element={<HoaPage />} />
            <Route path="/danh-sach-hoa" element={<HoaPage />} />
            <Route path="/ton-kho" element={<TonKhoPage />} />
            <Route path="/nha-cung-cap" element={<NCCPage />} />
            <Route path="/ncc" element={<NCCPage />} />
            <Route path="/nha-phan-phoi" element={<NPPPage />} />
            <Route path="/npp" element={<NPPPage />} />
            <Route path="/cong-no" element={<CongNoPage />} />
            <Route path="/quan-ly-cong-no" element={<CongNoPage />} />
            <Route path="/thu-chi" element={<ThuChiPage />} />
            <Route path="/nhan-vien" element={<NhanVienPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
      <ConfirmDialog />
    </BrowserRouter>
  );
}
