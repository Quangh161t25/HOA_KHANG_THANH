import { computeAllOrdersVirtualDebt } from '@/lib/orderDebtHelper';
import { watchModule } from './moduleAuditStore';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbJSONStorage } from '@/lib/idbStorage';
import type {
  Flower,
  Supplier,
  Distributor,
  Order,
  SupplierOrder,
  InventoryItem,
  Employee,
  CashTransaction,
  DebtDailyRecord,
  FixedExpensePreset,
} from '@/types/hoaKhangThanh';

import { toInputDate, todayISODate } from '@/lib/format';
import { recordOrderAudit } from './orderLogStore';

function orderBusinessKey(order: Order) {
  return JSON.stringify([
    order.code?.trim().toLowerCase(),
    order.orderDate,
    order.distributorName?.trim().toLowerCase(),
    order.phone || '',
    order.totalAmount || 0,
    order.paidAmount || 0,
    order.items || [],
  ]);
}

/**
 * Dọn dữ liệu đơn cũ: bỏ dòng trùng hoàn toàn, đồng thời bảo đảm mã và id không trùng.
 * ID trùng khiến React tái sử dụng sai dòng và các hàm sửa/xóa tác động nhiều đơn cùng lúc.
 */
export function normalizeOrders(input: Order[]): Order[] {
  const seenRows = new Set<string>();
  const usedIds = new Set<string>();
  const usedCodes = new Set<string>();

  return input.flatMap((source, index) => {
    const rowKey = orderBusinessKey(source);
    if (seenRows.has(rowKey)) return [];
    seenRows.add(rowKey);

    const baseCode = source.code?.trim() || `DH-${index + 1}`;
    let code = baseCode;
    let codeSuffix = 2;
    while (usedCodes.has(code.toLowerCase())) {
      code = `${baseCode}-${codeSuffix++}`;
    }
    usedCodes.add(code.toLowerCase());

    const slug = code.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || String(index + 1);
    let id = source.id?.trim() || `dh-${slug}`;
    let idSuffix = 2;
    while (usedIds.has(id)) {
      id = `dh-${slug}-${idSuffix++}`;
    }
    usedIds.add(id);

    return [{ ...source, id, code }];
  });
}

// --- Flower Store ---
interface FlowerState {
  flowers: Flower[];
  addFlower: (flower: Omit<Flower, 'id'>) => void;
  updateFlower: (id: string, updates: Partial<Flower>) => void;
  deleteFlower: (id: string) => void;
  updateStock: (id: string, newStock: number) => void;
  resetFlowers: () => void;
}

export const useFlowerStore = create<FlowerState>()(
  persist(
    (set) => ({
      flowers: [],
      addFlower: (flower) =>
        set((state) => ({
          flowers: [...state.flowers, { ...flower, id: `fl-${Date.now()}` }],
        })),
      updateFlower: (id, updates) =>
        set((state) => ({
          flowers: state.flowers.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),
      deleteFlower: (id) =>
        set((state) => ({
          flowers: state.flowers.filter((f) => f.id !== id),
        })),
      updateStock: (id, newStock) =>
        set((state) => ({
          flowers: state.flowers.map((f) =>
            f.id === id
              ? {
                  ...f,
                  stock: newStock,
                  status: newStock <= 0 ? 'out_of_stock' : f.status === 'out_of_stock' ? 'active' : f.status,
                }
              : f,
          ),
        })),
      resetFlowers: () => set({ flowers: [] }),
    }),
    { name: 'hkt-flowers-storage', storage: idbJSONStorage },
  ),
);

// --- Supplier Store ---
interface SupplierState {
  suppliers: Supplier[];
  addSupplier: (s: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  resetSuppliers: () => void;
}

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set) => ({
      suppliers: [],
      addSupplier: (s) =>
        set((state) => ({
          suppliers: [{ ...s, id: `ncc-${Date.now()}` }, ...state.suppliers],
        })),
      updateSupplier: (id, updates) =>
        set((state) => ({
          suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      deleteSupplier: (id) =>
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        })),
      resetSuppliers: () => set({ suppliers: [] }),
    }),
    { name: 'hkt-suppliers-storage', storage: idbJSONStorage },
  ),
);

// --- Distributor Store ---
interface DistributorState {
  distributors: Distributor[];
  addDistributor: (d: Omit<Distributor, 'id'>) => void;
  updateDistributor: (id: string, updates: Partial<Distributor>) => void;
  deleteDistributor: (id: string) => void;
  resetDistributors: () => void;
}

