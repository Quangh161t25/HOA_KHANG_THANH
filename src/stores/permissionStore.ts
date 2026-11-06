import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface ActionRights {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  group: string;
  groupName: string;
}

export const PERMISSION_GROUPS = [
  { id: 'banHang', name: 'Bán hàng & Khách hàng' },
  { id: 'muaHang', name: 'Mua hàng & Nhà vườn' },
  { id: 'khoHoa', name: 'Kho hoa & Sản phẩm' },
  { id: 'taiChinh', name: 'Tài chính & Kế toán' },
  { id: 'heThong', name: 'Hệ thống & Nhân sự' },
] as const;

export const MODULE_LIST: ModuleDefinition[] = [
  // Bán hàng
  { id: 'donHang', name: 'Đơn đặt hàng sỉ', description: 'Tạo đơn đặt hoa, lên toa, in hoá đơn, giao hàng', group: 'banHang', groupName: 'Bán hàng & Khách hàng' },
  { id: 'npp', name: 'Nhà phân phối (NPP)', description: 'Danh mục đại lý sỉ, shop hoa, lịch sử mua hàng', group: 'banHang', groupName: 'Bán hàng & Khách hàng' },
  { id: 'congNoNPP', name: 'Công nợ NPP', description: 'Sổ theo dõi công nợ, hạn thanh toán đại lý sỉ', group: 'banHang', groupName: 'Bán hàng & Khách hàng' },
  // Mua hàng
  { id: 'donHangNCC', name: 'Đơn đặt hoa NCC', description: 'Đơn nhập hàng nhà vườn, đọc ảnh đơn hoá đơn OCR', group: 'muaHang', groupName: 'Mua hàng & Nhà vườn' },
  { id: 'ncc', name: 'Nhà cung cấp (NCC)', description: 'Danh bạ nhà vườn, đối tác cung ứng hoa Đà Lạt', group: 'muaHang', groupName: 'Mua hàng & Nhà vườn' },
  { id: 'congNoNCC', name: 'Công nợ NCC', description: 'Sổ nợ tiền nhập hàng nhà vườn theo chuyến xe', group: 'muaHang', groupName: 'Mua hàng & Nhà vườn' },
  // Kho hoa
  { id: 'hoa', name: 'Danh mục giống hoa & Giá', description: 'Bảng giá hoa tươi sỉ, phân loại, màu sắc, xuất xứ', group: 'khoHoa', groupName: 'Kho hoa & Sản phẩm' },
  { id: 'tonKho', name: 'Tồn kho lạnh', description: 'Kiểm kê kho lạnh hoa tươi, xuất nhập tồn, hao hụt', group: 'khoHoa', groupName: 'Kho hoa & Sản phẩm' },
  // Tài chính
  { id: 'thuChi', name: 'Sổ quỹ Thu - Chi', description: 'Phiếu thu, phiếu chi tiền mặt, dòng tiền hằng ngày', group: 'taiChinh', groupName: 'Tài chính & Kế toán' },
  { id: 'congNoTongHop', name: 'Tổng hợp công nợ', description: 'Đối chiếu công nợ 2 chiều, báo cáo nợ quá hạn', group: 'taiChinh', groupName: 'Tài chính & Kế toán' },
  // Hệ thống
  { id: 'nhanVien', name: 'Danh sách nhân sự', description: 'Hồ sơ nhân viên, nghệ nhân cắm hoa, tiền lương', group: 'heThong', groupName: 'Hệ thống & Nhân sự' },
  { id: 'phanQuyen', name: 'Phân quyền truy cập', description: 'Thiết lập quyền xem, thêm, sửa, xoá theo tài khoản', group: 'heThong', groupName: 'Hệ thống & Nhân sự' },
];

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  permissions: Record<string, ActionRights>;
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'admin',
    name: 'Quản trị viên (Toàn quyền)',
    description: 'Toàn quyền Xem, Thêm, Sửa, Xoá trên tất cả các module trong hệ thống.',
    permissions: MODULE_LIST.reduce((acc, m) => {
      acc[m.id] = { view: true, create: true, edit: true, delete: true };
      return acc;
    }, {} as Record<string, ActionRights>),
  },
  {
    id: 'kinh-doanh',
    name: 'Nhân viên Kinh doanh / Bán hàng',
    description: 'Tạo và quản lý đơn đặt hoa sỉ, danh sách NPP, xem tồn kho & danh mục hoa tươi.',
    permissions: {
      donHang: { view: true, create: true, edit: true, delete: false },
      npp: { view: true, create: true, edit: true, delete: false },
      congNoNPP: { view: true, create: false, edit: false, delete: false },
      hoa: { view: true, create: false, edit: false, delete: false },
      tonKho: { view: true, create: false, edit: false, delete: false },
      ncc: { view: false, create: false, edit: false, delete: false },
      donHangNCC: { view: false, create: false, edit: false, delete: false },
      congNoNCC: { view: false, create: false, edit: false, delete: false },
      thuChi: { view: false, create: false, edit: false, delete: false },
      congNoTongHop: { view: false, create: false, edit: false, delete: false },
      nhanVien: { view: false, create: false, edit: false, delete: false },
      phanQuyen: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    id: 'thu-kho',
    name: 'Quản lý Kho & Vận chuyển',
    description: 'Quản lý tồn kho hoa lạnh, nhập đơn nhà vườn, kiểm tra số lượng giao hoa.',
    permissions: {
      tonKho: { view: true, create: true, edit: true, delete: true },
      hoa: { view: true, create: true, edit: true, delete: false },
      donHangNCC: { view: true, create: true, edit: true, delete: false },
      ncc: { view: true, create: false, edit: false, delete: false },
      donHang: { view: true, create: false, edit: false, delete: false },
      npp: { view: true, create: false, edit: false, delete: false },
      congNoNPP: { view: false, create: false, edit: false, delete: false },
      congNoNCC: { view: false, create: false, edit: false, delete: false },
      thuChi: { view: false, create: false, edit: false, delete: false },
      congNoTongHop: { view: false, create: false, edit: false, delete: false },
      nhanVien: { view: false, create: false, edit: false, delete: false },
      phanQuyen: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    id: 'ke-toan',
    name: 'Kế toán & Thu quỹ',
    description: 'Toàn quyền Thu - Chi, theo dõi và đối soát công nợ 2 chiều khách hàng & nhà vườn.',
    permissions: {
      thuChi: { view: true, create: true, edit: true, delete: false },
      congNoNPP: { view: true, create: true, edit: true, delete: false },
      congNoNCC: { view: true, create: true, edit: true, delete: false },
      congNoTongHop: { view: true, create: true, edit: true, delete: false },
      donHang: { view: true, create: false, edit: false, delete: false },
      donHangNCC: { view: true, create: false, edit: false, delete: false },
      hoa: { view: true, create: false, edit: false, delete: false },
      tonKho: { view: true, create: false, edit: false, delete: false },
      npp: { view: true, create: false, edit: false, delete: false },
      ncc: { view: true, create: false, edit: false, delete: false },
      nhanVien: { view: true, create: false, edit: false, delete: false },
      phanQuyen: { view: false, create: false, edit: false, delete: false },
    },
  },
];

export const DEFAULT_EMPLOYEE_ID = '__default__';

const DEFAULT_GLOBAL_PERMISSIONS: Record<string, ActionRights> = MODULE_LIST.reduce((acc, m) => {
  acc[m.id] = { view: true, create: true, edit: true, delete: true };
  return acc;
}, {} as Record<string, ActionRights>);

interface PermissionStoreState {
  // Bản ghi quyền cho từng nhân viên: { [employeeId]: { [moduleId]: ActionRights } }
  permissions: Record<string, Record<string, ActionRights>>;
  
  // Kiểm tra quyền
  getRights: (employeeId: string, moduleId: string) => ActionRights;
  
  // Thao tác chỉnh sửa
  toggleRight: (employeeId: string, moduleId: string, action: PermissionAction, explicitValue?: boolean) => void;
  toggleModuleRow: (employeeId: string, moduleId: string, allValue: boolean) => void;
  toggleColumn: (employeeId: string, action: PermissionAction | 'all', value: boolean) => void;
  
  // Module-centric
  toggleModuleForEmployee: (moduleId: string, employeeId: string, action: PermissionAction, explicitValue?: boolean) => void;
  
  // Sao chép & Vai trò
  copyPermissions: (fromEmployeeId: string, toEmployeeId: string) => void;
  applyRole: (employeeId: string, roleId: string) => void;
  resetToDefault: (employeeId: string) => void;
  
  // Lưu
  savePermissions: () => void;
}

export const usePermissionStore = create<PermissionStoreState>()(
  persist(
    (set, get) => ({
      permissions: {
        [DEFAULT_EMPLOYEE_ID]: { ...DEFAULT_GLOBAL_PERMISSIONS },
      },

      getRights: (employeeId: string, moduleId: string): ActionRights => {
        const state = get();
        // Nếu là admin mặc định
        if (employeeId === 'nv-admin' || employeeId === 'NV-001') {
          return { view: true, create: true, edit: true, delete: true };
        }
        const userPerms = state.permissions[employeeId];
        if (userPerms && userPerms[moduleId]) {
          return userPerms[moduleId];
        }
        // Fallback về quyền mặc định chung
        const defaultPerms = state.permissions[DEFAULT_EMPLOYEE_ID];
        if (defaultPerms && defaultPerms[moduleId]) {
          return defaultPerms[moduleId];
        }
        return { view: true, create: true, edit: true, delete: true };
      },

      toggleRight: (employeeId: string, moduleId: string, action: PermissionAction, explicitValue?: boolean) => {
        set((state) => {
          const userPerms = { ...(state.permissions[employeeId] || state.permissions[DEFAULT_EMPLOYEE_ID] || DEFAULT_GLOBAL_PERMISSIONS) };
          const currentRights = { ...(userPerms[moduleId] || { view: false, create: false, edit: false, delete: false }) };
          
          const nextVal = explicitValue !== undefined ? explicitValue : !currentRights[action];
          currentRights[action] = nextVal;

          // Logic quy tắc:
          // 1. Bật Thêm / Sửa / Xoá sẽ TỰ ĐỘNG BẬT Xem
          if ((action === 'create' || action === 'edit' || action === 'delete') && nextVal) {
            currentRights.view = true;
          }
          // 2. Tắt Xem sẽ TỰ ĐỘNG TẮT HẾT Thêm, Sửa, Xoá
          if (action === 'view' && !nextVal) {
            currentRights.create = false;
            currentRights.edit = false;
            currentRights.delete = false;
          }

          userPerms[moduleId] = currentRights;
          return {
            permissions: {
              ...state.permissions,
              [employeeId]: userPerms,
            },
          };
        });
      },

      toggleModuleRow: (employeeId: string, moduleId: string, allValue: boolean) => {
        set((state) => {
          const userPerms = { ...(state.permissions[employeeId] || state.permissions[DEFAULT_EMPLOYEE_ID] || DEFAULT_GLOBAL_PERMISSIONS) };
          userPerms[moduleId] = {
            view: allValue,
            create: allValue,
            edit: allValue,
            delete: allValue,
          };
          return {
            permissions: {
              ...state.permissions,
              [employeeId]: userPerms,
            },
          };
        });
      },

      toggleColumn: (employeeId: string, action: PermissionAction | 'all', value: boolean) => {
        set((state) => {
          const userPerms = { ...(state.permissions[employeeId] || state.permissions[DEFAULT_EMPLOYEE_ID] || DEFAULT_GLOBAL_PERMISSIONS) };
          MODULE_LIST.forEach((m) => {
            const current = { ...(userPerms[m.id] || { view: false, create: false, edit: false, delete: false }) };
            if (action === 'all') {
              current.view = value;
              current.create = value;
              current.edit = value;
              current.delete = value;
            } else if (action === 'view') {
              current.view = value;
              if (!value) {
                current.create = false;
                current.edit = false;
                current.delete = false;
              }
            } else {
              current[action] = value;
              if (value) current.view = true;
            }
            userPerms[m.id] = current;
          });

          return {
            permissions: {
              ...state.permissions,
              [employeeId]: userPerms,
            },
          };
        });
      },

      toggleModuleForEmployee: (moduleId: string, employeeId: string, action: PermissionAction, explicitValue?: boolean) => {
        get().toggleRight(employeeId, moduleId, action, explicitValue);
      },

      copyPermissions: (fromEmployeeId: string, toEmployeeId: string) => {
        set((state) => {
          const source = state.permissions[fromEmployeeId] || state.permissions[DEFAULT_EMPLOYEE_ID] || DEFAULT_GLOBAL_PERMISSIONS;
          const cloned: Record<string, ActionRights> = JSON.parse(JSON.stringify(source));
          toast.success('Đã sao chép phân quyền thành công!');
          return {
            permissions: {
              ...state.permissions,
              [toEmployeeId]: cloned,
            },
          };
        });
      },

      applyRole: (employeeId: string, roleId: string) => {
        const role = ROLE_TEMPLATES.find((r) => r.id === roleId);
        if (!role) return;
        set((state) => {
          const cloned: Record<string, ActionRights> = JSON.parse(JSON.stringify(role.permissions));
          toast.success(`Đã áp dụng mẫu vai trò "${role.name}"!`);
          return {
            permissions: {
              ...state.permissions,
              [employeeId]: cloned,
            },
          };
        });
      },

      resetToDefault: (employeeId: string) => {
        set((state) => {
          const next = { ...state.permissions };
          delete next[employeeId];
          toast.info('Đã hoàn về quyền mặc định hệ thống.');
          return { permissions: next };
        });
      },

      savePermissions: () => {
        toast.success('Đã lưu cấu hình phân quyền hệ thống thành công!', {
          description: 'Quyền đã được cập nhật và đồng bộ vào bộ nhớ hệ thống.',
        });
      },
    }),
    {
      name: 'hoa_khang_thanh_permissions',
    }
  )
);
