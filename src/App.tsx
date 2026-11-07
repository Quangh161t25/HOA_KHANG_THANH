import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Feedback';
import { useAuthStore } from '@/stores/auth';
import LoginPage from '@/modules/auth/LoginPage';
import { pageLoaders, preloadRoute } from '@/modules/routeLoaders';

const DashboardPage = lazy(pageLoaders.dashboard);
const DonHangPage = lazy(pageLoaders.donHang);
const DonHangNCCPage = lazy(pageLoaders.donHangNcc);
const HoaPage = lazy(pageLoaders.hoa);
const TonKhoPage = lazy(pageLoaders.tonKho);
const TonNgayPage = lazy(pageLoaders.tonNgay);
const NCCPage = lazy(pageLoaders.ncc);
const NPPPage = lazy(pageLoaders.npp);
const CongNoPage = lazy(pageLoaders.congNo);
const ThuChiPage = lazy(pageLoaders.thuChi);
const NhanVienPage = lazy(pageLoaders.nhanVien);
const PhanQuyenPage = lazy(pageLoaders.phanQuyen);

const PAGE_FALLBACK = (
  <div className="flex-1 flex items-center justify-center py-20">
    <Spinner text="Đang tải dữ liệu..." />
  </div>
);

export default function App() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const paths = ['/don-hang', '/don-hang-ncc', '/cong-no', '/hoa', '/nha-phan-phoi', '/nha-cung-cap', '/ton-kho', '/ton-ngay', '/thu-chi', '/nhan-vien', '/phan-quyen'];
    let cancelled = false;
    let timer = 0;
    let index = 0;
    const loadNext = () => {
      if (cancelled || index >= paths.length) return;
      const target = paths[index++];
      const pending = preloadRoute(target);
      void pending?.finally(() => {
        timer = window.setTimeout(loadNext, 180);
      });
    };
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(loadNext, { timeout: 2500 })
      : window.setTimeout(loadNext, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, [user]);

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
            <Route path="/ton-ngay" element={<TonNgayPage />} />
            <Route path="/kiem-ton-ngay" element={<TonNgayPage />} />
            <Route path="/nha-cung-cap" element={<NCCPage />} />
            <Route path="/ncc" element={<NCCPage />} />
            <Route path="/nha-phan-phoi" element={<NPPPage />} />
            <Route path="/npp" element={<NPPPage />} />
            <Route path="/cong-no" element={<CongNoPage />} />
            <Route path="/quan-ly-cong-no" element={<CongNoPage />} />
            <Route path="/thu-chi" element={<ThuChiPage />} />
            <Route path="/nhan-vien" element={<NhanVienPage />} />
            <Route path="/phan-quyen" element={<PhanQuyenPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
      <ConfirmDialog />
    </BrowserRouter>
  );
}