export const useDistributorStore = create<DistributorState>()(
  persist(
    (set) => ({
      distributors: [],
      addDistributor: (d) =>
        set((state) => ({
          distributors: [{ ...d, id: `npp-${Date.now()}` }, ...state.distributors],
        })),
      updateDistributor: (id, updates) =>
        set((state) => ({
          distributors: state.distributors.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),
      deleteDistributor: (id) =>
        set((state) => ({
          distributors: state.distributors.filter((d) => d.id !== id),
        })),
      resetDistributors: () => set({ distributors: [] }),
    }),
    { name: 'hkt-distributors-storage', storage: idbJSONStorage },
  ),
);

// --- Order Store ---
interface OrderState {
  orders: Order[];
  addOrder: (o: Omit<Order, 'id'>, performer?: string) => void;
  updateOrder: (id: string, updates: Partial<Order>, performer?: string) => void;
  updateOrderStatus: (id: string, status: Order['status'], performer?: string) => void;
  updatePaymentStatus: (id: string, paymentStatus: Order['paymentStatus'], paidAmount?: number, performer?: string) => void;
  deleteOrder: (id: string, performer?: string) => void;
  resetOrders: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (o, performer) =>
        set((state) => {
          const totalQty = o.items.reduce((s, i) => s + (i.quantity || 0), 0);
          const subtotal = o.items.reduce((s, i) => s + (i.amount || 0), 0);
          const shipping = o.shippingFee || 0;
          const disc = o.discount || 0;
          const total = o.totalAmount || (subtotal + shipping - disc);
          const paid = o.paidAmount || 0;
          const totalCost = o.items.reduce((s, i) => s + (i.importTotal || (i.costPrice * i.quantity) || 0), 0);
          const totalProfit = subtotal - totalCost;

          const oldDebt = o.oldDebt !== undefined ? Number(o.oldDebt) : 0;
          const totalPayment = o.totalPayment !== undefined ? Number(o.totalPayment) : (total + oldDebt);

          const newOrder: Order = {
            ...o,
            id: `dh-${Date.now()}`,
            totalQuantity: totalQty,
            itemsSubtotal: subtotal,
            shippingFee: shipping,
            discount: disc,
            totalAmount: total,
            oldDebt,
            totalPayment,
            paidAmount: paid,
            debtAmount: Math.max(0, total - paid),
            totalCost,
            totalProfit,
            updatedAt: o.updatedAt || `${new Date().getDate()}/${new Date().getMonth() + 1}`,
          };
          // Trừ tồn kho hoa tương ứng
          const flowerStore = useFlowerStore.getState();
          const invStore = useInventoryStore.getState();
          newOrder.items.forEach((item) => {
            const fl = flowerStore.flowers.find((f) => f.id === item.flowerId);
            if (fl) {
              const newQty = Math.max(0, fl.stock - item.quantity);
              flowerStore.updateStock(fl.id, newQty);
            }
            invStore.exportStock(item.flowerId, item.quantity, 'order', `Xuất cho đơn hàng ${newOrder.code}`);
          });

          // Nếu có thanh toán trước, ghi nhận phiếu thu
          if (newOrder.paidAmount > 0) {
            useCashStore.getState().addTransaction({
              code: `PT-${Date.now().toString().slice(-6)}`,
              type: 'income',
              category: 'Thu tiền bán hoa sỉ',
              amount: newOrder.paidAmount,
              date: newOrder.orderDate,
              paymentMethod: 'Chuyển khoản Vietcombank',
              partner: newOrder.distributorName,
              creator: newOrder.creator,
              notes: `Thu tiền đơn hàng ${newOrder.code}`,
            });
          }

          // Tự động đồng bộ công nợ sang Quản lý Công nợ & Nhà phân phối
          setTimeout(() => {
            syncOrderToDebt(newOrder);
          }, 0);

          // Ghi nhận lịch sử thao tác thêm mới đơn
          recordOrderAudit({
            action: 'create',
            order: newOrder,
            performer,
          });

          return { orders: [...state.orders, newOrder] };
        }),
      updateOrder: (id, updates, performer) =>
        set((state) => {
          const oldOrder = state.orders.find((o) => o.id === id);
          let targetUpdated: Order | undefined;
          const updatedOrders = state.orders.map((o) => {
            if (o.id !== id) return o;
            const updated = { ...o, ...updates };
            if (updates.items) {
              updated.totalQuantity = updates.items.reduce((s, i) => s + (i.quantity || 0), 0);
              updated.itemsSubtotal = updates.items.reduce((s, i) => s + (i.amount || 0), 0);
              const shipping = updated.shippingFee || 0;
              const disc = updated.discount || 0;
              updated.totalAmount = updated.itemsSubtotal + shipping - disc;
              const paid = updated.paidAmount || 0;
              updated.debtAmount = Math.max(0, updated.totalAmount - paid);
              updated.totalPayment = updated.totalAmount + (updated.oldDebt || 0);
              updated.totalCost = updates.items.reduce((s, i) => s + (i.importTotal || (i.costPrice * i.quantity) || 0), 0);
              updated.totalProfit = updated.itemsSubtotal - updated.totalCost;
            } else if (updates.shippingFee !== undefined || updates.discount !== undefined || updates.paidAmount !== undefined || updates.oldDebt !== undefined) {
              const subtotal = updated.itemsSubtotal || updated.items.reduce((s, i) => s + (i.amount || 0), 0);
              const shipping = updated.shippingFee || 0;
              const disc = updated.discount || 0;
              updated.totalAmount = subtotal + shipping - disc;
              const paid = updated.paidAmount || 0;
              updated.debtAmount = Math.max(0, updated.totalAmount - paid);
              updated.totalPayment = updated.totalAmount + (updated.oldDebt || 0);
            }
            targetUpdated = updated;
            return updated;
          });

          if (targetUpdated) {
            const ord = targetUpdated;
            setTimeout(() => {
              syncOrderToDebt(ord, oldOrder?.code);
            }, 0);

            // Ghi nhận lịch sử thao tác chỉnh sửa đơn
            recordOrderAudit({
              action: 'update',
              order: ord,
              oldOrder,
              performer,
            });
          }

          return { orders: updatedOrders };
        }),
      updateOrderStatus: (id, status, performer) =>
        set((state) => {
          const oldOrder = state.orders.find((o) => o.id === id);
          let targetUpdated: Order | undefined;
          const updatedOrders = state.orders.map((o) => {
            if (o.id !== id) return o;
            const updated = { ...o, ...(status ? { status } : {}) };
            targetUpdated = updated;
            return updated;
          });

          if (targetUpdated && oldOrder && oldOrder.status !== status) {
            recordOrderAudit({
              action: 'status_change',
              order: targetUpdated,
              oldOrder,
              performer,
            });
          }

          return { orders: updatedOrders };
        }),
      updatePaymentStatus: (id, paymentStatus, paidAmount, performer) =>
        set((state) => {
          let targetUpdated: Order | undefined;
          const oldOrder = state.orders.find((o) => o.id === id);
          const updatedOrders = state.orders.map((o) => {
            if (o.id !== id) return o;
            const updatedPaid = paidAmount !== undefined ? paidAmount : paymentStatus === 'paid' ? o.totalAmount : o.paidAmount;
            const updated = {
              ...o,
              paymentStatus,
              paidAmount: updatedPaid,
              debtAmount: Math.max(0, o.totalAmount - updatedPaid),
            };
            targetUpdated = updated;
            return updated;
          });

          if (targetUpdated) {
            const ord = targetUpdated;
            setTimeout(() => {
              syncOrderToDebt(ord);
            }, 0);

            recordOrderAudit({
              action: 'update',
              order: ord,
              oldOrder,
              performer,
            });
          }

          return { orders: updatedOrders };
        }),
      deleteOrder: (id, performer) =>
        set((state) => {
          const oldOrder = state.orders.find((o) => o.id === id);
          if (oldOrder) {
            setTimeout(() => {
              removeOrderFromDebt(oldOrder.code, id, oldOrder.distributorId);
            }, 0);

            // Ghi nhận lịch sử thao tác xóa đơn
            recordOrderAudit({
              action: 'delete',
              order: oldOrder,
              performer,
            });
          }
          return { orders: state.orders.filter((o) => o.id !== id) };
        }),
      resetOrders: () => set({ orders: [] }),
    }),
    {
      name: 'hkt-orders-storage',
      storage: idbJSONStorage,
      merge: (persisted, current) => {
        const saved = persisted as Partial<OrderState>;
        return {
          ...current,
          ...saved,
          orders: normalizeOrders(saved.orders || current.orders),
        };
      },
    },
  ),
);

