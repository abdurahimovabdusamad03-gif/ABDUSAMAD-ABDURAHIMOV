import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { translations } from '../translations';
import { QRCodeSVG } from 'qrcode.react';
import {
  Settings,
  Sun,
  Moon,
  Store,
  Upload,
  Users,
  Globe,
  Send,
  Printer,
  Save,
  CheckCircle,
  Lock,
  Plus,
  Shield,
  ShieldCheck,
  Layers,
  DollarSign,
  LogOut,
  UserCheck,
  User as UserIcon,
  X,
  Edit2,
  Trash2,
  Eye,
  Phone,
  FileText,
  Palette,
  Check,
  Barcode,
  ChevronRight,
  Copy,
  Share2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Download,
  RefreshCw,
  Smartphone,
  ArrowUpCircle,
  Zap,
  BellRing,
} from 'lucide-react';
import { BarcodeSvg } from '../components/BarcodePrintModal';
import { ReceiptPrinterModal } from '../components/ReceiptPrinterModal';
import { Language, ThemeMode, UserRole, NavTab, User, Sale } from '../types';

export const SozlamalarView: React.FC = () => {
  const {
    settings,
    updateSettings,
    users,
    products,
    sales,
    customers,
    expenses,
    suppliers,
    stockIntakes,
    partnerStores,
    addUser,
    updateUser,
    deleteUser,
    cleanDuplicateUsers,
    currentUser,
    logout,
    promoteToAdmin,
    clearAllDatabaseData,
  } = useERP();
  const t = translations[settings.language || 'uz'];

  // Store profile form
  const [storeName, setStoreName] = useState(settings.storeName);
  const [partnerTabName, setPartnerTabName] = useState(settings.partnerTabName || "Sherik Do'konlar");
  const [storeLogoUrl, setStoreLogoUrl] = useState(settings.storeLogoUrl);
  const [usdRate, setUsdRate] = useState<number>(settings.usdRate || 12800);

  // Telegram bot form
  const [botToken, setBotToken] = useState(settings.telegramBotToken || '');
  const [chatId, setChatId] = useState(settings.telegramChatId || '');
  const [chatIds, setChatIds] = useState<string[]>(() => {
    if (settings.telegramChatIds && Array.isArray(settings.telegramChatIds) && settings.telegramChatIds.length > 0) {
      return settings.telegramChatIds.filter(Boolean);
    }
    if (settings.telegramChatId && settings.telegramChatId.trim()) {
      return [settings.telegramChatId.trim()];
    }
    return [];
  });
  const [newChatIdInput, setNewChatIdInput] = useState('');
  const [autoNotify, setAutoNotify] = useState(settings.telegramAutoNotify !== false);
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // XPrinter & Chek Customizer
  const [xprinterName, setXprinterName] = useState(settings.xprinterName);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(settings.xprinterPaperWidth);
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [receiptAddress, setReceiptAddress] = useState(settings.receiptAddress);
  const [receiptPhone, setReceiptPhone] = useState(settings.receiptPhone);
  const [receiptPhone2, setReceiptPhone2] = useState(settings.receiptPhone2 || '');
  const [receiptCustomNote, setReceiptCustomNote] = useState(settings.receiptCustomNote || '');
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(settings.showLogoOnReceipt);
  const [telegramChannelLink, setTelegramChannelLink] = useState(
    settings.telegramChannelLink || 'https://t.me/+KexajQhWkoBmYTA6'
  );
  const [showTelegramQrOnReceipt, setShowTelegramQrOnReceipt] = useState(
    settings.showTelegramQrOnReceipt !== false
  );

  // Barcode Label Printer Settings State
  const [barcodeLabelWidth, setBarcodeLabelWidth] = useState<'58x40mm' | '50x30mm' | '40x30mm' | '58x60mm'>(
    settings.barcodeLabelWidth || '58x40mm'
  );
  const [barcodeShowStoreName, setBarcodeShowStoreName] = useState<boolean>(
    settings.barcodeShowStoreName !== false
  );
  const [barcodeShowProductName, setBarcodeShowProductName] = useState<boolean>(
    settings.barcodeShowProductName !== false
  );
  const [barcodeShowModel, setBarcodeShowModel] = useState<boolean>(
    settings.barcodeShowModel !== false
  );
  const [barcodeShowPrice, setBarcodeShowPrice] = useState<boolean>(
    settings.barcodeShowPrice !== false
  );
  const [barcodeShowQuantityMeters, setBarcodeShowQuantityMeters] = useState<boolean>(
    settings.barcodeShowQuantityMeters !== false
  );
  const [barcodeShowCodeNumber, setBarcodeShowCodeNumber] = useState<boolean>(
    settings.barcodeShowCodeNumber !== false
  );

  // Receipt, Barcode, and Theme Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [testSaleModal, setTestSaleModal] = useState<Sale | null>(null);

  const handleTestPrint = () => {
    const sampleSale: Sale = {
      id: 'test-sale-001',
      saleNumber: 'INV-2026-TEST',
      date: new Date().toISOString(),
      customerName: 'MIJOZ (SINOV CHEKI)',
      customerRegion: 'Toshkent shahri',
      cashierName: currentUser?.name || 'Administrator',
      customerPhone: '+998901234567',
      items: [
        {
          productId: 'p1',
          productName: 'Kafel Marble 60x60',
          model: 'Persian Classic',
          quantity: 20,
          unitType: 'metr',
          costPrice: 70000,
          salePrice: 85000,
          currency: 'UZS',
          totalAmountUzs: 1700000,
        },
        {
          productId: 'p2',
          productName: 'Parda Mato Silk',
          model: 'Royal Gold',
          quantity: 15,
          unitType: 'metr',
          costPrice: 60000,
          salePrice: 75000,
          currency: 'UZS',
          totalAmountUzs: 1125000,
        },
      ],
      currencyRate: 12500,
      totalCostUzs: 2300000,
      totalAmountUzs: 2825000,
      totalAmountUsd: 226,
      cashAmount: 2825000,
      cardAmount: 0,
      nasiyaAmount: 0,
      paymentType: 'naqd',
    };
    setTestSaleModal(sampleSale);
  };

  // User management modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetIncludeSettings, setResetIncludeSettings] = useState(true);
  const [resetIncludeEmployees, setResetIncludeEmployees] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [inviteUserModal, setInviteUserModal] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExecuteZeroReset = async () => {
    setIsResettingData(true);
    try {
      await clearAllDatabaseData({
        resetSettings: resetIncludeSettings,
        resetEmployees: resetIncludeEmployees,
      });

      if (resetIncludeSettings) {
        setStoreName('');
        setStoreLogoUrl('');
        setReceiptHeader('');
        setReceiptFooter('');
        setReceiptAddress('');
        setReceiptPhone('');
        setReceiptPhone2('');
        setReceiptCustomNote('');
        setBotToken('');
        setChatId('');
      }

      setShowResetModal(false);
      showToast("✅ Barcha bo'limlar va sozlamalar to'liq 0 qilindi!");
    } catch (err: any) {
      showToast("❌ Xatolik yuz berdi: " + (err.message || 'Reset amalga oshmadi'));
    } finally {
      setIsResettingData(false);
    }
  };

  // App Update & PWA Modal States
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [currentAppVersion, setCurrentAppVersion] = useState<string>(() => {
    return localStorage.getItem('erp_app_version') || 'v2.5.0';
  });

  const handleCheckUpdates = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setShowUpdateModal(true);
    }, 600);
  };

  const handleApplyUpdate = () => {
    localStorage.setItem('erp_app_version', 'v2.5.0');
    sessionStorage.removeItem('erp_splash_seen'); // Clear splash screen session flag to replay animation
    showToast("🚀 Tizim muvaffaqiyatli yangilandi! Splash screen bilan qayta yuklanmoqda...");
    setTimeout(() => {
      window.location.reload();
    }, 900);
  };

  const handleCopyAppLink = () => {
    const link = window.location.origin;
    navigator.clipboard.writeText(link);
    showToast("📋 Asosiy havola nusxalandi: " + link);
  };

  const handleCopyRegisterLink = () => {
    const link = window.location.origin + '?register=1';
    navigator.clipboard.writeText(link);
    showToast("📋 Yangi do'kon ochish (Ro'yxatdan o'tish) havolasi nusxalandi!");
  };

  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('cashier');
  const [formAllowedTabs, setFormAllowedTabs] = useState<NavTab[]>([
    'dashboard',
    'sotuv',
    'mijozlar',
  ]);

  const allTabsList: Array<{ id: NavTab; label: string }> = [
    { id: 'dashboard', label: 'Dashboard (Boshqaruv)' },
    { id: 'sotuv', label: 'Sotuv (Kassa)' },
    { id: 'dokon_ombor', label: "Do'kon & Ombor" },
    { id: 'kirim', label: "Kirim (Postavka & Partiyalar)" },
    { id: 'sheriklar', label: partnerTabName || "Sherik Do'konlar (Oldi-Berdi)" },
    { id: 'mijozlar', label: 'Mijozlar & Qarzdorlar' },
    { id: 'sozlamalar', label: 'Sozlamalar' },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormName(user.name);
      setFormUsername(user.username);
      setFormPhone(user.phone || '+998 ');
      setFormPin(user.pin);
      setFormRole(user.role);
      setFormAllowedTabs(user.allowedTabs || ['dashboard', 'sotuv', 'mijozlar']);
    } else {
      setEditingUser(null);
      setFormName('');
      setFormUsername('');
      setFormPhone('+998 ');
      setFormPin('');
      setFormRole('cashier');
      setFormAllowedTabs(['dashboard', 'sotuv', 'mijozlar']);
    }
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = formUsername.trim().toLowerCase().replace(/\s+/g, '').replace(/^@+/, '');
    const cleanPhone = formPhone.trim();
    const cleanPhoneDigits = cleanPhone.replace(/\D/g, '');
    const cleanPhoneLast7 = cleanPhoneDigits.length >= 7 ? cleanPhoneDigits.slice(-7) : '';

    if (!formName.trim() || !cleanUsername || !formPin.trim()) {
      showToast("⚠️ Iltimos, ism, login va parolni kiriting!");
      return;
    }

    // Check if another user already has the exact username or phone number
    const duplicateUser = users.find((u) => {
      if (editingUser && u.id === editingUser.id) return false;
      const uUsername = (u.username || '').trim().toLowerCase().replace(/\s+/g, '').replace(/^@+/, '');
      const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
      const uPhoneLast7 = uPhoneDigits.length >= 7 ? uPhoneDigits.slice(-7) : '';

      if (cleanUsername && uUsername && cleanUsername === uUsername) return true;
      if (cleanPhoneLast7 && uPhoneLast7 && cleanPhoneLast7 === uPhoneLast7) return true;
      return false;
    });

    if (duplicateUser && !editingUser) {
      showToast(`⚠️ Ushbu login (@${cleanUsername}) yoki telefon raqamli xodim allaqachon mavjud!`);
      return;
    }

    let savedUserObj: User;

    if (editingUser) {
      savedUserObj = {
        ...editingUser,
        name: formName.trim(),
        username: cleanUsername,
        phone: cleanPhone,
        pin: formPin.trim(),
        role: formRole,
        allowedTabs: formAllowedTabs,
      };
      updateUser(editingUser.id, savedUserObj);
      showToast("✅ Xodim ma'lumotlari tahrirlandi!");
    } else {
      savedUserObj = {
        id: `user-${Date.now()}`,
        name: formName.trim(),
        username: cleanUsername,
        phone: cleanPhone,
        pin: formPin.trim(),
        role: formRole,
        allowedTabs: formAllowedTabs,
      };
      addUser(savedUserObj);
      showToast("✅ Yangi xodim muvaffaqiyatli qo'shildi!");
    }
    setShowUserModal(false);

    // Open invite & SMS modal automatically for this user
    setInviteUserModal(savedUserObj);
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (users.length <= 1) {
      showToast("⚠️ So'nggi foydalanuvchini o'chirib bo'lmaydi!");
      return;
    }
    setShowUserModal(false);
    setUserToDelete({ id: userId, name });
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    if (users.length <= 1) {
      showToast("⚠️ So'nggi foydalanuvchini o'chirib bo'lmaydi!");
      setUserToDelete(null);
      return;
    }
    deleteUser(userToDelete.id);
    showToast(`🗑️ ${userToDelete.name} profili tizimdan muvaffaqiyatli o'chirildi!`);
    setUserToDelete(null);
    setShowUserModal(false);
  };

  const toggleAllowedTab = (tab: NavTab) => {
    if (formAllowedTabs.includes(tab)) {
      setFormAllowedTabs(formAllowedTabs.filter((t) => t !== tab));
    } else {
      setFormAllowedTabs([...formAllowedTabs, tab]);
    }
  };

  // Logo upload handler (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setStoreLogoUrl(base64);
        updateSettings({ storeLogoUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddChatId = () => {
    const clean = newChatIdInput.trim();
    if (!clean) return;
    if (chatIds.includes(clean)) {
      showToast("⚠️ Ushbu Chat ID allaqachon qo'shilgan!");
      return;
    }
    const updated = [...chatIds, clean];
    setChatIds(updated);
    setChatId(updated[0] || '');
    setNewChatIdInput('');
  };

  const handleRemoveChatId = (idToRemove: string) => {
    const updated = chatIds.filter((id) => id !== idToRemove);
    setChatIds(updated);
    setChatId(updated[0] || '');
  };

  // Test Telegram Connection
  const handleTestTelegram = async () => {
    const effectiveChatIds = chatIds.length > 0 ? chatIds : (chatId ? [chatId] : []);
    if (!botToken || effectiveChatIds.length === 0) {
      showToast("⚠️ Iltimos, Bot Token va kamida 1 ta Chat ID kiriting!");
      return;
    }

    setTelegramTesting(true);
    setTelegramStatus(null);

    try {
      const response = await fetch('/api/telegram-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken,
          chatId: effectiveChatIds[0],
          chatIds: effectiveChatIds,
          message: `🤖 <b>ERP System: Telegram Bot muvaffaqiyatli ulandi!</b>\n🏪 Do'kon: <b>${storeName || "Asosiy Do'kon"}</b>\n⏰ Vaqt: <b>${new Date().toLocaleTimeString()}</b>\n✅ Test xabari ${effectiveChatIds.length} ta manzilga yuborildi.`,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTelegramStatus(`✅ Ulanish muvaffaqiyatli! ${data.results?.length || effectiveChatIds.length} ta manzilga test xabari yuborildi.`);
        showToast("✅ Test xabari Telegram'ga yuborildi!");
      } else {
        setTelegramStatus(`❌ Xatolik: ${data.error || 'Telegram ulanmadi.'}`);
      }
    } catch (err: any) {
      setTelegramStatus(`❌ Server xatoligi: ${err.message}`);
    } finally {
      setTelegramTesting(false);
    }
  };

  const handleSaveTelegramSettings = () => {
    const effectiveChatIds = chatIds.length > 0 ? chatIds : (chatId ? [chatId] : []);
    updateSettings({
      telegramBotToken: botToken,
      telegramChatId: effectiveChatIds[0] || '',
      telegramChatIds: effectiveChatIds,
      telegramAutoNotify: autoNotify,
    });
    showToast("💾 Telegram Bot sozlamalari saqlandi!");
    setIsTelegramModalOpen(false);
  };

  // Save All Settings
  const handleSaveSettings = () => {
    const effectiveChatIds = chatIds.length > 0 ? chatIds : (chatId ? [chatId] : []);
    updateSettings({
      storeName,
      partnerTabName,
      storeLogoUrl,
      usdRate,
      telegramBotToken: botToken,
      telegramChatId: effectiveChatIds[0] || '',
      telegramChatIds: effectiveChatIds,
      telegramAutoNotify: autoNotify,
      xprinterName,
      xprinterPaperWidth: paperWidth,
      receiptHeader,
      receiptFooter,
      receiptAddress,
      receiptPhone,
      receiptPhone2,
      receiptCustomNote,
      showLogoOnReceipt,
      telegramChannelLink,
      showTelegramQrOnReceipt,
      barcodeLabelWidth,
      barcodeShowStoreName,
      barcodeShowProductName,
      barcodeShowModel,
      barcodeShowPrice,
      barcodeShowQuantityMeters,
      barcodeShowCodeNumber,
      themeMode: settings.themeMode,
      accentColor: settings.accentColor,
      language: settings.language,
    });

    showToast("✅ Barcha sozlamalar muvaffaqiyatli saqlandi!");
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-3 sm:space-y-4 pb-20 max-w-5xl mx-auto text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* HEADER */}
      <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between gap-2 transition-colors">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{t.sozlamalar}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Tizim va chek sozlamalari</p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Saqlash</span>
        </button>
      </div>

      {/* 0. USER ACCOUNT & AUTHENTICATION */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">Profil & Hisob Boshqaruvi</h3>
          </div>
          {currentUser && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/30">
              ● Faol Seans
            </span>
          )}
        </div>

        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-base flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{currentUser.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 flex-wrap">
                  <span>@{currentUser.username}</span>
                  <span>•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-black uppercase tracking-wide">
                    {currentUser.role === 'admin' ? 'GLAVNIY ADMIN' : currentUser.role === 'warehouse_manager' ? 'OMBORCHI' : 'KASSIR'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {currentUser.role !== 'admin' && (
                <button
                  onClick={() => promoteToAdmin()}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                  title="Admin darajasiga o'tish"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Qilish</span>
                </button>
              )}

              <button
                onClick={logout}
                className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-lg shadow-rose-500/25 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                title="Tizimdan chiqish"
              >
                <LogOut className="w-4 h-4" />
                <span>Chiqish</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>Seans ochilmagan</span>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs active:scale-95 transition-all"
            >
              Kirish
            </button>
          </div>
        )}
      </div>

      {/* APP LINK & UPDATE SECTION (COMPACT) */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 shrink-0 relative">
            <Sparkles className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white">App Link & Versiya</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                {currentAppVersion}
              </span>
            </div>
            <div className="text-[11px] font-mono text-amber-600 dark:text-amber-300 font-bold truncate">
              {window.location.origin}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleCopyRegisterLink}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
            title="Yangi odamga yuborish uchun maxsus ro'yxatdan o'tish havolasini nusxalash"
          >
            <UserIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Ro'yxatdan O'tish Linki</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAppLink}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
            title="Asosiy havola"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Link</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPwaModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-600 dark:text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
            title="Telefonga o'rnatish"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span>O'rnatish</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUpdateModal(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {/* 1. ADMIN PANEL - XODIMLAR */}
      {isAdmin && (
        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Xodimlar ({users.length})</h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  cleanDuplicateUsers();
                  showToast("🧹 Dublikat foydalanuvchilar tozalandi va birlashtirildi!");
                }}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shrink-0"
                title="Bir xil login, nomer yoki ismli foydalanuvchilarni tozalash"
              >
                <RefreshCw className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                <span>Tozalash</span>
              </button>

              <button
                onClick={() => handleOpenUserModal()}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>+ Xodim</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-2 sm:p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-1.5 text-xs transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs truncate">
                      <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-500 dark:text-amber-400 text-[10px] flex items-center justify-center shrink-0 font-black relative">
                        {u.name.charAt(0)}
                        {u.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                        )}
                      </span>
                      <span className="truncate">{u.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {u.isOnline ? (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>Online</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 shrink-0">
                          Offline
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-100 dark:bg-slate-700 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-slate-600 shrink-0">
                        {u.role === 'admin' ? 'ADMIN' : u.role === 'warehouse_manager' ? 'OMBORCHI' : 'KASSIR'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Login: <strong className="text-slate-800 dark:text-slate-200">@{u.username}</strong></span>
                    <span>Tel: <strong className="text-sky-600 dark:text-sky-300">{u.phone || 'Kiritilmagan'}</strong></span>
                    <span>PIN: <strong className="text-amber-600 dark:text-amber-300">{u.pin}</strong></span>
                  </div>

                  {/* Allowed tabs list */}
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1">
                    {u.allowedTabs && u.allowedTabs.length > 0 ? (
                      u.allowedTabs.map((tab) => (
                        <span
                          key={tab}
                          className="px-1 py-0.5 rounded text-[8px] font-bold bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300"
                        >
                          {allTabsList.find((t) => t.id === tab)?.label.split(' ')[0] || tab}
                        </span>
                      ))
                    ) : (
                      <span className="text-[8px] text-rose-500 dark:text-rose-400 font-bold">Ruxsat yo'q</span>
                    )}
                  </div>
                </div>

                {/* Invite/SMS, Edit & Delete */}
                <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-200 dark:border-slate-700/60">
                  <button
                    onClick={() => setInviteUserModal(u)}
                    className="px-2 py-1 rounded bg-sky-500/10 dark:bg-sky-500/20 hover:bg-sky-500/20 dark:hover:bg-sky-500/30 text-sky-600 dark:text-sky-300 border border-sky-500/20 dark:border-sky-500/30 text-[10px] font-extrabold flex items-center gap-1 active:scale-95 transition-all"
                    title="Xodimga SMS yoki Telegram orqali kirish havolasini yuborish"
                  >
                    <Send className="w-2.5 h-2.5 text-sky-500 dark:text-sky-400" />
                    <span>SMS / Link</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenUserModal(u)}
                      className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                      <span>Tahrirlash</span>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="px-2 py-1 rounded bg-rose-500/10 dark:bg-rose-500/20 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-rose-500 dark:text-rose-400" />
                      <span>O'chirish</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. CHEK, BARKOD, TIZIM MAVZUSI VA TELEGRAM BOT SOZLAMALARI TUGMALARI (KOMPAKT KARTALAR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* CHEK VA PRINTER SOZLAMALARI TUGMASI */}
        <button
          type="button"
          onClick={() => setIsReceiptModalOpen(true)}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all active:scale-[0.98] group shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors truncate">
                Chek va Printer
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                {paperWidth} • {showLogoOnReceipt ? "Logo bor" : "Logo yo'q"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black border border-amber-500/20 uppercase">
              {paperWidth}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors" />
          </div>
        </button>

        {/* BARKOD VA STIKER SOZLAMALARI TUGMASI */}
        <button
          type="button"
          onClick={() => setIsBarcodeModalOpen(true)}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all active:scale-[0.98] group shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shrink-0">
              <Barcode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors truncate">
                Barkod va Stiker
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                {barcodeLabelWidth} • Stiker
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black border border-amber-500/20">
              {barcodeLabelWidth}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors" />
          </div>
        </button>

        {/* TIZIM MAVZUSI VA RANG SOZLAMALARI TUGMASI */}
        <button
          type="button"
          onClick={() => setIsThemeModalOpen(true)}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all active:scale-[0.98] group shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors truncate">
                Tizim Mavzusi
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                {settings.themeMode === 'light' ? 'Kunduzi' : settings.themeMode === 'dark' ? 'Tungi' : 'Avto'} • {settings.accentColor || 'amber'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black border border-amber-500/20 uppercase">
              {settings.themeMode === 'light' ? 'Kunduzi' : settings.themeMode === 'dark' ? 'Tungi' : 'Avto'}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors" />
          </div>
        </button>

        {/* TELEGRAM BOT ULASH TUGMASI */}
        <button
          type="button"
          onClick={() => setIsTelegramModalOpen(true)}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 flex items-center justify-between text-left transition-all active:scale-[0.98] group shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-slate-950 transition-all shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors truncate">
                Telegram Bot Ulash
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                {botToken ? `${chatIds.length || 1} ta ID ulangan` : "Token & ID ulash"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <span className={`text-[9px] px-2 py-0.5 rounded-md font-black border uppercase ${
              botToken ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
            }`}>
              {botToken ? 'Ulangan' : 'Ulanmagan'}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-sky-500 transition-colors" />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* USD Rate */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5 transition-colors">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Dollar Kursi (1 USD)</span>
          </h3>
          <div className="relative">
            <input
              type="number"
              value={usdRate}
              onChange={(e) => setUsdRate(Number(e.target.value))}
              className="w-full pl-7 pr-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-amber-500"
            />
            <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Language */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5 transition-colors">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Til</span>
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'uz', label: "O'zbek" },
              { id: 'ru', label: "Русский" },
              { id: 'en', label: "English" },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => updateSettings({ language: lang.id as Language })}
                className={`py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                  settings.language === lang.id
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. RESET ALL DATA (HAMMA MALUMOTLARNI VA BOLIMLARNI 0 QILISH) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/30 border border-rose-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-rose-200 flex items-center gap-2">
              <span>Tizimni va Barcha Bo'limlarni 0 Qilish</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">To'liq Reset</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Ombor, do'kon, sotuvlar, mijozlar, qarzlar, kirimlar, xarajatlar va sheriklar — barcha bo'limlarni bir bosishda 0 qiladi.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          <span>Barchasini 0 Qilish</span>
        </button>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  Rostdan ham barcha bo'limlarni 0 qilmoqchimisiz?
                </h3>
                <p className="text-[11px] text-rose-300 mt-0.5 font-medium">
                  Ushbu amal barcha bo'limlardagi ma'lumotlarni tozalaydi va ortga qaytarib bo'lmaydi!
                </p>
              </div>
            </div>

            {/* Current Active Data Snapshot */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                <span>Hozirda tizimdagi ma'lumotlar:</span>
                <span className="text-[10px] font-bold text-slate-400">Hammasi 0 bo'ladi</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">📦 Tovarlar</span>
                  <span className="font-extrabold text-rose-400">{products.length} ta</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">💰 Sotuvlar</span>
                  <span className="font-extrabold text-rose-400">{sales.length} ta</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">👥 Mijozlar</span>
                  <span className="font-extrabold text-rose-400">{customers.length} ta</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">📥 Kirimlar</span>
                  <span className="font-extrabold text-rose-400">{stockIntakes.length} ta</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">🏭 Ta'minotchilar</span>
                  <span className="font-extrabold text-rose-400">{suppliers.length} ta</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">💸 Xarajatlar</span>
                  <span className="font-extrabold text-rose-400">{expenses.length} ta</span>
                </div>
              </div>
            </div>

            {/* List of Affected Sections */}
            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-[11px] space-y-1 text-slate-300">
              <div className="font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>To'liq 0 qilinadigan bo'limlar:</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-slate-300 list-disc list-inside">
                <li>Ombor & Do'kondagi barcha tovarlar</li>
                <li>Barcha sotuvlar va cheklar tarixi</li>
                <li>Mijozlar ro'yxati va nasiya qarzlar</li>
                <li>Kirim partiyalari va qabullar</li>
                <li>Ta'minotchilar va to'lovlar</li>
                <li>Barcha xarajatlar va chiqimlar</li>
                <li>Sherik do'konlar oldi-berdisi</li>
                <li>Xabarnomalar va o'tkazmalar</li>
              </ul>
            </div>

            {/* Additional Reset Options Checkboxes */}
            <div className="space-y-2 pt-1 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all select-none">
                <input
                  type="checkbox"
                  checked={resetIncludeSettings}
                  onChange={(e) => setResetIncludeSettings(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0"
                />
                <div>
                  <div className="font-bold text-white text-[11px]">Sozlamalarni ham 0 qilish</div>
                  <div className="text-[10px] text-slate-400">Do'kon nomi, chek va printer sozlamalari tozalanadi</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all select-none">
                <input
                  type="checkbox"
                  checked={resetIncludeEmployees}
                  onChange={(e) => setResetIncludeEmployees(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0"
                />
                <div>
                  <div className="font-bold text-white text-[11px]">Xodimlarni ham tozalash</div>
                  <div className="text-[10px] text-slate-400">Boshqa xodimlar profili o'chiriladi, faqat asosiy admin qoladi</div>
                </div>
              </label>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isResettingData}
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                Bekor Qilish
              </button>
              <button
                type="button"
                disabled={isResettingData}
                onClick={handleExecuteZeroReset}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isResettingData ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>0 qilinmoqda...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ha, Barcha Bo'limlarni 0 Qilish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER MODAL (ADD / EDIT EMPLOYEE) */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full h-[92dvh] sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col min-h-0 text-slate-100 overflow-hidden">
            
            {/* Header */}
            <div className="shrink-0 p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{editingUser ? "Xodimni Tahrirlash" : "Yangi Xodim Biriktirish"}</span>
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveUser} className="p-3 sm:p-4 overflow-y-auto space-y-3 text-xs flex-1">
              <div>
                <label className="block text-slate-300 font-bold mb-1 text-[11px]">Xodim Ism Familiyasi</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masalan: Sardor Rahimov"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 text-[11px] flex items-center justify-between">
                  <span>Telefon Raqami (SMS yuborish uchun)</span>
                  <span className="text-[10px] text-amber-400 font-semibold">+998 ...</span>
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sky-300 font-bold text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 text-[11px]">Login (Username)</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="kassir1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 text-[11px]">Parol / PIN</label>
                  <input
                    type="text"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 text-[11px]">Roli (Lavozimi)</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:outline-none"
                >
                  <option value="admin">Administrator (Boshqaruvchi)</option>
                  <option value="cashier">Kassir (Sotuvchi)</option>
                  <option value="warehouse_manager">Omborchi (Ombor Mudiri)</option>
                </select>
              </div>

              {/* ALLOWED TABS (Dostup) */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-amber-400 font-black mb-1.5 text-[11px]">
                  Ruxsat Berilgan Bo'limlar (Dostup):
                </label>
                <div className="space-y-1.5">
                  {allTabsList.map((tab) => {
                    const isChecked = formAllowedTabs.includes(tab.id);
                    return (
                      <label
                        key={tab.id}
                        onClick={() => toggleAllowedTab(tab.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="shrink-0 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {editingUser ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(editingUser.id, editingUser.name)}
                    className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Profilni O'chirish</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all"
                  >
                    Saqlash
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* INVITE & SMS MODAL */}
      {inviteUserModal && (() => {
        const origin = window.location.origin + window.location.pathname;
        const adminPhone = settings.receiptPhone || currentUser?.phone || currentUser?.username || 'admin';
        const storeName = settings.storeName || '';
        const tabsStr = inviteUserModal.allowedTabs && inviteUserModal.allowedTabs.length > 0 ? inviteUserModal.allowedTabs.join(',') : '';
        const directLoginUrl = `${origin}?u=${encodeURIComponent(inviteUserModal.username)}&p=${encodeURIComponent(inviteUserModal.pin)}&name=${encodeURIComponent(inviteUserModal.name)}&phone=${encodeURIComponent(inviteUserModal.phone || '')}&role=${encodeURIComponent(inviteUserModal.role || 'cashier')}&admin=${encodeURIComponent(adminPhone)}&store=${encodeURIComponent(storeName)}&tabs=${encodeURIComponent(tabsStr)}`;
        const phoneDigits = inviteUserModal.phone ? inviteUserModal.phone.replace(/\D/g, '') : '';
        const phoneFormatted = inviteUserModal.phone || 'Kiritilmagan';

        const inviteMessage = `📱 Assalomu alaykum, ${inviteUserModal.name}!
Sizga ${storeName ? `"${storeName}"` : 'ERP'} Tizimiga kirish ma'lumotlari berildi:

🔗 Kirish havolasi (Bir marta bosing):
${directLoginUrl}

👤 Login: ${inviteUserModal.username}${inviteUserModal.phone ? ` (${inviteUserModal.phone})` : ''}
🔑 Parol (PIN): ${inviteUserModal.pin}`;

        const handleSendSMS = () => {
          const smsUrl = `sms:${phoneDigits}?body=${encodeURIComponent(inviteMessage)}`;
          window.open(smsUrl, '_self');
          showToast("📱 SMS ilovasi ochilmoqda...");
        };

        const handleSendTelegram = () => {
          const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(directLoginUrl)}&text=${encodeURIComponent(inviteMessage)}`;
          window.open(tgUrl, '_blank');
          showToast("✈️ Telegram ulashish oynasi ochilmoqda...");
        };

        const handleCopyInvite = () => {
          navigator.clipboard.writeText(inviteMessage);
          showToast("✅ Taklifnoma va kirish havolasi nusxalandi!");
        };

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 text-slate-100">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Xodimga Kirish Ma'lumotlarini Yuborish</h3>
                    <p className="text-[11px] text-slate-400">SMS, Telegram yoki Nusxalash orqali jo'natish</p>
                  </div>
                </div>
                <button
                  onClick={() => setInviteUserModal(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User summary badge */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">{inviteUserModal.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {inviteUserModal.role}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                  <div>Login: <strong className="text-white">@{inviteUserModal.username}</strong></div>
                  <div>Parol (PIN): <strong className="text-amber-400">{inviteUserModal.pin}</strong></div>
                  <div className="col-span-2">Telefon: <strong className="text-sky-300">{phoneFormatted}</strong></div>
                </div>
              </div>

              {/* Message preview box */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Yuboriladigan SMS matni va Havola:</label>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-slate-300 text-[11px] font-mono whitespace-pre-wrap leading-relaxed select-all">
                  {inviteMessage}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendSMS}
                  className="p-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>SMS Yuborish</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendTelegram}
                  className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex flex-col items-center justify-center gap-1 border border-slate-700 active:scale-95 transition-all"
                >
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Nusxalash</span>
                </button>
              </div>

              {/* Tip box */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-normal">
                💡 <strong>Eslatma:</strong> Xodim ushbu SMS-dagi havolaga 1 marta bossa, telefonida ilova avtomatik ochilib, u tizimga darhol kiradi ("Login xato" muammosi bo'lmaydi).
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInviteUserModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Yopish
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Xodimni o'chirish</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                <strong className="text-rose-400 font-extrabold">{userToDelete.name}</strong> xodimi va uning barcha ruxsat profili tizimdan to'liq o'chiriladi. Tasdiqlaysizmi?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
              >
                Ha, O'chirilsin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[80] bg-slate-800/95 border border-amber-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-slideUp backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CHEK VA PRINTER SOZLAMALARI MODAL */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Chek va Printer Sozlamalari</h3>
                  <p className="text-[11px] text-slate-400">Do'kon ma'lumotlari, sarlavha, logo va chek namunasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-900">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Controls (Left) */}
                <div className="lg:col-span-7 space-y-3 text-xs">
                  {/* Store Name & Partner Section Name */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-0.5 text-[10px]">Do'kon Nomi</label>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Do'kon nomini kiriting..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-amber-400 font-bold mb-0.5 text-[10px]">Sherik Do'kon Bo'limi Nomi</label>
                      <input
                        type="text"
                        value={partnerTabName}
                        onChange={(e) => setPartnerTabName(e.target.value)}
                        placeholder="Sherik Do'konlar..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-amber-500/50 text-white font-bold text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-0.5 text-[10px]">Chek Yuqori Sarlavhasi</label>
                    <input
                      type="text"
                      value={receiptHeader}
                      onChange={(e) => setReceiptHeader(e.target.value)}
                      placeholder="Sarlavha..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Phones */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-0.5 text-[10px]">Telefon 1</label>
                      <input
                        type="text"
                        value={receiptPhone}
                        onChange={(e) => setReceiptPhone(e.target.value)}
                        placeholder="+998 90 ..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-0.5 text-[10px]">Telefon 2</label>
                      <input
                        type="text"
                        value={receiptPhone2}
                        onChange={(e) => setReceiptPhone2(e.target.value)}
                        placeholder="+998 91 ..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-0.5 text-[10px]">Manzil</label>
                    <input
                      type="text"
                      value={receiptAddress}
                      onChange={(e) => setReceiptAddress(e.target.value)}
                      placeholder="Manzilni kiriting..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Footers & Custom Note */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-0.5 text-[10px]">Chek Osti Yozuvi</label>
                      <input
                        type="text"
                        value={receiptFooter}
                        onChange={(e) => setReceiptFooter(e.target.value)}
                        placeholder="Xaridingiz uchun rahmat..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-0.5 text-[10px]">Eslatma / Kafolat</label>
                      <input
                        type="text"
                        value={receiptCustomNote}
                        onChange={(e) => setReceiptCustomNote(e.target.value)}
                        placeholder="Eslatma matni..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Telegram QR Link & Toggle */}
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-xs">Telegram Kanal QR-kodini Chekda Ko'rsatish</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showTelegramQrOnReceipt}
                          onChange={(e) => setShowTelegramQrOnReceipt(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {showTelegramQrOnReceipt && (
                      <div className="pt-2 border-t border-slate-700/60">
                        <label className="block text-slate-400 font-bold mb-1 text-[10px]">Telegram Kanal Linki (https://t.me/...)</label>
                        <input
                          type="text"
                          value={telegramChannelLink}
                          onChange={(e) => setTelegramChannelLink(e.target.value)}
                          placeholder="https://t.me/+KexajQhWkoBmYTA6"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Logo Toggle & Upload */}
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-xs">Chekda Logo Ko'rsatish</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showLogoOnReceipt}
                          onChange={(e) => setShowLogoOnReceipt(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {showLogoOnReceipt && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          {storeLogoUrl ? (
                            <img src={storeLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <Store className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <label className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold cursor-pointer flex items-center gap-1.5 border border-slate-600">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Logo Yuklash</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Paper Width Selection */}
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-[10px]">Printer Qog'oz Eni</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaperWidth('80mm')}
                        className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                          paperWidth === '80mm'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        80mm (Katta)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaperWidth('58mm')}
                        className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                          paperWidth === '58mm'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        58mm (Kichik)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Preview & Test Print (Right) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner relative overflow-x-auto">
                  <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-2 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chek Namunasi Live Preview</span>
                  </div>

                  <div
                    id="settings-receipt-preview"
                    className={`bg-white text-black p-4 font-mono shadow-lg border border-slate-300 rounded-sm ${
                      paperWidth === '58mm' ? 'w-[230px]' : 'w-[290px]'
                    }`}
                    style={{ color: '#000', backgroundColor: '#fff' }}
                  >
                    {/* Logo & Header */}
                    <div className="text-center mb-2 border-b-2 border-dashed border-black pb-2">
                      {showLogoOnReceipt && storeLogoUrl && (
                        <img
                          src={storeLogoUrl}
                          alt="Logo"
                          className="w-14 h-14 object-contain mx-auto mb-1"
                        />
                      )}
                      <div className="font-black text-base uppercase tracking-wide">
                        {receiptHeader || storeName || 'DO\'KON NOMI'}
                      </div>
                      {receiptAddress && (
                        <div className="text-xs font-bold text-black mt-0.5">{receiptAddress}</div>
                      )}
                      {receiptPhone && (
                        <div className="text-xs font-bold text-black">
                          Tel: {receiptPhone} {receiptPhone2 ? `| ${receiptPhone2}` : ''}
                        </div>
                      )}
                    </div>

                    {/* Sample Meta */}
                    <div className="mb-2 text-xs space-y-0.5 border-b-2 border-dashed border-black pb-2">
                      <div className="flex justify-between">
                        <span className="font-extrabold">CHEK №:</span>
                        <span className="font-black">#ORD-998</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-extrabold">Sana:</span>
                        <span className="font-bold">{new Date().toLocaleDateString('uz-UZ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-extrabold">Kassir:</span>
                        <span className="font-bold">{currentUser?.name || 'Kassir'}</span>
                      </div>
                    </div>

                    {/* Sample Items */}
                    <table className="w-full text-left text-xs mb-2 border-b-2 border-dashed border-black pb-2">
                      <thead>
                        <tr className="border-b-2 border-black font-black uppercase text-xs">
                          <th className="py-0.5">Tavar</th>
                          <th className="text-right py-0.5">Soni</th>
                          <th className="text-right py-0.5">Summa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/30">
                        <tr>
                          <td className="py-1 pr-1 font-extrabold text-xs">Kafel Marble</td>
                          <td className="text-right py-1 font-black text-xs whitespace-nowrap">20 m</td>
                          <td className="text-right py-1 font-black text-xs whitespace-nowrap">1,700,000</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-1 font-extrabold text-xs">Parda Mato</td>
                          <td className="text-right py-1 font-black text-xs whitespace-nowrap">15 m</td>
                          <td className="text-right py-1 font-black text-xs whitespace-nowrap">1,125,000</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Sample Totals */}
                    <div className="space-y-1 text-xs mb-2 border-b-2 border-dashed border-black pb-2">
                      <div className="flex justify-between font-black text-base">
                        <span>JAMI:</span>
                        <span>2,825,000 UZS</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs space-y-0.5">
                      <div className="font-black text-xs">{receiptFooter || 'Rahmat!'}</div>
                      {receiptCustomNote && (
                        <div className="text-xs font-bold text-black italic">{receiptCustomNote}</div>
                      )}
                    </div>

                    {/* Telegram QR Preview */}
                    {showTelegramQrOnReceipt && (
                      <div className="flex flex-col items-center justify-center pt-2 mt-2 border-t-2 border-dashed border-black">
                        <div className="p-1 bg-white border border-black rounded">
                          <QRCodeSVG
                            value={telegramChannelLink || 'https://t.me/+KexajQhWkoBmYTA6'}
                            size={paperWidth === '58mm' ? 75 : 90}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                        <div className="text-[11px] font-black uppercase text-black mt-1 text-center tracking-tight">
                          Telegram Kanalimizga A'zo Bo'ling!
                        </div>
                        <div className="text-[9px] font-bold text-gray-800 text-center tracking-tight">
                          {telegramChannelLink || 'https://t.me/+KexajQhWkoBmYTA6'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TEST PRINT BUTTON */}
                  <div className="mt-3 w-full">
                    <button
                      type="button"
                      onClick={handleTestPrint}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Sinov Cheki (Test Print)</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleSaveSettings();
                  setIsReceiptModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Saqlash va Yopish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARKOD VA STIKER SOZLAMALARI MODAL */}
      {isBarcodeModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Barcode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Barkod va Stiker Sozlamalari</h3>
                  <p className="text-[11px] text-slate-400">Termo-printer o'lchamlari va stikerda ko'rinuvchi maydonlar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-900">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Controls (Left) */}
                <div className="lg:col-span-7 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-[10px]">Stiker O'lchami</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: '58x40mm', name: '58 x 40 mm' },
                        { id: '50x30mm', name: '50 x 30 mm' },
                        { id: '40x30mm', name: '40 x 30 mm' },
                        { id: '58x60mm', name: '58 x 60 mm' },
                      ].map((sz) => (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => setBarcodeLabelWidth(sz.id as any)}
                          className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                            barcodeLabelWidth === sz.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {sz.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="block text-slate-300 font-bold text-[11px]">Stikerda Ko'rsatiladigan Elemental</label>
                    <div className="grid grid-cols-2 gap-2">
                      
                      {/* Store Name Toggle */}
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                        <span className="font-bold text-slate-300 text-[11px]">Do'kon Nomi</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={barcodeShowStoreName}
                            onChange={(e) => setBarcodeShowStoreName(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {/* Product Name Toggle */}
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                        <span className="font-bold text-slate-300 text-[11px]">Tovar Nomi</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={barcodeShowProductName}
                            onChange={(e) => setBarcodeShowProductName(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {/* Model Toggle */}
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                        <span className="font-bold text-slate-300 text-[11px]">Model</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={barcodeShowModel}
                            onChange={(e) => setBarcodeShowModel(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {/* Price Toggle */}
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                        <span className="font-bold text-slate-300 text-[11px]">Sotuv Narxi</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={barcodeShowPrice}
                            onChange={(e) => setBarcodeShowPrice(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {/* Meter/Quantity Toggle */}
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                        <span className="font-bold text-slate-300 text-[11px]">Rulon Metri / Hajmi</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={barcodeShowQuantityMeters}
                            onChange={(e) => setBarcodeShowQuantityMeters(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {/* Code Number Toggle */}
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                        <span className="font-bold text-slate-300 text-[11px]">Barkod Raqamlari</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={barcodeShowCodeNumber}
                            onChange={(e) => setBarcodeShowCodeNumber(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Live Preview (Right) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                  <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-2 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Stiker Namunasi Live Preview</span>
                  </div>

                  {/* Sticker Preview Card */}
                  <div
                    className={`bg-white text-black p-2 font-sans text-center rounded shadow-lg border border-slate-300 flex flex-col justify-between ${
                      barcodeLabelWidth === '50x30mm'
                        ? 'w-[180px] min-h-[110px]'
                        : barcodeLabelWidth === '40x30mm'
                        ? 'w-[150px] min-h-[105px]'
                        : barcodeLabelWidth === '58x60mm'
                        ? 'w-[210px] min-h-[170px]'
                        : 'w-[200px] min-h-[135px]'
                    }`}
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  >
                    {barcodeShowStoreName && (
                      <div className="font-black text-[9px] uppercase tracking-wide border-b border-black/30 pb-0.5 truncate">
                        {storeName || "DO'KON NOMI"}
                      </div>
                    )}

                    <div className="my-0.5 space-y-0.5">
                      {barcodeShowProductName && (
                        <div className="font-extrabold text-[10px] uppercase leading-tight truncate">
                          Gilam Premium Silk
                        </div>
                      )}
                      {barcodeShowModel && (
                        <div className="font-bold text-[8px] text-gray-700 truncate">
                          Model: Persian Classic 3x4
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-black border-t border-b border-black/20 my-0.5 py-0.5 px-1 bg-gray-50">
                      {barcodeShowQuantityMeters && (
                        <span className="bg-black text-white px-1 py-0.2 rounded text-[8px] font-mono">
                          Rulon #1: 35.5 metr
                        </span>
                      )}
                      {barcodeShowPrice && (
                        <span className="text-black font-extrabold text-[9px]">
                          140,000 UZS
                        </span>
                      )}
                    </div>

                    <div className="my-0.5 flex flex-col items-center justify-center overflow-hidden">
                      <BarcodeSvg
                        value="478000111001"
                        width={barcodeLabelWidth === '40x30mm' ? 1.0 : 1.2}
                        height={barcodeLabelWidth === '58x60mm' ? 40 : 25}
                        displayValue={barcodeShowCodeNumber}
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-[10px] text-slate-400 text-center font-medium leading-tight">
                    Stiker do'konga kelib tushgan tovarlar va har bir rulon/karobkaga alohida chop etiladi.
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleSaveSettings();
                  setIsBarcodeModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Saqlash va Yopish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIZIM MAVZUSI VA RANG SOZLAMALARI MODAL */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Tizim Mavzusi va Asosiy Rang</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Interfeys rejimi va ilovaning urg'u ranglarini tanlang</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-900 space-y-5">
              
              {/* Theme Mode Selector (Kunduzi / Tungi / Avto) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200">Mavzu Rejimi</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'light', label: 'Kunduzi (Light)', icon: Sun },
                    { id: 'dark', label: 'Tungi (Dark)', icon: Moon },
                    { id: 'auto', label: 'Avto (Tizim)', icon: Settings },
                  ].map((theme) => {
                    const Icon = theme.icon;
                    const isSelected = (settings.themeMode || 'dark') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          updateSettings({ themeMode: theme.id as ThemeMode });
                        }}
                        className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Picker */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Asosiy Urg'u Rangi (Accent Color)
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono uppercase">
                    Hozirgi: <strong className="text-amber-600 dark:text-amber-400">{settings.accentColor || 'amber'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-7 gap-2">
                  {[
                    { id: 'amber', name: 'Oltin', color: '#f59e0b', ring: 'ring-amber-400', bg: 'bg-amber-500' },
                    { id: 'emerald', name: 'Zümrad', color: '#10b981', ring: 'ring-emerald-400', bg: 'bg-emerald-500' },
                    { id: 'indigo', name: 'Siyohrang', color: '#6366f1', ring: 'ring-indigo-400', bg: 'bg-indigo-500' },
                    { id: 'blue', name: 'Okean', color: '#3b82f6', ring: 'ring-blue-400', bg: 'bg-blue-500' },
                    { id: 'rose', name: 'Yoqut', color: '#f43f5e', ring: 'ring-rose-400', bg: 'bg-rose-500' },
                    { id: 'purple', name: 'Binafsha', color: '#a855f7', ring: 'ring-purple-400', bg: 'bg-purple-500' },
                    { id: 'cyan', name: 'Firuza', color: '#06b6d4', ring: 'ring-cyan-400', bg: 'bg-cyan-500' },
                  ].map((item) => {
                    const isSelected = (settings.accentColor || 'amber') === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updateSettings({ accentColor: item.id })}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
                          isSelected
                            ? `bg-slate-100 dark:bg-slate-800 border-2 ${item.ring} shadow-md`
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full ${item.bg} flex items-center justify-center shadow-sm relative`}
                          style={{ backgroundColor: item.color }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-slate-950 font-black stroke-[3]" />}
                        </div>
                        <span className="text-[10px] font-bold truncate max-w-full">{item.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="pt-2 flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl border border-black/10 dark:border-white/20 shadow-inner shrink-0"
                      style={{ backgroundColor: settings.accentColor && settings.accentColor.startsWith('#') ? settings.accentColor : 'var(--accent-main, #f59e0b)' }}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Xohlagan Rangni Tanlash (Custom Palette)</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">HEX kod yoki palette g'ildiragi orqali</div>
                    </div>
                  </div>

                  <label className="relative cursor-pointer shrink-0">
                    <input
                      type="color"
                      value={settings.accentColor && settings.accentColor.startsWith('#') ? settings.accentColor : '#f59e0b'}
                      onChange={(e) => updateSettings({ accentColor: e.target.value })}
                      className="sr-only"
                    />
                    <span className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow active:scale-95 transition-all">
                      <Palette className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span>Rang Tanlash</span>
                    </span>
                  </label>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleSaveSettings();
                  setIsThemeModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Saqlash va Yopish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {testSaleModal && (
        <ReceiptPrinterModal
          sale={testSaleModal}
          onClose={() => setTestSaleModal(null)}
        />
      )}

      {/* CHANGELOG & APP UPDATE MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 text-slate-100 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Tizim Yangilanishi (v2.5.0)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Yangi
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Yangi xususiyatlar va optimallashtirishlar</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Whats New List */}
            <div className="space-y-2.5 text-xs">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                🎁 Nima yangiliklar kelgan?
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-100 font-bold block">1. Splash Screen Logo Animatsiyasi</strong>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Appga ochilib kirish vaqtida bosh ekranda Apple uslubidagi maxsus qora blok, apelsin rang doira va ERP Master savat belgisi animatsiyasi paydo bo'ldi.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800/60">
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-100 font-bold block">2. Xodimlarga SMS & Avto-Kirish Havolasi</strong>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Xodimlarni ro'yxatga olganda SMS yoki Telegram orqali 1 bosishda parolsiz avto-kiruvchi havola (link) yuborish tizimi joriy etildi.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800/60">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-100 font-bold block">3. PWA Mobil Dastur Rejimi</strong>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Dasturni Android, iPhone va Windows kompyuterlarga alohida programma ko'rinishida o'rnatish imkoniyati.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800/60">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-100 font-bold block">4. Chek Printer & QR Kodlar</strong>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      XPrinter kassa apparati uchun Telegram kanali QR kodli chek chop etish yaxshilandi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={handleApplyUpdate}
                className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>⚡️ Yangilanishni Qo'llash & Qayta Yuklash</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Yopish
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PWA / MOBILE APP LINK MODAL */}
      {showPwaModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 text-slate-100 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg border border-amber-500/30 p-0.5 bg-slate-950 shrink-0">
                  <img
                    src={settings.storeLogoUrl || '/icon-192.png'}
                    alt="ERP Master Logo"
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icon.png';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">ERP Master Mobil Ilova</h3>
                  <p className="text-[11px] text-amber-400 font-semibold">Telefonga rasmiy logo bilan o'rnatish</p>
                </div>
              </div>
              <button
                onClick={() => setShowPwaModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile App Icon Preview Badge */}
            <div className="p-3 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 rounded-2xl border border-amber-500/20 flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl border-2 border-amber-500/40 p-0.5 bg-slate-950 shrink-0 flex items-center justify-center">
                <img
                  src="/icon-192.png"
                  alt="App Icon"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>ERP Master App</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-extrabold">HD LOGO</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                  Xodimlar telefoniga qo'shganda ushbu maxsus oltin-to'q rangli app logotipi bilan chiqadi.
                </p>
              </div>
            </div>

            {/* Link & QR Code */}
            <div className="flex flex-col items-center justify-center space-y-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="p-3 bg-white rounded-2xl shadow-lg">
                <QRCodeSVG value={window.location.origin} size={140} />
              </div>
              <div className="text-center space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Kamera orqali skanerlang:</div>
                <div className="text-xs font-mono text-amber-300 font-black">{window.location.origin}</div>
              </div>
            </div>

            {/* Quick installation steps */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="font-bold text-slate-200">📲 Telefonga programma qilib o'rnatish:</div>
              <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc pl-4">
                <li><strong className="text-slate-200">Android (Chrome):</strong> Brauzerning yuqori o'ng burchagidagi <span className="text-amber-400">⋮ (Uch nuqta)</span> tugmasini bosing va <span className="text-white">"Ekraningizga qo'shish (Установить приложение)"</span> ni tanlang.</li>
                <li><strong className="text-slate-200">iPhone (Safari):</strong> Pastdagi <span className="text-amber-400">Ulashish (Share ⎋)</span> tugmasini bosing va <span className="text-white">"Bosh ekranga qo'shish (+ На экран «Домой»)"</span> ni tanlang.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCopyAppLink}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <Copy className="w-4 h-4" />
                <span>Linkni Nusxalash</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPwaModal(false)}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Yopish
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TELEGRAM BOT ULASH VA SOZLAMALAR MODALI */}
      {isTelegramModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Telegram Bot Ulash</h3>
                  <p className="text-[11px] text-slate-400">Har bir sotuv bo'lganda Telegram orqali xabar yuborish</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTelegramModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Bot Token Input */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-black text-xs flex items-center justify-between">
                  <span>Telegram Bot Token</span>
                  <span className="text-[10px] text-sky-400 font-bold">@BotFather bergan token</span>
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* Chat IDs Multi-Recipient Management */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-black text-xs flex items-center justify-between">
                  <span>Qabul qiluvchilar (Telegram ID lar)</span>
                  <span className="text-[10px] text-amber-400 font-bold">
                    {chatIds.length > 0 ? `${chatIds.length} ta ID qo'shilgan` : "ID qo'shilmagan"}
                  </span>
                </label>

                {/* Add new ID row */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newChatIdInput}
                    onChange={(e) => setNewChatIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChatId();
                      }
                    }}
                    placeholder="Masalan: 123456789 (User yoki Guruh ID)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddChatId}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Qo'shish</span>
                  </button>
                </div>

                {/* List of active IDs */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  {chatIds.length === 0 ? (
                    <div className="text-[11px] text-slate-500 text-center py-2">
                      Hozircha hech qanday Telegram ID qo'shilmagan. Yuqoridagi maydonga ID yozib "Qo'shish"ni bosing.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {chatIds.map((cId, idx) => (
                        <div
                          key={cId + idx}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-lg bg-sky-500/10 text-sky-400 font-bold text-[10px] flex items-center justify-center border border-sky-500/20">
                              {idx + 1}
                            </span>
                            <span className="font-mono text-xs font-bold text-white tracking-wide truncate">{cId}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveChatId(cId)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Auto notify toggle */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Avtomatik Sotuv Xabarnomasi</div>
                  <div className="text-[11px] text-slate-400">Har bir kassa sotuvida barcha ulangan ID larga xabar boradi</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoNotify}
                  onChange={(e) => setAutoNotify(e.target.checked)}
                  className="w-5 h-5 rounded accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Instructions Guide */}
              <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/20 space-y-2 text-[11px] text-sky-200/90 leading-relaxed">
                <div className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Bot ulash bo'yicha qisqa yo'riqnoma:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                  <li>Telegram'da <strong>@BotFather</strong> ga kiring va <code className="bg-slate-800 px-1 rounded text-amber-300 font-mono">/newbot</code> buyrug'i orqali yangi bot yarating.</li>
                  <li>BotFather bergan <strong>HTTP API Token</strong>ni yuqoridagi "Token" maydoniga kiriting.</li>
                  <li>Yaratgan botingizga kirib <strong>/start</strong> tugmasini bosing (bu majburiy).</li>
                  <li>O'zingizning Telegram ID raqamingizni bilish uchun <strong>@userinfobot</strong> ga yozing va chiqqan Id ni bu yerga qo'shing.</li>
                  <li>Bir nechta admin yoki xo'jayinlarga ham borishi uchun ularning ID-larini ham bittalab qo'shishingiz mumkin.</li>
                </ol>
              </div>

              {/* Status Message */}
              {telegramStatus && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  telegramStatus.includes('✅')
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}>
                  {telegramStatus}
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={telegramTesting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-black text-xs flex items-center gap-2 border border-slate-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {telegramTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-sky-400" />
                    <span>Test Xabar Yuborish</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTelegramModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleSaveTelegramSettings}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/30 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Saqlash</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
