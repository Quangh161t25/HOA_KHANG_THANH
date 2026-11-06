import { useState, useMemo } from 'react';
import {
  Users,
  Grid,
  ShieldCheck,
  Search,
  Copy,
  RotateCcw,
  Crown,
  KeyRound,
  Save,
  CheckCircle2,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useEmployeeStore } from '@/stores/hoaKhangThanhStore';
import {
  usePermissionStore,
  MODULE_LIST,
  PERMISSION_GROUPS,
  ROLE_TEMPLATES,
  DEFAULT_EMPLOYEE_ID,
} from '@/stores/permissionStore';
import { toast } from 'sonner';

type ActiveTab = 'by-employee' | 'by-module' | 'roles';

export default function PhanQuyenPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('by-employee');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(DEFAULT_EMPLOYEE_ID);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(MODULE_LIST[0].id);
  const [copySourceId, setCopySourceId] = useState<string>('');
  
  // Modal chọn áp dụng vai trò
  const [roleToApply, setRoleToApply] = useState<string | null>(null);
  const [targetEmployeesForRole, setTargetEmployeesForRole] = useState<string[]>([]);

  const { employees } = useEmployeeStore();
  const {
    permissions,
    getRights,
    toggleRight,
    toggleModuleRow,
    toggleColumn,
    copyPermissions,
    applyRole,
    resetToDefault,
    savePermissions,
  } = usePermissionStore();

  // Danh sách nhân viên lọc theo tìm kiếm
  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        (e.phone && e.phone.includes(q)) ||
        (e.position && e.position.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q))
    );
  }, [employees, employeeSearch]);

  // Danh sách module lọc theo tìm kiếm
  const filteredModules = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return MODULE_LIST;
    return MODULE_LIST.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.groupName.toLowerCase().includes(q)
    );
  }, [moduleSearch]);

  // Thông tin nhân viên đang chọn trong tab "Theo nhân viên"
  const currentEmployee = useMemo(() => {
    if (selectedEmployeeId === DEFAULT_EMPLOYEE_ID) {
      return {
        id: DEFAULT_EMPLOYEE_ID,
        code: 'ALL',
        fullName: 'Mặc định cho mọi nhân viên',
        department: 'Hệ thống',
        position: 'Cấu hình chung mặc định',
        isAdmin: false,
      };
    }
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    return emp
      ? {
          ...emp,
          isAdmin:
            emp.role === 'admin' ||
            emp.department.includes('Quản trị') ||
            emp.position.includes('Giám đốc'),
        }
      : null;
  }, [employees, selectedEmployeeId]);

  // Kiểm tra trạng thái cấu hình riêng
  const isCustomized = (empId: string) => {
    return Boolean(permissions[empId]);
  };

  // Tính số lượng người có quyền xem của một module
  const countViewers = (modId: string) => {
    let count = 0;
    for (const emp of employees) {
      const rights = getRights(emp.id, modId);
      if (rights.view) count++;
    }
    return count;
  };

  // Xử lý sao chép quyền
  const handleCopy = () => {
    if (!copySourceId) {
      toast.error('Vui lòng chọn nhân viên hoặc vai trò nguồn để sao chép!');
      return;
    }
    copyPermissions(copySourceId, selectedEmployeeId);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Top Header / Mode Tabs */}
      <div className="bg-card border-b border-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('by-employee')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                activeTab === 'by-employee'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Users size={15} />
              Theo nhân viên
            </button>
            <button
              onClick={() => setActiveTab('by-module')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                activeTab === 'by-module'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Grid size={15} />
              Theo module
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                activeTab === 'roles'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ShieldCheck size={15} />
              Vai trò (mẫu)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedEmployeeId !== DEFAULT_EMPLOYEE_ID) {
                resetToDefault(selectedEmployeeId);
              } else {
                toast.info('Đã hủy các thay đổi chưa lưu.');
              }
            }}
            className="text-xs h-8"
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={savePermissions}
            className="text-xs h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
          >
            <Save size={14} />
            Lưu phân quyền
          </Button>
        </div>
      </div>

      {/* Info notice bar */}
      <div className="bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 px-4 py-2 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 shrink-0">
        <div className="flex items-center gap-2 font-medium">
          <KeyRound size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            Bật <strong>Thêm / Sửa / Xóa</strong> sẽ tự bật <strong>Xem</strong>; tắt Xem sẽ tắt hết. Quyền được kiểm soát an toàn và lưu trực tiếp vào hệ thống.
          </span>
        </div>
        <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80 hidden md:inline">
          Tab 25. PhanQuyen_NhanVien
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* TAB 1: THEO NHÂN VIÊN */}
        {activeTab === 'by-employee' && (
          <div className="flex h-full overflow-hidden">
            {/* Left Sidebar: Employee List */}
            <div className="w-72 lg:w-80 border-r border-border bg-card/60 flex flex-col shrink-0">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm nhân viên..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {/* Default option */}
                <button
                  onClick={() => setSelectedEmployeeId(DEFAULT_EMPLOYEE_ID)}
                  className={cn(
                    'w-full text-left p-3 transition-colors flex items-start gap-3 select-none',
                    selectedEmployeeId === DEFAULT_EMPLOYEE_ID
                      ? 'bg-primary/10 border-l-4 border-primary text-primary'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Users size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs leading-tight text-foreground">
                      Mặc định cho mọi nhân viên
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      Áp dụng khi chưa cấu hình riêng
                    </div>
                  </div>
                </button>

                {/* Employees list */}
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedEmployeeId === emp.id;
                  const isAdmin =
                    emp.role === 'admin' ||
                    emp.department.includes('Quản trị') ||
                    emp.position.includes('Giám đốc');
                  const customized = isCustomized(emp.id);

                  return (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className={cn(
                        'w-full text-left p-3 transition-colors flex items-start gap-3 select-none',
                        isSelected
                          ? 'bg-primary/10 border-l-4 border-primary'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="relative shrink-0">
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs border border-border">
                            {emp.fullName.slice(0, 1)}
                          </div>
                        )}
                        {isAdmin && (
                          <Crown
                            size={12}
                            className="absolute -top-1 -right-1 text-amber-500 fill-amber-500 drop-shadow"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              'font-semibold text-xs truncate leading-tight',
                              isSelected ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            {emp.fullName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {emp.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {emp.position || emp.department}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {isAdmin ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium">
                              Quản trị viên
                            </span>
                          ) : customized ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium">
                              Cấu hình riêng
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Theo mặc định</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Permission Matrix */}
            <div className="flex-1 flex flex-col bg-background min-w-0 overflow-hidden">
              {/* Employee Toolbar */}
              <div className="p-3 bg-card border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-foreground">
                    {currentEmployee?.fullName}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    ({currentEmployee?.position || currentEmployee?.department})
                  </span>
                  {currentEmployee?.isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                      <Crown size={12} /> Toàn quyền Admin
                    </span>
                  )}
                </div>

                {selectedEmployeeId !== DEFAULT_EMPLOYEE_ID && (
                  <div className="flex items-center gap-2">
                    <select
                      value={copySourceId}
                      onChange={(e) => setCopySourceId(e.target.value)}
                      className="text-xs h-8 px-2 border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">-- Sao chép quyền từ --</option>
                      <option value={DEFAULT_EMPLOYEE_ID}>Mặc định hệ thống</option>
                      <optgroup label="Vai trò mẫu">
                        {ROLE_TEMPLATES.map((r) => (
                          <option key={r.id} value={`role:${r.id}`}>
                            Mẫu: {r.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Nhân viên khác">
                        {employees
                          .filter((e) => e.id !== selectedEmployeeId)
                          .map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.fullName} ({e.code})
                            </option>
                          ))}
                      </optgroup>
                    </select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (copySourceId.startsWith('role:')) {
                          applyRole(selectedEmployeeId, copySourceId.replace('role:', ''));
                        } else {
                          handleCopy();
                        }
                      }}
                      className="text-xs h-8 gap-1"
                    >
                      <Copy size={13} />
                      Chép
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resetToDefault(selectedEmployeeId)}
                      className="text-xs h-8 gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw size={13} />
                      Theo mặc định
                    </Button>
                  </div>
                )}
              </div>

              {/* Matrix Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm border-b border-border shadow-sm">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold text-foreground/80 w-[40%]">
                        Module / Tính năng
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-center w-[12%]">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                            onChange={(e) => toggleColumn(selectedEmployeeId, 'view', e.target.checked)}
                          />
                          <span>Xem</span>
                        </label>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-center w-[12%]">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                            onChange={(e) => toggleColumn(selectedEmployeeId, 'create', e.target.checked)}
                          />
                          <span>Thêm</span>
                        </label>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-center w-[12%]">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                            onChange={(e) => toggleColumn(selectedEmployeeId, 'edit', e.target.checked)}
                          />
                          <span>Sửa</span>
                        </label>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-center w-[12%]">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                            onChange={(e) => toggleColumn(selectedEmployeeId, 'delete', e.target.checked)}
                          />
                          <span>Xóa</span>
                        </label>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-center w-[12%]">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                            onChange={(e) => toggleColumn(selectedEmployeeId, 'all', e.target.checked)}
                          />
                          <span>Tất cả</span>
                        </label>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/60">
                    {PERMISSION_GROUPS.map((group) => {
                      const groupModules = MODULE_LIST.filter((m) => m.group === group.id);
                      if (groupModules.length === 0) return null;

                      return (
                        <div key={group.id} className="contents">
                          {/* Group header row */}
                          <tr className="bg-blue-50/50 dark:bg-blue-950/20 font-bold text-primary">
                            <td colSpan={6} className="px-4 py-2 border-y border-border/80">
                              <span className="flex items-center gap-1.5 text-xs text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                                <ChevronRight size={13} className="text-primary" />
                                {group.name}
                              </span>
                            </td>
                          </tr>

                          {/* Module rows */}
                          {groupModules.map((mod) => {
                            const rights = getRights(selectedEmployeeId, mod.id);
                            const isAll = rights.view && rights.create && rights.edit && rights.delete;

                            return (
                              <tr key={mod.id} className="hover:bg-muted/40 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-foreground text-xs">
                                    {mod.name}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                    {mod.description}
                                  </div>
                                </td>

                                {/* Xem */}
                                <td className="px-3 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={rights.view}
                                    onChange={(e) =>
                                      toggleRight(selectedEmployeeId, mod.id, 'view', e.target.checked)
                                    }
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary"
                                  />
                                </td>

                                {/* Thêm */}
                                <td className="px-3 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={rights.create}
                                    onChange={(e) =>
                                      toggleRight(selectedEmployeeId, mod.id, 'create', e.target.checked)
                                    }
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary"
                                  />
                                </td>

                                {/* Sửa */}
                                <td className="px-3 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={rights.edit}
                                    onChange={(e) =>
                                      toggleRight(selectedEmployeeId, mod.id, 'edit', e.target.checked)
                                    }
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary"
                                  />
                                </td>

                                {/* Xóa */}
                                <td className="px-3 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={rights.delete}
                                    onChange={(e) =>
                                      toggleRight(selectedEmployeeId, mod.id, 'delete', e.target.checked)
                                    }
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary"
                                  />
                                </td>

                                {/* Tất cả */}
                                <td className="px-3 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isAll}
                                    onChange={(e) =>
                                      toggleModuleRow(selectedEmployeeId, mod.id, e.target.checked)
                                    }
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </div>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THEO MODULE */}
        {activeTab === 'by-module' && (
          <div className="flex h-full overflow-hidden">
            {/* Left Sidebar: Module List */}
            <div className="w-72 lg:w-80 border-r border-border bg-card/60 flex flex-col shrink-0">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm module..."
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {PERMISSION_GROUPS.map((group) => {
                  const mods = filteredModules.filter((m) => m.group === group.id);
                  if (mods.length === 0) return null;

                  return (
                    <div key={group.id} className="py-2">
                      <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {group.name}
                      </div>
                      {mods.map((mod) => {
                        const isSelected = selectedModuleId === mod.id;
                        const viewerCount = countViewers(mod.id);

                        return (
                          <button
                            key={mod.id}
                            onClick={() => setSelectedModuleId(mod.id)}
                            className={cn(
                              'w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between gap-2 select-none',
                              isSelected
                                ? 'bg-primary/10 border-l-4 border-primary text-primary font-semibold'
                                : 'hover:bg-muted/50 text-foreground'
                            )}
                          >
                            <div className="min-w-0">
                              <div className="text-xs truncate leading-tight">{mod.name}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {viewerCount} người xem được
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-muted-foreground/60 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Employee List for this Module */}
            <div className="flex-1 flex flex-col bg-background min-w-0 overflow-hidden">
              {/* Header */}
              {(() => {
                const currentMod = MODULE_LIST.find((m) => m.id === selectedModuleId);
                return (
                  <div className="p-3 bg-card border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        {currentMod?.name}
                        <span className="text-xs font-normal text-muted-foreground">
                          ({currentMod?.groupName})
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {currentMod?.description}
                      </div>
                    </div>

                    <div className="w-56">
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Lọc nhân viên..."
                          value={employeeSearch}
                          onChange={(e) => setEmployeeSearch(e.target.value)}
                          className="h-8 pl-8 text-xs bg-background"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm border-b border-border shadow-sm">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold text-foreground/80 w-[40%]">
                        Nhân viên
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-center w-[12%]">Xem</th>
                      <th className="px-3 py-2.5 font-semibold text-center w-[12%]">Thêm</th>
                      <th className="px-3 py-2.5 font-semibold text-center w-[12%]">Sửa</th>
                      <th className="px-3 py-2.5 font-semibold text-center w-[12%]">Xóa</th>
                      <th className="px-3 py-2.5 font-semibold text-center w-[12%]">Tất cả</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/60">
                    {/* Default Row */}
                    {(() => {
                      const defRights = getRights(DEFAULT_EMPLOYEE_ID, selectedModuleId);
                      const isAll = defRights.view && defRights.create && defRights.edit && defRights.delete;

                      return (
                        <tr className="bg-primary/5 font-semibold">
                          <td className="px-4 py-3">
                            <div className="text-xs text-primary font-bold">
                              Mặc định cho mọi nhân viên
                            </div>
                            <div className="text-[11px] text-muted-foreground font-normal">
                              Áp dụng khi nhân viên chưa cấu hình riêng
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={defRights.view}
                              onChange={(e) =>
                                toggleRight(DEFAULT_EMPLOYEE_ID, selectedModuleId, 'view', e.target.checked)
                              }
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={defRights.create}
                              onChange={(e) =>
                                toggleRight(DEFAULT_EMPLOYEE_ID, selectedModuleId, 'create', e.target.checked)
                              }
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={defRights.edit}
                              onChange={(e) =>
                                toggleRight(DEFAULT_EMPLOYEE_ID, selectedModuleId, 'edit', e.target.checked)
                              }
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={defRights.delete}
                              onChange={(e) =>
                                toggleRight(DEFAULT_EMPLOYEE_ID, selectedModuleId, 'delete', e.target.checked)
                              }
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isAll}
                              onChange={(e) =>
                                toggleModuleRow(DEFAULT_EMPLOYEE_ID, selectedModuleId, e.target.checked)
                              }
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary"
                            />
                          </td>
                        </tr>
                      );
                    })()}

                    {/* Employee rows */}
                    {filteredEmployees.map((emp) => {
                      const isAdmin =
                        emp.role === 'admin' ||
                        emp.department.includes('Quản trị') ||
                        emp.position.includes('Giám đốc');
                      const rights = getRights(emp.id, selectedModuleId);
                      const isAll = rights.view && rights.create && rights.edit && rights.delete;

                      return (
                        <tr key={emp.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isAdmin && <Crown size={13} className="text-amber-500 fill-amber-500 shrink-0" />}
                              <div>
                                <span className="font-semibold text-foreground text-xs">
                                  {emp.fullName}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono ml-2">
                                  {emp.code}
                                </span>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {emp.position || emp.department}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Checkboxes */}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              disabled={isAdmin}
                              checked={isAdmin ? true : rights.view}
                              onChange={(e) =>
                                toggleRight(emp.id, selectedModuleId, 'view', e.target.checked)
                              }
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary disabled:opacity-50"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              disabled={isAdmin}
                              checked={isAdmin ? true : rights.create}
                              onChange={(e) =>
                                toggleRight(emp.id, selectedModuleId, 'create', e.target.checked)
                              }
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary disabled:opacity-50"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              disabled={isAdmin}
                              checked={isAdmin ? true : rights.edit}
                              onChange={(e) =>
                                toggleRight(emp.id, selectedModuleId, 'edit', e.target.checked)
                              }
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary disabled:opacity-50"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              disabled={isAdmin}
                              checked={isAdmin ? true : rights.delete}
                              onChange={(e) =>
                                toggleRight(emp.id, selectedModuleId, 'delete', e.target.checked)
                              }
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary disabled:opacity-50"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              disabled={isAdmin}
                              checked={isAdmin ? true : isAll}
                              onChange={(e) =>
                                toggleModuleRow(emp.id, selectedModuleId, e.target.checked)
                              }
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary disabled:opacity-50"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VAI TRÒ (MẪU) */}
        {activeTab === 'roles' && (
          <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                Mẫu vai trò chức danh được định cấu hình sẵn
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Áp dụng nhanh bộ quyền chuẩn cho một hoặc nhiều nhân viên chỉ với một thao tác.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ROLE_TEMPLATES.map((role) => (
                <div
                  key={role.id}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                        {role.name}
                      </h3>
                      {role.id === 'admin' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold flex items-center gap-1">
                          <Crown size={11} /> Toàn quyền
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium">
                          Vai trò mẫu
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      {role.description}
                    </p>

                    <div className="space-y-1.5 mb-4">
                      <div className="text-[11px] font-semibold text-foreground/80">
                        Chi tiết quyền truy cập chính:
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {MODULE_LIST.map((m) => {
                          const r = role.permissions[m.id];
                          if (!r || !r.view) return null;
                          return (
                            <div
                              key={m.id}
                              className="flex items-center gap-1.5 text-muted-foreground bg-muted/40 px-2 py-1 rounded"
                            >
                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                              <span className="truncate">{m.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setRoleToApply(role.id);
                        setTargetEmployeesForRole([]);
                      }}
                      className="text-xs h-8 gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 font-semibold"
                    >
                      <UserCheck size={14} />
                      Áp dụng cho nhân viên...
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal gán vai trò */}
            {roleToApply && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-card border border-border rounded-xl max-w-md w-full p-5 shadow-2xl flex flex-col max-h-[85vh]">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <UserCheck size={16} className="text-primary" />
                      Gán vai trò: {ROLE_TEMPLATES.find((r) => r.id === roleToApply)?.name}
                    </h3>
                    <button
                      onClick={() => setRoleToApply(null)}
                      className="text-muted-foreground hover:text-foreground text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="py-3 text-xs text-muted-foreground">
                    Chọn các nhân viên bạn muốn gán bộ phân quyền này:
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-60 border border-border rounded-lg mb-4">
                    {employees.map((emp) => {
                      const checked = targetEmployeesForRole.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className="flex items-center gap-3 p-2.5 hover:bg-muted/50 cursor-pointer select-none text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTargetEmployeesForRole([...targetEmployeesForRole, emp.id]);
                              } else {
                                setTargetEmployeesForRole(
                                  targetEmployeesForRole.filter((id) => id !== emp.id)
                                );
                              }
                            }}
                            className="rounded border-border text-primary accent-primary cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-foreground">{emp.fullName}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">
                              ({emp.code} - {emp.position || emp.department})
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRoleToApply(null)}
                      className="text-xs h-8"
                    >
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      disabled={targetEmployeesForRole.length === 0}
                      onClick={() => {
                        targetEmployeesForRole.forEach((empId) => {
                          applyRole(empId, roleToApply);
                        });
                        toast.success(`Đã gán vai trò cho ${targetEmployeesForRole.length} nhân viên!`);
                        setRoleToApply(null);
                      }}
                      className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      Xác nhận áp dụng
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