// --- Inventory Store ---
interface InventoryState {
  inventory: InventoryItem[];
  importStock: (flowerId: string, quantity: number, warehouse: string, unitPrice?: number, supplierName?: string) => void;
  exportStock: (flowerId: string, quantity: number, reason: 'order' | 'damage' | 'adjust', notes?: string) => void;
  updateInventoryItem: (flowerId: string, updates: Partial<InventoryItem>) => void;
  resetInventory: () => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      inventory: [],
      importStock: (flowerId, quantity, warehouse, unitPrice, supplierName) =>
        set((state) => {
          const fl = useFlowerStore.getState().flowers.find((f) => f.id === flowerId);
          const exists = state.inventory.some((i) => i.flowerId === flowerId);
          let updated: InventoryItem[];
          if (!exists) {
            const newItem: InventoryItem = {
              flowerId,
              flowerCode: fl?.code || `FL-${Date.now().toString().slice(-4)}`,
              flowerName: fl?.name || 'Hoa tươi',
              category: fl?.category || 'Hoa tươi',
              unit: fl?.unit || 'cành',
              warehouse: warehouse || 'Kho mát',
              currentStock: (fl?.stock || 0) + quantity,
              minStock: 50,
              maxStock: 500,
              costPrice: unitPrice || fl?.costPrice || 0,
              lastImportDate: new Date().toISOString().split('T')[0],
              shelfLifeDays: 7,
              freshness: 'Tươi mới 100% (Mới nhập hôm nay)',
              status: 'normal',
              importStock: quantity,
            };
            updated = [...state.inventory, newItem];
          } else {
            updated = state.inventory.map((item) => {
              if (item.flowerId !== flowerId) return item;
              const newStock = item.currentStock + quantity;
              return {
                ...item,
                warehouse: warehouse || item.warehouse,
                currentStock: newStock,
                importStock: (item.importStock || 0) + quantity,
                status: (newStock <= item.minStock ? 'low' : newStock === 0 ? 'out' : 'normal') as InventoryItem['status'],
                lastImportDate: new Date().toISOString().split('T')[0],
                freshness: 'Tươi mới 100% (Mới nhập hôm nay)',
              };
            });
          }

          // Update Flower stock as well
          if (fl) {
            useFlowerStore.getState().updateStock(flowerId, fl.stock + quantity);
          }

          // Ghi nhận phiếu chi tiền nếu có giá nhập
          if (unitPrice && unitPrice > 0) {
            useCashStore.getState().addTransaction({
              code: `PC-${Date.now().toString().slice(-6)}`,
              type: 'expense',
              category: 'Chi nhập hoa từ NCC',
              amount: quantity * unitPrice,
              date: new Date().toISOString().split('T')[0],
              paymentMethod: 'Chuyển khoản Vietcombank',
              partner: supplierName || 'Nhà vườn cung ứng',
              creator: 'Thủ kho Quản lý',
              notes: `Nhập ${quantity} ${fl?.unit || 'cành'} ${fl?.name || ''}`,
            });
          }

          return { inventory: updated };
        }),
      exportStock: (flowerId, quantity, reason, _notes) =>
        set((state) => {
          const fl = useFlowerStore.getState().flowers.find((f) => f.id === flowerId);
          const exists = state.inventory.some((i) => i.flowerId === flowerId);
          let updated: InventoryItem[];
          if (!exists) {
            const currentStock = Math.max(0, (fl?.stock || 0) - quantity);
            const newItem: InventoryItem = {
              flowerId,
              flowerCode: fl?.code || `FL-${Date.now().toString().slice(-4)}`,
              flowerName: fl?.name || 'Hoa tươi',
              category: fl?.category || 'Hoa tươi',
              unit: fl?.unit || 'cành',
              warehouse: 'Kho mát',
              currentStock,
              minStock: 50,
              maxStock: 500,
              costPrice: fl?.costPrice || 0,
              lastImportDate: '',
              shelfLifeDays: 7,
              freshness: 'Tươi mới',
              status: (currentStock === 0 ? 'out' : 'normal') as InventoryItem['status'],
              exportStock: quantity,
            };
            updated = [...state.inventory, newItem];
          } else {
            updated = state.inventory.map((item) => {
              if (item.flowerId !== flowerId) return item;
              const newStock = Math.max(0, item.currentStock - quantity);
              return {
                ...item,
                currentStock: newStock,
                exportStock: (item.exportStock || 0) + quantity,
                status: (newStock === 0 ? 'out' : newStock <= item.minStock ? 'low' : 'normal') as InventoryItem['status'],
              };
            });
          }

          if (reason === 'damage' || reason === 'order' || reason === 'adjust') {
            if (fl) {
              useFlowerStore.getState().updateStock(flowerId, Math.max(0, fl.stock - quantity));
            }
          }

          return { inventory: updated };
        }),
      updateInventoryItem: (flowerId, updates) =>
        set((state) => {
          const exists = state.inventory.some((i) => i.flowerId === flowerId);
          if (!exists) {
            const fl = useFlowerStore.getState().flowers.find((f) => f.id === flowerId);
            const newItem: InventoryItem = {
              flowerId,
              flowerCode: fl?.code || `FL-${Date.now().toString().slice(-4)}`,
              flowerName: fl?.name || 'Hoa tươi',
              category: fl?.category || 'Hoa tươi',
              unit: fl?.unit || 'cành',
              warehouse: 'Kho mát',
              currentStock: fl?.stock || 0,
              minStock: 50,
              maxStock: 500,
              costPrice: fl?.costPrice || 0,
              lastImportDate: '',
              shelfLifeDays: 7,
              freshness: 'Tươi mới',
              status: 'normal',
              ...updates,
            };
            return { inventory: [...state.inventory, newItem] };
          }
          return {
            inventory: state.inventory.map((i) => (i.flowerId === flowerId ? { ...i, ...updates } : i)),
          };
        }),
      resetInventory: () => set({ inventory: [] }),
    }),
    { name: 'hkt-inventory-storage', storage: idbJSONStorage },
  ),
);

// --- Employee Store ---
interface EmployeeState {
  employees: Employee[];
  addEmployee: (e: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  resetEmployees: () => void;
}

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set) => ({
      employees: [],
      addEmployee: (e) =>
        set((state) => ({
          employees: [...state.employees, { ...e, id: `nv-${Date.now()}` }],
        })),
      updateEmployee: (id, updates) =>
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((e) => e.id !== id),
        })),
      resetEmployees: () => set({ employees: [] }),
    }),
    { name: 'hkt-employees-storage', storage: idbJSONStorage },
  ),
);

// --- Cash Store (Thu Chi) ---
interface CashState {
  transactions: CashTransaction[];
  addTransaction: (t: Omit<CashTransaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<CashTransaction>) => void;
  deleteTransaction: (id: string) => void;
  resetTransactions: () => void;
}

