const env = typeof process !== 'undefined' && process.env ? process.env : {};
const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};

const spreadsheetId =
  metaEnv.VITE_GOOGLE_SPREADSHEET_ID ||
  env.VITE_GOOGLE_SPREADSHEET_ID ||
  '1iFYENcKF-9y5y_cfsmSjZyfbITMl1aIYwYgPL6i9vnQ';

const spreadsheetUrl =
  metaEnv.VITE_GOOGLE_SPREADSHEET_URL ||
  env.VITE_GOOGLE_SPREADSHEET_URL ||
  `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=0#gid=0`;

const title =
  metaEnv.VITE_GOOGLE_SPREADSHEET_TITLE ||
  env.VITE_GOOGLE_SPREADSHEET_TITLE ||
  'HOA_KHANG_THANH';

const clientEmail =
  env.GOOGLE_CLIENT_EMAIL ||
  metaEnv.VITE_GOOGLE_CLIENT_EMAIL ||
  'ca-nhan@h161-508101.iam.gserviceaccount.com';

const projectId =
  env.GOOGLE_PROJECT_ID ||
  metaEnv.VITE_GOOGLE_PROJECT_ID ||
  'h161-508101';

export const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId,
  spreadsheetUrl,
  title,
  serviceAccount: {
    clientEmail,
    projectId,
  },
  sheets: {
    DON_HANG: 'DON_HANG',
    CHI_TIET_DON_HANG: 'CHI_TIET_DON_HANG',
    DANH_SACH_HOA: 'DANH_SACH_HOA',
    NHA_PHAN_PHOI: 'NHA_PHAN_PHOI',
    NHA_CUNG_CAP: 'NHA_CUNG_CAP',
    DON_NHAP_NCC: 'DON_NHAP_NCC',
    CONG_NO_NPP: 'CONG_NO_NPP',
    CONG_NO_NCC: 'CONG_NO_NCC',
    THU_CHI: 'THU_CHI',
    TON_KHO: 'TON_KHO',
    NHAN_VIEN: 'NHAN_VIEN',
    LICH_SU_THAO_TAC: 'LICH_SU_THAO_TAC',
  },
};
