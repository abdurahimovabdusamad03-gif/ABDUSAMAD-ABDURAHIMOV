export type UnitType = 'dona' | 'metr' | 'kg';

export type Language = 'uz' | 'ru' | 'en';

export type ThemeMode = 'light' | 'dark' | 'auto';

export type UserRole = 'admin' | 'cashier' | 'warehouse_manager';

export type NavTab = 'dashboard' | 'sotuv' | 'dokon_ombor' | 'kirim' | 'sheriklar' | 'mijozlar' | 'sozlamalar';

export interface Product {
  id: string;
  name: string;
  model: string;
  unitType: UnitType;
  costPrice: number; // Tannarx (So'm)
  costPriceUsd?: number; // Tannarx ($ USD)
  salePrice: number; // Sotilish narxi (So'm)
  salePriceUsd?: number; // Sotilish narxi ($ USD)
  minAlertStock: number; // Kam qolgan chegara
  imageUrl?: string; // Product photo (data URL or web URL)
  barcode?: string;  // Unique barcode/EAN/code

  // Unit specific quantities
  // Metr
  rollsInWarehouse?: number;
  metersPerRoll?: number;
  rollsInStore?: number;
  totalMetersWarehouse?: number;
  totalMetersStore?: number;
  warehouseRollsList?: number[]; // Individual roll lengths in warehouse (e.g. [32, 29, 35, 22])
  storeRollsList?: number[];     // Individual roll lengths in store

  // Kg
  bagsInWarehouse?: number;
  kgPerBag?: number;
  bagsInStore?: number;
  totalKgWarehouse?: number;
  totalKgStore?: number;
  warehouseBagsList?: number[];  // Individual bag weights in warehouse
  storeBagsList?: number[];      // Individual bag weights in store

  // Dona
  boxesInWarehouse?: number;
  itemsPerBox?: number;
  boxesInStore?: number;
  quantityWarehouse?: number; // total dona warehouse
  quantityStore?: number;     // total dona store
  warehouseBoxesList?: number[]; // Individual box capacities in warehouse
  storeBoxesList?: number[];     // Individual box capacities in store
}

export interface SaleItem {
  productId: string;
  productName: string;
  model: string;
  unitType: UnitType;
  quantity: number; // in meters, kg, or pieces
  returnedQuantity?: number; // quantity returned via vozvrat
  unitsCount?: number; // rolls, bags, or boxes
  selectedRollIndex?: number; // Selected roll/bag/box index from store list
  selectedRollIndices?: number[]; // Selected multiple roll/bag/box indices
  selectedRollsInfo?: string; // Human readable selected rolls description (e.g. "1, 2, 3-rulonlar (50m + 45.5m + 74.3m)")
  costPrice: number;
  salePrice: number; // price per unit (so'm)
  currency: 'UZS' | 'USD';
  salePriceUsd?: number;
  totalAmountUzs: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  date: string; // ISO date string or formatted date
  customerName: string;
  customerRegion: string;
  customerPhone: string;
  items: SaleItem[];
  currencyRate: number; // Current $ USD exchange rate
  totalCostUzs: number; // Total cost price
  totalAmountUzs: number; // Total sale price
  totalAmountUsd: number;
  cashAmount: number;
  cardAmount: number;
  nasiyaAmount: number;
  paymentType: 'naqd' | 'karta' | 'nasiya' | 'aralash';
  debtDueDate?: string;
  cashierName: string;
  telegramSent?: boolean;
  sendTelegram?: boolean;
  isReturned?: boolean;
  returnedAt?: string;
  returnReason?: string;
  refundedAmountUzs?: number;
}

export interface Customer {
  id: string;
  name: string;
  region: string;
  phone: string;
  totalPurchasesUzs: number;
  currentDebtUzs: number;
  debtDueDate?: string;
  partnerSince: string; // Date string
  notes?: string;
}

export interface DebtPayment {
  id: string;
  customerId: string;
  customerName: string;
  amountUzs: number;
  paymentType: 'naqd' | 'karta';
  date: string;
  cashierName: string;
  note?: string;
}

export interface StockTransfer {
  id: string;
  date: string;
  productId: string;
  productName: string;
  model: string;
  unitType: UnitType;
  quantityTransferred: number; // meters / kg / dona
  rollsTransferred?: number;
  bagsTransferred?: number;
  boxesTransferred?: number;
  transferredBy: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  storeName?: string;
  adminId?: string;
  companyId?: string;
  pin: string;
  role: UserRole;
  allowedTabs: NavTab[];
  lastActive?: number;
  isOnline?: boolean;
}