export const useCashStore = create<CashState>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (t) =>
        set((state) => ({
          transactions: [...state.transactions, { ...t, id: `tc-${Date.now()}` }],
        })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      resetTransactions: () => set({ transactions: [] }),
    }),
    { name: 'hkt-cash-storage', storage: idbJSONStorage },
  ),
);

// --- Debt Store (Công nợ theo ngày cho NPP & NCC) ---
interface DebtState {
  records: DebtDailyRecord[];
  addRecord: (r: Omit<DebtDailyRecord, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<DebtDailyRecord>) => void;
  deleteRecord: (id: string) => void;
  resetRecords: () => void;
}

export const useDebtStore = create<DebtState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (r) =>
        set((state) => {
          const isThu = r.type === 'thu';
          const amt = r.amount !== undefined ? r.amount : (isThu ? (r.decreaseAmount || 0) : (r.increaseAmount || 0));
          const prevDebt = r.oldDebt !== undefined ? r.oldDebt : 0;
          const calculatedRemainingDebt =
            r.remainingDebt !== undefined
              ? r.remainingDebt
              : isThu
              ? Math.max(0, prevDebt - amt)
              : prevDebt + amt;

          const newRecord: DebtDailyRecord = {
            ...r,
            id: `debt-${Date.now()}`,
            entryType: r.entryType || 'daily',
            type: r.type || (r.decreaseAmount && r.decreaseAmount > 0 ? 'thu' : 'chi'),
            amount: amt,
            remainingDebt: calculatedRemainingDebt,
            oldDebt: prevDebt,
            increaseAmount: isThu ? 0 : amt,
            decreaseAmount: isThu ? amt : 0,
            finalDebt: calculatedRemainingDebt,
          };
          setTimeout(() => {
            if (r.partnerType === 'npp') {
              recalcDistributorDebts(r.partnerId);
            } else {
              recalcSupplierDebts(r.partnerId);
            }
          }, 0);
          return { records: [...state.records, newRecord] };
        }),
      updateRecord: (id, updates) =>
        set((state) => {
          let targetUpdated: DebtDailyRecord | undefined;
          const updatedRecords = state.records.map((r) => {
            if (r.id !== id) return r;
            const updated = { ...r, ...updates };
            const isThu = updated.type === 'thu';
            const amt = updated.amount !== undefined ? updated.amount : (isThu ? (updated.decreaseAmount || 0) : (updated.increaseAmount || 0));
            const prev = updated.oldDebt !== undefined ? updated.oldDebt : 0;

            if (updates.amount !== undefined || updates.type !== undefined || updates.remainingDebt !== undefined) {
              updated.amount = amt;
              updated.remainingDebt = updates.remainingDebt !== undefined
                ? updates.remainingDebt
                : (isThu ? Math.max(0, prev - amt) : prev + amt);
              updated.increaseAmount = isThu ? 0 : amt;
              updated.decreaseAmount = isThu ? amt : 0;
              updated.finalDebt = updated.remainingDebt;
            } else if (updates.oldDebt !== undefined || updates.increaseAmount !== undefined || updates.decreaseAmount !== undefined) {
              const old = updates.oldDebt !== undefined ? updates.oldDebt : r.oldDebt || 0;
              const inc = updates.increaseAmount !== undefined ? updates.increaseAmount : r.increaseAmount || 0;
              const dec = updates.decreaseAmount !== undefined ? updates.decreaseAmount : r.decreaseAmount || 0;
              updated.finalDebt = old + inc - dec;
              updated.remainingDebt = updated.finalDebt;
            }
            targetUpdated = updated;
            return updated;
          });
          if (targetUpdated) {
            const rec = targetUpdated;
            setTimeout(() => {
              if (rec.partnerType === 'npp') {
                recalcDistributorDebts(rec.partnerId);
              } else {
                recalcSupplierDebts(rec.partnerId);
              }
            }, 0);
          }
          return { records: updatedRecords };
        }),
      deleteRecord: (id) =>
        set((state) => {
          const target = state.records.find((r) => r.id === id);
          if (target) {
            setTimeout(() => {
              if (target.partnerType === 'npp') {
                recalcDistributorDebts(target.partnerId);
              } else {
                recalcSupplierDebts(target.partnerId);
              }
            }, 0);
          }
          return { records: state.records.filter((r) => r.id !== id) };
        }),
      resetRecords: () => set({ records: [] }),
    }),
    { name: 'hkt-debt-records-storage', storage: idbJSONStorage },
  ),
);

// --- Fixed Expense Presets Store (Chi phí cố định nhanh) ---
interface FixedExpenseState {
  presets: FixedExpensePreset[];
  addPreset: (p: Omit<FixedExpensePreset, 'id'>) => void;
  updatePreset: (id: string, updates: Partial<FixedExpensePreset>) => void;
  deletePreset: (id: string) => void;
  resetPresets: () => void;
}

