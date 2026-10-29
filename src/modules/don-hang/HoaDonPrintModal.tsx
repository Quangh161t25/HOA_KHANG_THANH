import { useRef, useState } from 'react';
import { Copy, ExternalLink, FileText, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '@/types/hoaKhangThanh';
import { formatDate } from '@/lib/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export function generateInvoiceUrl(order: Order): string {
  const ngay = formatDate(order.orderDate);
  const khachHang = encodeURIComponent(order.distributorName || 'Khách hàng');
  const cuoc = order.shippingFee || 0;
  const truHang = order.discount || 0;
  const congNo = order.oldDebt || 0;
  const phone = encodeURIComponent(order.phone || '');
  const code = encodeURIComponent(order.code || '');
  const products = (order.items || [])
    .filter((item) => item.flowerName)
    .map(
      (item) =>
        `${encodeURIComponent(item.flowerName)}_a_${item.unitPrice || 0}_a_${item.quantity || 0}`
    )
    .join('_b_');

  return `/hoa_khang_thanh.html?id=${code}?phone=${phone}?ngay=${encodeURIComponent(ngay)}?khach_hang=${khachHang}?cuoc=${cuoc}?tru_hang=${truHang}?cong_no=${congNo}?${products}`;
}

export function HoaDonPrintModal({ isOpen, onClose, order }: Props) {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const totalQuantity =
    order.totalQuantity || order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
  const itemsSubtotal =
    order.itemsSubtotal ||
    order.items?.reduce((s, i) => s + (i.amount || (i.unitPrice || 0) * (i.quantity || 0)), 0) ||
    0;
  const shippingFee = order.shippingFee || 0;
  const discount = order.discount || 0;
  const totalAmount = order.totalAmount || itemsSubtotal + shippingFee - discount;
  const oldDebt = order.oldDebt || 0;
  const totalPayment = order.totalPayment || totalAmount + oldDebt;

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const invoiceUrl = generateInvoiceUrl(order);

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${invoiceUrl}`;
    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        toast.success('Đã sao chép đường dẫn hóa đơn!');
      })
      .catch(() => {
        toast.error('Không thể sao chép liên kết');
      });
  };

  const handleOpenNewTab = () => {
    window.open(invoiceUrl, '_blank');
  };

  const handlePrint = (mode: 'full' | 'simple') => {
    const invoiceEl = invoiceRef.current;
    if (!invoiceEl) return;

    // Tạo iframe ẩn để in riêng biệt nội dung hóa đơn
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    const isSimple = mode === 'simple';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Hóa Đơn - ${order.code}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 10mm; }
          body {
            font-family: 'Montserrat', sans-serif;
            background-color: white;
            color: #2c3e50;
            margin: 0;
            padding: 10px;
            -webkit-font-smoothing: antialiased;
          }
          .invoice-container { max-width: 100%; margin: 0 auto; }
          .header-top { display: flex; justify-content: space-between; align-items: center; width: 100%; }
          .logo-img { width: 7rem; height: auto; }
          .qr-img { width: 7.5rem; height: auto; }
          .shop-info { text-align: center; }
          .shop-name { font-family: 'Playfair Display', serif; font-style: italic; font-size: 2rem; font-weight: 700; color: #b38b00; margin: 0; }
          .address { font-size: 0.85rem; margin: 0.25rem 0 0; }
          .phone { font-size: 0.85rem; font-weight: 600; color: #b38b00; margin: 0; }
          .title-section { text-align: center; margin: 0.75rem 0 0.5rem; }
          .header-title { font-family: 'Playfair Display', serif; color: #1e3a8a; font-size: 22px; letter-spacing: 1.5px; border-bottom: 1px solid #1e3a8a; display: inline-block; padding-bottom: 4px; text-transform: uppercase; margin: 0; }
          .info-section { margin-bottom: 0.75rem; font-size: 0.9rem; border-left: 2px solid #b38b00; padding: 0.4rem 0 0.4rem 0.8rem; background-color: #fffaf0; }
          .info-section p { margin: 0; line-height: 1.4; }
          .text-gray-600 { color: #4b5563; }
          .font-bold { font-weight: 700; }
          table { border-collapse: collapse; width: 100%; font-size: 13px; }
          th, td { border-bottom: 0.5px solid #e2e8f0; padding: 6px 4px; line-height: 1.3; }
          th { border-top: 1px solid #1e3a8a; border-bottom: 1px solid #1e3a8a; color: #1e3a8a; font-weight: 600; text-transform: uppercase; text-align: center; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .col-stt { width: 35px; }
          .col-sl { width: 50px; }
          .col-gia { width: 90px; }
          .col-tien { width: 110px; }
          .col-tick { width: 35px; }
          .col-note { width: 120px; }
          .summary-container { display: flex; justify-content: flex-end; margin-top: 1rem; }
          .glass-panel { width: 320px; border: 1px solid rgba(179, 139, 0, 0.2); border-radius: 8px; padding: 1rem; background: rgba(179, 139, 0, 0.03); }
          .summary-row { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(179, 139, 0, 0.1); padding-bottom: 0.35rem; margin-bottom: 0.35rem; font-size: 0.85rem; }
          .summary-total { display: flex; justify-content: space-between; font-weight: 700; color: #1e3a8a; margin-top: 0.5rem; font-size: 0.95rem; }
          .summary-final { display: flex; justify-content: space-between; font-size: 1.05rem; font-weight: 700; color: #1e3a8a; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(30, 58, 138, 0.2); text-transform: uppercase; }
          .footer-msg { text-align: center; margin-top: 2rem; font-style: italic; color: #6b7280; font-family: 'Playfair Display', serif; font-size: 0.85rem; }

          ${
            isSimple
              ? `
            .col-gia, .col-tien, .summary-container, .qr-box, .logo-box, .shop-info, .footer-msg, .title-section {
              display: none !important;
            }
            .col-tick, .col-note { display: table-cell !important; }
            th, td { font-size: 16px !important; padding: 8px !important; }
            .info-section { font-size: 1.1rem !important; }
          `
              : `
            .col-tick, .col-note { display: none !important; }
          `
          }
        </style>
      </head>
      <body>
        ${invoiceEl.innerHTML}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR / ACTIONS */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-amber-400" />
            <span className="font-bold text-sm tracking-wide">
              Phiếu In Hóa Đơn — <span className="font-mono text-amber-400">{order.code}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handlePrint('full')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-sm transition-colors cursor-pointer"
              title="In toàn bộ phiếu A4 gồm đầy đủ giá tiền và công nợ"
            >
              <Printer size={13} />
              <span>In A4 Đầy đủ</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrint('simple')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors cursor-pointer"
              title="In tối giản chỉ gồm Tên hoa và Số lượng cho kho/xe giao"
            >
              <FileText size={13} />
              <span>In Tối giản (Tên + SL)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-colors cursor-pointer"
              title="Mở toàn bộ phiếu in trong tab riêng của trình duyệt"
            >
              <ExternalLink size={14} className="text-white" />
              <span>Mở Tab Mới</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              title="Sao chép liên kết phiếu in"
            >
              <Copy size={13} />
              <span>Sao chép Link</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Đóng (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* INVOICE PREVIEW CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#fffcf5]">
          <div
            ref={invoiceRef}
            className="invoice-container max-w-[800px] mx-auto bg-white/95 rounded-2xl p-5 sm:p-8 border border-amber-900/10 shadow-lg text-[#2c3e50]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {/* Header Section */}
            <div className="invoice-header pb-3 mb-3 border-b border-gray-200">
              <div className="header-top flex justify-between items-center w-full">
                <div className="logo-box bg-white p-2 rounded-lg shadow-sm">
                  <img
                    src="https://i.ibb.co/X1vVPZn/65-A0-B8-B5-1-EA7-43-D4-87-EC-DB2-C237-B4-EC6.png"
                    alt="Khang Thành Flower Logo"
                    className="w-24 sm:w-28 h-auto"
                  />
                </div>
                <div className="qr-box bg-white p-1 rounded-lg shadow-sm">
                  <img
                    src="https://img.vietqr.io/image/MB-0090123457979-qr_only.png"
                    alt="QR Thanh Toán"
                    className="w-24 sm:w-28 h-auto"
                  />
                </div>
              </div>

              <div className="shop-info text-center mt-2">
                <h1
                  className="shop-name text-2xl sm:text-3xl font-bold italic text-[#b38b00] leading-tight m-0"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Khang Thành Flower
                </h1>
                <p className="address text-xs sm:text-sm text-gray-700 mt-1 mb-0.5">
                  338 Xô Viết Nghệ Tĩnh - P. Lang Biang - Đà Lạt
                </p>
                <p className="phone text-xs sm:text-sm font-semibold text-[#b38b00] m-0">
                  SĐT: 0902.422.102
                </p>
                <p className="phone text-xs sm:text-sm font-semibold text-[#b38b00] m-0">
                  STK: 0090123457979 - MB - NGUYEN THI THUY LOAN
                </p>
              </div>
            </div>

            {/* Title Section */}
            <div className="title-section text-center mb-2">
              <h2
                className="header-title inline-block text-xl sm:text-2xl font-bold uppercase tracking-wider text-[#1e3a8a] border-b border-[#1e3a8a] pb-1 m-0"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Hóa Đơn Bán Hàng
              </h2>
              <div className="text-xs text-gray-500 font-mono mt-1">ID: {order.code}</div>
            </div>

            {/* Info Section */}
            <div className="info-section mb-3 text-xs sm:text-sm border-l-2 border-[#b38b00] py-2 pl-3.5 bg-[#fffaf0] rounded-r-lg space-y-1">
              <p>
                <span className="text-gray-600">Ngày đặt:</span>{' '}
                <span className="font-bold text-gray-900">{formatDate(order.orderDate)}</span>
                <span className="text-gray-600 ml-4">Tổng SL:</span>{' '}
                <span className="font-bold text-gray-900 font-mono">{formatNumber(totalQuantity)} cành/bó</span>
              </p>
              <p>
                <span className="text-gray-600">Khách hàng:</span>{' '}
                <span className="font-bold text-gray-900">{order.distributorName}</span>
                {order.phone && <span className="text-gray-600 font-mono"> • {order.phone}</span>}
              </p>
              {order.address && (
                <p className="text-gray-600 text-xs">
                  <span>Địa chỉ:</span> {order.address}
                </p>
              )}
            </div>

            {/* Table Section */}
            <div className="table-container overflow-x-auto mb-4">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-t border-b border-[#1e3a8a] text-[#1e3a8a] uppercase bg-[#fffcf5]/60 text-xs">
                    <th className="py-2.5 px-1.5 text-center w-8">V</th>
                    <th className="py-2.5 px-1.5 text-center w-10">STT</th>
                    <th className="py-2.5 px-2 text-left">Tên hoa</th>
                    <th className="py-2.5 px-1.5 text-center w-12">SL</th>
                    <th className="py-2.5 px-2 text-right w-24">Đơn giá</th>
                    <th className="py-2.5 px-2 text-right w-28">Thành tiền</th>
                    <th className="py-2.5 px-2 text-left w-24">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((p, idx) => {
                    const price = p.unitPrice || 0;
                    const qty = p.quantity || 0;
                    const amount = p.amount || price * qty;

                    return (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-amber-50/30">
                        <td className="py-2 px-1 text-center">
                          <input
                            type="checkbox"
                            checked={!!checkedItems[idx]}
                            onChange={(e) =>
                              setCheckedItems((prev) => ({ ...prev, [idx]: e.target.checked }))
                            }
                            className="w-4 h-4 rounded text-amber-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-1 text-center text-gray-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-2 font-bold text-gray-900">{p.flowerName}</td>
                        <td className="py-2 px-1 text-center font-mono font-bold">{qty}</td>
                        <td className="py-2 px-2 text-right font-mono text-gray-700">
                          {formatNumber(price)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-gray-900">
                          {formatNumber(amount)}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={notes[idx] || ''}
                            onChange={(e) =>
                              setNotes((prev) => ({ ...prev, [idx]: e.target.value }))
                            }
                            placeholder="..."
                            className="w-full bg-transparent border-b border-dashed border-gray-300 text-xs focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="summary-container flex justify-end mt-4">
              <div className="glass-panel w-full sm:w-80 bg-amber-50/50 border border-amber-900/15 rounded-xl p-4 shadow-sm text-xs sm:text-sm">
                <div className="summary-row flex justify-between py-1 border-b border-amber-900/10">
                  <span className="text-gray-600">Tiền hàng:</span>
                  <span className="font-semibold font-mono text-gray-900">
                    {formatNumber(itemsSubtotal)}
                  </span>
                </div>

                <div className="summary-row flex justify-between py-1 border-b border-amber-900/10">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-semibold font-mono text-gray-900">
                    {formatNumber(shippingFee)}
                  </span>
                </div>

                <div className="summary-row flex justify-between py-1 border-b border-amber-900/10">
                  <span className="text-gray-600">Tiền trừ hàng:</span>
                  <span className="font-semibold font-mono text-rose-600">
                    -{formatNumber(discount)}
                  </span>
                </div>

                <div className="summary-total flex justify-between py-1.5 font-bold text-[#1e3a8a] text-sm sm:text-base border-b border-amber-900/15">
                  <span>TỔNG CỘNG:</span>
                  <span className="font-mono">{formatNumber(totalAmount)}</span>
                </div>

                <div className="summary-row flex justify-between py-1 border-b border-amber-900/10 mt-2">
                  <span className="text-gray-600">Nợ cũ:</span>
                  <span className={`font-semibold font-mono ${oldDebt < 0 ? 'text-emerald-700 font-bold' : 'text-amber-700'}`}>
                    {oldDebt < 0 ? `Dư: ${formatNumber(Math.abs(oldDebt))}` : formatNumber(oldDebt)}
                  </span>
                </div>

                <div className="summary-final flex justify-between pt-2 mt-1 border-t-2 border-[#1e3a8a] font-bold text-[#1e3a8a] text-base sm:text-lg uppercase">
                  <span>Thanh toán:</span>
                  <span className="font-mono font-extrabold">
                    {totalPayment < 0 ? `Dư: ${formatNumber(Math.abs(totalPayment))}` : formatNumber(totalPayment)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Message */}
            <div
              className="footer-msg text-center mt-8 pt-4 border-t border-gray-100 italic text-gray-500 text-xs sm:text-sm"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <p className="m-0">Khang Thành Flower chân thành cảm ơn quý khách!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