export interface SystemSettings {
  companyId?: string;
  storeName: string;
  storeLogoUrl: string; // Base64 or image URL
  themeMode: ThemeMode;
  accentColor?: string; // Main accent color theme (e.g. 'amber', 'emerald', 'indigo', 'blue', 'rose', 'purple', 'cyan', or hex)
  language: Language;
  unitPreference: UnitType;
  usdRate: number;

  // Telegram Bot config
  telegramBotToken: string;
  telegramChatId: string;
  telegramChatIds?: string[]; // Multiple chat/user IDs list for broadcasting
  telegramAutoNotify: boolean;

  // XPrinter configuration
  xprinterName: string;
  xprinterPaperWidth: '80mm' | '58mm';
  receiptHeader: string;
  receiptFooter: string;
  receiptAddress: string;
  receiptPhone: string;
  receiptPhone2?: string;
  receiptCustomNote?: string;
  showLogoOnReceipt: boolean;
  telegramChannelLink?: string;
  showTelegramQrOnReceipt?: boolean;
  partnerTabName?: string; // Custom editable title for Partner Stores / Oldi-Berdi section

  // Barcode Printer Settings
  barcodeLabelWidth?: '58x40mm' | '50x30mm' | '40x30mm' | '58x60mm';
  barcodeShowStoreName?: boolean;
  barcodeShowProductName?: boolean;
  barcodeShowModel?: boolean;
  barcodeShowPrice?: boolean;
  barcodeShowQuantityMeters?: boolean;
  barcodeShowCodeNumber?: boolean;
}

export interface PartnerStore {
  id: string;
  name: string;
  phone: string;
  address?: string;
  debtBalanceUzs: number; // positive = partner owes us money (+); negative = we owe partner money (-)
  createdAt: string;
  notes?: string;
}

export interface PartnerTransactionItem {
  productId?: string;
  productName: string;
  model?: string;
  unitType: UnitType;
  rollsCount?: number;
  metersPerRoll?: number;
  quantity: number;
  currency?: 'UZS' | 'USD';
  priceValue?: number;
  priceUzs: number;
  totalUzs: number;
}

export interface PartnerTransaction {
  id: string;
  partnerId: string;
  partnerName: string;
  type: 'tovar_berildi' | 'tovar_olindi' | 'pul_olindi' | 'pul_berildi';
  date: string;
  items?: PartnerTransactionItem[];
  amountUzs: number;
  paymentType?: 'naqd' | 'karta';
  addedBy: string;
  note?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'debt' | 'info';
  date: string;
  read: boolean;
}

export type ExpenseCategory = 'tushlik' | 'yolkira' | 'oylik' | 'kommunal' | 'boshqa';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  title: string;
  amountUzs: number;
  paymentType: 'naqd' | 'karta';
  date: string; // ISO date string or YYYY-MM-DD
  addedBy: string;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  phone: string;
  address?: string;
  debtBalanceUzs: number; // positive = we owe supplier money (+); negative = supplier owes us (-)
  createdAt: string;
  notes?: string;
}

export interface StockIntakeItem {
  productId?: string;
  productName: string;
  model?: string;
  unitType: UnitType;
  costPriceUzs: number;
  costPriceUsd?: number;
  salePriceUzs?: number;
  salePriceUsd?: number;
  currencyUsed?: 'UZS' | 'USD';
  quantity: number; // in meters, kg, or dona
  rollsCount?: number;
  metersPerRoll?: number;
  rollsList?: number[];
  bagsCount?: number;
  kgPerBag?: number;
  boxesCount?: number;
  itemsPerBox?: number;
  totalAmountUzs: number;
  totalAmountUsd?: number;
}

export interface StockIntake {
  id: string;
  intakeNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  location: 'warehouse' | 'store';
  items: StockIntakeItem[];
  totalAmountUzs: number;
  paidAmountUzs: number;
  debtAmountUzs: number;
  paymentType: 'naqd' | 'karta' | 'nasiya' | 'aralash';
  addedBy: string;
  note?: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  amountUzs: number;
  paymentType: 'naqd' | 'karta';
  date: string;
  addedBy: string;
  note?: string;
}