export const useFixedExpenseStore = create<FixedExpenseState>()(
  persist(
    (set) => ({
      presets: [],
      addPreset: (p) =>
        set((state) => ({
          presets: [...state.presets, { ...p, id: `fe-${Date.now()}` }],
        })),
      updatePreset: (id, updates) =>
        set((state) => ({
          presets: state.presets.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),
      resetPresets: () => set({ presets: [] }),
    }),
    { name: 'hkt-fixed-expenses-storage', storage: idbJSONStorage },
  ),
);

// --- Supplier Order Store (Đơn đặt / nhập hoa từ Nhà cung cấp/Nhà vườn) ---
interface SupplierOrderState {
  orders: SupplierOrder[];
  addOrder: (order: Omit<SupplierOrder, 'id'>) => void;
  updateOrder: (id: string, updates: Partial<SupplierOrder>) => void;
  deleteOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: SupplierOrder['status']) => void;
  updatePaymentStatus: (id: string, status: SupplierOrder['paymentStatus'], paidAmount?: number) => void;
  resetOrders: () => void;
}

export const useSupplierOrderStore = create<SupplierOrderState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) =>
        set((state) => {
          const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
          const subtotal = order.items.reduce((sum, i) => sum + i.amount, 0);
          const shipping = order.shippingFee || 0;
          const discount = order.discount || 0;
          const totalAmount = Math.max(0, subtotal + shipping - discount);
          const paidAmount = order.paidAmount || 0;
          const debtAmount = Math.max(0, totalAmount - paidAmount);
          const paymentStatus: SupplierOrder['paymentStatus'] =
            paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

          const newOrder: SupplierOrder = {
            ...order,
            id: `po-ncc-${Date.now()}`,
            totalQuantity: totalQty,
            itemsSubtotal: subtotal,
            totalAmount,
            paidAmount,
            debtAmount,
            paymentStatus,
            updatedAt: new Date().toISOString(),
          };

          // Tự động đồng bộ công nợ nhà cung cấp
          setTimeout(() => {
            syncSupplierOrderToDebt(newOrder);
          }, 0);

          return { orders: [...state.orders, newOrder] };
        }),
      updateOrder: (id, updates) =>
        set((state) => {
          const oldOrder = state.orders.find((o) => o.id === id);
          let targetUpdated: SupplierOrder | undefined;
          const updatedOrders = state.orders.map((o) => {
            if (o.id !== id) return o;
            const updated = { ...o, ...updates };
            if (updates.items) {
              updated.totalQuantity = updates.items.reduce((sum, i) => sum + i.quantity, 0);
              updated.itemsSubtotal = updates.items.reduce((sum, i) => sum + i.amount, 0);
            }
            const subtotal = updated.itemsSubtotal ?? o.itemsSubtotal;
            const shipping = updated.shippingFee ?? o.shippingFee ?? 0;
            const discount = updated.discount ?? o.discount ?? 0;
            const totalAmount = Math.max(0, subtotal + shipping - discount);
            const paidAmount = updated.paidAmount !== undefined ? updated.paidAmount : o.paidAmount;
            const debtAmount = Math.max(0, totalAmount - paidAmount);
            const paymentStatus: SupplierOrder['paymentStatus'] =
              paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

            const next: SupplierOrder = {
              ...updated,
              totalAmount,
              paidAmount,
              debtAmount,
              paymentStatus,
              updatedAt: new Date().toISOString(),
            };
            targetUpdated = next;
            return next;
          });

          if (targetUpdated) {
            const ord = targetUpdated;
            setTimeout(() => {
              syncSupplierOrderToDebt(ord, oldOrder?.code);
            }, 0);
          }

          return { orders: updatedOrders };
        }),
      deleteOrder: (id) =>
        set((state) => {
          const oldOrder = state.orders.find((o) => o.id === id);
          if (oldOrder) {
            setTimeout(() => {
              removeSupplierOrderFromDebt(oldOrder.code, id, oldOrder.supplierId);
            }, 0);
          }
          return { orders: state.orders.filter((o) => o.id !== id) };
        }),
      updateOrderStatus: (id, status) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
          ),
        })),
      updatePaymentStatus: (id, paymentStatus, paidAmount) =>
        set((state) => {
          let targetUpdated: SupplierOrder | undefined;
          const updatedOrders = state.orders.map((o) => {
            if (o.id !== id) return o;
            const newPaid =
              paidAmount !== undefined ? paidAmount : paymentStatus === 'paid' ? o.totalAmount : o.paidAmount;
            const debtAmount = Math.max(0, o.totalAmount - newPaid);
            const updated = {
              ...o,
              paymentStatus,
              paidAmount: newPaid,
              debtAmount,
              updatedAt: new Date().toISOString(),
            };
            targetUpdated = updated;
            return updated;
          });

          if (targetUpdated) {
            const ord = targetUpdated;
            setTimeout(() => {
              syncSupplierOrderToDebt(ord);
            }, 0);
          }

          return { orders: updatedOrders };
        }),
      resetOrders: () => set({ orders: [] }),
    }),
    { name: 'hkt-supplier-orders-storage', storage: idbJSONStorage },
  ),
);

/**
 * Chuẩn hóa chuỗi ngày sang định dạng YYYY-MM-DD
 */
export function normalizeToISODate(dateStr?: string): string {
  if (!dateStr) return todayISODate();
  const trimmed = dateStr.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  const iso = trimmed.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return iso;
  }
  return toInputDate(trimmed) || todayISODate();
}

/**
 * Tính toán tài chính công nợ & tiền bán hoa của NPP từ sổ công nợ và đơn hàng
 */
export function calculateDistributorFinancials(
  distributor: Distributor,
  debtRecords: DebtDailyRecord[],
  orders: Order[]
) {
  const normName = distributor.name ? distributor.name.trim().toLowerCase() : '';

  // 1. Lọc tất cả bản ghi công nợ của NPP này
  const matchingRecords = debtRecords.filter(
    (r) =>
      r.partnerType === 'npp' &&
      (r.partnerId === distributor.id ||
        (r.partnerCode && r.partnerCode === distributor.code) ||
        (r.partnerName && r.partnerName.trim().toLowerCase() === normName))
  );

  let debtSales = 0;
  let debtCollected = 0;
  const recordedOrderCodes = new Set<string>();

  for (const r of matchingRecords) {
    const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
    const inc = r.increaseAmount !== undefined ? r.increaseAmount : (!isThu ? (r.amount || 0) : 0);
    const dec = r.decreaseAmount !== undefined ? r.decreaseAmount : (isThu ? (r.amount || 0) : 0);
    debtSales += inc;
    debtCollected += dec;
    if (r.referenceCode) recordedOrderCodes.add(r.referenceCode);
    if (r.id && r.id.startsWith('debt-dh-')) recordedOrderCodes.add(r.id.replace('debt-dh-', ''));
  }

  // 2. Các đơn hàng chưa ghi nhận vào sổ công nợ
  const matchingOrders = orders.filter(
    (o) =>
      o.distributorId === distributor.id ||
      (o.distributorName && o.distributorName.trim().toLowerCase() === normName)
  );

  let unrecordedSales = 0;
  let unrecordedCollected = 0;

  for (const o of matchingOrders) {
    const isRecorded = (o.code && recordedOrderCodes.has(o.code)) || recordedOrderCodes.has(o.id);
    if (!isRecorded && o.status !== 'huy') {
      unrecordedSales += (o.totalAmount || 0);
      unrecordedCollected += (o.paidAmount || 0);
    }
  }

  const oldDebt = distributor.oldDebt || 0;
  const salesAmount = debtSales + unrecordedSales;
  const collectedAmount = debtCollected + unrecordedCollected;
  const finalDebt = oldDebt + salesAmount - collectedAmount;

  return {
    oldDebt,
    salesAmount,
    collectedAmount,
    finalDebt,
    totalRevenue: salesAmount,
  };
}

/**
 * Tính toán tài chính công nợ & tiền nhập hoa của Nhà Cung Cấp từ sổ công nợ và đơn nhập
 */
