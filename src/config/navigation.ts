import {
  Boxes,
  Flower2,
  LayoutDashboard,
  PackagePlus,
  ReceiptText,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  path: string;
  nameKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  gradient: string;
}

/** Danh sách các module chính của hệ thống phân phối hoa Hoa Khang Thành. */
export const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    nameKey: 'Dashboard',
    descriptionKey: 'Tổng quan kinh doanh hoa tươi',
    icon: LayoutDashboard,
    gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
  },
  {
    path: '/don-hang',
    nameKey: 'Đơn hàng',
    descriptionKey: 'Quản lý đơn đặt hoa sỉ & giao hàng',
    icon: ShoppingCart,
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
  },
  {
    path: '/don-hang-ncc',
    nameKey: 'Đơn hàng NCC',
    descriptionKey: 'Đơn đặt hoa nhà vườn & đọc ảnh đơn OCR',
    icon: PackagePlus,
    gradient: 'bg-gradient-to-br from-emerald-600 to-teal-700',
  },
  {
    path: '/hoa',
    nameKey: 'Danh sách hoa',
    descriptionKey: 'Danh mục các loại hoa tươi & giá sỉ',
    icon: Flower2,
    gradient: 'bg-gradient-to-br from-rose-500 to-pink-700',
  },
  {
    path: '/ton-kho',
    nameKey: 'Tồn kho',
    descriptionKey: 'Kiểm soát kho lạnh & xuất nhập tồn',
    icon: Boxes,
    gradient: 'bg-gradient-to-br from-amber-500 to-amber-700',
  },
  {
    path: '/nha-cung-cap',
    nameKey: 'Danh sách NCC',
    descriptionKey: 'Nhà vườn & đối tác cung ứng hoa',
    icon: Truck,
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
  },
  {
    path: '/nha-phan-phoi',
    nameKey: 'Danh sách NPP',
    descriptionKey: 'Đại lý phân phối & chuỗi shop hoa',
    icon: Store,
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
  },
  {
    path: '/cong-no',
    nameKey: 'Công nợ',
    descriptionKey: 'Sổ theo dõi công nợ NPP & NCC theo ngày',
    icon: ReceiptText,
    gradient: 'bg-gradient-to-br from-amber-600 to-orange-700',
  },
  {
    path: '/thu-chi',
    nameKey: 'Thu chi',
    descriptionKey: 'Sổ quỹ thu chi & dòng tiền hoa tươi',
    icon: Wallet,
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
  },
  {
    path: '/nhan-vien',
    nameKey: 'Danh sách nhân viên',
    descriptionKey: 'Đội ngũ nhân sự & nghệ nhân cắm hoa',
    icon: Users,
    gradient: 'bg-gradient-to-br from-sky-500 to-sky-700',
  },
  {
    path: '/phan-quyen',
    nameKey: 'Phân quyền',
    descriptionKey: 'Thiết lập quyền xem, thêm, sửa, xoá theo nhân sự',
    icon: ShieldCheck,
    gradient: 'bg-gradient-to-br from-blue-600 to-indigo-800',
  },
];
