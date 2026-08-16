import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Product,
  Sale,
  Customer,
  DebtPayment,
  StockTransfer,
  SystemSettings,
  User,
  UserRole,
  AppNotification,
  NavTab,
  Expense,
  PartnerStore,
  PartnerTransaction,
  PartnerTransactionItem,
  UnitType,
  Supplier,
  StockIntake,
  StockIntakeItem,
  SupplierPayment,
  ThemeMode,
} from '../types';
import {
  initialProducts,
  initialCustomers,
  initialSales,
  initialSettings,
  initialUsers,
  initialNotifications,
  initialExpenses,
  initialPartnerStores,
  initialPartnerTransactions,
  initialSuppliers,
  initialStockIntakes,
} from '../mockData';

interface ERPContextType {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  debtPayments: DebtPayment[];
  stockTransfers: StockTransfer[];
  expenses: Expense[];
  partnerStores: PartnerStore[];
  partnerTransactions: PartnerTransaction[];
  suppliers: Supplier[];
  stockIntakes: StockIntake[];
  supplierPayments: SupplierPayment[];
  settings: SystemSettings;
  users: User[];
  currentUser: User | null;
  companyId: string;
  setCompanyId: (id: string) => void;
  notifications: AppNotification[];
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Actions
  addSale: (saleData: Omit<Sale, 'id' | 'saleNumber'>) => Sale;
  returnSale: (saleId: string, itemsToReturn?: { productId: string; returnQuantity: number }[], reason?: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  addMultipleProducts: (newProducts: Omit<Product, 'id'>[]) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  deleteMultipleProducts: (ids: string[]) => void;
  clearZeroStockProducts: () => number;
  clearAllProducts: () => void;
  clearAllDatabaseData: (options?: { resetSettings?: boolean; resetEmployees?: boolean }) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  deleteExpense: (id: string) => void;
  transferStock: (
    productId: string,
    quantity: number,
    unitsCount?: { rolls?: number; bags?: number; boxes?: number },
    selectedItems?: number[]
  ) => boolean;
  repayDebt: (
    customerId: string,
    amountUzs: number,
    paymentType: 'naqd' | 'karta',
    note?: string
  ) => void;

  // Partner Store Actions (Oldi-Berdi)
  addPartnerStore: (storeData: Omit<PartnerStore, 'id' | 'createdAt' | 'debtBalanceUzs'>) => PartnerStore;
  updatePartnerStore: (id: string, storeData: Partial<PartnerStore>) => void;
  deletePartnerStore: (id: string) => void;
  sendStockToPartner: (
    partnerId: string,
    items: Array<{
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
    }>,
    note?: string
  ) => boolean;
  receiveStockFromPartner: (
    partnerId: string,
    items: Array<{
      productId?: string;
      productName: string;
      model?: string;
      unitType: UnitType;
      rollsCount?: number;
      metersPerRoll?: number;
      quantity: number;
      currency?: 'UZS' | 'USD';
      priceValue?: number;
      costPrice: number;
      salePrice?: number;
    }>,
    note?: string
  ) => void;
  settlePartnerPayment: (
    partnerId: string,
    amountUzs: number,
    direction: 'partner_paid_us' | 'we_paid_partner',
    paymentType: 'naqd' | 'karta',
    note?: string
  ) => void;
  deletePartnerTransaction: (transactionId: string) => void;

  // Supplier & Stock Intake Actions (Kirim / Postavka)
  addSupplier: (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'debtBalanceUzs'>) => Supplier;
  updateSupplier: (id: string, supplierData: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addStockIntake: (intakeData: Omit<StockIntake, 'id' | 'intakeNumber' | 'date' | 'addedBy'>) => StockIntake;
  repaySupplierDebt: (supplierId: string, amountUzs: number, paymentType: 'naqd' | 'karta', note?: string) => void;
  deleteStockIntake: (id: string) => void;

  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  cleanDuplicateUsers: () => void;
  loginWithPin: (pin: string) => boolean;
  loginWithCredentials: (usernameOrPhone: string, pin: string) => boolean;
  loginWithCredentialsAsync: (usernameOrPhone: string, pin: string) => Promise<boolean>;
  promoteToAdmin: (userId?: string) => void;
  registerAdmin: (data: {
    firstName: string;
    lastName: string;
    storeName: string;
    phone: string;
    username: string;
    pin: string;
  }) => User;
  logout: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Financial Analytics Helpers
  getAggregatedStats: (startDate?: string, endDate?: string) => {
    totalSalesCount: number;
    totalRevenueUzs: number;
    totalCostUzs: number;
    totalProfitUzs: number;
    cashTotalUzs: number;
    cardTotalUzs: number;
    nasiyaTotalUzs: number;
    cashboxBalanceUzs: number;
    totalExpensesUzs: number;
    netCashboxBalanceUzs: number;
    netProfitAfterExpensesUzs: number;
  };
  getPaymentTypeSales: (type: 'naqd' | 'karta' | 'nasiya', startDate?: string, endDate?: string) => Sale[];
  getTopSellingProductsMonth: () => Array<{
    productId: string;
    productName: string;
    model: string;
    quantitySold: number;
    unitType: string;
    totalRevenueUzs: number;
    totalProfitUzs: number;
  }>;
}

// Check if user is a legacy demo/mock account
export function isDemoUser(u: User | any): boolean {
  if (!u) return true;
  const username = (u.username || '').toLowerCase().trim();
  const name = (u.name || '').toLowerCase().trim();
  const id = (u.id || '').toLowerCase().trim();

  if (id === 'user-cashier' || id === 'user-warehouse') return true;
  if (name.includes('alisher kassir') || name.includes('javohir omborchi')) return true;
  if (username === 'kassir' || username === 'omborchi') return true;
  return false;
}

// Helper function to deduplicate and consolidate users
export function deduplicateUsers(users: User[]): User[] {
  if (!users || !Array.isArray(users)) return [];

  // Check if real custom users exist
  const hasRealUsers = users.some(
    (u) => u && !isDemoUser(u) && (u.username !== 'admin' || (u.name && !u.name.includes('Bosh Administrator')))
  );

  // Filter out demo users if real users exist
  const filtered = hasRealUsers ? users.filter((u) => !isDemoUser(u)) : users;

  const uniqueList: User[] = [];

  for (const rawUser of filtered) {
    if (!rawUser) continue;
    const user = { ...rawUser };

    // If real custom admin exists, remove generic "Bosh Administrator" demo account
    if (
      hasRealUsers &&
      (user.id === 'user-admin' || (user.username === 'admin' && user.name === 'Bosh Administrator'))
    ) {
      const hasCustomAdmin = filtered.some(
        (u) => u.role === 'admin' && u.id !== 'user-admin' && u.name !== 'Bosh Administrator'
      );
      if (hasCustomAdmin) {
        continue;
      }
    }

    const usernameNorm = (user.username || '').trim().toLowerCase().replace(/^@+/, '');
    const phoneDigits = (user.phone || '').replace(/\D/g, '');
    const phoneLast7 = phoneDigits.length >= 7 ? phoneDigits.slice(-7) : '';
    const phoneLast9 = phoneDigits.length >= 9 ? phoneDigits.slice(-9) : '';
    const nameNorm = (user.name || '').trim().toLowerCase();

    // Check if matching user already exists in uniqueList
    const existingIndex = uniqueList.findIndex((u) => {
      const uUsernameNorm = (u.username || '').trim().toLowerCase().replace(/^@+/, '');
      const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
      const uPhoneLast7 = uPhoneDigits.length >= 7 ? uPhoneDigits.slice(-7) : '';
      const uPhoneLast9 = uPhoneDigits.length >= 9 ? uPhoneDigits.slice(-9) : '';
      const uNameNorm = (u.name || '').trim().toLowerCase();

      // 1. Same non-empty username / nickname
      if (usernameNorm && uUsernameNorm && usernameNorm === uUsernameNorm) {
        return true;
      }

      // 2. Same non-empty phone number (at least 7-9 digits match)
      if (phoneDigits.length >= 7 && uPhoneDigits.length >= 7) {
        if (
          phoneDigits === uPhoneDigits ||
          (phoneLast9 && uPhoneLast9 && phoneLast9 === uPhoneLast9) ||
          (phoneLast7 && uPhoneLast7 && phoneLast7 === uPhoneLast7)
        ) {
          return true;
        }
      }

      // 3. Same name AND role
      if (nameNorm && uNameNorm && nameNorm === uNameNorm && user.role && u.role && user.role === u.role) {
        return true;
      }

      return false;
    });

    if (existingIndex >= 0) {
      // Merge: prefer admin role, non-empty fields, newest active PIN
      const existing = uniqueList[existingIndex];
      const mergedRole = existing.role === 'admin' || user.role === 'admin' ? 'admin' : (user.role || existing.role);
      const mergedPin = (user.pin && String(user.pin).trim()) ? String(user.pin).trim() : existing.pin;
      const mergedPhone = (user.phone && String(user.phone).trim()) ? String(user.phone).trim() : existing.phone;
      const mergedName = (user.name && String(user.name).trim()) ? String(user.name).trim() : existing.name;
      const mergedUsername = (user.username && String(user.username).trim()) ? String(user.username).trim() : existing.username;
      const mergedAllowedTabs = user.allowedTabs && user.allowedTabs.length > 0 ? user.allowedTabs : existing.allowedTabs;

      uniqueList[existingIndex] = {
        ...existing,
        ...user,
        role: mergedRole,
        pin: mergedPin,
        phone: mergedPhone,
        name: mergedName,
        username: mergedUsername,
        allowedTabs: mergedAllowedTabs,
      };
    } else {
      uniqueList.push(user);
    }
  }

  return uniqueList;
}

const isDemoItem = (item: any): boolean => {
  if (!item) return false;
  const id = String(item.id || '');
  if (
    id === 'prod-1' || id === 'prod-2' || id === 'prod-3' || id === 'prod-4' || id === 'prod-5' || id === 'prod-6' || id === 'prod-7' ||
    id === 'cust-1' || id === 'cust-2' || id === 'cust-3' || id === 'cust-4' ||
    id === 'sale-101' || id === 'sale-102' || id === 'sale-103' ||
    id === 'supp-1' || id === 'supp-2' ||
    id === 'intake-101' ||
    id === 'partner-1' || id === 'partner-2' ||
    id === 'ptrans-1' || id === 'ptrans-2' ||
    id === 'exp-1' || id === 'exp-2'
  ) {
    return true;
  }
  return false;
};

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local storage hydrations (ensure clean zero data for new accounts)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('erp_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((p) => !isDemoItem(p));
      } catch {}
    }
    return [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('erp_sales');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((s) => !isDemoItem(s));
      } catch {}
    }
    return [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('erp_customers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((c) => !isDemoItem(c));
      } catch {}
    }
    return [];
  });

  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>(() => {
    const saved = localStorage.getItem('erp_debt_payments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(() => {
    const saved = localStorage.getItem('erp_stock_transfers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('erp_expenses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((e) => !isDemoItem(e));
      } catch {}
    }
    return [];
  });

  const [partnerStores, setPartnerStores] = useState<PartnerStore[]>(() => {
    const saved = localStorage.getItem('erp_partner_stores');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((p) => !isDemoItem(p));
      } catch {}
    }
    return [];
  });

  const [partnerTransactions, setPartnerTransactions] = useState<PartnerTransaction[]>(() => {
    const saved = localStorage.getItem('erp_partner_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((t) => !isDemoItem(t));
      } catch {}
    }
    return [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('erp_suppliers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((s) => !isDemoItem(s));
      } catch {}
    }
    return [];
  });

  const [stockIntakes, setStockIntakes] = useState<StockIntake[]>(() => {
    const saved = localStorage.getItem('erp_stock_intakes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((i) => !isDemoItem(i));
      } catch {}
    }
    return [];
  });

  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => {
    const saved = localStorage.getItem('erp_supplier_payments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  // Helper function to parse URL parameters for invitation links or force registration
  const parseUrlAutoLogin = () => {
    try {
      if (typeof window === 'undefined') return null;
      const urlParams = new URLSearchParams(window.location.search);

      // Check if URL explicitly requests new registration or logout
      const forceRegister = urlParams.get('register') || urlParams.get('mode') === 'register' || urlParams.get('action') === 'register' || urlParams.get('new') === '1' || urlParams.get('logout') === '1';
      if (forceRegister) {
        try {
          localStorage.removeItem('erp_current_user');
          localStorage.removeItem('erp_current_company_id');
        } catch {}
        return null;
      }

      const uParam = urlParams.get('u') || urlParams.get('username') || urlParams.get('login') || urlParams.get('autologin');
      const pParam = urlParams.get('p') || urlParams.get('pin') || urlParams.get('pass') || urlParams.get('password');
      const nameParam = urlParams.get('name') || urlParams.get('n');
      const phoneParam = urlParams.get('phone') || urlParams.get('tel');
      const rawRole = urlParams.get('role');
      const roleParam = rawRole ? (rawRole as UserRole) : null;
      const storeParam = urlParams.get('store') || urlParams.get('storeName');
      const adminParam = urlParams.get('admin');
      const tabsParam = urlParams.get('tabs') || urlParams.get('allowedTabs');

      let parsedAllowedTabs: NavTab[] | null = null;
      if (tabsParam) {
        const splitTabs = decodeURIComponent(tabsParam)
          .split(',')
          .map((t) => t.trim() as NavTab)
          .filter(Boolean);
        if (splitTabs.length > 0) {
          parsedAllowedTabs = splitTabs;
        }
      }

      if (uParam) {
        const cleanU = uParam.trim().toLowerCase();
        const cleanP = pParam ? pParam.trim() : '1234';
        const cleanName = nameParam ? decodeURIComponent(nameParam) : cleanU;
        const cleanPhone = phoneParam ? decodeURIComponent(phoneParam) : '';

        return {
          uParam: cleanU,
          pParam: cleanP,
          nameParam: cleanName,
          phoneParam: cleanPhone,
          roleParam,
          storeParam: storeParam ? decodeURIComponent(storeParam) : null,
          adminParam: adminParam ? decodeURIComponent(adminParam) : null,
          allowedTabs: parsedAllowedTabs,
        };
      }
    } catch (e) {
      console.error('URL parse error:', e);
    }
    return null;
  };

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const urlData = parseUrlAutoLogin();
    const saved = localStorage.getItem('erp_settings');
    let parsedSettings = initialSettings;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.storeName === "ERP MASTER") parsed.storeName = "";
        if (parsed.receiptHeader && parsed.receiptHeader.includes("GRAND OPTOM")) parsed.receiptHeader = "";
        if (parsed.receiptFooter && parsed.receiptFooter.includes("Xaridingiz uchun rahmat")) parsed.receiptFooter = "";
        if (parsed.receiptAddress && parsed.receiptAddress.includes("Toshkent shahri, Chilonzor")) parsed.receiptAddress = "";
        if (parsed.receiptPhone === "+998 71 200 88 99") parsed.receiptPhone = "";
        if (parsed.receiptPhone2 === "+998 90 123 45 67") parsed.receiptPhone2 = "";
        if (parsed.receiptCustomNote && parsed.receiptCustomNote.includes("Tahrirlangan va barqaror")) parsed.receiptCustomNote = "";
        parsedSettings = parsed;
      } catch (e) {
        parsedSettings = initialSettings;
      }
    }

    const savedTheme = localStorage.getItem('erp_theme_mode') as ThemeMode | null;
    if (savedTheme) {
      parsedSettings = { ...parsedSettings, themeMode: savedTheme };
    }

    // Apply immediate theme to DOM on startup
    if (typeof window !== 'undefined') {
      const mode = parsedSettings.themeMode || 'dark';
      const isDark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.body?.classList.add('dark');
        document.body?.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.body?.classList.remove('dark');
        document.body?.classList.add('light');
      }
    }

    if (urlData?.storeParam) {
      parsedSettings = { ...parsedSettings, storeName: urlData.storeParam };
      localStorage.setItem('erp_settings', JSON.stringify(parsedSettings));
    }
    return parsedSettings;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('erp_users');
    let userList: User[] = saved ? JSON.parse(saved) : initialUsers;
    const urlData = parseUrlAutoLogin();
    if (urlData) {
      const cleanPhoneDigits = urlData.phoneParam.replace(/\D/g, '');
      let existingIndex = userList.findIndex(
        (u) =>
          u.username.trim().toLowerCase() === urlData.uParam ||
          (cleanPhoneDigits.length >= 7 &&
            u.phone &&
            u.phone.replace(/\D/g, '').includes(cleanPhoneDigits))
      );

      const defaultTabs: NavTab[] = urlData.roleParam === 'admin'
        ? ['dashboard', 'sotuv', 'dokon_ombor', 'kirim', 'sheriklar', 'mijozlar', 'sozlamalar']
        : (urlData.roleParam === 'warehouse_manager' ? ['dashboard', 'dokon_ombor', 'kirim'] : ['dashboard', 'sotuv', 'mijozlar']);

      const effectiveTabs = urlData.allowedTabs && urlData.allowedTabs.length > 0
        ? urlData.allowedTabs
        : (existingIndex >= 0 && userList[existingIndex].allowedTabs && userList[existingIndex].allowedTabs.length > 0
            ? userList[existingIndex].allowedTabs
            : defaultTabs);

      const targetUser: User = {
        id: existingIndex >= 0 ? userList[existingIndex].id : `user-invite-${Date.now()}`,
        username: urlData.uParam,
        name: urlData.nameParam,
        pin: urlData.pParam,
        phone: urlData.phoneParam,
        role: urlData.roleParam || (existingIndex >= 0 ? userList[existingIndex].role : 'cashier'),
        adminId: urlData.adminParam || undefined,
        storeName: urlData.storeParam || undefined,
        allowedTabs: effectiveTabs,
      };

      if (existingIndex >= 0) {
        userList[existingIndex] = { ...userList[existingIndex], ...targetUser };
      } else {
        userList.push(targetUser);
      }
    }
    const deduplicated = deduplicateUsers(userList);
    localStorage.setItem('erp_users', JSON.stringify(deduplicated));
    return deduplicated;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const urlData = parseUrlAutoLogin();
    const savedUsers = localStorage.getItem('erp_users');
    const userList: User[] = savedUsers ? JSON.parse(savedUsers) : [];

    if (urlData) {
      const cleanPhoneDigits = urlData.phoneParam.replace(/\D/g, '');
      let matchedUser = userList.find(
        (u) =>
          u.username.trim().toLowerCase() === urlData.uParam ||
          (cleanPhoneDigits.length >= 7 &&
            u.phone &&
            u.phone.replace(/\D/g, '').includes(cleanPhoneDigits))
      );

      const defaultTabs: NavTab[] = urlData.roleParam === 'admin'
        ? ['dashboard', 'sotuv', 'dokon_ombor', 'kirim', 'sheriklar', 'mijozlar', 'sozlamalar']
        : (urlData.roleParam === 'warehouse_manager' ? ['dashboard', 'dokon_ombor', 'kirim'] : ['dashboard', 'sotuv', 'mijozlar']);

      const effectiveTabs = urlData.allowedTabs && urlData.allowedTabs.length > 0
        ? urlData.allowedTabs
        : (matchedUser?.allowedTabs && matchedUser.allowedTabs.length > 0 ? matchedUser.allowedTabs : defaultTabs);

      if (!matchedUser) {
        matchedUser = {
          id: `user-invite-${Date.now()}`,
          username: urlData.uParam,
          name: urlData.nameParam,
          pin: urlData.pParam,
          phone: urlData.phoneParam,
          role: urlData.roleParam || 'cashier',
          adminId: urlData.adminParam || undefined,
          storeName: urlData.storeParam || undefined,
          allowedTabs: effectiveTabs,
        };
      } else {
        matchedUser = {
          ...matchedUser,
          allowedTabs: effectiveTabs,
        };
      }

      localStorage.setItem('erp_current_user', JSON.stringify(matchedUser));
      return matchedUser;
    }

    const saved = localStorage.getItem('erp_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const inList = userList.find(
          (u) => u.id === parsed.id || u.username.toLowerCase() === (parsed.username || '').toLowerCase()
        );
        const defaultTabs: NavTab[] = parsed.role === 'admin'
          ? ['dashboard', 'sotuv', 'dokon_ombor', 'kirim', 'sheriklar', 'mijozlar', 'sozlamalar']
          : ['dashboard', 'sotuv', 'mijozlar'];
        const finalTabs = inList?.allowedTabs && inList.allowedTabs.length > 0
          ? inList.allowedTabs
          : (parsed.allowedTabs && parsed.allowedTabs.length > 0 ? parsed.allowedTabs : defaultTabs);

        return {
          ...parsed,
          ...(inList || {}),
          allowedTabs: finalTabs,
        };
      } catch (e) {
        return null;
      }
    }
    return null; // Force auth/registration on first open if no saved session
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('erp_notifications');
      if (saved) {
        const parsed: AppNotification[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out dummy/mock notifications from previous versions
          return parsed.filter(
            (n) => n && n.id && n.id !== 'notif-1' && n.id !== 'notif-2'
          );
        }
      }
    } catch {}
    return [];
  });

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const [companyId, setCompanyId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_current_company_id');
      if (saved) return saved;
    }
    return 'comp_default';
  });

  const companyIdRef = useRef<string>(companyId);

  useEffect(() => {
    companyIdRef.current = companyId;
    if (companyId) {
      try {
        localStorage.setItem('erp_current_company_id', companyId);
      } catch {}
    }
  }, [companyId]);

  // Sync notifications to local storage
  useEffect(() => {
    try {
      localStorage.setItem('erp_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('erp_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('erp_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('erp_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('erp_debt_payments', JSON.stringify(debtPayments));
  }, [debtPayments]);

  useEffect(() => {
    localStorage.setItem('erp_stock_transfers', JSON.stringify(stockTransfers));
  }, [stockTransfers]);

  useEffect(() => {
    localStorage.setItem('erp_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('erp_partner_stores', JSON.stringify(partnerStores));
  }, [partnerStores]);

  useEffect(() => {
    localStorage.setItem('erp_partner_transactions', JSON.stringify(partnerTransactions));
  }, [partnerTransactions]);

  useEffect(() => {
    localStorage.setItem('erp_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('erp_stock_intakes', JSON.stringify(stockIntakes));
  }, [stockIntakes]);

  useEffect(() => {
    localStorage.setItem('erp_supplier_payments', JSON.stringify(supplierPayments));
  }, [supplierPayments]);

  useEffect(() => {
    localStorage.setItem('erp_settings', JSON.stringify(settings));

    // Apply accent color CSS variables to document root
    const accentKey = settings.accentColor || 'amber';
    const colorPalettes: Record<string, { main: string; hover: string; light: string; ring: string }> = {
      amber: { main: '#f59e0b', hover: '#d97706', light: 'rgba(245, 158, 11, 0.2)', ring: 'rgba(245, 158, 11, 0.4)' },
      emerald: { main: '#10b981', hover: '#059669', light: 'rgba(16, 185, 129, 0.2)', ring: 'rgba(16, 185, 129, 0.4)' },
      indigo: { main: '#6366f1', hover: '#4f46e5', light: 'rgba(99, 102, 241, 0.2)', ring: 'rgba(99, 102, 241, 0.4)' },
      blue: { main: '#3b82f6', hover: '#2563eb', light: 'rgba(59, 130, 246, 0.2)', ring: 'rgba(59, 130, 246, 0.4)' },
      rose: { main: '#f43f5e', hover: '#e11d48', light: 'rgba(244, 63, 94, 0.2)', ring: 'rgba(244, 63, 94, 0.4)' },
      purple: { main: '#a855f7', hover: '#9333ea', light: 'rgba(168, 85, 247, 0.2)', ring: 'rgba(168, 85, 247, 0.4)' },
      cyan: { main: '#06b6d4', hover: '#0891b2', light: 'rgba(6, 182, 212, 0.2)', ring: 'rgba(6, 182, 212, 0.4)' },
    };

    let main = '#f59e0b';
    let hover = '#d97706';
    let light = 'rgba(245, 158, 11, 0.2)';
    let ring = 'rgba(245, 158, 11, 0.4)';

    if (colorPalettes[accentKey]) {
      const p = colorPalettes[accentKey];
      main = p.main;
      hover = p.hover;
      light = p.light;
      ring = p.ring;
    } else if (accentKey.startsWith('#')) {
      main = accentKey;
      hover = accentKey;
      light = accentKey + '33';
      ring = accentKey + '66';
    }

    const root = document.documentElement;
    root.style.setProperty('--accent-main', main);
    root.style.setProperty('--accent-hover', hover);
    root.style.setProperty('--accent-light', light);
    root.style.setProperty('--accent-ring', ring);

    // Dynamic style tag injection for Tailwind amber utilities override
    let styleTag = document.getElementById('dynamic-accent-theme-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-accent-theme-styles';
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      .bg-amber-500 { background-color: var(--accent-main) !important; }
      .bg-amber-600 { background-color: var(--accent-hover) !important; }
      .bg-amber-400 { background-color: var(--accent-main) !important; }
      .text-amber-500, .text-amber-400, .text-amber-300 { color: var(--accent-main) !important; }
      .border-amber-500, .border-amber-400, .border-amber-600 { border-color: var(--accent-main) !important; }
      .bg-amber-500\\/10, .bg-amber-500\\/20, .bg-amber-500\\/30 { background-color: var(--accent-light) !important; }
      .from-amber-500 { --tw-gradient-from: var(--accent-main) !important; --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%) !important; }
      .to-amber-600, .to-amber-500 { --tw-gradient-to: var(--accent-hover) !important; }
      .hover\\:bg-amber-500:hover, .hover\\:bg-amber-400:hover { background-color: var(--accent-hover) !important; }
      .hover\\:text-amber-500:hover, .hover\\:text-amber-400:hover { color: var(--accent-main) !important; }
      .ring-amber-500, .ring-amber-400 { --tw-ring-color: var(--accent-main) !important; }
    `;
  }, [settings]);

  // Last known reset timestamp to prevent stale writes
  const lastResetTimestampRef = useRef<string>(
    typeof window !== 'undefined' ? localStorage.getItem('erp_last_reset_time') || '' : ''
  );

  // Timestamp of the latest local user action (add, edit, delete, sale, transfer)
  const lastLocalActionTimeRef = useRef<number>(0);

  // Flag to prevent un-hydrated client from overwriting server data on initial mount
  const isServerHydratedRef = useRef<boolean>(false);

  // Universal helper to trigger immediate or debounced server sync with local mutation protection
  const triggerServerSync = (overrides?: any) => {
    lastLocalActionTimeRef.current = Date.now();
    const currentCompId = companyIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('erp_current_company_id') || 'comp_default' : 'comp_default');
    try {
      fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-id': currentCompId,
        },
        body: JSON.stringify({
          companyId: currentCompId,
          users,
          products,
          sales,
          customers,
          debtPayments,
          stockTransfers,
          expenses,
          partnerStores,
          partnerTransactions,
          suppliers,
          stockIntakes,
          supplierPayments,
          settings,
          ...overrides,
        }),
      }).catch(() => {});
    } catch (e) {}
  };

  // Initial and periodic cross-device state synchronization with server
  useEffect(() => {
    let isSubscribed = true;

    const syncFromServer = async (force: boolean = false) => {
      // If user recently made local mutations (in the last 4 seconds) and not forced, do NOT clobber with stale polling
      if (!force && Date.now() - lastLocalActionTimeRef.current < 4000) {
        return;
      }

      const requestStartTime = Date.now();
      const currentCompId = companyIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('erp_current_company_id') || 'comp_default' : 'comp_default');

      try {
        const res = await fetch(`/api/sync?companyId=${encodeURIComponent(currentCompId)}`, {
          headers: {
            'x-company-id': currentCompId,
          },
        });
        if (!res.ok || !isSubscribed) return;
        const json = await res.json();
        if (json.success && json.data) {
          // If a local user mutation occurred while this GET request was in flight, discard response to avoid race conditions
          if (!force && (lastLocalActionTimeRef.current >= requestStartTime || Date.now() - lastLocalActionTimeRef.current < 4000)) {
            isServerHydratedRef.current = true;
            return;
          }

          const d = json.data;
          isServerHydratedRef.current = true;

          // Check if a global Factory Reset was performed by Admin
          if (d.resetTimestamp && d.resetTimestamp !== lastResetTimestampRef.current) {
            lastResetTimestampRef.current = d.resetTimestamp;
            try {
              localStorage.setItem('erp_last_reset_time', d.resetTimestamp);
              localStorage.removeItem('erp_products');
              localStorage.removeItem('erp_sales');
              localStorage.removeItem('erp_customers');
              localStorage.removeItem('erp_debt_payments');
              localStorage.removeItem('erp_stock_transfers');
              localStorage.removeItem('erp_expenses');
              localStorage.removeItem('erp_partner_stores');
              localStorage.removeItem('erp_partner_transactions');
              localStorage.removeItem('erp_suppliers');
              localStorage.removeItem('erp_stock_intakes');
              localStorage.removeItem('erp_supplier_payments');
            } catch (e) {}

            setProducts([]);
            setSales([]);
            setCustomers([]);
            setDebtPayments([]);
            setStockTransfers([]);
            setExpenses([]);
            setPartnerStores([]);
            setPartnerTransactions([]);
            setSuppliers([]);
            setStockIntakes([]);
            setSupplierPayments([]);
          } else {
            if (Array.isArray(d.products)) {
              setProducts(d.products);
              try { localStorage.setItem('erp_products', JSON.stringify(d.products)); } catch {}
            }
            if (Array.isArray(d.sales)) {
              setSales(d.sales);
              try { localStorage.setItem('erp_sales', JSON.stringify(d.sales)); } catch {}
            }
            if (Array.isArray(d.customers)) {
              setCustomers(d.customers);
              try { localStorage.setItem('erp_customers', JSON.stringify(d.customers)); } catch {}
            }
            if (Array.isArray(d.debtPayments)) {
              setDebtPayments(d.debtPayments);
              try { localStorage.setItem('erp_debt_payments', JSON.stringify(d.debtPayments)); } catch {}
            }
            if (Array.isArray(d.stockTransfers)) {
              setStockTransfers(d.stockTransfers);
              try { localStorage.setItem('erp_stock_transfers', JSON.stringify(d.stockTransfers)); } catch {}
            }
            if (Array.isArray(d.expenses)) {
              setExpenses(d.expenses);
              try { localStorage.setItem('erp_expenses', JSON.stringify(d.expenses)); } catch {}
            }
            if (Array.isArray(d.partnerStores)) {
              setPartnerStores(d.partnerStores);
              try { localStorage.setItem('erp_partner_stores', JSON.stringify(d.partnerStores)); } catch {}
            }
            if (Array.isArray(d.partnerTransactions)) {
              setPartnerTransactions(d.partnerTransactions);
              try { localStorage.setItem('erp_partner_transactions', JSON.stringify(d.partnerTransactions)); } catch {}
            }
            if (Array.isArray(d.suppliers)) {
              setSuppliers(d.suppliers);
              try { localStorage.setItem('erp_suppliers', JSON.stringify(d.suppliers)); } catch {}
            }
            if (Array.isArray(d.stockIntakes)) {
              setStockIntakes(d.stockIntakes);
              try { localStorage.setItem('erp_stock_intakes', JSON.stringify(d.stockIntakes)); } catch {}
            }
            if (Array.isArray(d.supplierPayments)) {
              setSupplierPayments(d.supplierPayments);
              try { localStorage.setItem('erp_supplier_payments', JSON.stringify(d.supplierPayments)); } catch {}
            }
          }

          if (d.users && Array.isArray(d.users) && d.users.length > 0) {
            const cleanedUsers = deduplicateUsers(d.users);
            setUsers(cleanedUsers);
            try { localStorage.setItem('erp_users', JSON.stringify(cleanedUsers)); } catch {}

            // Live update currentUser permissions if modified on another device
            setCurrentUser((prevCurr) => {
              if (!prevCurr) return null;
              const matched = d.users.find(
                (u: User) => u.id === prevCurr.id || (u.username && u.username.toLowerCase() === (prevCurr.username || '').toLowerCase())
              );
              if (matched && matched.allowedTabs && JSON.stringify(matched.allowedTabs) !== JSON.stringify(prevCurr.allowedTabs)) {
                const updatedCurr = { ...prevCurr, ...matched };
                try { localStorage.setItem('erp_current_user', JSON.stringify(updatedCurr)); } catch {}
                return updatedCurr;
              }
              return prevCurr;
            });
          }

          if (d.settings) {
            setSettings((prev) => {
              const localTheme = (typeof window !== 'undefined' ? localStorage.getItem('erp_theme_mode') : null) as ThemeMode | null;
              const s = {
                ...prev,
                ...d.settings,
                ...(localTheme ? { themeMode: localTheme } : {}),
              };
              try { localStorage.setItem('erp_settings', JSON.stringify(s)); } catch {}
              return s;
            });
          }
        }
      } catch (e) {
        // Silently continue
      }
    };

    // Perform initial hydration immediately
    syncFromServer(true);
    // Poll every 2 seconds for ultra-responsive cross-device updates
    const interval = setInterval(() => syncFromServer(false), 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // Debounced server backup sync (ONLY runs after client is safely hydrated from server)
  useEffect(() => {
    if (!isServerHydratedRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      const currentCompId = companyIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('erp_current_company_id') || 'comp_default' : 'comp_default');
      try {
        fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-company-id': currentCompId,
          },
          body: JSON.stringify({
            companyId: currentCompId,
            users,
            products,
            sales,
            customers,
            debtPayments,
            stockTransfers,
            expenses,
            partnerStores,
            partnerTransactions,
            suppliers,
            stockIntakes,
            supplierPayments,
            settings,
          }),
        }).catch(() => {});
      } catch (e) {}
    }, 500);

    return () => clearTimeout(timer);
  }, [
    users,
    products,
    sales,
    customers,
    debtPayments,
    stockTransfers,
    expenses,
    partnerStores,
    partnerTransactions,
    suppliers,
    stockIntakes,
    supplierPayments,
    settings,
  ]);

  useEffect(() => {
    localStorage.setItem('erp_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('erp_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('erp_current_user');
    }
  }, [currentUser]);

  // URL Auto-login via Invite Link (?u=login&p=password)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const uParam = urlParams.get('u') || urlParams.get('username') || urlParams.get('login');
      const pParam = urlParams.get('p') || urlParams.get('pin') || urlParams.get('pass') || urlParams.get('password');
      const nameParam = urlParams.get('name') || urlParams.get('n');
      const phoneParam = urlParams.get('phone') || urlParams.get('tel');
      const roleParam = (urlParams.get('role') || 'cashier') as UserRole;
      const tabsParam = urlParams.get('tabs') || urlParams.get('allowedTabs');

      let parsedAllowedTabs: NavTab[] | null = null;
      if (tabsParam) {
        const split = decodeURIComponent(tabsParam)
          .split(',')
          .map((t) => t.trim() as NavTab)
          .filter(Boolean);
        if (split.length > 0) parsedAllowedTabs = split;
      }

      if (uParam && pParam) {
        const cleanU = uParam.trim().toLowerCase();
        const cleanP = pParam.trim();
        const cleanPhoneDigits = phoneParam ? phoneParam.replace(/\D/g, '') : '';

        const defaultTabs: NavTab[] = roleParam === 'admin'
          ? ['dashboard', 'sotuv', 'dokon_ombor', 'kirim', 'sheriklar', 'mijozlar', 'sozlamalar']
          : (roleParam === 'warehouse_manager' ? ['dashboard', 'dokon_ombor', 'kirim'] : ['dashboard', 'sotuv', 'mijozlar']);

        setUsers((prevUsers) => {
          let existing = prevUsers.find(
            (u) =>
              u.username.trim().toLowerCase() === cleanU ||
              (cleanPhoneDigits.length >= 7 &&
                u.phone &&
                u.phone.replace(/\D/g, '').includes(cleanPhoneDigits))
          );

          const effectiveTabs = parsedAllowedTabs && parsedAllowedTabs.length > 0
            ? parsedAllowedTabs
            : (existing?.allowedTabs && existing.allowedTabs.length > 0 ? existing.allowedTabs : defaultTabs);

          if (!existing) {
            const newUser: User = {
              id: `user-invite-${Date.now()}`,
              username: cleanU,
              name: nameParam ? decodeURIComponent(nameParam) : cleanU,
              pin: cleanP,
              phone: phoneParam ? decodeURIComponent(phoneParam) : '',
              role: roleParam,
              allowedTabs: effectiveTabs,
            };
            setCurrentUser(newUser);
            return [...prevUsers, newUser];
          } else {
            // Update pin or phone or tabs if modified in URL link
            const updatedUser: User = {
              ...existing,
              pin: cleanP,
              allowedTabs: effectiveTabs,
            };
            if (phoneParam) updatedUser.phone = decodeURIComponent(phoneParam);
            setCurrentUser(updatedUser);
            return prevUsers.map((u) => (u.id === existing!.id ? updatedUser : u));
          }
        });

        // Clean query parameters from URL bar without reload
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (e) {
      console.error('URL Auto-login parsing error:', e);
    }
  }, []);

  // Handle Theme Mode
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const mode = settings.themeMode || 'dark';
    const isDark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      if (body) {
        body.classList.add('dark');
        body.classList.remove('light');
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      if (body) {
        body.classList.remove('dark');
        body.classList.add('light');
      }
    }

    try {
      localStorage.setItem('erp_theme_mode', mode);
    } catch {}
  }, [settings.themeMode]);

  // Check low stock & overdue debt triggers periodically, and cleanly remove invalidated alerts
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute currently valid low stock alerts for real products in stock list
    const validLowStockAlerts = new Map<string, AppNotification>();
    products.forEach((p) => {
      // Product must exist, be active and have a real minAlertStock > 0
      if (!p || !p.id || !p.minAlertStock || p.minAlertStock <= 0) return;

      let storeQty = 0;
      if (p.unitType === 'metr') storeQty = p.totalMetersStore || 0;
      else if (p.unitType === 'kg') storeQty = p.totalKgStore || 0;
      else storeQty = p.quantityStore || 0;

      if (storeQty <= p.minAlertStock) {
        const alertId = `low-${p.id}`;
        validLowStockAlerts.set(alertId, {
          id: alertId,
          title: `Kam qolgan tovar: ${p.name}`,
          message: `${p.name} (${p.model || 'model'}) do'konda kam qoldi (${storeQty} ${p.unitType}).`,
          type: 'warning',
          date: todayStr,
          read: false,
        });
      }
    });

    // Compute currently valid overdue debt alerts for real customers with debt
    const validDebtAlerts = new Map<string, AppNotification>();
    customers.forEach((c) => {
      if (c && c.id && c.currentDebtUzs > 0 && c.debtDueDate && c.debtDueDate <= todayStr) {
        const alertId = `debt-${c.id}`;
        validDebtAlerts.set(alertId, {
          id: alertId,
          title: `Qarz muddati keldi: ${c.name}`,
          message: `${c.name} ning ${c.currentDebtUzs.toLocaleString()} so'm qarzi muddati keldi (${c.debtDueDate}).`,
          type: 'debt',
          date: todayStr,
          read: false,
        });
      }
    });

    setNotifications((prev) => {
      // 1. Remove legacy dummy notifications and stale low/debt alerts that are no longer true
      const filteredPrev = prev.filter((n) => {
        if (!n || !n.id || n.id === 'notif-1' || n.id === 'notif-2') return false;
        if (n.id.startsWith('low-')) {
          return validLowStockAlerts.has(n.id);
        }
        if (n.id.startsWith('debt-')) {
          return validDebtAlerts.has(n.id);
        }
        return true; // Keep manual/system notifications
      });

      const existingIds = new Set(filteredPrev.map((n) => n.id));
      const newlyAdded: AppNotification[] = [];

      // Add missing low stock alerts
      validLowStockAlerts.forEach((alert, id) => {
        if (!existingIds.has(id)) {
          newlyAdded.push(alert);
          existingIds.add(id);
        }
      });

      // Add missing debt alerts
      validDebtAlerts.forEach((alert, id) => {
        if (!existingIds.has(id)) {
          newlyAdded.push(alert);
          existingIds.add(id);
        }
      });

      if (newlyAdded.length === 0 && filteredPrev.length === prev.length) {
        return prev;
      }

      return [...newlyAdded, ...filteredPrev];
    });
  }, [products, customers]);

  // User Management Actions (Admin)
  const addUser = (userData: Omit<User, 'id'>) => {
    const currentCompId = companyIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('erp_current_company_id') || 'comp_default' : 'comp_default');
    const cleanUsername = (userData.username || '').trim().toLowerCase().replace(/^@+/, '');
    const cleanPhoneDigits = (userData.phone || '').replace(/\D/g, '');
    const cleanPhoneLast7 = cleanPhoneDigits.length >= 7 ? cleanPhoneDigits.slice(-7) : '';

    const existingIdx = users.findIndex((u) => {
      const uUsername = (u.username || '').trim().toLowerCase().replace(/^@+/, '');
      const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
      const uPhoneLast7 = uPhoneDigits.length >= 7 ? uPhoneDigits.slice(-7) : '';

      return (
        (cleanUsername && uUsername && cleanUsername === uUsername) ||
        (cleanPhoneLast7 && uPhoneLast7 && cleanPhoneLast7 === uPhoneLast7)
      );
    });

    let updatedList: User[];
    if (existingIdx >= 0) {
      const existing = users[existingIdx];
      const merged: User = {
        ...existing,
        ...userData,
        companyId: currentCompId,
        id: existing.id,
      };
      updatedList = [...users];
      updatedList[existingIdx] = merged;
    } else {
      const newUser: User = {
        ...userData,
        companyId: currentCompId,
        id: `user-${Date.now()}`,
      };
      updatedList = [newUser, ...users];
    }

    const deduplicated = deduplicateUsers(updatedList);
    setUsers(deduplicated);
    try {
      localStorage.setItem('erp_users', JSON.stringify(deduplicated));
    } catch (e) {}

    // Instantly sync to server with company scope
    fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-company-id': currentCompId,
      },
      body: JSON.stringify({ companyId: currentCompId, users: deduplicated }),
    }).catch(() => {});
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    const currentCompId = companyIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('erp_current_company_id') || 'comp_default' : 'comp_default');
    const updated = users.map((u) => (u.id === id ? { ...u, ...userData, companyId: currentCompId } : u));
    const deduplicated = deduplicateUsers(updated);
    setUsers(deduplicated);
    try {
      localStorage.setItem('erp_users', JSON.stringify(deduplicated));
    } catch (e) {}

    if (currentUser && currentUser.id === id) {
      const updatedCurr = { ...currentUser, ...userData, companyId: currentCompId };
      setCurrentUser(updatedCurr);
      try {
        localStorage.setItem('erp_current_user', JSON.stringify(updatedCurr));
      } catch (e) {}
    }

    fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-company-id': currentCompId,
      },
      body: JSON.stringify({ companyId: currentCompId, users: deduplicated }),
    }).catch(() => {});
  };

  const deleteUser = (id: string) => {
    const currentCompId = companyIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('erp_current_company_id') || 'comp_default' : 'comp_default');
    const remaining = users.filter((u) => u.id !== id);
    const deduplicated = deduplicateUsers(remaining);
    setUsers(deduplicated);
    try {
      localStorage.setItem('erp_users', JSON.stringify(deduplicated));
    } catch (e) {
      console.error(e);
    }
    if (currentUser && currentUser.id === id) {
      const nextUser = deduplicated.length > 0 ? deduplicated[0] : null;
      setCurrentUser(nextUser);
      if (nextUser) {
        localStorage.setItem('erp_current_user', JSON.stringify(nextUser));
      } else {
        localStorage.removeItem('erp_current_user');
      }
    }

    // Permanently sync deletion to server database immediately
    fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'x-company-id': currentCompId,
      },
    }).catch(() => {});
    fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-company-id': currentCompId,
      },
      body: JSON.stringify({ companyId: currentCompId, users: deduplicated }),
    }).catch(() => {});
  };

  const cleanDuplicateUsers = () => {
    const currentCompId = companyIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('erp_current_company_id') || 'comp_default' : 'comp_default');
    setUsers((prev) => {
      const cleaned = deduplicateUsers(prev);
      try {
        localStorage.setItem('erp_users', JSON.stringify(cleaned));
      } catch (e) {}
      return cleaned;
    });
    fetch('/api/users/deduplicate', {
      method: 'POST',
      headers: {
        'x-company-id': currentCompId,
      },
    }).catch(() => {});
  };

  // Auth
  const loginWithPin = (pin: string): boolean => {
    const cleanPin = pin.trim();
    const user = users.find((u) => {
      const uPin = u.pin.trim();
      const uUser = u.username.trim().toLowerCase();
      return uPin === cleanPin || uUser === cleanPin.toLowerCase();
    });
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const loginWithCredentials = (usernameOrPhone: string, pin: string): boolean => {
    const term = usernameOrPhone.trim().toLowerCase();
    const cleanTermNoSpace = term.replace(/\s+/g, '');
    const cleanPhoneDigits = term.replace(/\D/g, '');
    const cleanInputPin = pin.trim().replace(/\s+/g, '');

    // Last 7 and last 9 digits of phone input
    const inputLast7 = cleanPhoneDigits.length >= 7 ? cleanPhoneDigits.slice(-7) : '';
    const inputLast9 = cleanPhoneDigits.length >= 9 ? cleanPhoneDigits.slice(-9) : '';

    const settingsPhone1Digits = settings.receiptPhone ? settings.receiptPhone.replace(/\D/g, '') : '';
    const settingsPhone2Digits = settings.receiptPhone2 ? settings.receiptPhone2.replace(/\D/g, '') : '';

    let matchedUser = users.find((u) => {
      const uUser = u.username.trim().toLowerCase();
      const uUserNoSpace = uUser.replace(/\s+/g, '');
      const uName = u.name ? u.name.trim().toLowerCase() : '';
      const uPin = u.pin.trim().replace(/\s+/g, '');

      // 1. PIN Check
      const matchPin = uPin === cleanInputPin;
      if (!matchPin) return false;

      // 2. Username / Login Match
      const matchUsername =
        uUser === term ||
        uUserNoSpace === cleanTermNoSpace ||
        uUser === `@${term}` ||
        `@${uUser}` === term ||
        (uName && (uName === term || uName.replace(/\s+/g, '') === cleanTermNoSpace));

      if (matchUsername) return true;

      // 3. Phone Match
      if (cleanPhoneDigits.length >= 7) {
        const uPhoneDigits = u.phone ? u.phone.replace(/\D/g, '') : '';
        const uLast7 = uPhoneDigits.length >= 7 ? uPhoneDigits.slice(-7) : '';
        const uLast9 = uPhoneDigits.length >= 9 ? uPhoneDigits.slice(-9) : '';

        if (uPhoneDigits) {
          if (
            (inputLast7 && uLast7 && inputLast7 === uLast7) ||
            (inputLast9 && uLast9 && inputLast9 === uLast9) ||
            uPhoneDigits.includes(cleanPhoneDigits) ||
            cleanPhoneDigits.includes(uPhoneDigits)
          ) {
            return true;
          }
        }

        // If user is admin, also check settings phone numbers
        if (u.role === 'admin') {
          const s1Last7 = settingsPhone1Digits.length >= 7 ? settingsPhone1Digits.slice(-7) : '';
          const s2Last7 = settingsPhone2Digits.length >= 7 ? settingsPhone2Digits.slice(-7) : '';
          if (
            (s1Last7 && inputLast7 && s1Last7 === inputLast7) ||
            (s2Last7 && inputLast7 && s2Last7 === inputLast7)
          ) {
            return true;
          }
        }
      }

      return false;
    });

    // Fallback for Admin: If logging in with phone + valid Admin PIN (or default '1234')
    // and no specific user matched yet, match the Admin user!
    if (!matchedUser) {
      const adminUser = users.find((u) => u.role === 'admin') || users[0];
      if (adminUser) {
        const adminPin = adminUser.pin.trim().replace(/\s+/g, '');
        if (cleanInputPin === adminPin || cleanInputPin === '1234') {
          const updatedPhone = adminUser.phone || (cleanPhoneDigits.length >= 7 ? usernameOrPhone.trim() : adminUser.phone);
          matchedUser = {
            ...adminUser,
            phone: updatedPhone,
          };
          // Save updated admin user to state so phone is persisted
          setUsers((prev) =>
            prev.map((u) => (u.id === adminUser.id ? matchedUser! : u))
          );
        }
      }
    }

    if (matchedUser) {
      setCurrentUser(matchedUser);
      localStorage.setItem('erp_current_user', JSON.stringify(matchedUser));
      return true;
    }

    return false;
  };

  const loginWithCredentialsAsync = async (usernameOrPhone: string, pin: string): Promise<boolean> => {
    // 1. First attempt instant local match
    const localSuccess = loginWithCredentials(usernameOrPhone, pin);
    if (localSuccess) {
      return true;
    }

    // 2. Query the server auth API (cross-device sync: Phone -> Laptop / vice-versa)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier: usernameOrPhone, pin, companyId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const serverUser: User = data.user;
          const compId = data.companyId || serverUser.companyId || 'comp_default';
          setCompanyId(compId);
          try {
            localStorage.setItem('erp_current_company_id', compId);
          } catch {}

          // Merge user into users state & storage
          setUsers((prev) => {
            const map = new Map<string, User>();
            prev.forEach((u) => map.set(u.id, u));
            map.set(serverUser.id, serverUser);
            const merged = Array.from(map.values());
            localStorage.setItem('erp_users', JSON.stringify(merged));
            return merged;
          });

          setCurrentUser(serverUser);
          localStorage.setItem('erp_current_user', JSON.stringify(serverUser));

          // If server returned fullData, sync local state
          if (data.fullData) {
            const fd = data.fullData;
            if (Array.isArray(fd.products)) {
              const pList = fd.products.filter((p: any) => !isDemoItem(p));
              setProducts(pList);
              try { localStorage.setItem('erp_products', JSON.stringify(pList)); } catch {}
            }
            if (Array.isArray(fd.sales)) {
              const sList = fd.sales.filter((s: any) => !isDemoItem(s));
              setSales(sList);
              try { localStorage.setItem('erp_sales', JSON.stringify(sList)); } catch {}
            }
            if (Array.isArray(fd.customers)) {
              const cList = fd.customers.filter((c: any) => !isDemoItem(c));
              setCustomers(cList);
              try { localStorage.setItem('erp_customers', JSON.stringify(cList)); } catch {}
            }
            if (Array.isArray(fd.debtPayments)) {
              setDebtPayments(fd.debtPayments);
              try { localStorage.setItem('erp_debt_payments', JSON.stringify(fd.debtPayments)); } catch {}
            }
            if (Array.isArray(fd.stockTransfers)) {
              setStockTransfers(fd.stockTransfers);
              try { localStorage.setItem('erp_stock_transfers', JSON.stringify(fd.stockTransfers)); } catch {}
            }
            if (Array.isArray(fd.expenses)) {
              const eList = fd.expenses.filter((e: any) => !isDemoItem(e));
              setExpenses(eList);
              try { localStorage.setItem('erp_expenses', JSON.stringify(eList)); } catch {}
            }
            if (Array.isArray(fd.partnerStores)) {
              const psList = fd.partnerStores.filter((p: any) => !isDemoItem(p));
              setPartnerStores(psList);
              try { localStorage.setItem('erp_partner_stores', JSON.stringify(psList)); } catch {}
            }
            if (Array.isArray(fd.partnerTransactions)) {
              const ptList = fd.partnerTransactions.filter((t: any) => !isDemoItem(t));
              setPartnerTransactions(ptList);
              try { localStorage.setItem('erp_partner_transactions', JSON.stringify(ptList)); } catch {}
            }
            if (Array.isArray(fd.suppliers)) {
              const spList = fd.suppliers.filter((s: any) => !isDemoItem(s));
              setSuppliers(spList);
              try { localStorage.setItem('erp_suppliers', JSON.stringify(spList)); } catch {}
            }
            if (Array.isArray(fd.stockIntakes)) {
              const siList = fd.stockIntakes.filter((i: any) => !isDemoItem(i));
              setStockIntakes(siList);
              try { localStorage.setItem('erp_stock_intakes', JSON.stringify(siList)); } catch {}
            }
            if (Array.isArray(fd.supplierPayments)) {
              setSupplierPayments(fd.supplierPayments);
              try { localStorage.setItem('erp_supplier_payments', JSON.stringify(fd.supplierPayments)); } catch {}
            }
            if (fd.settings) {
              setSettings((prev) => {
                const mergedSettings = { ...prev, ...fd.settings, companyId: compId };
                try { localStorage.setItem('erp_settings', JSON.stringify(mergedSettings)); } catch {}
                return mergedSettings;
              });
            }
          }

          return true;
        }
      }
    } catch (e) {
      console.error('Server login request error:', e);
    }

    return false;
  };

  const registerAdmin = (data: {
    firstName: string;
    lastName: string;
    storeName: string;
    phone: string;
    username: string;
    pin: string;
  }): User => {
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.username || 'Glavniy Admin';
    const cleanUsername = (data.username || 'admin').trim().toLowerCase().replace(/^@+/, '');
    const cleanPhoneDigits = (data.phone || '').replace(/\D/g, '');
    const cleanPhoneLast7 = cleanPhoneDigits.length >= 7 ? cleanPhoneDigits.slice(-7) : '';

    // Generate new company id for new store registration
    const newCompanyId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    companyIdRef.current = newCompanyId;
    setCompanyId(newCompanyId);
    try {
      localStorage.setItem('erp_current_company_id', newCompanyId);
    } catch {}

    // Lock local polling overwrite for 6 seconds while registering
    lastLocalActionTimeRef.current = Date.now() + 6000;
    isServerHydratedRef.current = true;

    const newAdminUser: User = {
      id: `user-admin-${Date.now()}`,
      companyId: newCompanyId,
      username: cleanUsername,
      name: fullName,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      storeName: data.storeName,
      pin: data.pin,
      role: 'admin',
      allowedTabs: ['dashboard', 'sotuv', 'dokon_ombor', 'kirim', 'mijozlar', 'sozlamalar', 'sheriklar'],
    };

    // Clean slate for new registered store: start at 0
    setProducts([]);
    setSales([]);
    setCustomers([]);
    setDebtPayments([]);
    setStockTransfers([]);
    setExpenses([]);
    setPartnerStores([]);
    setPartnerTransactions([]);
    setSuppliers([]);
    setStockIntakes([]);
    setSupplierPayments([]);
    setNotifications([]);

    try {
      localStorage.removeItem('erp_products');
      localStorage.removeItem('erp_sales');
      localStorage.removeItem('erp_customers');
      localStorage.removeItem('erp_debt_payments');
      localStorage.removeItem('erp_stock_transfers');
      localStorage.removeItem('erp_expenses');
      localStorage.removeItem('erp_partner_stores');
      localStorage.removeItem('erp_partner_transactions');
      localStorage.removeItem('erp_suppliers');
      localStorage.removeItem('erp_stock_intakes');
      localStorage.removeItem('erp_supplier_payments');
      localStorage.removeItem('erp_notifications');
      localStorage.removeItem('erp_cart_items');
      localStorage.removeItem('erp_sotuv_cart');
      localStorage.removeItem('erp_pos_cart');
      localStorage.removeItem('erp_selected_customer');
      localStorage.removeItem('erp_quick_cart');
    } catch {}

    setUsers([newAdminUser]);
    try {
      localStorage.setItem('erp_users', JSON.stringify([newAdminUser]));
    } catch (e) {}
    
    // Update store name in settings
    setSettings((prev) => {
      const updated = {
        ...prev,
        companyId: newCompanyId,
        storeName: data.storeName || prev.storeName,
      };
      try {
        localStorage.setItem('erp_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Set active user
    setCurrentUser(newAdminUser);
    try {
      localStorage.setItem('erp_current_user', JSON.stringify(newAdminUser));
    } catch {}

    // Instantly register with server to create isolated /data/companies/{companyId}.json
    fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-company-id': newCompanyId,
      },
      body: JSON.stringify({
        ...data,
        companyId: newCompanyId,
      }),
    }).catch((e) => console.error('Server registration error:', e));

    return newAdminUser;
  };

  const promoteToAdmin = (userId?: string) => {
    const targetId = userId || currentUser?.id;
    if (!targetId) return;

    setUsers((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, role: 'admin' as UserRole } : u))
    );

    if (currentUser && (currentUser.id === targetId || !userId)) {
      const updatedUser: User = { ...currentUser, role: 'admin' };
      setCurrentUser(updatedUser);
      localStorage.setItem('erp_current_user', JSON.stringify(updatedUser));
    }

    const savedUsers = localStorage.getItem('erp_users');
    if (savedUsers) {
      try {
        const uList: User[] = JSON.parse(savedUsers);
        const updated = uList.map((u) => (u.id === targetId ? { ...u, role: 'admin' as UserRole } : u));
        localStorage.setItem('erp_users', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('erp_current_user');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    try {
      localStorage.removeItem('erp_notifications');
    } catch {}
  };

  // Add Sale Function
  const addSale = (saleData: Omit<Sale, 'id' | 'saleNumber'> & { sendTelegram?: boolean }): Sale => {
    lastLocalActionTimeRef.current = Date.now();
    const saleId = `sale-${Date.now()}`;
    const saleNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const effectiveCustomerName = (saleData.customerName || '').trim() || 'Oddiy xaridor';

    const newSale: Sale = {
      ...saleData,
      customerName: effectiveCustomerName,
      id: saleId,
      saleNumber: saleNum,
    };

    // 1. Deduct quantities from Store inventory
    let updatedProducts: Product[] = [];
    setProducts((prev) => {
      updatedProducts = prev.map((p) => {
        const itemsSold = saleData.items.filter((i) => i.productId === p.id);
        if (itemsSold.length === 0) return p;

        if (p.unitType === 'metr') {
          let currentStoreRolls = p.storeRollsList ? [...p.storeRollsList] : [];
          if (currentStoreRolls.length === 0 && (p.rollsInStore || 0) > 0) {
            const count = p.rollsInStore || 1;
            const total = p.totalMetersStore || 0;
            const perRoll = count > 0 ? Math.round(total / count) : 50;
            currentStoreRolls = Array(count).fill(perRoll);
          }

          for (const itemSold of itemsSold) {
            // Case A: Multiple specific roll indices selected
            if (
              itemSold.selectedRollIndices &&
              Array.isArray(itemSold.selectedRollIndices) &&
              itemSold.selectedRollIndices.length > 0
            ) {
              const sortedIndicesDesc = [...itemSold.selectedRollIndices].sort((a, b) => b - a);
              for (const idx of sortedIndicesDesc) {
                if (idx >= 0 && idx < currentStoreRolls.length) {
                  currentStoreRolls.splice(idx, 1);
                }
              }
            }
            // Case B: Single specific roll index selected
            else if (
              itemSold.selectedRollIndex !== undefined &&
              itemSold.selectedRollIndex >= 0 &&
              itemSold.selectedRollIndex < currentStoreRolls.length
            ) {
              const idx = itemSold.selectedRollIndex;
              const rollLen = currentStoreRolls[idx];
              let qtyToDeduct = itemSold.quantity;

              if (qtyToDeduct >= rollLen) {
                const overflow = qtyToDeduct - rollLen;
                currentStoreRolls.splice(idx, 1);
                qtyToDeduct = overflow;
              } else {
                currentStoreRolls[idx] = Math.round((rollLen - qtyToDeduct) * 100) / 100;
                qtyToDeduct = 0;
              }

              while (qtyToDeduct > 0 && currentStoreRolls.length > 0) {
                const firstRoll = currentStoreRolls[0];
                if (qtyToDeduct >= firstRoll) {
                  qtyToDeduct -= firstRoll;
                  currentStoreRolls.shift();
                } else {
                  currentStoreRolls[0] = Math.round((firstRoll - qtyToDeduct) * 100) / 100;
                  qtyToDeduct = 0;
                }
              }
            }
            // Case C: General deduction without specific roll index
            else {
              let qtyToDeduct = itemSold.quantity;
              while (qtyToDeduct > 0 && currentStoreRolls.length > 0) {
                const firstRoll = currentStoreRolls[0];
                if (qtyToDeduct >= firstRoll) {
                  qtyToDeduct -= firstRoll;
                  currentStoreRolls.shift();
                } else {
                  currentStoreRolls[0] = Math.round((firstRoll - qtyToDeduct) * 100) / 100;
                  qtyToDeduct = 0;
                }
              }
            }
          }

          const newTotalMeters = Math.round(currentStoreRolls.reduce((sum, r) => sum + r, 0) * 100) / 100;

          return {
            ...p,
            totalMetersStore: newTotalMeters,
            rollsInStore: currentStoreRolls.length,
            storeRollsList: currentStoreRolls,
          };
        } else if (p.unitType === 'kg') {
          let currentStoreBags = p.storeBagsList ? [...p.storeBagsList] : [];
          if (currentStoreBags.length === 0 && (p.bagsInStore || 0) > 0) {
            const count = p.bagsInStore || 1;
            const total = p.totalKgStore || 0;
            const perBag = count > 0 ? Math.round(total / count) : 25;
            currentStoreBags = Array(count).fill(perBag);
          }

          for (const itemSold of itemsSold) {
            if (
              itemSold.selectedRollIndices &&
              Array.isArray(itemSold.selectedRollIndices) &&
              itemSold.selectedRollIndices.length > 0
            ) {
              const sortedIndicesDesc = [...itemSold.selectedRollIndices].sort((a, b) => b - a);
              for (const idx of sortedIndicesDesc) {
                if (idx >= 0 && idx < currentStoreBags.length) {
                  currentStoreBags.splice(idx, 1);
                }
              }
            } else if (
              itemSold.selectedRollIndex !== undefined &&
              itemSold.selectedRollIndex >= 0 &&
              itemSold.selectedRollIndex < currentStoreBags.length
            ) {
              const idx = itemSold.selectedRollIndex;
              const bagWeight = currentStoreBags[idx];
              let qtyToDeduct = itemSold.quantity;

              if (qtyToDeduct >= bagWeight) {
                const overflow = qtyToDeduct - bagWeight;
                currentStoreBags.splice(idx, 1);
                qtyToDeduct = overflow;
              } else {
                currentStoreBags[idx] = Math.round((bagWeight - qtyToDeduct) * 100) / 100;
                qtyToDeduct = 0;
              }

              while (qtyToDeduct > 0 && currentStoreBags.length > 0) {
                const firstBag = currentStoreBags[0];
                if (qtyToDeduct >= firstBag) {
                  qtyToDeduct -= firstBag;
                  currentStoreBags.shift();
                } else {
                  currentStoreBags[0] = Math.round((firstBag - qtyToDeduct) * 100) / 100;
                  qtyToDeduct = 0;
                }
              }
            } else {
              let qtyToDeduct = itemSold.quantity;
              while (qtyToDeduct > 0 && currentStoreBags.length > 0) {
                const firstBag = currentStoreBags[0];
                if (qtyToDeduct >= firstBag) {
                  qtyToDeduct -= firstBag;
                  currentStoreBags.shift();
                } else {
                  currentStoreBags[0] = Math.round((firstBag - qtyToDeduct) * 100) / 100;
                  qtyToDeduct = 0;
                }
              }
            }
          }

          const newTotalKg = Math.round(currentStoreBags.reduce((sum, b) => sum + b, 0) * 100) / 100;

          return {
            ...p,
            totalKgStore: newTotalKg,
            bagsInStore: currentStoreBags.length,
            storeBagsList: currentStoreBags,
          };
        } else {
          let currentStoreBoxes = p.storeBoxesList ? [...p.storeBoxesList] : [];
          if (currentStoreBoxes.length === 0 && (p.boxesInStore || 0) > 0) {
            const count = p.boxesInStore || 1;
            const total = p.quantityStore || 0;
            const perBox = count > 0 ? Math.round(total / count) : 10;
            currentStoreBoxes = Array(count).fill(perBox);
          }

          for (const itemSold of itemsSold) {
            if (
              itemSold.selectedRollIndices &&
              Array.isArray(itemSold.selectedRollIndices) &&
              itemSold.selectedRollIndices.length > 0
            ) {
              const sortedIndicesDesc = [...itemSold.selectedRollIndices].sort((a, b) => b - a);
              for (const idx of sortedIndicesDesc) {
                if (idx >= 0 && idx < currentStoreBoxes.length) {
                  currentStoreBoxes.splice(idx, 1);
                }
              }
            } else if (
              itemSold.selectedRollIndex !== undefined &&
              itemSold.selectedRollIndex >= 0 &&
              itemSold.selectedRollIndex < currentStoreBoxes.length
            ) {
              const idx = itemSold.selectedRollIndex;
              const boxItems = currentStoreBoxes[idx];
              let qtyToDeduct = itemSold.quantity;

              if (qtyToDeduct >= boxItems) {
                const overflow = qtyToDeduct - boxItems;
                currentStoreBoxes.splice(idx, 1);
                qtyToDeduct = overflow;
              } else {
                currentStoreBoxes[idx] = Math.round((boxItems - qtyToDeduct) * 100) / 100;
                qtyToDeduct = 0;
              }

              while (qtyToDeduct > 0 && currentStoreBoxes.length > 0) {
                const firstBox = currentStoreBoxes[0];
                if (qtyToDeduct >= firstBox) {
                  qtyToDeduct -= firstBox;
                  currentStoreBoxes.shift();
                } else {
                  currentStoreBoxes[0] = Math.round((firstBox - qtyToDeduct) * 100) / 100;
                  qtyToDeduct = 0;
                }
              }
            } else {
              let qtyToDeduct = itemSold.quantity;
              while (qtyToDeduct > 0 && currentStoreBoxes.length > 0) {
                const firstBox = currentStoreBoxes[0];
                if (qtyToDeduct >= firstBox) {
                  qtyToDeduct -= firstBox;
                  currentStoreBoxes.shift();
                } else {
                  currentStoreBoxes[0] = Math.round((firstBox - qtyToDeduct) * 100) / 100;
                  qtyToDeduct = 0;
                }
              }
            }
          }

          const newTotalQty = Math.round(currentStoreBoxes.reduce((sum, bx) => sum + bx, 0) * 100) / 100;

          return {
            ...p,
            quantityStore: newTotalQty,
            boxesInStore: currentStoreBoxes.length,
            storeBoxesList: currentStoreBoxes,
          };
        }
      });
      try { localStorage.setItem('erp_products', JSON.stringify(updatedProducts)); } catch {}
      return updatedProducts;
    });

    // 2. Add or update Customer (only if a specific named customer or has debt)
    let updatedCustomers: Customer[] = [];
    setCustomers((prev) => {
      if (!effectiveCustomerName || effectiveCustomerName === 'Oddiy xaridor') {
        updatedCustomers = prev;
        return prev;
      }

      const existingIndex = prev.findIndex(
        (c) =>
          c.name.trim().toLowerCase() === effectiveCustomerName.toLowerCase() ||
          (c.phone && c.phone === saleData.customerPhone)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          totalPurchasesUzs: existing.totalPurchasesUzs + saleData.totalAmountUzs,
          currentDebtUzs: existing.currentDebtUzs + saleData.nasiyaAmount,
          debtDueDate: saleData.nasiyaAmount > 0 ? saleData.debtDueDate || existing.debtDueDate : existing.debtDueDate,
        };
        updatedCustomers = updated;
      } else {
        const newCust: Customer = {
          id: `cust-${Date.now()}`,
          name: effectiveCustomerName,
          region: saleData.customerRegion || 'Toshkent shahri',
          phone: saleData.customerPhone || '',
          totalPurchasesUzs: saleData.totalAmountUzs,
          currentDebtUzs: saleData.nasiyaAmount,
          debtDueDate: saleData.debtDueDate,
          partnerSince: new Date().toISOString().split('T')[0],
        };
        updatedCustomers = [newCust, ...prev];
      }
      try { localStorage.setItem('erp_customers', JSON.stringify(updatedCustomers)); } catch {}
      return updatedCustomers;
    });

    // 3. Add Sale
    let updatedSales: Sale[] = [];
    setSales((prev) => {
      updatedSales = [newSale, ...prev];
      try { localStorage.setItem('erp_sales', JSON.stringify(updatedSales)); } catch {}
      return updatedSales;
    });

    // 4. Trigger Instant Sync & Direct Server Sync
    triggerServerSync({
      products: updatedProducts,
      sales: updatedSales,
      customers: updatedCustomers,
    });

    const currentCompId = companyId || (typeof window !== 'undefined' ? localStorage.getItem('erp_current_company_id') || 'comp_default' : 'comp_default');

    fetch('/api/sync/sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-company-id': currentCompId,
      },
      body: JSON.stringify({
        companyId: currentCompId,
        sale: newSale,
        products: updatedProducts,
        customers: updatedCustomers,
      }),
    }).catch((err) => console.error('Direct sale sync error:', err));

    // 5. Send Telegram Bot notification if enabled (via saleData.sendTelegram or settings)
    const shouldSendTelegram = saleData.sendTelegram !== false;
    const hasBotToken = Boolean(settings.telegramBotToken && settings.telegramBotToken.trim());
    const hasChatIds = Boolean(
      (settings.telegramChatId && settings.telegramChatId.trim()) ||
      (settings.telegramChatIds && settings.telegramChatIds.length > 0)
    );

    if (shouldSendTelegram && hasBotToken && hasChatIds && settings.telegramAutoNotify !== false) {
      fetch('/api/telegram-notify-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-id': currentCompId,
        },
        body: JSON.stringify({
          companyId: currentCompId,
          botToken: settings.telegramBotToken,
          chatId: settings.telegramChatId,
          chatIds: settings.telegramChatIds,
          sale: newSale,
          storeName: settings.storeName || 'Asosiy Do\'kon',
        }),
      }).catch((err) => console.error('Telegram dispatch error:', err));
    }

    return newSale;
  };

  // Return Sale (Sotuvni Qaytarib Olish / Vozvrat)
  const returnSale = (
    saleId: string,
    itemsToReturn?: { productId: string; returnQuantity: number }[],
    reason?: string
  ) => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) return;
    if (targetSale.isReturned) {
      alert("Bu sotuv allaqachon to'liq qaytarilgan (vozvrat qilingan)!");
      return;
    }

    // Determine return map for each product in targetSale { productId: quantityToReturn }
    const returnQtyMap: Record<string, number> = {};
    let calculatedRefundUzs = 0;

    targetSale.items.forEach((item) => {
      const alreadyReturned = item.returnedQuantity || 0;
      const remainingReturnable = Math.max(0, item.quantity - alreadyReturned);

      if (itemsToReturn && itemsToReturn.length > 0) {
        const found = itemsToReturn.find((r) => r.productId === item.productId);
        if (found && found.returnQuantity > 0) {
          const qty = Math.min(found.returnQuantity, remainingReturnable);
          returnQtyMap[item.productId] = (returnQtyMap[item.productId] || 0) + qty;
          calculatedRefundUzs += qty * item.salePrice;
        }
      } else {
        // Full return of remaining quantities
        if (remainingReturnable > 0) {
          returnQtyMap[item.productId] = (returnQtyMap[item.productId] || 0) + remainingReturnable;
          calculatedRefundUzs += remainingReturnable * item.salePrice;
        }
      }
    });

    if (calculatedRefundUzs <= 0) {
      alert("Qaytarish uchun kamida bitta tovar va uning miqdori tanlanishi kerak!");
      return;
    }

    lastLocalActionTimeRef.current = Date.now();

    // 1. Restore product quantities back to store stock
    let updatedProducts: Product[] = [];
    setProducts((prevProducts) => {
      updatedProducts = prevProducts.map((p) => {
        const totalQtyToRestore = returnQtyMap[p.id] || 0;
        if (totalQtyToRestore <= 0) return p;

        if (p.unitType === 'metr') {
          const currentStoreMeters = p.totalMetersStore || 0;
          const currentStoreRolls = p.rollsInStore || 0;
          const metersPerRoll = p.metersPerRoll || 50;
          const returnedRollsEstimate = Math.ceil(totalQtyToRestore / metersPerRoll);

          return {
            ...p,
            totalMetersStore: currentStoreMeters + totalQtyToRestore,
            rollsInStore: currentStoreRolls + returnedRollsEstimate,
          };
        } else if (p.unitType === 'kg') {
          return {
            ...p,
            totalKgStore: (p.totalKgStore || 0) + totalQtyToRestore,
          };
        } else {
          // dona / qop / karobka
          const currentQty = p.quantityStore || 0;
          let storeBoxesList = p.storeBoxesList ? [...p.storeBoxesList] : [];
          if (storeBoxesList.length > 0) {
            storeBoxesList.push(totalQtyToRestore);
          }
          return {
            ...p,
            quantityStore: currentQty + totalQtyToRestore,
            boxesInStore: (p.boxesInStore || 0) + (storeBoxesList.length > 0 ? 1 : 0),
            storeBoxesList: storeBoxesList.length > 0 ? storeBoxesList : undefined,
          };
        }
      });
      try { localStorage.setItem('erp_products', JSON.stringify(updatedProducts)); } catch {}
      return updatedProducts;
    });

    // 2. Adjust customer debt and total purchases
    let updatedCustomers: Customer[] = [];
    setCustomers((prev) => {
      updatedCustomers = prev.map((c) => {
        if (
          c.name.trim().toLowerCase() === targetSale.customerName.trim().toLowerCase() ||
          (c.phone && targetSale.customerPhone && c.phone === targetSale.customerPhone)
        ) {
          const debtRatio = targetSale.totalAmountUzs > 0 ? targetSale.nasiyaAmount / targetSale.totalAmountUzs : 0;
          const debtReduction = Math.min(c.currentDebtUzs, Math.round(calculatedRefundUzs * debtRatio));

          return {
            ...c,
            totalPurchasesUzs: Math.max(0, c.totalPurchasesUzs - calculatedRefundUzs),
            currentDebtUzs: Math.max(0, c.currentDebtUzs - debtReduction),
          };
        }
        return c;
      });
      try { localStorage.setItem('erp_customers', JSON.stringify(updatedCustomers)); } catch {}
      return updatedCustomers;
    });

    // 3. Mark sale as returned / partially returned
    const now = new Date().toISOString();
    let updatedSales: Sale[] = [];
    setSales((prev) => {
      updatedSales = prev.map((s) => {
        if (s.id !== saleId) return s;

        const updatedItems = s.items.map((item) => {
          const returned = returnQtyMap[item.productId] || 0;
          if (returned <= 0) return item;
          return {
            ...item,
            returnedQuantity: (item.returnedQuantity || 0) + returned,
          };
        });

        const isFullyReturned = updatedItems.every(
          (item) => (item.returnedQuantity || 0) >= item.quantity
        );

        return {
          ...s,
          items: updatedItems,
          refundedAmountUzs: (s.refundedAmountUzs || 0) + calculatedRefundUzs,
          isReturned: isFullyReturned,
          returnedAt: now,
          returnReason: reason || "Qaytarildi (Vozvrat)",
        };
      });
      try { localStorage.setItem('erp_sales', JSON.stringify(updatedSales)); } catch {}
      return updatedSales;
    });

    triggerServerSync({
      products: updatedProducts,
      sales: updatedSales,
      customers: updatedCustomers,
    });

    // 4. Add system notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `Sotuv Qaytarildi (Vozvrat #${targetSale.saleNumber})`,
      message: `Mijoz (${targetSale.customerName}) sotuvdan tovar qaytardi. Jami ${calculatedRefundUzs.toLocaleString()} so'm qiymatidagi tovarlar omborga tiklandi.`,
      date: now,
      type: 'warning',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Add Product
  const addProduct = (product: Omit<Product, 'id'>) => {
    lastLocalActionTimeRef.current = Date.now();
    const autoBarcode = product.barcode && product.barcode.trim() !== ''
      ? product.barcode
      : `478${Math.floor(100000000 + Math.random() * 900000000)}`;

    const newP: Product = {
      ...product,
      barcode: autoBarcode,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setProducts((prev) => {
      const updated = [newP, ...prev];
      try { localStorage.setItem('erp_products', JSON.stringify(updated)); } catch {}
      triggerServerSync({ products: updated });
      return updated;
    });

    // Also send direct upsert for instant multi-device reliability
    fetch('/api/sync/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newP),
    }).catch(() => {});
  };

  // Add Multiple Products (Batch import)
  const addMultipleProducts = (newProducts: Omit<Product, 'id'>[]) => {
    lastLocalActionTimeRef.current = Date.now();
    const timestamp = Date.now();
    const created: Product[] = newProducts.map((p, idx) => ({
      ...p,
      id: `prod-${timestamp}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
    }));
    setProducts((prev) => {
      const updated = [...created, ...prev];
      try { localStorage.setItem('erp_products', JSON.stringify(updated)); } catch {}
      triggerServerSync({ products: updated });
      return updated;
    });
  };

  // Update Product
  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    lastLocalActionTimeRef.current = Date.now();
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
      try { localStorage.setItem('erp_products', JSON.stringify(updated)); } catch {}
      triggerServerSync({ products: updated });
      return updated;
    });
  };

  // Delete Product
  const deleteProduct = (id: string) => {
    lastLocalActionTimeRef.current = Date.now();
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try { localStorage.setItem('erp_products', JSON.stringify(updated)); } catch {}
      triggerServerSync({ products: updated });
      return updated;
    });
  };

  // Delete Multiple Products
  const deleteMultipleProducts = (ids: string[]) => {
    lastLocalActionTimeRef.current = Date.now();
    const idSet = new Set(ids);
    setProducts((prev) => {
      const updated = prev.filter((p) => !idSet.has(p.id));
      try { localStorage.setItem('erp_products', JSON.stringify(updated)); } catch {}
      triggerServerSync({ products: updated });
      return updated;
    });
  };

  // Clear Zero Stock Products (stogi 0 bo'lgan keraksiz tovarlarni o'chirish)
  const clearZeroStockProducts = (): number => {
    lastLocalActionTimeRef.current = Date.now();
    let deletedCount = 0;
    setProducts((prev) => {
      const remaining = prev.filter((p) => {
        const whQty = p.unitType === 'metr' ? p.totalMetersWarehouse || 0 : p.unitType === 'kg' ? p.totalKgWarehouse || 0 : p.quantityWarehouse || 0;
        const storeQty = p.unitType === 'metr' ? p.totalMetersStore || 0 : p.unitType === 'kg' ? p.totalKgStore || 0 : p.quantityStore || 0;
        const total = whQty + storeQty;
        if (total <= 0) {
          deletedCount++;
          return false;
        }
        return true;
      });
      try { localStorage.setItem('erp_products', JSON.stringify(remaining)); } catch {}
      triggerServerSync({ products: remaining });
      return remaining;
    });
    return deletedCount;
  };

  // Clear All Products
  const clearAllProducts = () => {
    lastLocalActionTimeRef.current = Date.now();
    setProducts([]);
    try { localStorage.removeItem('erp_products'); } catch {}
    triggerServerSync({ products: [] });
  };

  // Clear All Database Data (Reset all system data & modules to 0)
  const clearAllDatabaseData = async (options?: { resetSettings?: boolean; resetEmployees?: boolean }) => {
    // 1. Zero out all transactional, inventory and entity states
    setProducts([]);
    setSales([]);
    setCustomers([]);
    setDebtPayments([]);
    setStockTransfers([]);
    setExpenses([]);
    setPartnerStores([]);
    setPartnerTransactions([]);
    setSuppliers([]);
    setStockIntakes([]);
    setSupplierPayments([]);
    setNotifications([]);

    // 2. Clear all local storage records
    try {
      localStorage.removeItem('erp_products');
      localStorage.removeItem('erp_sales');
      localStorage.removeItem('erp_customers');
      localStorage.removeItem('erp_debt_payments');
      localStorage.removeItem('erp_stock_transfers');
      localStorage.removeItem('erp_expenses');
      localStorage.removeItem('erp_partner_stores');
      localStorage.removeItem('erp_partner_transactions');
      localStorage.removeItem('erp_suppliers');
      localStorage.removeItem('erp_stock_intakes');
      localStorage.removeItem('erp_supplier_payments');
      localStorage.removeItem('erp_notifications');
      localStorage.removeItem('erp_cart_items');
      localStorage.removeItem('erp_sotuv_cart');
      localStorage.removeItem('erp_pos_cart');
      localStorage.removeItem('erp_selected_customer');
      localStorage.removeItem('erp_quick_cart');
    } catch (e) {
      console.error('LocalStorage clear error:', e);
    }

    // 3. Optional Settings Reset
    if (options?.resetSettings) {
      const blankSettings: SystemSettings = {
        ...initialSettings,
        storeName: "",
        storeLogoUrl: "",
        receiptHeader: "",
        receiptFooter: "",
        receiptAddress: "",
        receiptPhone: "",
        receiptPhone2: "",
        receiptCustomNote: "",
        telegramBotToken: "",
        telegramChatId: "",
      };
      setSettings(blankSettings);
      try {
        localStorage.setItem('erp_settings', JSON.stringify(blankSettings));
      } catch (e) {}
    }

    // 4. Optional Employees Reset (keep current logged in user)
    if (options?.resetEmployees) {
      const activeAdmin: User = currentUser || {
        id: 'user-admin',
        username: 'admin',
        name: 'Bosh Administrator',
        pin: '1234',
        role: 'admin',
        allowedTabs: ['dashboard', 'sotuv', 'dokon_ombor', 'kirim', 'sheriklar', 'mijozlar', 'sozlamalar'],
      };
      const singleAdminList = [{ ...activeAdmin, role: 'admin' as UserRole }];
      setUsers(singleAdminList);
      try {
        localStorage.setItem('erp_users', JSON.stringify(singleAdminList));
      } catch (e) {}
    }

    // 5. Server Database Zero-Out Sync (cross-device reset)
    try {
      const currentCompId = companyIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('erp_current_company_id') || 'comp_default' : 'comp_default');
      await fetch('/api/reset-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-id': currentCompId,
        },
        body: JSON.stringify({
          companyId: currentCompId,
          resetSettings: options?.resetSettings,
          resetEmployees: options?.resetEmployees,
          keepAdminId: currentUser?.id,
        }),
      });
    } catch (e) {
      console.error('Server reset API error:', e);
    }
  };

  // Add Expense (Xarajat qo'shish)
  const addExpense = (expenseData: Omit<Expense, 'id'>): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  // Delete Expense
  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Stock Transfer: Ombor -> Do'kon
  const transferStock = (
    productId: string,
    quantity: number,
    unitsCount?: { rolls?: number; bags?: number; boxes?: number },
    selectedItems?: number[]
  ): boolean => {
    lastLocalActionTimeRef.current = Date.now();
    const product = products.find((p) => p.id === productId);
    if (!product) return false;

    let success = false;
    let updatedProducts: Product[] = [];

    setProducts((prev) => {
      updatedProducts = prev.map((p) => {
        if (p.id !== productId) return p;

        if (p.unitType === 'metr') {
          const avail = p.totalMetersWarehouse || 0;
          if (avail < quantity) return p;

          // Build current lists
          let currentWhRolls = p.warehouseRollsList ? [...p.warehouseRollsList] : [];
          if (currentWhRolls.length === 0 && (p.rollsInWarehouse || 0) > 0) {
            const count = p.rollsInWarehouse || 0;
            const perRoll = p.metersPerRoll || (count > 0 ? Math.round(avail / count) : 50);
            currentWhRolls = Array(count).fill(perRoll);
          }

          let currentStoreRolls = p.storeRollsList ? [...p.storeRollsList] : [];
          if (currentStoreRolls.length === 0 && (p.rollsInStore || 0) > 0) {
            const count = p.rollsInStore || 0;
            const perRoll = p.metersPerRoll || 50;
            currentStoreRolls = Array(count).fill(perRoll);
          }

          if (selectedItems && selectedItems.length > 0) {
            selectedItems.forEach((val) => {
              const idx = currentWhRolls.indexOf(val);
              if (idx !== -1) {
                currentWhRolls.splice(idx, 1);
              } else {
                currentWhRolls.shift();
              }
              currentStoreRolls.push(val);
            });
          } else {
            const rollsToMove = unitsCount?.rolls || Math.ceil(quantity / (p.metersPerRoll || 50));
            for (let i = 0; i < rollsToMove && currentWhRolls.length > 0; i++) {
              const moved = currentWhRolls.shift()!;
              currentStoreRolls.push(moved);
            }
          }

          const rollsTransferred = selectedItems ? selectedItems.length : (unitsCount?.rolls || Math.ceil(quantity / (p.metersPerRoll || 50)));

          const targetBarcode = p.barcode && p.barcode.trim() !== ''
            ? p.barcode
            : `478${Math.floor(100000000 + Math.random() * 900000000)}`;

          success = true;
          return {
            ...p,
            barcode: targetBarcode,
            totalMetersWarehouse: Math.max(0, avail - quantity),
            rollsInWarehouse: Math.max(0, currentWhRolls.length),
            warehouseRollsList: currentWhRolls,
            totalMetersStore: (p.totalMetersStore || 0) + quantity,
            rollsInStore: (p.rollsInStore || 0) + rollsTransferred,
            storeRollsList: currentStoreRolls,
          };
        } else if (p.unitType === 'kg') {
          const avail = p.totalKgWarehouse || 0;
          if (avail < quantity) return p;

          let currentWhBags = p.warehouseBagsList ? [...p.warehouseBagsList] : [];
          if (currentWhBags.length === 0 && (p.bagsInWarehouse || 0) > 0) {
            const count = p.bagsInWarehouse || 0;
            const perBag = p.kgPerBag || (count > 0 ? Math.round(avail / count) : 25);
            currentWhBags = Array(count).fill(perBag);
          }

          let currentStoreBags = p.storeBagsList ? [...p.storeBagsList] : [];
          if (currentStoreBags.length === 0 && (p.bagsInStore || 0) > 0) {
            const count = p.bagsInStore || 0;
            const perBag = p.kgPerBag || 25;
            currentStoreBags = Array(count).fill(perBag);
          }

          if (selectedItems && selectedItems.length > 0) {
            selectedItems.forEach((val) => {
              const idx = currentWhBags.indexOf(val);
              if (idx !== -1) {
                currentWhBags.splice(idx, 1);
              } else {
                currentWhBags.shift();
              }
              currentStoreBags.push(val);
            });
          } else {
            const bagsToMove = unitsCount?.bags || Math.ceil(quantity / (p.kgPerBag || 25));
            for (let i = 0; i < bagsToMove && currentWhBags.length > 0; i++) {
              const moved = currentWhBags.shift()!;
              currentStoreBags.push(moved);
            }
          }

          const bagsTransferred = selectedItems ? selectedItems.length : (unitsCount?.bags || Math.ceil(quantity / (p.kgPerBag || 25)));

          const targetBarcode = p.barcode && p.barcode.trim() !== ''
            ? p.barcode
            : `478${Math.floor(100000000 + Math.random() * 900000000)}`;

          success = true;
          return {
            ...p,
            barcode: targetBarcode,
            totalKgWarehouse: Math.max(0, avail - quantity),
            bagsInWarehouse: Math.max(0, currentWhBags.length),
            warehouseBagsList: currentWhBags,
            totalKgStore: (p.totalKgStore || 0) + quantity,
            bagsInStore: (p.bagsInStore || 0) + bagsTransferred,
            storeBagsList: currentStoreBags,
          };
        } else {
          // dona
          const avail = p.quantityWarehouse || 0;
          if (avail < quantity) return p;

          let currentWhBoxes = p.warehouseBoxesList ? [...p.warehouseBoxesList] : [];
          if (currentWhBoxes.length === 0 && (p.boxesInWarehouse || 0) > 0) {
            const count = p.boxesInWarehouse || 0;
            const perBox = p.itemsPerBox || (count > 0 ? Math.round(avail / count) : 10);
            currentWhBoxes = Array(count).fill(perBox);
          }

          let currentStoreBoxes = p.storeBoxesList ? [...p.storeBoxesList] : [];
          if (currentStoreBoxes.length === 0 && (p.boxesInStore || 0) > 0) {
            const count = p.boxesInStore || 0;
            const perBox = p.itemsPerBox || 10;
            currentStoreBoxes = Array(count).fill(perBox);
          }

          if (selectedItems && selectedItems.length > 0) {
            selectedItems.forEach((val) => {
              const idx = currentWhBoxes.indexOf(val);
              if (idx !== -1) {
                currentWhBoxes.splice(idx, 1);
              } else {
                currentWhBoxes.shift();
              }
              currentStoreBoxes.push(val);
            });
          } else {
            const boxesToMove = unitsCount?.boxes || Math.ceil(quantity / (p.itemsPerBox || 10));
            for (let i = 0; i < boxesToMove && currentWhBoxes.length > 0; i++) {
              const moved = currentWhBoxes.shift()!;
              currentStoreBoxes.push(moved);
            }
          }

          const boxesTransferred = selectedItems ? selectedItems.length : (unitsCount?.boxes || Math.ceil(quantity / (p.itemsPerBox || 10)));

          const targetBarcode = p.barcode && p.barcode.trim() !== ''
            ? p.barcode
            : `478${Math.floor(100000000 + Math.random() * 900000000)}`;

          success = true;
          return {
            ...p,
            barcode: targetBarcode,
            quantityWarehouse: Math.max(0, avail - quantity),
            boxesInWarehouse: Math.max(0, currentWhBoxes.length),
            warehouseBoxesList: currentWhBoxes,
            quantityStore: (p.quantityStore || 0) + quantity,
            boxesInStore: (p.boxesInStore || 0) + boxesTransferred,
            storeBoxesList: currentStoreBoxes,
          };
        }
      });
      try { localStorage.setItem('erp_products', JSON.stringify(updatedProducts)); } catch {}
      return updatedProducts;
    });

    if (success) {
      const transferRecord: StockTransfer = {
        id: `trans-${Date.now()}`,
        date: new Date().toISOString(),
        productId,
        productName: product.name,
        model: product.model,
        unitType: product.unitType,
        quantityTransferred: quantity,
        rollsTransferred: product.unitType === 'metr' ? (selectedItems ? selectedItems.length : unitsCount?.rolls) : undefined,
        bagsTransferred: product.unitType === 'kg' ? (selectedItems ? selectedItems.length : unitsCount?.bags) : undefined,
        boxesTransferred: product.unitType === 'dona' ? (selectedItems ? selectedItems.length : unitsCount?.boxes) : undefined,
        transferredBy: currentUser?.name || 'Omborchi',
      };
      setStockTransfers((prev) => {
        const updatedTrans = [transferRecord, ...prev];
        try { localStorage.setItem('erp_stock_transfers', JSON.stringify(updatedTrans)); } catch {}
        triggerServerSync({ products: updatedProducts, stockTransfers: updatedTrans });
        return updatedTrans;
      });
    }

    return success;
  };

  // Repay Debt
  const repayDebt = (
    customerId: string,
    amountUzs: number,
    paymentType: 'naqd' | 'karta',
    note?: string
  ) => {
    lastLocalActionTimeRef.current = Date.now();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    // 1. Record Debt Payment
    const paymentRecord: DebtPayment = {
      id: `pay-${Date.now()}`,
      customerId,
      customerName: customer.name,
      amountUzs,
      paymentType,
      date: new Date().toISOString(),
      cashierName: currentUser?.name || 'Kassir',
      note,
    };
    let updatedPayments: DebtPayment[] = [];
    setDebtPayments((prev) => {
      updatedPayments = [paymentRecord, ...prev];
      try { localStorage.setItem('erp_debt_payments', JSON.stringify(updatedPayments)); } catch {}
      return updatedPayments;
    });

    // 2. Reduce Customer Debt
    let updatedCustomers: Customer[] = [];
    setCustomers((prev) => {
      updatedCustomers = prev.map((c) => {
        if (c.id !== customerId) return c;
        const newDebt = Math.max(0, c.currentDebtUzs - amountUzs);
        return {
          ...c,
          currentDebtUzs: newDebt,
          debtDueDate: newDebt === 0 ? undefined : c.debtDueDate,
        };
      });
      try { localStorage.setItem('erp_customers', JSON.stringify(updatedCustomers)); } catch {}
      triggerServerSync({ debtPayments: updatedPayments, customers: updatedCustomers });
      return updatedCustomers;
    });
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    if (newSettings.themeMode) {
      const mode = newSettings.themeMode;
      try {
        localStorage.setItem('erp_theme_mode', mode);
      } catch {}
      const isDark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const root = document.documentElement;
      const body = document.body;
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        if (body) {
          body.classList.add('dark');
          body.classList.remove('light');
        }
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        if (body) {
          body.classList.remove('dark');
          body.classList.add('light');
        }
      }
    }

    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('erp_settings', JSON.stringify(updated));
      } catch {}
      // Sync to server immediately
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated }),
      }).catch(() => {});
      return updated;
    });
  };

  // Financial Statistics
  const getAggregatedStats = (startDate?: string, endDate?: string) => {
    let filteredSales = sales;

    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86400000; // include full end day
      filteredSales = sales.filter((s) => {
        const saleTime = new Date(s.date).getTime();
        return saleTime >= start && saleTime <= end;
      });
    }

    let totalRevenueUzs = 0;
    let totalCostUzs = 0;
    let cashTotalUzs = 0;
    let cardTotalUzs = 0;
    let nasiyaTotalUzs = 0;

    filteredSales.forEach((s) => {
      totalRevenueUzs += s.totalAmountUzs;
      totalCostUzs += s.totalCostUzs;
      cashTotalUzs += s.cashAmount;
      cardTotalUzs += s.cardAmount;
      nasiyaTotalUzs += s.nasiyaAmount;
    });

    // Add debt repayments collected to cash or card totals
    debtPayments.forEach((dp) => {
      if (startDate && endDate) {
        const dpTime = new Date(dp.date).getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + 86400000;
        if (dpTime < start || dpTime > end) return;
      }

      if (dp.paymentType === 'naqd') {
        cashTotalUzs += dp.amountUzs;
      } else {
        cardTotalUzs += dp.amountUzs;
      }
    });

    // Calculate Expenses in date range
    let totalExpensesUzs = 0;
    expenses.forEach((e) => {
      if (startDate && endDate) {
        const expTime = new Date(e.date).getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + 86400000;
        if (expTime < start || expTime > end) return;
      }
      totalExpensesUzs += e.amountUzs;
    });

    const cashboxBalanceUzs = cashTotalUzs + cardTotalUzs;
    const netCashboxBalanceUzs = cashboxBalanceUzs - totalExpensesUzs;
    const totalProfitUzs = totalRevenueUzs - totalCostUzs;
    const netProfitAfterExpensesUzs = totalProfitUzs - totalExpensesUzs;

    return {
      totalSalesCount: filteredSales.length,
      totalRevenueUzs,
      totalCostUzs,
      totalProfitUzs,
      cashTotalUzs,
      cardTotalUzs,
      nasiyaTotalUzs,
      cashboxBalanceUzs,
      totalExpensesUzs,
      netCashboxBalanceUzs,
      netProfitAfterExpensesUzs,
    };
  };

  const getPaymentTypeSales = (
    type: 'naqd' | 'karta' | 'nasiya',
    startDate?: string,
    endDate?: string
  ): Sale[] => {
    let filtered = sales;
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86400000;
      filtered = sales.filter((s) => {
        const t = new Date(s.date).getTime();
        return t >= start && t <= end;
      });
    }

    return filtered.filter((s) => {
      if (type === 'naqd') return s.cashAmount > 0;
      if (type === 'karta') return s.cardAmount > 0;
      if (type === 'nasiya') return s.nasiyaAmount > 0;
      return true;
    });
  };

  const getTopSellingProductsMonth = () => {
    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        model: string;
        quantitySold: number;
        unitType: string;
        totalRevenueUzs: number;
        totalProfitUzs: number;
      }
    >();

    sales.forEach((s) => {
      s.items.forEach((item) => {
        const key = `${item.productId}-${item.model}`;
        const revenue = item.totalAmountUzs;
        const profit = item.totalAmountUzs - item.costPrice * item.quantity;

        if (productMap.has(key)) {
          const current = productMap.get(key)!;
          current.quantitySold += item.quantity;
          current.totalRevenueUzs += revenue;
          current.totalProfitUzs += profit;
        } else {
          productMap.set(key, {
            productId: item.productId,
            productName: item.productName,
            model: item.model,
            quantitySold: item.quantity,
            unitType: item.unitType,
            totalRevenueUzs: revenue,
            totalProfitUzs: profit,
          });
        }
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.totalRevenueUzs - a.totalRevenueUzs)
      .slice(0, 10);
  };

  // Partner Store Actions Implementation
  const addPartnerStore = (storeData: Omit<PartnerStore, 'id' | 'createdAt' | 'debtBalanceUzs'>): PartnerStore => {
    const newPartner: PartnerStore = {
      ...storeData,
      id: `partner-${Date.now()}`,
      debtBalanceUzs: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setPartnerStores((prev) => [newPartner, ...prev]);
    return newPartner;
  };

  const updatePartnerStore = (id: string, storeData: Partial<PartnerStore>) => {
    setPartnerStores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...storeData } : s))
    );
  };

  const deletePartnerStore = (id: string) => {
    setPartnerStores((prev) => prev.filter((s) => s.id !== id));
    setPartnerTransactions((prev) => prev.filter((t) => t.partnerId !== id));
  };

  const sendStockToPartner = (
    partnerId: string,
    items: Array<{
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
    }>,
    note?: string
  ): boolean => {
    const partner = partnerStores.find((p) => p.id === partnerId);
    if (!partner) return false;

    let totalTransactionValue = 0;
    const transactionItems: PartnerTransactionItem[] = [];

    // 1. Deduct stock from products if matching productId or productName
    setProducts((prev) =>
      prev.map((p) => {
        const item = items.find((i) => (i.productId && i.productId === p.id) || (i.productName && i.productName.toLowerCase().trim() === p.name.toLowerCase().trim() && (i.model || '') === (p.model || '')));
        if (!item) return p;

        if (p.unitType === 'metr') {
          const storeM = Math.max(0, (p.totalMetersStore || 0) - item.quantity);
          const storeRolls = Math.max(0, (p.rollsInStore || 0) - (item.rollsCount || 0));
          return { ...p, totalMetersStore: storeM, rollsInStore: storeRolls };
        } else if (p.unitType === 'kg') {
          const storeKg = Math.max(0, (p.totalKgStore || 0) - item.quantity);
          return { ...p, totalKgStore: storeKg };
        } else {
          const storeQty = Math.max(0, (p.quantityStore || 0) - item.quantity);
          return { ...p, quantityStore: storeQty };
        }
      })
    );

    // Build items
    items.forEach((item) => {
      const lineTotalUzs = Math.round(item.quantity * item.priceUzs);
      totalTransactionValue += lineTotalUzs;

      transactionItems.push({
        productId: item.productId,
        productName: item.productName,
        model: item.model || '',
        unitType: item.unitType,
        rollsCount: item.rollsCount,
        metersPerRoll: item.metersPerRoll,
        quantity: item.quantity,
        currency: item.currency || 'UZS',
        priceValue: item.priceValue || item.priceUzs,
        priceUzs: item.priceUzs,
        totalUzs: lineTotalUzs,
      });
    });

    // 2. Increase partner's debt balance (+)
    setPartnerStores((prev) =>
      prev.map((s) =>
        s.id === partnerId
          ? { ...s, debtBalanceUzs: s.debtBalanceUzs + totalTransactionValue }
          : s
      )
    );

    // 3. Record transaction
    const newTrans: PartnerTransaction = {
      id: `ptrans-${Date.now()}`,
      partnerId,
      partnerName: partner.name,
      type: 'tovar_berildi',
      date: new Date().toISOString(),
      items: transactionItems,
      amountUzs: totalTransactionValue,
      addedBy: currentUser?.name || 'Kassir',
      note,
    };
    setPartnerTransactions((prev) => [newTrans, ...prev]);

    return true;
  };

  const receiveStockFromPartner = (
    partnerId: string,
    items: Array<{
      productId?: string;
      productName: string;
      model?: string;
      unitType: UnitType;
      rollsCount?: number;
      metersPerRoll?: number;
      quantity: number;
      currency?: 'UZS' | 'USD';
      priceValue?: number;
      costPrice: number; // in UZS
      salePrice?: number; // in UZS
    }>,
    note?: string
  ) => {
    const partner = partnerStores.find((p) => p.id === partnerId);
    if (!partner) return;

    let totalTransactionValue = 0;
    const transactionItems: PartnerTransactionItem[] = [];

    items.forEach((item) => {
      const lineTotalUzs = Math.round(item.quantity * item.costPrice);
      totalTransactionValue += lineTotalUzs;

      transactionItems.push({
        productId: item.productId,
        productName: item.productName,
        model: item.model || '',
        unitType: item.unitType,
        rollsCount: item.rollsCount,
        metersPerRoll: item.metersPerRoll,
        quantity: item.quantity,
        currency: item.currency || 'UZS',
        priceValue: item.priceValue || item.costPrice,
        priceUzs: item.costPrice,
        totalUzs: lineTotalUzs,
      });

      // Update or create product in store inventory
      if (item.productId) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== item.productId) return p;
            if (p.unitType === 'metr') {
              return {
                ...p,
                totalMetersStore: (p.totalMetersStore || 0) + item.quantity,
                rollsInStore: (p.rollsInStore || 0) + (item.rollsCount || 0),
                metersPerRoll: item.metersPerRoll || p.metersPerRoll || 50,
              };
            } else if (p.unitType === 'kg') {
              return { ...p, totalKgStore: (p.totalKgStore || 0) + item.quantity };
            } else {
              return { ...p, quantityStore: (p.quantityStore || 0) + item.quantity };
            }
          })
        );
      } else {
        const newProd: Product = {
          id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: item.productName,
          model: item.model || 'Standart',
          unitType: item.unitType,
          costPrice: item.costPrice,
          salePrice: item.salePrice || Math.round(item.costPrice * 1.25),
          minAlertStock: 10,
          rollsInStore: item.unitType === 'metr' ? (item.rollsCount || 1) : undefined,
          metersPerRoll: item.unitType === 'metr' ? (item.metersPerRoll || item.quantity) : undefined,
          quantityStore: item.unitType === 'dona' ? item.quantity : 0,
          totalMetersStore: item.unitType === 'metr' ? item.quantity : 0,
          totalKgStore: item.unitType === 'kg' ? item.quantity : 0,
        };
        setProducts((prev) => [newProd, ...prev]);
      }
    });

    // Reduce partner's debt balance / Increase our debt (-)
    setPartnerStores((prev) =>
      prev.map((s) =>
        s.id === partnerId
          ? { ...s, debtBalanceUzs: s.debtBalanceUzs - totalTransactionValue }
          : s
      )
    );

    // Record transaction
    const newTrans: PartnerTransaction = {
      id: `ptrans-${Date.now()}`,
      partnerId,
      partnerName: partner.name,
      type: 'tovar_olindi',
      date: new Date().toISOString(),
      items: transactionItems,
      amountUzs: totalTransactionValue,
      addedBy: currentUser?.name || 'Kassir',
      note,
    };
    setPartnerTransactions((prev) => [newTrans, ...prev]);
  };

  const settlePartnerPayment = (
    partnerId: string,
    amountUzs: number,
    direction: 'partner_paid_us' | 'we_paid_partner',
    paymentType: 'naqd' | 'karta',
    note?: string
  ) => {
    const partner = partnerStores.find((p) => p.id === partnerId);
    if (!partner) return;

    if (direction === 'partner_paid_us') {
      // Partner paid us money => Partner debt balance decreases (-)
      setPartnerStores((prev) =>
        prev.map((s) =>
          s.id === partnerId
            ? { ...s, debtBalanceUzs: s.debtBalanceUzs - amountUzs }
            : s
        )
      );

      const trans: PartnerTransaction = {
        id: `ptrans-${Date.now()}`,
        partnerId,
        partnerName: partner.name,
        type: 'pul_olindi',
        date: new Date().toISOString(),
        amountUzs,
        paymentType,
        addedBy: currentUser?.name || 'Kassir',
        note,
      };
      setPartnerTransactions((prev) => [trans, ...prev]);
    } else {
      // We paid partner money => Partner debt balance increases / Our debt decreases (+)
      setPartnerStores((prev) =>
        prev.map((s) =>
          s.id === partnerId
            ? { ...s, debtBalanceUzs: s.debtBalanceUzs + amountUzs }
            : s
        )
      );

      const trans: PartnerTransaction = {
        id: `ptrans-${Date.now()}`,
        partnerId,
        partnerName: partner.name,
        type: 'pul_berildi',
        date: new Date().toISOString(),
        amountUzs,
        paymentType,
        addedBy: currentUser?.name || 'Kassir',
        note,
      };
      setPartnerTransactions((prev) => [trans, ...prev]);
    }
  };

  const deletePartnerTransaction = (transactionId: string) => {
    setPartnerTransactions((prev) => prev.filter((t) => t.id !== transactionId));
  };

  // Supplier & Stock Intake Actions (Kirim / Postavka)
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'debtBalanceUzs'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `supp-${Date.now()}`,
      debtBalanceUzs: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    return newSupplier;
  };

  const updateSupplier = (id: string, supplierData: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...supplierData } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const addStockIntake = (intakeData: Omit<StockIntake, 'id' | 'intakeNumber' | 'date' | 'addedBy'>): StockIntake => {
    lastLocalActionTimeRef.current = Date.now();
    const newId = `intake-${Date.now()}`;
    const intakeNum = `K-${Math.floor(10000 + Math.random() * 90000)}`;
    const newIntake: StockIntake = {
      ...intakeData,
      id: newId,
      intakeNumber: intakeNum,
      date: new Date().toISOString(),
      addedBy: currentUser?.name || 'Bosh Administrator',
    };

    // Update stock quantities for each item in intake
    let updatedProducts: Product[] = [];
    setProducts((prevProducts) => {
      const updated = [...prevProducts];

      newIntake.items.forEach((item) => {
        let prodIndex = updated.findIndex(
          (p) =>
            (item.productId && p.id === item.productId) ||
            (p.name.trim().toLowerCase() === item.productName.trim().toLowerCase() &&
              p.model.trim().toLowerCase() === (item.model || '').trim().toLowerCase())
        );

        if (prodIndex !== -1) {
          const prod = { ...updated[prodIndex] };
          if (item.costPriceUzs > 0) prod.costPrice = item.costPriceUzs;
          if (item.salePriceUzs && item.salePriceUzs > 0) prod.salePrice = item.salePriceUzs;

          if (newIntake.location === 'warehouse') {
            if (prod.unitType === 'metr') {
              const rollsList = item.rollsList && item.rollsList.length > 0
                ? item.rollsList
                : Array(item.rollsCount || 1).fill(item.metersPerRoll || (item.quantity / (item.rollsCount || 1)));
              const addRolls = rollsList.length;
              const addMeters = item.quantity || rollsList.reduce((a, b) => a + b, 0);
              prod.rollsInWarehouse = (prod.rollsInWarehouse || 0) + addRolls;
              prod.totalMetersWarehouse = (prod.totalMetersWarehouse || 0) + addMeters;
              prod.warehouseRollsList = [...(prod.warehouseRollsList || []), ...rollsList];
            } else if (prod.unitType === 'kg') {
              const addBags = item.bagsCount || 0;
              const addKg = item.quantity || addBags * (item.kgPerBag || 0);
              prod.bagsInWarehouse = (prod.bagsInWarehouse || 0) + addBags;
              prod.totalKgWarehouse = (prod.totalKgWarehouse || 0) + addKg;
            } else {
              const addBoxes = item.boxesCount || 0;
              const addDona = item.quantity || addBoxes * (item.itemsPerBox || 1);
              prod.boxesInWarehouse = (prod.boxesInWarehouse || 0) + addBoxes;
              prod.quantityWarehouse = (prod.quantityWarehouse || 0) + addDona;
            }
          } else {
            // store
            if (prod.unitType === 'metr') {
              const rollsList = item.rollsList && item.rollsList.length > 0
                ? item.rollsList
                : Array(item.rollsCount || 1).fill(item.metersPerRoll || (item.quantity / (item.rollsCount || 1)));
              const addRolls = rollsList.length;
              const addMeters = item.quantity || rollsList.reduce((a, b) => a + b, 0);
              prod.rollsInStore = (prod.rollsInStore || 0) + addRolls;
              prod.totalMetersStore = (prod.totalMetersStore || 0) + addMeters;
              prod.storeRollsList = [...(prod.storeRollsList || []), ...rollsList];
            } else if (prod.unitType === 'kg') {
              const addBags = item.bagsCount || 0;
              const addKg = item.quantity || addBags * (item.kgPerBag || 0);
              prod.bagsInStore = (prod.bagsInStore || 0) + addBags;
              prod.totalKgStore = (prod.totalKgStore || 0) + addKg;
            } else {
              const addBoxes = item.boxesCount || 0;
              const addDona = item.quantity || addBoxes * (item.itemsPerBox || 1);
              prod.boxesInStore = (prod.boxesInStore || 0) + addBoxes;
              prod.quantityStore = (prod.quantityStore || 0) + addDona;
            }
          }
          updated[prodIndex] = prod;
        } else {
          // Product doesn't exist, create it automatically
          const isWarehouse = newIntake.location === 'warehouse';
          const newProd: Product = {
            id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: item.productName,
            model: item.model || 'Standart',
            unitType: item.unitType,
            costPrice: item.costPriceUzs,
            salePrice: item.salePriceUzs || Math.round(item.costPriceUzs * 1.3),
            minAlertStock: 20,
            barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            rollsInWarehouse: isWarehouse && item.unitType === 'metr' ? (item.rollsList?.length || item.rollsCount || 1) : 0,
            totalMetersWarehouse: isWarehouse && item.unitType === 'metr' ? item.quantity : 0,
            warehouseRollsList: isWarehouse && item.unitType === 'metr' ? (item.rollsList && item.rollsList.length > 0 ? item.rollsList : Array(item.rollsCount || 1).fill(item.metersPerRoll || item.quantity)) : [],
            rollsInStore: !isWarehouse && item.unitType === 'metr' ? (item.rollsList?.length || item.rollsCount || 1) : 0,
            totalMetersStore: !isWarehouse && item.unitType === 'metr' ? item.quantity : 0,
            storeRollsList: !isWarehouse && item.unitType === 'metr' ? (item.rollsList && item.rollsList.length > 0 ? item.rollsList : Array(item.rollsCount || 1).fill(item.metersPerRoll || item.quantity)) : [],
            
            bagsInWarehouse: isWarehouse && item.unitType === 'kg' ? item.bagsCount || 1 : 0,
            totalKgWarehouse: isWarehouse && item.unitType === 'kg' ? item.quantity : 0,
            bagsInStore: !isWarehouse && item.unitType === 'kg' ? item.bagsCount || 1 : 0,
            totalKgStore: !isWarehouse && item.unitType === 'kg' ? item.quantity : 0,

            boxesInWarehouse: isWarehouse && item.unitType === 'dona' ? item.boxesCount || 1 : 0,
            quantityWarehouse: isWarehouse && item.unitType === 'dona' ? item.quantity : 0,
            boxesInStore: !isWarehouse && item.unitType === 'dona' ? item.boxesCount || 1 : 0,
            quantityStore: !isWarehouse && item.unitType === 'dona' ? item.quantity : 0,
          };
          updated.unshift(newProd);
        }
      });

      updatedProducts = updated;
      try { localStorage.setItem('erp_products', JSON.stringify(updatedProducts)); } catch {}
      return updatedProducts;
    });

    // Update supplier debt balance if debtAmountUzs is non-zero
    let updatedSuppliers: Supplier[] = [];
    if (newIntake.supplierId && newIntake.debtAmountUzs !== 0) {
      setSuppliers((prev) => {
        updatedSuppliers = prev.map((s) => (s.id === newIntake.supplierId ? { ...s, debtBalanceUzs: s.debtBalanceUzs + newIntake.debtAmountUzs } : s));
        try { localStorage.setItem('erp_suppliers', JSON.stringify(updatedSuppliers)); } catch {}
        return updatedSuppliers;
      });
    }

    let updatedIntakes: StockIntake[] = [];
    setStockIntakes((prev) => {
      updatedIntakes = [newIntake, ...prev];
      try { localStorage.setItem('erp_stock_intakes', JSON.stringify(updatedIntakes)); } catch {}
      triggerServerSync({ products: updatedProducts, suppliers: updatedSuppliers, stockIntakes: updatedIntakes });
      return updatedIntakes;
    });

    return newIntake;
  };

  const repaySupplierDebt = (supplierId: string, amountUzs: number, paymentType: 'naqd' | 'karta', note?: string) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, debtBalanceUzs: s.debtBalanceUzs - amountUzs } : s))
    );

    const supplierObj = suppliers.find((s) => s.id === supplierId);
    const newPayment: SupplierPayment = {
      id: `spay-${Date.now()}`,
      supplierId,
      supplierName: supplierObj?.name || 'Postavshik',
      amountUzs,
      paymentType,
      date: new Date().toISOString(),
      addedBy: currentUser?.name || 'Bosh Administrator',
      note,
    };
    setSupplierPayments((prev) => [newPayment, ...prev]);
  };

  const deleteStockIntake = (id: string) => {
    setStockIntakes((prev) => prev.filter((i) => i.id !== id));
  };

  // Real-time cross-tab storage sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === 'erp_products') setProducts(JSON.parse(e.newValue).filter((p: any) => !isDemoItem(p)));
        if (e.key === 'erp_sales') setSales(JSON.parse(e.newValue).filter((s: any) => !isDemoItem(s)));
        if (e.key === 'erp_customers') setCustomers(JSON.parse(e.newValue).filter((c: any) => !isDemoItem(c)));
        if (e.key === 'erp_users') setUsers(JSON.parse(e.newValue));
        if (e.key === 'erp_settings') setSettings(JSON.parse(e.newValue));
        if (e.key === 'erp_expenses') setExpenses(JSON.parse(e.newValue).filter((ex: any) => !isDemoItem(ex)));
        if (e.key === 'erp_suppliers') setSuppliers(JSON.parse(e.newValue).filter((s: any) => !isDemoItem(s)));
        if (e.key === 'erp_partner_stores') setPartnerStores(JSON.parse(e.newValue).filter((p: any) => !isDemoItem(p)));
        if (e.key === 'erp_stock_transfers') setStockTransfers(JSON.parse(e.newValue));
      } catch (err) {
        console.error('Storage sync error:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Presence & Heartbeat tracking
  const [presenceMap, setPresenceMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('erp_presence_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'HEARTBEAT' && event.data?.userId) {
            setPresenceMap((prev) => ({
              ...prev,
              [event.data.userId]: event.data.timestamp || Date.now(),
            }));
          }
        };
      }
    } catch (e) {
      // BroadcastChannel optional fallback
    }

    const interval = setInterval(() => {
      if (currentUser) {
        const now = Date.now();
        localStorage.setItem(`erp_presence_${currentUser.id}`, String(now));
        if (bc) {
          bc.postMessage({ type: 'HEARTBEAT', userId: currentUser.id, timestamp: now });
        }
        setPresenceMap((prev) => ({
          ...prev,
          [currentUser.id]: now,
        }));
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [currentUser]);

  // Dynamically compute online status for each user
  const usersWithOnlineStatus = useMemo(() => {
    const now = Date.now();
    return users.map((u) => {
      const isSelf = currentUser?.id === u.id;
      const lastHeartbeat = presenceMap[u.id] || Number(localStorage.getItem(`erp_presence_${u.id}`) || '0');
      const isOnline = isSelf || (now - lastHeartbeat < 10000);
      return {
        ...u,
        isOnline,
        lastActive: lastHeartbeat || (isSelf ? now : undefined),
      };
    });
  }, [users, currentUser, presenceMap]);

  return (
    <ERPContext.Provider
      value={{
        products,
        sales,
        customers,
        debtPayments,
        stockTransfers,
        expenses,
        partnerStores,
        partnerTransactions,
        suppliers,
        stockIntakes,
        supplierPayments,
        settings,
        users: usersWithOnlineStatus,
        currentUser,
        companyId,
        setCompanyId,
        notifications,
        activeTab,
        setActiveTab,
        addSale,
        returnSale,
        addProduct,
        addMultipleProducts,
        updateProduct,
        deleteProduct,
        deleteMultipleProducts,
        clearZeroStockProducts,
        clearAllProducts,
        clearAllDatabaseData,
        addExpense,
        deleteExpense,
        transferStock,
        repayDebt,
        addPartnerStore,
        updatePartnerStore,
        deletePartnerStore,
        sendStockToPartner,
        receiveStockFromPartner,
        settlePartnerPayment,
        deletePartnerTransaction,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addStockIntake,
        repaySupplierDebt,
        deleteStockIntake,
        updateSettings,
        addUser,
        updateUser,
        deleteUser,
        cleanDuplicateUsers,
        loginWithPin,
        loginWithCredentials,
        loginWithCredentialsAsync,
        promoteToAdmin,
        registerAdmin,
        logout,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        removeNotification,
        clearAllNotifications,
        getAggregatedStats,
        getPaymentTypeSales,
        getTopSellingProductsMonth,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