export function calculateSupplierFinancials(
  supplier: Supplier,
  debtRecords: DebtDailyRecord[],
  supplierOrders: SupplierOrder[]
) {
  const normName = supplier.name ? supplier.name.trim().toLowerCase() : '';

  const matchingRecords = debtRecords.filter(
    (r) =>
      r.partnerType === 'ncc' &&
      (r.partnerId === supplier.id ||
        (r.partnerCode && r.partnerCode === supplier.code) ||
        (r.partnerName && r.partnerName.trim().toLowerCase() === normName))
  );

  let debtImport = 0;
  let debtPaid = 0;
  const recordedOrderCodes = new Set<string>();

  for (const r of matchingRecords) {
    const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
    const inc = r.increaseAmount !== undefined ? r.increaseAmount : (!isThu ? (r.amount || 0) : 0);
    const dec = r.decreaseAmount !== undefined ? r.decreaseAmount : (isThu ? (r.amount || 0) : 0);
    debtImport += inc;
    debtPaid += dec;
    if (r.referenceCode) recordedOrderCodes.add(r.referenceCode);
    if (r.id && r.id.startsWith('debt-ncc-')) recordedOrderCodes.add(r.id.replace('debt-ncc-', ''));
  }

  const matchingOrders = supplierOrders.filter(
    (o) =>
      o.supplierId === supplier.id ||
      (o.supplierName && o.supplierName.trim().toLowerCase() === normName)
  );

  let unrecordedImport = 0;
  let unrecordedPaid = 0;

  for (const o of matchingOrders) {
    const isRecorded = (o.code && recordedOrderCodes.has(o.code)) || recordedOrderCodes.has(o.id);
    if (!isRecorded && o.status !== 'huy') {
      unrecordedImport += (o.totalAmount || 0);
      unrecordedPaid += (o.paidAmount || 0);
    }
  }

  const oldDebt = supplier.oldDebt || 0;
  const importAmount = debtImport + unrecordedImport;
  const paidAmount = debtPaid + unrecordedPaid;
  const finalDebt = oldDebt + importAmount - paidAmount;

  return {
    oldDebt,
    importAmount,
    paidAmount,
    finalDebt,
    totalDebt: finalDebt,
  };
}

/**
 * Tính toán lại tổng phát sinh và công nợ cuối của Nhà Phân Phối
 */
export function recalcDistributorDebts(distId?: string) {
  if (!distId) return;
  const orderStore = useOrderStore.getState();
  const debtStore = useDebtStore.getState();
  const distStore = useDistributorStore.getState();

  const dist = distStore.distributors.find((d) => d.id === distId);
  if (!dist) return;

  const fin = calculateDistributorFinancials(dist, debtStore.records, orderStore.orders);

  distStore.updateDistributor(dist.id, {
    salesAmount: fin.salesAmount,
    collectedAmount: fin.collectedAmount,
    finalDebt: fin.finalDebt,
    currentDebt: fin.finalDebt,
    totalRevenue: fin.totalRevenue,
  });

  // Tự động tính toán lại và đồng bộ công nợ cũ & thanh toán cho toàn bộ đơn hàng liên quan của NPP này
  const allOrders = orderStore.orders;
  const allDebtRecords = debtStore.records;
  const allDistributors = distStore.distributors;

  const vMap = computeAllOrdersVirtualDebt(allOrders, allDebtRecords, allDistributors);

  let hasOrderChange = false;
  const nextOrders = allOrders.map((o) => {
    const v = vMap.get(o.id);
    if (v && (o.oldDebt !== v.oldDebt || o.totalPayment !== v.totalPayment)) {
      hasOrderChange = true;
      return {
        ...o,
        oldDebt: v.oldDebt,
        totalPayment: v.totalPayment,
        debtAmount: Math.max(0, v.totalPayment - (o.paidAmount || 0)),
      };
    }
    return o;
  });

  if (hasOrderChange) {
    useOrderStore.setState({ orders: nextOrders });
  }

  const orderDebtInfoMap = new Map<string, { oldDebt: number; totalPayment: number; finalDebt: number }>();
  allOrders.forEach((o) => {
    const v = vMap.get(o.id);
    if (v) {
      orderDebtInfoMap.set(o.code, { oldDebt: v.oldDebt, totalPayment: v.totalPayment, finalDebt: v.finalDebt });
      orderDebtInfoMap.set(o.id, { oldDebt: v.oldDebt, totalPayment: v.totalPayment, finalDebt: v.finalDebt });
    }
  });

  let hasRecordChange = false;
  const nextRecords = allDebtRecords.map((r) => {
    if (r.partnerType !== 'npp') return r;
    const info = (r.referenceCode ? orderDebtInfoMap.get(r.referenceCode) : undefined) ||
                 (r.id.startsWith('debt-dh-') ? orderDebtInfoMap.get(r.id.replace('debt-dh-', '')) : undefined);
    if (info && (r.oldDebt !== info.oldDebt || r.finalDebt !== info.finalDebt || r.remainingDebt !== info.finalDebt)) {
      hasRecordChange = true;
      return {
        ...r,
        oldDebt: info.oldDebt,
        finalDebt: info.finalDebt,
        remainingDebt: info.finalDebt,
      };
    }
    return r;
  });
  if (hasRecordChange) {
    useDebtStore.setState({ records: nextRecords });
  }
}

/**
 * Tự động đồng bộ đơn hàng bán vào Quản lý Công nợ theo ngày & Cập nhật NPP
 */
