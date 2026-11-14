import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { useEmployeeStore } from './hoaKhangThanhStore';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface ActionRights {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

// --- Cấu hình quyền hiển thị từng cột của bảng Chi tiết đơn hàng / Mặt hàng ---
export interface OrderDetailColumnRights {
  stt: boolean;               // Cột #: Số thứ tự
  flower: boolean;            // Cột Mặt hàng: Tên hoa & Mã hoa
  quantity: boolean;          // Cột Số lượng
  costPrice: boolean;         // Cột Giá nhập (Giá vốn) - Nhạy cảm kinh doanh
  unitPrice: boolean;         // Cột Giá bán
  importTotal: boolean;       // Cột TT Nhập (Thành tiền vốn) - Nhạy cảm kinh doanh
  amount: boolean;            // Cột TT Bán (Thành tiền bán)
  profit: boolean;            // Cột Lợi nhuận (+/-) - Nhạy cảm kinh doanh
  summaryProfitCost: boolean; // Tổng vốn nhập & Tổng lợi nhuận ở khối thanh toán
}

export interface OrderItemPermissionSetting {
  actions: ActionRights;              // Quyền thao tác: Xem, Thêm, Sửa, Xóa
  columns: OrderDetailColumnRights;   // Quyền xem chi tiết từng cột 1
}

export const ORDER_DETAIL_COLUMNS_CONFIG: {
  id: keyof OrderDetailColumnRights;
  name: string;
  description: string;
  isSensitive?: boolean;
}[] = [
  { id: 'stt', name: '# (Số thứ tự)', description: 'Hiển thị cột đánh số thứ tự mặt hàng trong đơn' },
  { id: 'flower', name: 'Mặt hàng', description: 'Tên hoa, mã hoa và chủng loại' },
  { id: 'quantity', name: 'Số lượng', description: 'Số lượng từng loại hoa khách đặt' },
  { id: 'costPrice', name: 'Giá nhập (vốn)', description: 'Đơn giá vốn hoa nhập từ nhà vườn', isSensitive: true },
  { id: 'unitPrice', name: 'Giá bán', description: 'Đơn giá xuất bán cho khách / NPP' },
  { id: 'importTotal', name: 'TT Nhập (vốn)', description: 'Tổng tiền vốn nhập (Số lượng × Giá nhập)', isSensitive: true },
  { id: 'amount', name: 'TT Bán (doanh số)', description: 'Tổng thành tiền bán (Số lượng × Giá bán)' },
  { id: 'profit', name: 'Lợi nhuận', description: 'Chênh lệch lãi từng dòng mặt hàng (+/-)', isSensitive: true },
  { id: 'summaryProfitCost', name: 'Tổng vốn & Lợi nhuận', description: 'Hiển thị Tổng vốn nhập & Lợi nhuận ở chân bảng / khối thanh toán', isSensitive: true },
];

export const DEFAULT_ORDER_DETAIL_COLUMNS: OrderDetailColumnRights = {
  stt: true,
  flower: true,
  quantity: true,
  costPrice: true,
  unitPrice: true,
  importTotal: true,
  amount: true,
  profit: true,
  summaryProfitCost: true,
};

export const DEFAULT_ORDER_ITEM_SETTING: OrderItemPermissionSetting = {
  actions: { view: true, create: true, edit: true, delete: true },
  columns: { ...DEFAULT_ORDER_DETAIL_COLUMNS },
};

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
  orderItemPermissions?: OrderItemPermissionSetting;
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'admin',
    name: 'Quản trị viên (Toàn quyền)',
    description: 'Toàn quyền Xem, Thêm, Sửa, Xoá trên tất cả các module và toàn quyền xem mọi cột đơn hàng.',
    permissions: MODULE_LIST.reduce((acc, m) => {
      acc[m.id] = { view: true, create: true, edit: true, delete: true };
      return acc;
    }, {} as Record<string, ActionRights>),
    orderItemPermissions: {
      actions: { view: true, create: true, edit: true, delete: true },
      columns: { ...DEFAULT_ORDER_DETAIL_COLUMNS },
    },
  },
  {
    id: 'kinh-doanh',
    name: 'Nhân viên Kinh doanh / Bán hàng',
    description: 'Tạo và quản lý đơn đặt hoa sỉ, xem giá bán. Tự động ẩn cột Giá vốn, TT Nhập và Lợi nhuận để bảo mật.',
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
    orderItemPermissions: {
      actions: { view: true, create: true, edit: true, delete: false },
      columns: {
        stt: true,
        flower: true,
        quantity: true,
        costPrice: false,     // Ẩn giá vốn
        unitPrice: true,
        importTotal: false,   // Ẩn TT nhập
        amount: true,
        profit: false,        // Ẩn lợi nhuận
        summaryProfitCost: false, // Ẩn tổng vốn và lợi nhuận
      },
    },
  },
  {
    id: 'thu-kho',
    name: 'Quản lý Kho & Vận chuyển',
    description: 'Chỉ xem mặt hàng và số lượng hoa để soạn đơn giao hàng. Ẩn toàn bộ giá nhập, giá bán và lợi nhuận.',
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
    orderItemPermissions: {
      actions: { view: true, create: false, edit: false, delete: false },
      columns: {
        stt: true,
        flower: true,
        quantity: true,
        costPrice: false,
        unitPrice: false,
        importTotal: false,
        amount: false,
        profit: false,
        summaryProfitCost: false,
      },
    },
  },
  {
    id: 'ke-toan',
    name: 'Kế toán & Thu quỹ',
    description: 'Toàn quyền Thu - Chi, đối soát công nợ. Xem đầy đủ các cột giá vốn, giá bán, thành tiền và lợi nhuận.',
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
    orderItemPermissions: {
      actions: { view: true, create: true, edit: true, delete: false },
      columns: { ...DEFAULT_ORDER_DETAIL_COLUMNS },
    },
  },
];

