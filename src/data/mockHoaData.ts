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

// Start with empty lists so the owner can enter new business data.
export const INITIAL_FLOWERS: Flower[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_DISTRIBUTORS: Distributor[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_TRANSACTIONS: CashTransaction[] = [];
export const INITIAL_DEBT_RECORDS: DebtDailyRecord[] = [];
export const DEFAULT_FIXED_EXPENSES: FixedExpensePreset[] = [];
export const INITIAL_SUPPLIER_ORDERS: SupplierOrder[] = [];