export function syncOrderToDebt(order: Order, previousCode?: string) {
  const debtStore = useDebtStore.getState();
  const distStore = useDistributorStore.getState();

  // 1. Tìm hoặc tự động tạo NPP nếu chưa có
  let dist = distStore.distributors.find(
    (d) =>
      (order.distributorId && d.id === order.distributorId) ||
      (d.name && d.name.trim().toLowerCase() === order.distributorName.trim().toLowerCase()),
  );

  if (!dist && order.distributorName.trim()) {
    const newDist: Distributor = {
      id: order.distributorId || `npp-${Date.now()}`,
      code: `NPP-${(distStore.distributors.length + 1).toString().padStart(3, '0')}`,
      name: order.distributorName.trim(),
      representative: order.distributorName.trim(),
      phone: order.phone || '',
      email: '',
      address: order.address || 'Việt Nam',
      region: 'Miền Nam',
      tier: 'Tiềm năng',
      discount: 0,
      totalRevenue: order.totalAmount || 0,
      oldDebt: order.oldDebt || 0,
      salesAmount: order.totalAmount || 0,
      collectedAmount: order.paidAmount || 0,
      finalDebt: (order.oldDebt || 0) + (order.totalAmount || 0) - (order.paidAmount || 0),
      currentDebt: (order.oldDebt || 0) + (order.totalAmount || 0) - (order.paidAmount || 0),
      status: 'active',
    };
    distStore.addDistributor(newDist);
    dist = newDist;
  }

  // 2. Tính công nợ cũ trước đơn này
  const oldDebtVal =
    order.oldDebt !== undefined ? order.oldDebt : dist?.finalDebt ?? dist?.currentDebt ?? dist?.oldDebt ?? 0;
  const increaseAmount = order.totalAmount || 0;
  const decreaseAmount = order.paidAmount || 0;
  const finalDebt = oldDebtVal + increaseAmount - decreaseAmount;
  const isoDate = normalizeToISODate(order.orderDate);

  // 3. Tìm bản ghi công nợ tương ứng
  const refCode = previousCode || order.code;
  const existingRecordIndex = debtStore.records.findIndex(
    (r) =>
      (refCode && r.referenceCode === refCode) ||
      r.id === `debt-dh-${order.id}` ||
      r.id === `debt-order-${order.id}` ||
      (order.code && r.referenceCode === order.code),
  );

  const isThuOnly = (order.totalAmount || 0) === 0 && (order.paidAmount || 0) > 0;
  const debtRecord: DebtDailyRecord = {
    id: existingRecordIndex >= 0 ? debtStore.records[existingRecordIndex].id : `debt-dh-${order.id}`,
    date: isoDate,
    partnerType: 'npp',
    partnerId: dist?.id || order.distributorId || `npp-auto-${Date.now()}`,
    partnerCode: dist?.code || 'NPP-LE',
    partnerName: order.distributorName,
    phone: order.phone || dist?.phone || '',
    entryType: 'order',
    type: isThuOnly ? 'thu' : 'chi',
    amount: order.totalAmount || order.paidAmount || 0,
    remainingDebt: finalDebt,
    oldDebt: oldDebtVal,
    increaseAmount,
    decreaseAmount,
    finalDebt,
    referenceCode: order.code,
    notes: order.notes ? `Đơn hàng ${order.code}: ${order.notes}` : `Đơn hàng ${order.code}`,
    creator: order.creator || 'Admin',
  };

  if (existingRecordIndex >= 0) {
    const updatedRecords = [...debtStore.records];
    updatedRecords[existingRecordIndex] = debtRecord;
    useDebtStore.setState({ records: updatedRecords });
  } else {
    useDebtStore.setState({ records: [debtRecord, ...debtStore.records] });
  }

  // 4. Đồng bộ tổng công nợ vào useDistributorStore
  recalcDistributorDebts(dist?.id || order.distributorId);
}

/**
 * Xóa bản ghi công nợ khi xóa đơn hàng bán
 */
export function removeOrderFromDebt(orderCode: string, orderId?: string, distId?: string) {
  const debtStore = useDebtStore.getState();
  const nextRecords = debtStore.records.filter(
    (r) =>
      r.referenceCode !== orderCode &&
      r.id !== `debt-dh-${orderId}` &&
      r.id !== `debt-order-${orderId}`,
  );
  useDebtStore.setState({ records: nextRecords });
  if (distId) {
    recalcDistributorDebts(distId);
  }
}

/**
 * Tính toán lại tổng phát sinh và công nợ cuối của Nhà Cung Cấp
 */
export function recalcSupplierDebts(supplierId?: string) {
  if (!supplierId) return;
  const supOrderStore = useSupplierOrderStore.getState();
  const debtStore = useDebtStore.getState();
  const supStore = useSupplierStore.getState();

  const supplier = supStore.suppliers.find((s) => s.id === supplierId);
  if (!supplier) return;

  const fin = calculateSupplierFinancials(supplier, debtStore.records, supOrderStore.orders);

  supStore.updateSupplier(supplier.id, {
    importAmount: fin.importAmount,
    paidAmount: fin.paidAmount,
    finalDebt: fin.finalDebt,
    totalDebt: fin.totalDebt,
  });
}

/**
 * Tính toán lại toàn bộ tài chính công nợ cho tất cả Nhà Phân Phối
 */
export function recalcAllDistributorsDebts() {
  const orderStore = useOrderStore.getState();
  const debtStore = useDebtStore.getState();
  const distStore = useDistributorStore.getState();

  if (distStore.distributors.length === 0) return;

  const updatedDistributors = distStore.distributors.map((dist) => {
    const fin = calculateDistributorFinancials(dist, debtStore.records, orderStore.orders);
    return {
      ...dist,
      salesAmount: fin.salesAmount,
      collectedAmount: fin.collectedAmount,
      finalDebt: fin.finalDebt,
      currentDebt: fin.finalDebt,
      totalRevenue: fin.totalRevenue,
    };
  });

  useDistributorStore.setState({ distributors: updatedDistributors });
}

/**
 * Tính toán lại toàn bộ tài chính công nợ cho tất cả Nhà Cung Cấp
 */
export function recalcAllSuppliersDebts() {
  const supOrderStore = useSupplierOrderStore.getState();
  const debtStore = useDebtStore.getState();
  const supStore = useSupplierStore.getState();

  if (supStore.suppliers.length === 0) return;

  const updatedSuppliers = supStore.suppliers.map((s) => {
    const fin = calculateSupplierFinancials(s, debtStore.records, supOrderStore.orders);
    return {
      ...s,
      importAmount: fin.importAmount,
      paidAmount: fin.paidAmount,
      finalDebt: fin.finalDebt,
      totalDebt: fin.totalDebt,
    };
  });

  useSupplierStore.setState({ suppliers: updatedSuppliers });
}

/**
 * Tự động đồng bộ đơn nhập NCC vào Quản lý Công nợ theo ngày & Cập nhật NCC
 */
