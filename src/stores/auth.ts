import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Employee } from '@/types/hoaKhangThanh';
import { useEmployeeStore } from './hoaKhangThanhStore';
import { pullFromGoogleSheets } from '@/lib/googleSheetsService';

export interface AuthUser {
  id: string;
  code: string;
  username: string;
  email: string;
  phone?: string;
  full_name: string;
  department?: string;
  position?: string;
  role: 'admin' | 'member';
  avatar_url?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  login: (credential: string, password?: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  loginAsEmployee: (employee: Employee) => void;
  logout: () => void;
}

function employeeToAuthUser(e: Employee): AuthUser {
  const role: 'admin' | 'member' =
    e.role === 'admin'
      ? 'admin'
      : e.role === 'member'
      ? 'member'
      : (e.department?.includes('Quản trị') ||
         e.position?.includes('Giám đốc') ||
         e.position?.includes('Kế toán trưởng')
          ? 'admin'
          : 'member');

  return {
    id: e.id,
    code: e.code,
    username: e.username || e.code.toLowerCase().replace('-', ''),
    email: e.email || '',
    phone: e.phone || '',
    full_name: e.fullName,
    department: e.department || '',
    position: e.position || 'Nhân viên',
    role,
    avatar_url: e.avatar,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, // Không sử dụng tài khoản mẫu - bắt buộc đăng nhập từ tài khoản trên Google Sheets
      login: async (credential, password = '') => {
        const cred = credential.trim().toLowerCase();
        const cleanPhone = cred.replace(/\s+/g, '');

        let employees = useEmployeeStore.getState().employees;

        const findEmp = (list: Employee[]) =>
          list.find((e) => {
            if (e.username && e.username.trim().toLowerCase() === cred) return true;
            if (e.code && e.code.trim().toLowerCase() === cred) return true;
            if (e.phone && e.phone.replace(/\s+/g, '') === cleanPhone) return true;
            if (e.email && e.email.trim().toLowerCase() === cred) return true;
            if (e.fullName && e.fullName.trim().toLowerCase() === cred) return true;
            return false;
          });

        let found = findEmp(employees);

        // Nếu chưa tìm thấy hoặc store chưa có nhân viên nào, chủ động kéo từ Google Sheets về
        if (!found) {
          try {
            await pullFromGoogleSheets();
            employees = useEmployeeStore.getState().employees;
            found = findEmp(employees);
          } catch (err) {
            console.error('[Auth] Lỗi khi tải dữ liệu nhân viên từ Google Sheets:', err);
          }
        }

        if (!found) {
          return {
            success: false,
            error: `Không tìm thấy tài khoản "${credential}" trong danh sách nhân viên lưu trên Google Sheets. Vui lòng kiểm tra lại Username, Mã NV hoặc SĐT.`,
          };
        }

        // Kiểm tra trạng thái làm việc
        const statusLower = String(found.status || '').toLowerCase();
        if (statusLower === 'inactive' || statusLower === 'resigned' || statusLower.includes('nghỉ')) {
          return {
            success: false,
            error: 'Tài khoản nhân viên này đã ngưng hoạt động hoặc đã nghỉ việc.',
          };
        }

        // Kiểm tra mật khẩu (mặc định 123456 nếu chưa thiết lập)
        const expectedPassword = found.password || '123456';
        if (password !== expectedPassword) {
          return {
            success: false,
            error: 'Mật khẩu không chính xác. Mật khẩu mặc định là 123456 nếu chưa đổi.',
          };
        }

        const authUser = employeeToAuthUser(found);
        set({ user: authUser });
        return { success: true, user: authUser };
      },
      loginAsEmployee: (employee) => {
        const employees = useEmployeeStore.getState().employees;
        const exists = employees.some((e) => e.id === employee.id || e.code === employee.code);
        if (exists) {
          const authUser = employeeToAuthUser(employee);
          set({ user: authUser });
        }
      },
      logout: () => {
        set({ user: null });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Dọn sạch tài khoản demo cũ 'khangnv'
        if (
          state?.user?.username === 'khangnv' ||
          (state?.user?.id === 'nv-001' && state?.user?.full_name === 'Nguyễn Văn Khang')
        ) {
          state.user = null;
        }
      },
    },
  ),
);

export function currentUserId() {
  return useAuthStore.getState().user?.id ?? '';
}