export const DEFAULT_EMPLOYEE_ID = '__default__';

const DEFAULT_GLOBAL_PERMISSIONS: Record<string, ActionRights> = MODULE_LIST.reduce((acc, m) => {
  acc[m.id] = { view: true, create: true, edit: true, delete: true };
  return acc;
}, {} as Record<string, ActionRights>);

interface PermissionStoreState {
  // Bản ghi quyền cho từng nhân viên theo module: { [employeeId]: { [moduleId]: ActionRights } }
  permissions: Record<string, Record<string, ActionRights>>;
  
  // Bản ghi phân quyền bảng chi tiết đơn hàng: { [employeeId]: OrderItemPermissionSetting }
  orderItemPermissions: Record<string, OrderItemPermissionSetting>;

  // Kiểm tra quyền
  getRights: (employeeId: string, moduleId: string) => ActionRights;
  getOrderItemRights: (employeeId: string) => OrderItemPermissionSetting;
  
  // Thao tác chỉnh sửa module
  toggleRight: (employeeId: string, moduleId: string, action: PermissionAction, explicitValue?: boolean) => void;
  toggleModuleRow: (employeeId: string, moduleId: string, allValue: boolean) => void;
  toggleColumn: (employeeId: string, action: PermissionAction | 'all', value: boolean) => void;
  toggleModuleForEmployee: (moduleId: string, employeeId: string, action: PermissionAction, explicitValue?: boolean) => void;
  
  // Thao tác phân quyền bảng chi tiết đơn hàng (Xem, Thêm, Sửa, Xóa & Từng cột 1)
  toggleOrderItemAction: (employeeId: string, action: PermissionAction, explicitValue?: boolean) => void;
  toggleAllOrderItemActions: (employeeId: string, value: boolean) => void;
  toggleOrderItemColumn: (employeeId: string, columnKey: keyof OrderDetailColumnRights, explicitValue?: boolean) => void;
  toggleAllOrderItemColumns: (employeeId: string, value: boolean) => void;
  setSensitiveColumnsVisibility: (employeeId: string, visible: boolean) => void;
  copyOrderItemPermissions: (fromEmployeeId: string, toEmployeeId: string) => void;
  applyRoleToOrderItem: (employeeId: string, roleId: string) => void;
  resetOrderItemToDefault: (employeeId: string) => void;

