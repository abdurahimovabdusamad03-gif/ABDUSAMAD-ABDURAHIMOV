import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Persistent Multi-Tenant Database Setup
const DATA_DIR = path.join(process.cwd(), 'data');
const COMPANIES_DIR = path.join(DATA_DIR, 'companies');
const INDEX_FILE = path.join(DATA_DIR, 'companies_index.json');
const LEGACY_DB_FILE = path.join(DATA_DIR, 'erp_database.json');

function ensureDataDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(COMPANIES_DIR)) {
    fs.mkdirSync(COMPANIES_DIR, { recursive: true });
  }
}

function sanitizeCompanyId(rawId?: string): string {
  if (!rawId) return 'comp_default';
  const clean = String(rawId).replace(/[^a-zA-Z0-9_-]/g, '').trim();
  return clean || 'comp_default';
}

function getCompanyFilePath(companyId: string): string {
  ensureDataDirectories();
  const cleanId = sanitizeCompanyId(companyId);
  return path.join(COMPANIES_DIR, `${cleanId}.json`);
}

function getCompaniesIndex(): Array<{
  id: string;
  storeName: string;
  ownerName?: string;
  ownerUsername?: string;
  ownerPhone?: string;
  createdAt: string;
}> {
  ensureDataDirectories();
  if (fs.existsSync(INDEX_FILE)) {
    try {
      const content = fs.readFileSync(INDEX_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.companies)) return parsed.companies;
    } catch (e) {
      console.error('Error reading companies index:', e);
    }
  }
  return [];
}

function saveCompaniesIndex(index: any[]) {
  try {
    ensureDataDirectories();
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving companies index:', e);
  }
}

function isDemoUser(u: any): boolean {
  if (!u) return true;
  const username = (u.username || '').toLowerCase().trim();
  const name = (u.name || '').toLowerCase().trim();
  const id = (u.id || '').toLowerCase().trim();

  if (id === 'user-cashier' || id === 'user-warehouse') return true;
  if (name.includes('alisher kassir') || name.includes('javohir omborchi')) return true;
  if (username === 'kassir' || username === 'omborchi') return true;
  return false;
}

function isDemoItem(item: any): boolean {
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
}

