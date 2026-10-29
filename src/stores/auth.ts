import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Employee } from '@/types/hoaKhangThanh';
import { useEmployeeStore } from './hoaKhangThanhStore';

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
  login: (credential: string, password?: string) => { success: boolean; error?: string; user?: AuthUser };
  loginAsEmployee: (employee: Employee) => void;
  logout: () => void;
}

function employeeToAuthUser(e: Employee): AuthUser {
  const role: 'admin' | 'member' =
    e.role ||
    (e.department.includes('Quản trị') ||
    e.position.includes('Giám đốc') ||
    e.position.includes('Kế toán trưởng')
      ? 'admin'
      : 'member');

  return {
    id: e.id,
    code: e.code,
    username: e.username || e.code.toLowerCase(),
    email: e.email,
    phone: e.phone,
    full_name: e.fullName,
    department: e.department,
    position: e.position,
    role,
    avatar_url: e.avatar,
  };
}

/** Tài khoản mẫu ban đầu: Nguyễn Văn Khang (Giám đốc Điều hành) */
const DEFAULT_USER: AuthUser = {
  id: 'nv-001',
  code: 'NV-001',
  username: 'khangnv',
  email: 'khang@hoakhangthanh.vn',
  phone: '0908 123 456',
  full_name: 'Nguyễn Văn Khang',
  department: 'Ban Quản trị',
  position: 'Giám đốc Điều hành',
  role: 'admin',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: DEFAULT_USER,
      login: (credential, password = '') => {
        const cred = credential.trim().toLowerCase();
        const cleanPhone = cred.replace(/\s+/g, '');
        const employees = useEmployeeStore.getState().employees;

        // Tìm nhân viên theo Username, Mã NV, SĐT, Email hoặc Tên
        const found = employees.find((e) => {
          if (e.username && e.username.toLowerCase() === cred) return true;
          if (e.code.toLowerCase() === cred) return true;
          if (e.phone && e.phone.replace(/\s+/g, '') === cleanPhone) return true;
          if (e.email && e.email.toLowerCase() === cred) return true;
          if (e.fullName.toLowerCase() === cred) return true;
          return false;
        });

        if (!found) {
          return {
            success: false,
            error: `Không tìm thấy tài khoản nhân viên nào khớp với "${credential}". Vui lòng kiểm tra lại Username, Mã NV hoặc SĐT.`,
          };
        }

        // Kiểm tra mật khẩu (mặc định là 123456 nếu chưa thiết lập)
        const expectedPassword = found.password || '123456';
        if (password !== expectedPassword) {
          return {
            success: false,
            error: 'Mật khẩu không chính xác. Mật khẩu mặc định là 123456.',
          };
        }

        const authUser = employeeToAuthUser(found);
        set({ user: authUser });
        return { success: true, user: authUser };
      },
      loginAsEmployee: (employee) => {
        const authUser = employeeToAuthUser(employee);
        set({ user: authUser });
      },
      logout: () => {
        set({ user: null });
      },
    }),
    { name: 'auth-storage' },
  ),
);

export function currentUserId() {
  return useAuthStore.getState().user?.id ?? 'nv-001';
}
