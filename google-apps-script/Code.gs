/**
 * HOA KHANG THÀNH — Cầu nối Google Sheets cho bản chạy trên GitHub Pages.
 *
 * Cách cài (chỉ làm 1 lần):
 *  1. Mở file Google Sheets HOA_KHANG_THANH → Tiện ích mở rộng → Apps Script.
 *  2. Xóa code mẫu, dán toàn bộ file này vào, bấm Lưu.
 *  3. Triển khai → Tùy chọn triển khai mới → Loại: Ứng dụng web
 *       - Thực thi với tư cách: Tôi
 *       - Người có quyền truy cập: Bất kỳ ai
 *     → Triển khai → cấp quyền → chép "URL ứng dụng web" (dạng https://script.google.com/macros/s/.../exec).
 *  4. Đưa URL đó vào biến VITE_APPS_SCRIPT_URL của repo GitHub (xem README).
 *
 * Khi sửa code này: Triển khai → Quản lý các bản triển khai → Chỉnh sửa → Phiên bản mới (giữ nguyên URL).
 */

// Để trống nếu script được tạo từ chính file Google Sheets (khuyến nghị).
var SPREADSHEET_ID = '';

// Các vùng dữ liệu app tải về (giống server cũ)
var PULL_RANGES = [
  'DANH_SACH_HOA!A2:G',
  'NHA_PHAN_PHOI!A2:N',
  'NHA_CUNG_CAP!A2:K',
  'DON_HANG!A2:S',
  'NHAN_VIEN!A2:L',
  'THU_CHI!A2:I',
  'TON_KHO!A2:I',
  'CHI_TIET_DON_HANG!A2:L',
  'DON_NHAP_NCC!A2:L',
  'CONG_NO!A2:I',
];

function getSpreadsheet_() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** 'S' → 19, 'AA' → 27 */
function columnNumber_(letters) {
  var n = 0;
  for (var i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64);
  return n;
}

/** GET ?action=status | ?action=pull */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'status';
    var ss = getSpreadsheet_();

    if (action === 'status') {
      return json_({
        success: true,
        connected: true,
        spreadsheetId: ss.getId(),
        title: ss.getName(),
        url: ss.getUrl(),
        sheets: ss.getSheets().map(function (s) {
          return { id: s.getSheetId(), title: s.getName(), rowCount: s.getMaxRows(), columnCount: s.getMaxColumns() };
        }),
      });
    }

    if (action === 'pull') {
      var valueRanges = PULL_RANGES.map(function (r) {
        var title = r.split('!')[0];
        var endCol = columnNumber_(r.split(':')[1].replace(/[0-9]/g, ''));
        var sheet = ss.getSheetByName(title);
        if (!sheet || sheet.getLastRow() < 2) return { range: r, values: [] };
        var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, endCol).getDisplayValues();
        return { range: r, values: values };
      });
      return json_({ success: true, valueRanges: valueRanges });
    }

    return json_({ success: false, error: 'Hành động không hợp lệ: ' + action });
  } catch (err) {
    return json_({ success: false, error: String(err && err.message ? err.message : err) });
  }
}

/** POST { tables: [{ range: 'TEN_SHEET!A2:X', values: [[...]] }] } — ghi đè dữ liệu từ dòng 2, giữ dòng tiêu đề */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var tables = body.tables || [];
    var ss = getSpreadsheet_();
    var totalCells = 0;

    tables.forEach(function (t) {
      var title = String(t.range || '').split('!')[0];
      var sheet = ss.getSheetByName(title);
      if (!sheet) throw new Error('Không tìm thấy sheet ' + title);

      var rows = t.values || [];
      var width = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
      if (!width) return;
      rows = rows.map(function (r) {
        var copy = r.slice();
        while (copy.length < width) copy.push('');
        return copy;
      });

      // Xóa dữ liệu cũ (chỉ trong các cột của bảng), giữ định dạng & dòng tiêu đề
      var lastRow = sheet.getLastRow();
      if (lastRow >= 2) sheet.getRange(2, 1, lastRow - 1, width).clearContent();

      var needRows = rows.length + 1;
      if (sheet.getMaxRows() < needRows) sheet.insertRowsAfter(sheet.getMaxRows(), needRows - sheet.getMaxRows());

      // Cột có chữ (mã, SĐT, ngày dd/mm/yyyy...) để dạng văn bản, tránh Sheets tự đổi kiểu
      for (var c = 0; c < width; c++) {
        var allNumbers = rows.every(function (r) { return r[c] === '' || typeof r[c] === 'number'; });
        if (!allNumbers) sheet.getRange(2, c + 1, rows.length, 1).setNumberFormat('@');
      }

      sheet.getRange(2, 1, rows.length, width).setValues(rows);
      totalCells += rows.length * width;
    });

    return json_({
      success: true,
      totalUpdatedCells: totalCells,
      updatedSheetsCount: tables.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return json_({ success: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}