export function syncSupplierOrderToDebt(order: SupplierOrder, previousCode?: string) {
  const debtStore = useDebtStore.getState();
  const supStore = useSupplierStore.getState();

  let supplier = supStore.suppliers.find(
    (s) =>
      (order.supplierId && s.id === order.supplierId) ||
      (s.name && s.name.trim().toLowerCase() === order.supplierName.trim().toLowerCase()),
  );

  if (!supplier && order.supplierName.trim()) {
    const newSup: Supplier = {
      id: order.supplierId || `ncc-${Date.now()}`,
      code: `NCC-${(supStore.suppliers.length + 1).toString().padStart(3, '0')}`,
      name: order.supplierName.trim(),
      contactPerson: order.supplierName.trim(),
      phone: order.phone || '',
      email: '',
      address: order.address || 'Đà Lạt, Lâm Đồng',
      specialties: ['Hoa tươi'],
      rating: 5,
      oldDebt: 0,
      importAmount: order.totalAmount || 0,
      paidAmount: order.paidAmount || 0,
      finalDebt: (order.totalAmount || 0) - (order.paidAmount || 0),
      totalDebt: (order.totalAmount || 0) - (order.paidAmount || 0),
      status: 'active',
    };
    supStore.addSupplier(newSup);
    supplier = newSup;
  }

  const oldDebtVal = supplier?.finalDebt ?? supplier?.totalDebt ?? supplier?.oldDebt ?? 0;
  const increaseAmount = order.totalAmount || 0;
  const decreaseAmount = order.paidAmount || 0;
  const finalDebt = oldDebtVal + increaseAmount - decreaseAmount;
  const isoDate = normalizeToISODate(order.orderDate);

  const refCode = previousCode || order.code;
  const existingRecordIndex = debtStore.records.findIndex(
    (r) =>
      (refCode && r.referenceCode === refCode) ||
      r.id === `debt-ncc-${order.id}` ||
      (order.code && r.referenceCode === order.code),
  );

  const isThuOnly = (order.totalAmount || 0) === 0 && (order.paidAmount || 0) > 0;
  const debtRecord: DebtDailyRecord = {
    id: existingRecordIndex >= 0 ? debtStore.records[existingRecordIndex].id : `debt-ncc-${order.id}`,
    date: isoDate,
    partnerType: 'ncc',
    partnerId: supplier?.id || order.supplierId || `ncc-auto-${Date.now()}`,
    partnerCode: supplier?.code || 'NCC-LE',
    partnerName: order.supplierName,
    phone: order.phone || supplier?.phone || '',
    entryType: 'order',
    type: isThuOnly ? 'thu' : 'chi',
    amount: order.totalAmount || order.paidAmount || 0,
    remainingDebt: finalDebt,
    oldDebt: oldDebtVal,
    increaseAmount,
    decreaseAmount,
    finalDebt,
    referenceCode: order.code,
    notes: order.notes ? `Đơn nhập NCC ${order.code}: ${order.notes}` : `Đơn nhập NCC ${order.code}`,
    creator: order.creator || 'Admin',
  };

  if (existingRecordIndex >= 0) {
    const updatedRecords = [...debtStore.records];
    updatedRecords[existingRecordIndex] = debtRecord;
    useDebtStore.setState({ records: updatedRecords });
  } else {
    useDebtStore.setState({ records: [debtRecord, ...debtStore.records] });
  }

  recalcSupplierDebts(supplier?.id || order.supplierId);
}

/**
 * Xóa bản ghi công nợ khi xóa đơn nhập NCC
 */
export function removeSupplierOrderFromDebt(orderCode: string, orderId?: string, supplierId?: string) {
  const debtStore = useDebtStore.getState();
  const nextRecords = debtStore.records.filter(
    (r) =>
      r.referenceCode !== orderCode &&
      r.id !== `debt-ncc-${orderId}`,
  );
  useDebtStore.setState({ records: nextRecords });
  if (supplierId) {
    recalcSupplierDebts(supplierId);
  }
}

/**
 * Tự động đồng bộ toàn bộ đơn hàng hiện có vào công nợ nếu chưa có bản ghi
 */
export function syncAllOrdersToDebtRecords() {
  const orderStore = useOrderStore.getState();
  const supOrderStore = useSupplierOrderStore.getState();
  const debtStore = useDebtStore.getState();

  // Tra cứu O(1) thay vì quét toàn bộ công nợ cho từng đơn
  const debtKeys = new Set<string>();
  debtStore.records.forEach((r) => {
    if (r.referenceCode) debtKeys.add(r.referenceCode);
    debtKeys.add(r.id);
  });

  // Đơn hàng bán
  orderStore.orders.forEach((o) => {
    const hasRecord = debtKeys.has(o.code) || debtKeys.has(`debt-dh-${o.id}`);
    if (!hasRecord) {
      syncOrderToDebt(o);
    }
  });

  // Đơn nhập NCC
  supOrderStore.orders.forEach((po) => {
    const hasRecord = debtKeys.has(po.code) || debtKeys.has(`debt-ncc-${po.id}`);
    if (!hasRecord) {
      syncSupplierOrderToDebt(po);
    }
  });
}

/**
 * Xóa sạch toàn bộ số liệu công nợ và đơn hàng mẫu để người dùng nhập mới từ đầu
 */
export const clearAllDebtAndOrderData = () => {
  useDebtStore.setState({ records: [] });
  useOrderStore.setState({ orders: [] });
  useSupplierOrderStore.setState({ orders: [] });
  useDistributorStore.setState((state) => ({
    distributors: state.distributors.map((d) => ({
      ...d,
      totalRevenue: 0,
      oldDebt: 0,
      salesAmount: 0,
      collectedAmount: 0,
      finalDebt: 0,
      currentDebt: 0,
    })),
  }));
  useSupplierStore.setState((state) => ({
    suppliers: state.suppliers.map((s) => ({
      ...s,
      oldDebt: 0,
      importAmount: 0,
      paidAmount: 0,
      finalDebt: 0,
      totalDebt: 0,
    })),
  }));
  try {
    localStorage.removeItem('hkt-debt-records-storage');
    localStorage.removeItem('hkt-orders-storage');
    localStorage.removeItem('hkt-supplier-orders-storage');
    localStorage.setItem('hkt-debts-cleared-clean-v2', 'true');
  } catch {
    // Ignore
  }
};

// Tự động làm sạch dữ liệu công nợ rác cũ một lần duy nhất
if (typeof window !== 'undefined' && localStorage.getItem('hkt-debts-cleared-clean-v2') !== 'true') {
  clearAllDebtAndOrderData();
}

// Không tự chạy syncAllOrdersToDebtRecords lúc khởi động: công nợ lấy từ Google Sheets làm chuẩn,
// và bản ghi từ Sheets không có referenceCode nên việc đồng bộ lại toàn bộ đơn gây treo trang.

// Register once, after persisted stores and startup migrations are initialized.
watchModule(useFlowerStore, (state) => state.flowers, 'hoa', (row) => row.id);
watchModule(useSupplierStore, (state) => state.suppliers, 'ncc', (row) => row.id);
watchModule(useDistributorStore, (state) => state.distributors, 'npp', (row) => row.id);
watchModule(useSupplierOrderStore, (state) => state.orders, 'don-hang-ncc', (row) => row.id);
watchModule(useInventoryStore, (state) => state.inventory, 'ton-kho', (row) => row.flowerId);
watchModule(useEmployeeStore, (state) => state.employees, 'nhan-vien', (row) => row.id);
watchModule(useCashStore, (state) => state.transactions, 'thu-chi', (row) => row.id);
watchModule(useFixedExpenseStore, (state) => state.presets, 'thu-chi', (row) => row.id);
watchModule(useDebtStore, (state) => state.records, 'cong-no', (row) => row.id);