function deduplicateUsers(users: any[]): any[] {
  if (!users || !Array.isArray(users)) return [];

  const hasRealUsers = users.some((u) => u && !isDemoUser(u) && (u.username !== 'admin' || (u.name && !u.name.includes('Bosh Administrator'))));

  const filtered = hasRealUsers
    ? users.filter((u) => !isDemoUser(u))
    : users;

  const uniqueList: any[] = [];

  for (const rawUser of filtered) {
    if (!rawUser) continue;
    const user = { ...rawUser };

    if (hasRealUsers && (user.id === 'user-admin' || (user.username === 'admin' && user.name === 'Bosh Administrator'))) {
      const hasCustomAdmin = filtered.some((u) => u.role === 'admin' && u.id !== 'user-admin' && u.name !== 'Bosh Administrator');
      if (hasCustomAdmin) {
        continue;
      }
    }

    const usernameNorm = (user.username || '').trim().toLowerCase().replace(/^@+/, '');
    const phoneDigits = (user.phone || '').replace(/\D/g, '');
    const phoneLast7 = phoneDigits.length >= 7 ? phoneDigits.slice(-7) : '';
    const phoneLast9 = phoneDigits.length >= 9 ? phoneDigits.slice(-9) : '';
    const nameNorm = (user.name || '').trim().toLowerCase();

    const existingIndex = uniqueList.findIndex((u) => {
      const uUsernameNorm = (u.username || '').trim().toLowerCase().replace(/^@+/, '');
      const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
      const uPhoneLast7 = uPhoneDigits.length >= 7 ? uPhoneDigits.slice(-7) : '';
      const uPhoneLast9 = uPhoneDigits.length >= 9 ? uPhoneDigits.slice(-9) : '';
      const uNameNorm = (u.name || '').trim().toLowerCase();

      if (usernameNorm && uUsernameNorm && usernameNorm === uUsernameNorm) {
        return true;
      }

      if (phoneDigits.length >= 7 && uPhoneDigits.length >= 7) {
        if (
          phoneDigits === uPhoneDigits ||
          (phoneLast9 && uPhoneLast9 && phoneLast9 === uPhoneLast9) ||
          (phoneLast7 && uPhoneLast7 && phoneLast7 === uPhoneLast7)
        ) {
          return true;
        }
      }

      if (nameNorm && uNameNorm && nameNorm === uNameNorm && user.role && u.role && user.role === u.role) {
        return true;
      }

      return false;
    });

    if (existingIndex >= 0) {
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

function sanitizeDatabase(data: any, companyId: string): any {
  if (!data) return data;
  data.companyId = companyId;
  if (data.users) data.users = deduplicateUsers(data.users);
  if (data.products && Array.isArray(data.products)) data.products = data.products.filter((p: any) => !isDemoItem(p));
  if (data.sales && Array.isArray(data.sales)) data.sales = data.sales.filter((s: any) => !isDemoItem(s));
  if (data.customers && Array.isArray(data.customers)) data.customers = data.customers.filter((c: any) => !isDemoItem(c));
  if (data.suppliers && Array.isArray(data.suppliers)) data.suppliers = data.suppliers.filter((s: any) => !isDemoItem(s));
  if (data.stockIntakes && Array.isArray(data.stockIntakes)) data.stockIntakes = data.stockIntakes.filter((i: any) => !isDemoItem(i));
  if (data.partnerStores && Array.isArray(data.partnerStores)) data.partnerStores = data.partnerStores.filter((p: any) => !isDemoItem(p));
  if (data.partnerTransactions && Array.isArray(data.partnerTransactions)) data.partnerTransactions = data.partnerTransactions.filter((t: any) => !isDemoItem(t));
  if (data.expenses && Array.isArray(data.expenses)) data.expenses = data.expenses.filter((e: any) => !isDemoItem(e));
  if (data.settings) {
    data.settings.companyId = companyId;
  }
  return data;
}

function createCleanCompanyDatabase(companyId: string, storeName: string = '', adminUser?: any): any {
  return {
    companyId,
    users: adminUser ? [adminUser] : [],
    products: [],
    categories: [],
    sales: [],
    customers: [],
    debtPayments: [],
    stockTransfers: [],
    expenses: [],
    partnerStores: [],
    partnerTransactions: [],
    suppliers: [],
    stockIntakes: [],
    supplierPayments: [],
    activityLogs: [],
    settings: {
      companyId,
      storeName: storeName || '',
      storeLogoUrl: '',
      themeMode: 'dark',
      accentColor: 'amber',
      language: 'uz',
      unitPreference: 'dona',
      usdRate: 12800,
      telegramBotToken: '',
      telegramChatId: '',
      telegramChatIds: [],
      telegramAutoNotify: true,
      xprinterName: 'XPrinter XP-N160I',
      xprinterPaperWidth: '80mm',
      receiptHeader: '',
      receiptFooter: '',
      receiptAddress: '',
      receiptPhone: '',
      receiptPhone2: '',
      receiptCustomNote: '',
      showLogoOnReceipt: false,
      telegramChannelLink: 'https://t.me/+KexajQhWkoBmYTA6',
      showTelegramQrOnReceipt: true,
      partnerTabName: "Sherik Do'konlar",
      barcodeLabelWidth: '58x40mm',
      barcodeShowStoreName: true,
      barcodeShowProductName: true,
      barcodeShowModel: true,
      barcodeShowPrice: true,
      barcodeShowQuantityMeters: true,
      barcodeShowCodeNumber: true,
    },
    lastUpdated: new Date().toISOString(),
  };
}

function migrateLegacyDatabaseIfNeeded() {
  ensureDataDirectories();
  const defaultFile = path.join(COMPANIES_DIR, 'comp_default.json');
  
  if (!fs.existsSync(defaultFile)) {
    if (fs.existsSync(LEGACY_DB_FILE)) {
      try {
        const legacyContent = fs.readFileSync(LEGACY_DB_FILE, 'utf-8');
        const legacyData = JSON.parse(legacyContent);
        const sanitized = sanitizeDatabase(legacyData, 'comp_default');
        fs.writeFileSync(defaultFile, JSON.stringify(sanitized, null, 2), 'utf-8');
        console.log('Migrated legacy erp_database.json to company comp_default.json');
      } catch (e) {
        console.error('Error migrating legacy database:', e);
        const clean = createCleanCompanyDatabase('comp_default', 'Asosiy Do\'kon');
        fs.writeFileSync(defaultFile, JSON.stringify(clean, null, 2), 'utf-8');
      }
    } else {
      const clean = createCleanCompanyDatabase('comp_default', 'Asosiy Do\'kon');
      fs.writeFileSync(defaultFile, JSON.stringify(clean, null, 2), 'utf-8');
    }
  }

  // Ensure index includes comp_default
  const index = getCompaniesIndex();
  if (!index.some((c) => c.id === 'comp_default')) {
    let storeName = 'Asosiy Do\'kon';
    try {
      if (fs.existsSync(defaultFile)) {
        const d = JSON.parse(fs.readFileSync(defaultFile, 'utf-8'));
        if (d.settings?.storeName) storeName = d.settings.storeName;
      }
    } catch {}
    index.unshift({
      id: 'comp_default',
      storeName,
      createdAt: new Date().toISOString(),
    });
    saveCompaniesIndex(index);
  }
}

// Initial migration check
migrateLegacyDatabaseIfNeeded();

function loadCompanyDatabase(companyId: string): any {
  ensureDataDirectories();
  const cleanId = sanitizeCompanyId(companyId);
  const filePath = getCompanyFilePath(cleanId);

  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      return sanitizeDatabase(parsed, cleanId);
    } catch (e) {
      console.error(`Error reading database file for company ${cleanId}:`, e);
    }
  }

  // If not found, create new clean isolated database
  const newClean = createCleanCompanyDatabase(cleanId);
  saveCompanyDatabase(cleanId, newClean);
  return newClean;
}

function saveCompanyDatabase(companyId: string, data: any) {
  try {
    ensureDataDirectories();
    const cleanId = sanitizeCompanyId(companyId);
    const filePath = getCompanyFilePath(cleanId);
    const sanitized = sanitizeDatabase(data, cleanId);
    sanitized.lastUpdated = new Date().toISOString();

    // Atomic write to prevent file corruption
    const tempPath = `${filePath}.tmp_${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(sanitized, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);

    // Update companies index store name and metadata if present
    const index = getCompaniesIndex();
    const idx = index.findIndex((c) => c.id === cleanId);
    const storeTitle = sanitized.settings?.storeName || (sanitized.users?.[0]?.storeName) || 'Do\'kon';
    const adminUser = (sanitized.users || []).find((u: any) => u.role === 'admin') || sanitized.users?.[0];

    if (idx >= 0) {
      index[idx] = {
        ...index[idx],
        storeName: storeTitle,
        ownerName: adminUser?.name || index[idx].ownerName,
        ownerUsername: adminUser?.username || index[idx].ownerUsername,
        ownerPhone: adminUser?.phone || index[idx].ownerPhone,
      };
    } else {
      index.push({
        id: cleanId,
        storeName: storeTitle,
        ownerName: adminUser?.name || '',
        ownerUsername: adminUser?.username || '',
        ownerPhone: adminUser?.phone || '',
        createdAt: new Date().toISOString(),
      });
    }
    saveCompaniesIndex(index);
  } catch (e) {
    console.error(`Error saving database file for company ${companyId}:`, e);
  }
}

// Find matching user across all companies on login
function findUserAcrossAllCompanies(loginIdentifier: string, inputPin: string) {
  const term = loginIdentifier.trim().toLowerCase();
  const cleanTermNoSpace = term.replace(/\s+/g, '');
  const cleanPhoneDigits = term.replace(/\D/g, '');
  const cleanInputPin = inputPin.trim().replace(/\s+/g, '');

  const inputLast7 = cleanPhoneDigits.length >= 7 ? cleanPhoneDigits.slice(-7) : '';
  const inputLast9 = cleanPhoneDigits.length >= 9 ? cleanPhoneDigits.slice(-9) : '';

  ensureDataDirectories();
  const files = fs.readdirSync(COMPANIES_DIR).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const compId = file.replace('.json', '');
    const compDb = loadCompanyDatabase(compId);
    const users: any[] = compDb.users || [];

    const matchedUser = users.find((u) => {
      const uPin = (u.pin || '').trim().replace(/\s+/g, '');
      if (uPin !== cleanInputPin) return false;

      const uUser = (u.username || '').trim().toLowerCase();
      const uUserNoSpace = uUser.replace(/\s+/g, '');
      const uName = (u.name || '').trim().toLowerCase();

      // 1. Username / Name check
      if (
        uUser === term ||
        uUserNoSpace === cleanTermNoSpace ||
        uUser === `@${term}` ||
        `@${uUser}` === term ||
        uName === term ||
        uName.replace(/\s+/g, '') === cleanTermNoSpace
      ) {
        return true;
      }

      // 2. Phone check
      if (cleanPhoneDigits.length >= 7) {
        const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
        const uLast7 = uPhoneDigits.length >= 7 ? uPhoneDigits.slice(-7) : '';
        const uLast9 = uPhoneDigits.length >= 9 ? uPhoneDigits.slice(-9) : '';

        if (
          (inputLast7 && uLast7 && inputLast7 === uLast7) ||
          (inputLast9 && uLast9 && inputLast9 === uLast9) ||
          uPhoneDigits.includes(cleanPhoneDigits) ||
          cleanPhoneDigits.includes(uPhoneDigits)
        ) {
          return true;
        }
      }

      return false;
    });

    if (matchedUser) {
      return {
        companyId: compId,
        user: matchedUser,
        fullData: compDb,
      };
    }
  }

  // Fallback for default admin/1234 on comp_default
  if (cleanTermNoSpace === 'admin' || cleanPhoneDigits.length >= 7) {
    const defaultDb = loadCompanyDatabase('comp_default');
    const adminUser = (defaultDb.users || []).find((u: any) => u.role === 'admin');
    if (adminUser) {
      const adminPin = (adminUser.pin || '').trim().replace(/\s+/g, '');
      if (cleanInputPin === adminPin || cleanInputPin === '1234') {
        return {
          companyId: 'comp_default',
          user: adminUser,
          fullData: defaultDb,
        };
      }
    }
  }

  return null;
}

// Extract company ID from request (header, query, or body)
function extractCompanyId(req: express.Request): string {
  const headerId = req.headers['x-company-id'];
  if (headerId && typeof headerId === 'string' && headerId.trim()) {
    return sanitizeCompanyId(headerId);
  }
  const queryId = req.query.companyId;
  if (queryId && typeof queryId === 'string' && queryId.trim()) {
    return sanitizeCompanyId(queryId);
  }
  const bodyId = req.body?.companyId;
  if (bodyId && typeof bodyId === 'string' && bodyId.trim()) {
    return sanitizeCompanyId(bodyId);
  }
  return 'comp_default';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize Gemini AI client lazily
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Multi-tenant: GET Company Index (Summary)
  app.get('/api/companies', (req, res) => {
    try {
      const index = getCompaniesIndex();
      res.json({ success: true, companies: index });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Cross-device Database Sync: GET All Data (Scoped to Company)
  app.get('/api/sync', (req, res) => {
    try {
      const companyId = extractCompanyId(req);
      const db = loadCompanyDatabase(companyId);
      res.json({ success: true, companyId, data: db });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Cross-device Database Sync: POST / Update Data (Scoped to Company)
  app.post('/api/sync', (req, res) => {
    try {
      const incoming = req.body;
      const companyId = extractCompanyId(req);
      const current = loadCompanyDatabase(companyId);

      const merged = {
        ...current,
        companyId,
        users: Array.isArray(incoming.users) ? deduplicateUsers(incoming.users) : current.users,
        products: Array.isArray(incoming.products) ? incoming.products : current.products,
        categories: Array.isArray(incoming.categories) ? incoming.categories : current.categories,
        sales: Array.isArray(incoming.sales) ? incoming.sales : current.sales,
        customers: Array.isArray(incoming.customers) ? incoming.customers : current.customers,
        debtPayments: Array.isArray(incoming.debtPayments) ? incoming.debtPayments : current.debtPayments,
        stockTransfers: Array.isArray(incoming.stockTransfers) ? incoming.stockTransfers : current.stockTransfers,
        expenses: Array.isArray(incoming.expenses) ? incoming.expenses : current.expenses,
        partnerStores: Array.isArray(incoming.partnerStores) ? incoming.partnerStores : current.partnerStores,
        partnerTransactions: Array.isArray(incoming.partnerTransactions) ? incoming.partnerTransactions : current.partnerTransactions,
        suppliers: Array.isArray(incoming.suppliers) ? incoming.suppliers : current.suppliers,
        stockIntakes: Array.isArray(incoming.stockIntakes) ? incoming.stockIntakes : current.stockIntakes,
        supplierPayments: Array.isArray(incoming.supplierPayments) ? incoming.supplierPayments : current.supplierPayments,
        activityLogs: Array.isArray(incoming.activityLogs) ? incoming.activityLogs : current.activityLogs,
        settings: incoming.settings ? { ...(current.settings || {}), ...incoming.settings, companyId } : current.settings,
        resetTimestamp: incoming.resetTimestamp || current.resetTimestamp,
        lastUpdated: new Date().toISOString(),
      };

      saveCompanyDatabase(companyId, merged);
      res.json({ success: true, companyId, data: merged });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Direct Product Upsert endpoint for immediate cross-device sync
  app.post('/api/sync/product', (req, res) => {
    try {
      const companyId = extractCompanyId(req);
      const product = req.body.product || req.body;
      if (!product || !product.id) {
        return res.status(400).json({ success: false, error: 'Product and ID required' });
      }
      const db = loadCompanyDatabase(companyId);
      const prods: any[] = Array.isArray(db.products) ? db.products : [];
      const idx = prods.findIndex((p: any) => p.id === product.id);
      if (idx >= 0) {
        prods[idx] = product;
      } else {
        prods.unshift(product);
      }
      db.products = prods;
      saveCompanyDatabase(companyId, db);
      res.json({ success: true, companyId, product, data: db });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Direct Sale Upsert & Inventory Deduction endpoint
  app.post('/api/sync/sale', (req, res) => {
    try {
      const companyId = extractCompanyId(req);
      const { sale, products, customers } = req.body;
      if (!sale || !sale.id) {
        return res.status(400).json({ success: false, error: 'Sale and ID required' });
      }
      const db = loadCompanyDatabase(companyId);
      
      // Update sales
      const sales: any[] = Array.isArray(db.sales) ? db.sales : [];
      const sIdx = sales.findIndex((s: any) => s.id === sale.id);
      if (sIdx >= 0) {
        sales[sIdx] = sale;
      } else {
        sales.unshift(sale);
      }
      db.sales = sales;

      // Update products if passed
      if (Array.isArray(products)) {
        db.products = products;
      }

      // Update customers if passed
      if (Array.isArray(customers)) {
        db.customers = customers;
      }

      saveCompanyDatabase(companyId, db);
      res.json({ success: true, companyId, sale, data: db });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Cross-device Auth: Register New Business / Store (Creates fresh isolated DB with 0 data)
  app.post('/api/auth/register', (req, res) => {
    try {
      const { firstName, lastName, storeName, phone, username, pin, role = 'admin' } = req.body;

      const fullName = `${firstName || ''} ${lastName || ''}`.trim() || username || 'Admin';
      const cleanPhone = (phone || '').trim();
      const cleanPin = (pin || '').trim();
      const cleanUsername = (username || '').trim() || (cleanPhone ? cleanPhone.replace(/\D/g, '') : 'admin');
      const cleanStoreName = (storeName || '').trim() || 'Mening Do\'konim';

      // Use client-provided companyId or generate clean unique company ID for this newly registered business
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const companyId = req.body.companyId || req.headers['x-company-id'] || `comp_${Date.now()}_${randomSuffix}`;

      const newAdminUser = {
        id: `user-admin-${Date.now()}`,
        username: cleanUsername,
        name: fullName,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: cleanPhone,
        storeName: cleanStoreName,
        companyId: companyId,
        pin: cleanPin,
        role: role,
        allowedTabs: ['dashboard', 'sotuv', 'dokon_ombor', 'kirim', 'mijozlar', 'sozlamalar', 'sheriklar'],
      };

      // Create completely isolated 0-data database for this new store
      const newCompanyDb = createCleanCompanyDatabase(companyId, cleanStoreName, newAdminUser);
      saveCompanyDatabase(companyId, newCompanyDb);

      res.json({
        success: true,
        companyId,
        user: newAdminUser,
        fullData: newCompanyDb,
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Cross-device Auth: Login User (Finds across isolated companies or by explicit companyId)
  app.post('/api/auth/login', (req, res) => {
    try {
      const { loginIdentifier, pin, companyId } = req.body;
      if (!loginIdentifier || !pin) {
        return res.status(400).json({ success: false, error: 'Login va parol kiritilishi shart.' });
      }

      // If explicit companyId is specified, search there first
      if (companyId) {
        const cleanCompId = sanitizeCompanyId(companyId);
        const compDb = loadCompanyDatabase(cleanCompId);
        const term = loginIdentifier.trim().toLowerCase();
        const cleanTermNoSpace = term.replace(/\s+/g, '');
        const cleanPhoneDigits = term.replace(/\D/g, '');
        const cleanInputPin = pin.trim().replace(/\s+/g, '');

        const matched = (compDb.users || []).find((u: any) => {
          const uPin = (u.pin || '').trim().replace(/\s+/g, '');
          if (uPin !== cleanInputPin) return false;
          const uUser = (u.username || '').trim().toLowerCase();
          const uName = (u.name || '').trim().toLowerCase();
          return uUser === term || uUser.replace(/\s+/g, '') === cleanTermNoSpace || uName === term;
        });

        if (matched) {
          return res.json({
            success: true,
            companyId: cleanCompId,
            user: matched,
            fullData: compDb,
          });
        }
      }

      // Universal search across all stores
      const found = findUserAcrossAllCompanies(loginIdentifier, pin);
      if (found) {
        return res.json({
          success: true,
          companyId: found.companyId,
          user: found.user,
          fullData: found.fullData,
        });
      }

      res.status(401).json({ success: false, error: 'Login yoki parol xato.' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Get Users endpoint (Scoped to Company)
  app.get('/api/users', (req, res) => {
    try {
      const companyId = extractCompanyId(req);
      const db = loadCompanyDatabase(companyId);
      res.json({ success: true, companyId, users: db.users || [] });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Delete User endpoint (Scoped to Company)
  app.delete('/api/users/:id', (req, res) => {
    try {
      const { id } = req.params;
      const companyId = extractCompanyId(req);
      const db = loadCompanyDatabase(companyId);
      db.users = (db.users || []).filter((u: any) => u.id !== id);
      saveCompanyDatabase(companyId, db);
      res.json({ success: true, companyId, users: db.users });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Force clean duplicates endpoint (Scoped to Company)
  app.post('/api/users/deduplicate', (req, res) => {
    try {
      const companyId = extractCompanyId(req);
      const db = loadCompanyDatabase(companyId);
      db.users = deduplicateUsers(db.users || []);
      saveCompanyDatabase(companyId, db);
      res.json({ success: true, companyId, users: db.users });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Factory Reset / Zero out all modules endpoint (Scoped to Company)
  app.post('/api/reset-all', (req, res) => {
    try {
      const companyId = extractCompanyId(req);
      const { resetSettings, resetEmployees, keepAdminId } = req.body || {};
      const db = loadCompanyDatabase(companyId);

      // Zero out all transactional & inventory data for this company
      db.products = [];
      db.categories = [];
      db.sales = [];
      db.customers = [];
      db.debtPayments = [];
      db.stockTransfers = [];
      db.expenses = [];
      db.partnerStores = [];
      db.partnerTransactions = [];
      db.suppliers = [];
      db.stockIntakes = [];
      db.supplierPayments = [];
      db.activityLogs = [];

      if (resetSettings) {
        db.settings = {
          companyId,
          storeName: "",
          storeLogoUrl: "",
          themeMode: "dark",
          accentColor: "amber",
          language: "uz",
          unitPreference: "dona",
          usdRate: 12800,
          telegramBotToken: "",
          telegramChatId: "",
          telegramChatIds: [],
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
      }

      if (resetEmployees) {
        if (keepAdminId && Array.isArray(db.users)) {
          db.users = db.users.filter((u: any) => u.id === keepAdminId || u.role === 'admin');
        }
        if (!db.users || db.users.length === 0) {
          db.users = [{
            id: `user-admin-${Date.now()}`,
            username: 'admin',
            name: 'Bosh Administrator',
            companyId,
            pin: '1234',
            role: 'admin',
            allowedTabs: ['dashboard', 'sotuv', 'dokon_ombor', 'kirim', 'sheriklar', 'mijozlar', 'sozlamalar'],
          }];
        }
      }

      db.resetTimestamp = new Date().toISOString();
      db.lastUpdated = new Date().toISOString();
      saveCompanyDatabase(companyId, db);
      res.json({ success: true, companyId, message: "Barcha bo'limlar ma'lumotlari 0 qilindi", data: db });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // AI Taxlilchi Endpoint
  app.post('/api/ai-analyst', async (req, res) => {
    try {
      const { prompt, storeData, model = 'gemini-2.5-flash' } = req.body;

      let aiClient;
      try {
        aiClient = getGeminiClient();
      } catch (err: any) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is not configured in settings.',
          message: err.message,
        });
      }

      const systemInstruction = `You are "AI Taxlilchi", a high-performance business analyst, sales forecaster, and universal AI Assistant powered by Google Gemini for this ERP Store and Warehouse Management System.

Key Directives:
1. UNIVERSAL ASSISTANT: You MUST answer ANY question asked by the user — including general knowledge, finance, marketing strategies, software/technology, mathematics, everyday advice, OR specific ERP store questions. NEVER refuse general queries outside the ERP system.
2. SALES ANALYTICS & FORECASTING: When asked about sales, revenue, profit, trends, comparison, or projections:
   - Compare TODAY's sales vs YESTERDAY's sales (revenue, profit, transaction count, payment methods).
   - Analyze daily averages and month-to-date performance.
   - Provide explicit projections/forecasts for TOMORROW's expected sales and net profit.
   - Provide explicit projected MONTH-END total revenue and net profit based on current run-rate.
   - Offer 2-3 high-impact, practical advice points to increase profit, optimize inventory, and recover customer debts.
3. FORMATTING: Use clean Markdown with emoji headers (e.g. 📊, 🔮, 💡, 📈, ⚠️) to make the analysis engaging and easy to read. Always respond in Uzbek language.

Context ERP Store & Sales Data:
${JSON.stringify(storeData, null, 2)}
`;

      const response = await aiClient.models.generateContent({
        model: model,
        contents: prompt || "Do'konimizning bugungi holati bo'yicha qisqa tahlil va maslahat bering.",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error('AI Analyst Error:', error);
      res.status(500).json({ error: 'AI tahlilida xatolik yuz berdi.', details: error.message });
    }
  });

  // Helper to extract clean chat ID array
  const parseChatIds = (chatId?: string, chatIds?: string[]): string[] => {
    const list: string[] = [];
    if (Array.isArray(chatIds)) {
      chatIds.forEach((id) => {
        const clean = String(id || '').trim();
        if (clean && !list.includes(clean)) list.push(clean);
      });
    }
    if (chatId) {
      String(chatId)
        .split(/[,;\n\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((clean) => {
          if (clean && !list.includes(clean)) list.push(clean);
        });
    }
    return list;
  };

  // Telegram Bot Test Endpoint (Multi-recipient support)
  app.post('/api/telegram-test', async (req, res) => {
    try {
      const { botToken, chatId, chatIds, message } = req.body;
      const targetIds = parseChatIds(chatId, chatIds);

      if (!botToken || targetIds.length === 0) {
        return res.status(400).json({ error: 'Bot Token va kamida bitta Chat ID kiritilishi shart.' });
      }

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const text = message || '🤖 <b>ERP Tizimi:</b> Telegram Bot muvaffaqiyatli ulandi va xabarlar qabul qilishga tayyor!';

      const results = await Promise.allSettled(
        targetIds.map(async (id) => {
          const resp = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: id,
              text,
              parse_mode: 'HTML',
            }),
          });
          const json = await resp.json();
          return { chatId: id, ok: json.ok, description: json.description };
        })
      );

      const successful = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        res.json({
          success: true,
          message: `${successful} ta ID ga sinov xabari yuborildi!${failed > 0 ? ` (${failed} tasida xatolik)` : ''}`,
          details: results,
        });
      } else {
        const firstError = results.find((r) => r.status === 'fulfilled' && !r.value.ok) as any;
        res.status(400).json({
          success: false,
          error: firstError?.value?.description || 'Telegram xabari yuborilmadi. Token yoki IDlarni tekshiring.',
          details: results,
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Telegram botga ulanib bo\'lmadi.', details: error.message });
    }
  });

  // Telegram Automatic Sale Notification Endpoint
  app.post('/api/telegram-notify-sale', async (req, res) => {
    try {
      const { botToken, chatId, chatIds, sale, storeName } = req.body;
      const targetIds = parseChatIds(chatId, chatIds);

      if (!botToken || targetIds.length === 0 || !sale) {
        return res.status(400).json({ error: 'Bot Token, Chat ID va Sotuv ma\'lumotlari kerak.' });
      }

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      // Build beautiful HTML sale receipt for Telegram
      const storeTitle = storeName || 'Do\'konimiz';
      const saleNo = sale.saleNumber || `#ORD-${sale.id ? String(sale.id).slice(-6) : '001'}`;
      const cashier = sale.cashierName || 'Kassir';
      const customer = sale.customerName ? `👤 <b>Mijoz:</b> ${sale.customerName}\n` : '';
      const dateStr = sale.date ? new Date(sale.date).toLocaleString('uz-UZ') : new Date().toLocaleString('uz-UZ');

      let paymentMethodStr = 'Naqd';
      if (sale.paymentType === 'karta') paymentMethodStr = 'Plastik Karta';
      else if (sale.paymentType === 'nasiya') paymentMethodStr = 'Nasiya (Qarz)';
      else if (sale.paymentType === 'aralash') {
        paymentMethodStr = `Aralash (Naqd: ${(sale.cashAmount || 0).toLocaleString()} so'm, Karta: ${(sale.cardAmount || 0).toLocaleString()} so'm${sale.nasiyaAmount > 0 ? `, Nasiya: ${(sale.nasiyaAmount).toLocaleString()} so'm` : ''})`;
      }

      let itemsListStr = '';
      if (Array.isArray(sale.items) && sale.items.length > 0) {
        itemsListStr = sale.items
          .map((it: any, idx: number) => {
            const unit = it.unitType || 'dona';
            const price = Number(it.price || it.priceUzs || it.salePrice || 0).toLocaleString();
            const total = Number(it.total || it.totalUzs || it.totalAmountUzs || (it.quantity * (it.salePrice || 0)) || 0).toLocaleString();
            return `  ${idx + 1}. <b>${it.productName || 'Tovar'}</b> (${it.model || 'model'})\n     └ ${it.quantity} ${unit} × ${price} = <b>${total} UZS</b>`;
          })
          .join('\n');
      } else {
        itemsListStr = '  • Tovarlar ma\'lumoti mavjud';
      }

      const totalUzs = Number(sale.totalAmount || sale.totalAmountUzs || 0).toLocaleString();
      const debtNote = sale.nasiyaAmount > 0 ? `\n⚠️ <b>Nasiya (Qarz):</b> ${Number(sale.nasiyaAmount).toLocaleString()} UZS` : '';

      const messageText = `🛒 <b>YANGI SOTUV BO'LDI!</b>
━━━━━━━━━━━━━━━━━━━
🏬 <b>Do'kon:</b> ${storeTitle}
🧾 <b>Chek:</b> <code>${saleNo}</code>
👨‍💼 <b>Kassir:</b> ${cashier}
${customer}📅 <b>Vaqt:</b> ${dateStr}

📦 <b>Sotilgan tovarlar:</b>
${itemsListStr}
━━━━━━━━━━━━━━━━━━━
💰 <b>JAMI: ${totalUzs} UZS</b>
💳 <b>To'lov:</b> ${paymentMethodStr}${debtNote}
━━━━━━━━━━━━━━━━━━━
✅ <i>ERP tizimi orqali avtomatik yuborildi</i>`;

      // Dispatch to all chat IDs concurrently
      const results = await Promise.allSettled(
        targetIds.map(async (id) => {
          const resp = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: id,
              text: messageText,
              parse_mode: 'HTML',
            }),
          });
          const json = await resp.json();
          return { chatId: id, ok: json.ok, description: json.description };
        })
      );

      res.json({ success: true, results });
    } catch (error: any) {
      console.error('Telegram Sale Notification Error:', error);
      res.status(500).json({ error: 'Telegram xabarini yuborishda xatolik.', details: error.message });
    }
  });

  // Explicit public folder serving for icons & manifest
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