  // Sao chép & Vai trò tổng thể
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
      orderItemPermissions: {
        [DEFAULT_EMPLOYEE_ID]: { ...DEFAULT_ORDER_ITEM_SETTING },
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

      getOrderItemRights: (employeeId: string): OrderItemPermissionSetting => {
        const state = get();
        if (employeeId === 'nv-admin' || employeeId === 'NV-001') {
          return {
            actions: { view: true, create: true, edit: true, delete: true },
            columns: { ...DEFAULT_ORDER_DETAIL_COLUMNS },
          };
        }
        try {
          const emp = useEmployeeStore.getState().employees.find((e) => e.id === employeeId || e.code === employeeId);
          if (emp && (emp.role === 'admin' || emp.department?.includes('Quản trị') || emp.position?.includes('Giám đốc'))) {
            return {
              actions: { view: true, create: true, edit: true, delete: true },
              columns: { ...DEFAULT_ORDER_DETAIL_COLUMNS },
            };
          }
        } catch {}

        const userSetting = state.orderItemPermissions?.[employeeId];
        if (userSetting) {
          return {
            actions: { ...userSetting.actions },
            columns: { ...DEFAULT_ORDER_DETAIL_COLUMNS, ...userSetting.columns },
          };
        }

        const defaultSetting = state.orderItemPermissions?.[DEFAULT_EMPLOYEE_ID];
        if (defaultSetting) {
          return {
            actions: { ...defaultSetting.actions },
            columns: { ...DEFAULT_ORDER_DETAIL_COLUMNS, ...defaultSetting.columns },
          };
        }

        return {
          actions: { view: true, create: true, edit: true, delete: true },
          columns: { ...DEFAULT_ORDER_DETAIL_COLUMNS },
        };
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

      toggleOrderItemAction: (employeeId: string, action: PermissionAction, explicitValue?: boolean) => {
        set((state) => {
          const prev = state.orderItemPermissions?.[employeeId] || state.orderItemPermissions?.[DEFAULT_EMPLOYEE_ID] || DEFAULT_ORDER_ITEM_SETTING;
          const nextActions = { ...prev.actions };
          const nextVal = explicitValue !== undefined ? explicitValue : !nextActions[action];
          nextActions[action] = nextVal;

          // Logic: Bật Thêm/Sửa/Xóa sẽ tự bật Xem; Tắt Xem sẽ tự tắt hết
          if ((action === 'create' || action === 'edit' || action === 'delete') && nextVal) {
            nextActions.view = true;
          }
          if (action === 'view' && !nextVal) {
            nextActions.create = false;
            nextActions.edit = false;
            nextActions.delete = false;
          }

          return {
            orderItemPermissions: {
              ...state.orderItemPermissions,
              [employeeId]: {
                actions: nextActions,
                columns: { ...(prev.columns || DEFAULT_ORDER_DETAIL_COLUMNS) },
              },
            },
          };
        });
      },

      toggleAllOrderItemActions: (employeeId: string, value: boolean) => {
        set((state) => {
          const prev = state.orderItemPermissions?.[employeeId] || state.orderItemPermissions?.[DEFAULT_EMPLOYEE_ID] || DEFAULT_ORDER_ITEM_SETTING;
          return {
            orderItemPermissions: {
              ...state.orderItemPermissions,
              [employeeId]: {
                actions: { view: value, create: value, edit: value, delete: value },
                columns: { ...(prev.columns || DEFAULT_ORDER_DETAIL_COLUMNS) },
              },
            },
          };
        });
      },

      toggleOrderItemColumn: (employeeId: string, columnKey: keyof OrderDetailColumnRights, explicitValue?: boolean) => {
        set((state) => {
          const prev = state.orderItemPermissions?.[employeeId] || state.orderItemPermissions?.[DEFAULT_EMPLOYEE_ID] || DEFAULT_ORDER_ITEM_SETTING;
          const nextCols = { ...(prev.columns || DEFAULT_ORDER_DETAIL_COLUMNS) };
          nextCols[columnKey] = explicitValue !== undefined ? explicitValue : !nextCols[columnKey];

          return {
            orderItemPermissions: {
              ...state.orderItemPermissions,
              [employeeId]: {
                actions: { ...(prev.actions || DEFAULT_ORDER_ITEM_SETTING.actions) },
                columns: nextCols,
              },
            },
          };
        });
      },

      toggleAllOrderItemColumns: (employeeId: string, value: boolean) => {
        set((state) => {
          const prev = state.orderItemPermissions?.[employeeId] || state.orderItemPermissions?.[DEFAULT_EMPLOYEE_ID] || DEFAULT_ORDER_ITEM_SETTING;
          const nextCols: OrderDetailColumnRights = {
            stt: value,
            flower: value,
            quantity: value,
            costPrice: value,
            unitPrice: value,
            importTotal: value,
            amount: value,
            profit: value,
            summaryProfitCost: value,
          };
          return {
            orderItemPermissions: {
              ...state.orderItemPermissions,
              [employeeId]: {
                actions: { ...(prev.actions || DEFAULT_ORDER_ITEM_SETTING.actions) },
                columns: nextCols,
              },
            },
          };
        });
      },

      setSensitiveColumnsVisibility: (employeeId: string, visible: boolean) => {
        set((state) => {
          const prev = state.orderItemPermissions?.[employeeId] || state.orderItemPermissions?.[DEFAULT_EMPLOYEE_ID] || DEFAULT_ORDER_ITEM_SETTING;
          const nextCols = { ...(prev.columns || DEFAULT_ORDER_DETAIL_COLUMNS) };
          nextCols.costPrice = visible;
          nextCols.importTotal = visible;
          nextCols.profit = visible;
          nextCols.summaryProfitCost = visible;

          return {
            orderItemPermissions: {
              ...state.orderItemPermissions,
              [employeeId]: {
                actions: { ...(prev.actions || DEFAULT_ORDER_ITEM_SETTING.actions) },
                columns: nextCols,
              },
            },
          };
        });
      },

      copyOrderItemPermissions: (fromEmployeeId: string, toEmployeeId: string) => {
        set((state) => {
          const source = state.orderItemPermissions?.[fromEmployeeId] || state.orderItemPermissions?.[DEFAULT_EMPLOYEE_ID] || DEFAULT_ORDER_ITEM_SETTING;
          const cloned: OrderItemPermissionSetting = JSON.parse(JSON.stringify(source));
          toast.success('Đã sao chép phân quyền bảng chi tiết đơn hàng!');
          return {
            orderItemPermissions: {
              ...state.orderItemPermissions,
              [toEmployeeId]: cloned,
            },
          };
        });
      },

      applyRoleToOrderItem: (employeeId: string, roleId: string) => {
        const role = ROLE_TEMPLATES.find((r) => r.id === roleId);
        if (!role || !role.orderItemPermissions) return;
        set((state) => {
          const cloned: OrderItemPermissionSetting = JSON.parse(JSON.stringify(role.orderItemPermissions));
          toast.success(`Đã áp dụng mẫu quyền chi tiết đơn hàng của "${role.name}"!`);
          return {
            orderItemPermissions: {
              ...state.orderItemPermissions,
              [employeeId]: cloned,
            },
          };
        });
      },

      resetOrderItemToDefault: (employeeId: string) => {
        set((state) => {
          const next = { ...state.orderItemPermissions };
          delete next[employeeId];
          toast.info('Đã hoàn quyền bảng chi tiết đơn hàng về mặc định.');
          return { orderItemPermissions: next };
        });
      },

      copyPermissions: (fromEmployeeId: string, toEmployeeId: string) => {
        set((state) => {
          const source = state.permissions[fromEmployeeId] || state.permissions[DEFAULT_EMPLOYEE_ID] || DEFAULT_GLOBAL_PERMISSIONS;
          const cloned: Record<string, ActionRights> = JSON.parse(JSON.stringify(source));
          
          const sourceItem = state.orderItemPermissions?.[fromEmployeeId] || state.orderItemPermissions?.[DEFAULT_EMPLOYEE_ID] || DEFAULT_ORDER_ITEM_SETTING;
          const clonedItem: OrderItemPermissionSetting = JSON.parse(JSON.stringify(sourceItem));

          toast.success('Đã sao chép toàn bộ phân quyền thành công!');
          return {
            permissions: {
              ...state.permissions,
              [toEmployeeId]: cloned,
            },
            orderItemPermissions: {
              ...state.orderItemPermissions,
              [toEmployeeId]: clonedItem,
            },
          };
        });
      },

      applyRole: (employeeId: string, roleId: string) => {
        const role = ROLE_TEMPLATES.find((r) => r.id === roleId);
        if (!role) return;
        set((state) => {
          const cloned: Record<string, ActionRights> = JSON.parse(JSON.stringify(role.permissions));
          const nextOrderItem = { ...state.orderItemPermissions };
          if (role.orderItemPermissions) {
            nextOrderItem[employeeId] = JSON.parse(JSON.stringify(role.orderItemPermissions));
          }
          toast.success(`Đã áp dụng mẫu vai trò "${role.name}"!`);
          return {
            permissions: {
              ...state.permissions,
              [employeeId]: cloned,
            },
            orderItemPermissions: nextOrderItem,
          };
        });
      },

      resetToDefault: (employeeId: string) => {
        set((state) => {
          const next = { ...state.permissions };
          delete next[employeeId];
          const nextItems = { ...state.orderItemPermissions };
          delete nextItems[employeeId];
          toast.info('Đã hoàn về quyền mặc định hệ thống.');
          return { permissions: next, orderItemPermissions: nextItems };
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
