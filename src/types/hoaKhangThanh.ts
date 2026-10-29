export interface Flower {
  id: string;
  code: string;
  name: string;
  customName?: string; // Tên riêng do người dùng tự đặt
  category: string;
  unit: string;
  costPrice: number;
  wholesalePrice: number;
  stock: number;
  origin: string;
  color: string;
  status: 'active' | 'out_of_stock' | 'discontinued';
  description?: string;
  image?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  specialties: string[];
  rating: number;
  totalDebt: number;
  oldDebt?: number; // Công nợ cũ
  importAmount?: number; // Tiền nhập hoa
  paidAmount?: number; // Tiền trả NCC
  finalDebt?: number; // Công nợ cuối
  status: 'active' | 'inactive';
  notes?: string;
}

export interface Distributor {
  id: string;
  code: string;
  name: string;
  representative: string;
  phone: string;
  email: string;
  address: string;
  region: string;
  tier: 'VIP 1 (Kim Cương)' | 'VIP 2 (Vàng)' | 'VIP 3 (Bạc)' | 'Tiềm năng';
  discount: number; // %
  totalRevenue: number;
  currentDebt: number;
  oldDebt?: number; // Công nợ cũ
  salesAmount?: number; // Tiền bán hoa
  collectedAmount?: number; // Tiền thu nợ
  finalDebt?: number; // Công nợ cuối
  status: 'active' | 'inactive';
}

export interface OrderItem {
  flowerId: string;
  flowerCode: string;
  flowerName: string;
  unit: string;
  quantity: number;
  costPrice: number; // Giá nhập
  unitPrice: number; // Giá bán
  importTotal: number; // Thành tiền nhập = quantity * costPrice
  amount: number; // Thành tiền bán = quantity * unitPrice
  profit: number; // Lợi nhuận = amount - importTotal
}

export interface Order {
  id: string;
  code: string; // ID đơn hàng / Mã đơn
  distributorId?: string;
  distributorName: string; // Tên NPP / Khách hàng
  phone?: string;
  address?: string;
  orderDate: string; // Ngày đặt
  deliveryDate?: string;
  warehouse?: string;
  creator: string;
  status: 'nhap' | 'da_xac_nhan' | 'dang_giao' | 'hoan_thanh' | 'huy' | 'pending' | 'processing' | 'delivering' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  items: OrderItem[];
  totalQuantity?: number; // Số lượng hoa trong đơn
  itemsSubtotal?: number; // Thành tiền (tiền hàng sản phẩm)
  shippingFee?: number; // Cước xe
  discount?: number; // Trừ hàng (khoản trừ cho khách hàng)
  totalAmount: number; // Tổng tiền = Thành tiền + Cước xe - Trừ hàng
  oldDebt?: number; // Công nợ cũ của khách hàng
  totalPayment?: number; // Thanh toán = Tổng tiền + Công nợ cũ
  paidAmount: number; // Đã thanh toán
  debtAmount?: number; // Công nợ còn lại
  totalCost?: number; // Tổng vốn nhập
  totalProfit?: number; // Tổng lợi nhuận
  updatedAt?: string;
  notes?: string;
}

export interface SupplierOrderItem {
  flowerId: string;
  flowerCode: string;
  flowerName: string;
  customName?: string;
  unit: string;
  quantity: number;
  costPrice: number; // Giá nhập hoa từ nhà vườn
  amount: number; // Thành tiền nhập = quantity * costPrice
  notes?: string;
}

export interface SupplierOrder {
  id: string;
  code: string; // ID đơn nhập / PO NCC (ví dụ: PO-NCC-001)
  supplierId?: string;
  supplierName: string; // Tên Nhà cung cấp / Nhà vườn
  phone?: string;
  address?: string;
  orderDate: string; // Ngày đặt / ngày nhập (YYYY-MM-DD)
  deliveryDate?: string;
  warehouse?: string;
  creator: string;
  status: 'nhap' | 'da_gui_ncc' | 'dang_chuyen' | 'da_nhap_kho' | 'huy';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  items: SupplierOrderItem[];
  totalQuantity: number; // Tổng số lượng hoa nhập
  itemsSubtotal: number; // Thành tiền hoa nhập
  shippingFee: number; // Cước xe chuyển từ vườn
  discount: number; // Trừ hàng / hoa hỏng / chiết khấu
  totalAmount: number; // Tổng tiền = Thành tiền + Cước xe - Trừ hàng
  paidAmount: number; // Đã trả NCC
  debtAmount: number; // Còn nợ NCC
  notes?: string;
  imageUrl?: string; // Ảnh phiếu đặt / hóa đơn nhà vườn
  updatedAt?: string;
}

export interface InventoryItem {
  flowerId: string;
  flowerCode: string;
  flowerName: string;
  category: string;
  unit: string;
  warehouse: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPrice: number;
  lastImportDate: string;
  shelfLifeDays: number;
  freshness: string;
  status: 'normal' | 'low' | 'out' | 'excess';
}

export interface StockTransaction {
  id: string;
  code: string;
  date: string;
  type: 'import' | 'export';
  reason: 'import_supplier' | 'export_order' | 'damaged' | 'adjustment';
  flowerId: string;
  flowerName: string;
  quantity: number;
  unit: string;
  warehouse: string;
  notes: string;
  performer: string;
}

export interface Employee {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email: string;
  username?: string; // Tên đăng nhập
  password?: string; // Mật khẩu đăng nhập
  role?: 'admin' | 'member'; // Quyền hạn
  department: string;
  position: string;
  joinDate: string;
  salary: number;
  status: 'active' | 'probation' | 'leave' | 'resigned';
  avatar?: string;
}

export interface CashTransaction {
  id: string;
  code: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  paymentMethod: 'Tiền mặt' | 'Chuyển khoản Vietcombank' | 'Chuyển khoản MB Bank' | 'Chuyển khoản VietinBank';
  partner: string;
  creator: string;
  notes: string;
}

export interface DebtDailyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  partnerType: 'npp' | 'ncc';
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  phone?: string;
  entryType?: 'daily' | 'order'; // Ghi theo ngày ('daily') hoặc Ghi theo đơn ('order')
  type?: 'thu' | 'chi'; // Thu tiền ('thu') hoặc Chi tiền / Bán hàng nợ ('chi')
  amount?: number; // Số tiền phát sinh
  remainingDebt?: number; // Công nợ còn lại sau phát sinh
  // Các trường cũ tương thích
  oldDebt?: number; // Công nợ cũ
  increaseAmount?: number; // Tiền bán hoa / Tiền nhập hoa
  decreaseAmount?: number; // Tiền thu nợ / Tiền trả NCC
  finalDebt?: number; // Công nợ cuối
  referenceCode?: string; // Mã đơn hàng / Phiếu thu / Phiếu chi / Lô hàng
  notes?: string;
  creator?: string;
  isAggregated?: boolean; // Bản ghi tổng hợp NPP / NCC theo ngày
  childRecords?: DebtDailyRecord[]; // Danh sách các đơn / chứng từ cấu thành trong ngày
}

export interface FixedExpensePreset {
  id: string;
  name: string;
  amount: number;
  category: string;
  paymentMethod: CashTransaction['paymentMethod'];
  notes?: string;
  icon?: string;
}
