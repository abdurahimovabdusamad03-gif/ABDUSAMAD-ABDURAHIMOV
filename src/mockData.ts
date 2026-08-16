import { Product, Sale, Customer, SystemSettings, User, AppNotification, PartnerStore, PartnerTransaction, Supplier, StockIntake, Expense } from './types';

export const initialSuppliers: Supplier[] = [];

export const initialStockIntakes: StockIntake[] = [];

export const initialPartnerStores: PartnerStore[] = [];

export const initialPartnerTransactions: PartnerTransaction[] = [];

export const initialProducts: Product[] = [];

export const initialCustomers: Customer[] = [];

export const initialSales: Sale[] = [];

export const initialSettings: SystemSettings = {
  storeName: "",
  storeLogoUrl: "",
  themeMode: "dark",
  accentColor: "amber",
  language: "uz",
  unitPreference: "dona",
  usdRate: 12800,
  telegramBotToken: "",
  telegramChatId: "",
  telegramAutoNotify: true,
  xprinterName: "XPrinter XP-N160I",
  xprinterPaperWidth: "80mm",
  receiptHeader: "",
  receiptFooter: "",
  receiptAddress: "",
  receiptPhone: "",
  receiptPhone2: "",
  receiptCustomNote: "",
  showLogoOnReceipt: false,
  telegramChannelLink: "https://t.me/+KexajQhWkoBmYTA6",
  showTelegramQrOnReceipt: true,
  partnerTabName: "Sherik Do'konlar",
  barcodeLabelWidth: "58x40mm",
  barcodeShowStoreName: true,
  barcodeShowProductName: true,
  barcodeShowModel: true,
  barcodeShowPrice: true,
  barcodeShowQuantityMeters: true,
  barcodeShowCodeNumber: true,
};

export const initialUsers: User[] = [];

export const initialNotifications: AppNotification[] = [];

export const initialExpenses: Expense[] = [];
