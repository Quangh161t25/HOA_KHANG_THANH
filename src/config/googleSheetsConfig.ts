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

const privateKeyId =
  env.GOOGLE_PRIVATE_KEY_ID ||
  '7394696a19771486f1368cfaafe5ffe6b8e9ab00';

const rawPrivateKey =
  env.GOOGLE_PRIVATE_KEY ||
  `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1XkzwY+oHzPmN
YnJ+sMKxe5TRTp8Md0Jb+PFApojE72HcVnXj14zFxFocyCPX1+dtwXJGJ/sSCyAh
iV3OtLEpxRU5QJponFszl9X6vmdLzDbzQS7VQTqMPv0JB+lHEYMU2B37hcIfpfJO
+l6EMprUA7NJtmeJpqmXKjsov6Rdt61sjyH/LKaYj0T2sLGazgZesp96sEOu83HM
nl+KPk9xafPOlKaE34Bk6zl4D8lFUK3v7opndvt/7IOBQ/RdI7p0v+HeOORGUuZW
kW3GH1vo6xY/uyrtmjD7+18w5vmAIRm24Satu0MJYz+j1JtqV4U5wwDkNelXBAWz
hKkfl5yxAgMBAAECggEAA9pDk+Epc943qFhQoo6Oai77+ai8AeuoHBRJCqSm99j2
aRPol+0Im1xZBi69rSxzyO3wp5sajxbvqSq19Im70C10rpVH2mRE3y8Q321LPC3T
tn3aWPMUY22Emjwh6U2uzULsex7roVi48ZLJrnD1Pz7vYGfYofDJfjGqVUqh2xA+
OSiz/U2JFTmePtrhxQGwaS8PHWyyUd+aiHz7pBg+tNzX0L+rMirPsN6i/ph+QolS
4YXubv94O/WL92helDjQuUyWbisYdkuLp2XxnB+5Oa/2fQY7+rhju4pcIm+zA+Wc
GdSzvLtL5hY9vLrZ8e4n0E/saILqViHSkRFksV1PaQKBgQDmEDaYQxmBeQsDbRJN
BLg5lNBCgEWWkW/GNcL9cT+IcmNSyiPAnk2jofQpvmbbBh1lYeCbOhE4HDotN8a8
hc1uRLb4K17fofhGV/znXW9Y12NcwZTkL5u4kKwDy8Qfx3PfckeLxA1s/3oS01tF
wrybv1aB3Vxain5axUps5v0x6QKBgQDJ0Ld9nqXGBrknORjF1uQ7vpp5wp4Haohy
FVNNfMzjKGRzKl8d4TxPVrUpShYBQE+v1pCwahOXCefovff32mQHzg4oVeml3bQq
otLFVVcydb1L8RY1R+QLbiqRy6Pnv5h4pB82eWg1i7xKuZvxZ68v6iPpEz+8zx0F
FJ9IGolPiQKBgBRF03nBV+sHzoejwdwVkWJJkbx6bydgc3gE3sTUiOOuKMBv3Yyo
pnDH4asYAxpDxK1dXZxwFnpaSmoXoySTqdGQrorZz4dnT2hrcna0zg4HFNNkn4ko
BNHTtcSz3Plr6vMCr/lJ8mDrdkdYZo+UJGiZCLdy2SOFVrMK9Y75H9CZAoGBAJcl
jTc06VztTiA1H/uT3K1uLA2DF43gWL5wgEopbN24M7sZAdHEDcIx405AIUjgnI3J
+eVWHMPi9GAYXq2vT3mU9n95EJtb9wJznb2TE9JD4fkNX5+Z7w4sfQ9iX6hCk3PP
H11SAh0QQX4JkuRyzf7pselutC65Qze54S1ESpBZAoGACkqjFmmF9I9jLZfJdWJM
hOdPNHJD8NcM7ixbO9FBMw6S7PeUE//IuKQQcnxm9FsxCFVo2Q16+XKYLryZ/QxD
cRUVkq/nAg4IB78jDp5Yc3n5VXAr10zWHWNFwVbdcZAs3BT9Q4WacASPdyowQPx0
JYdnFqf9hx1XKT04zZ49M7w=
-----END PRIVATE KEY-----
`;

// Tự động xử lý ký tự \n nếu private key được đọc từ file .env một dòng
const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

export const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId,
  spreadsheetUrl,
  title,
  serviceAccount: {
    clientEmail,
    projectId,
    privateKeyId,
    privateKey,
  },
  sheets: {
    DON_HANG: 'DON_HANG',
    CHI_TIET_DON_HANG: 'CHI_TIET_DON_HANG',
    DANH_SACH_HOA: 'DANH_SACH_HOA',
    NHA_PHAN_PHOI: 'NHA_PHAN_PHOI',
    NHA_CUNG_CAP: 'NHA_CUNG_CAP',
    DON_NHAP_NCC: 'DON_NHAP_NCC',
    CONG_NO: 'CONG_NO',
    THU_CHI: 'THU_CHI',
    TON_KHO: 'TON_KHO',
    NHAN_VIEN: 'NHAN_VIEN',
    LICH_SU_THAO_TAC: 'LICH_SU_THAO_TAC',
  },
};
