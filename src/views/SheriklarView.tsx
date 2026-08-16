import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { PartnerStore, PartnerTransaction, UnitType } from '../types';
import {
  Handshake,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  History,
  Building2,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  X,
  Check,
  Package,
  CreditCard,
  Calendar,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';

export interface SendItemState {
  productId: string;
  productName: string;
  model: string;
  unitType: UnitType;
  rollsCount: number;
  metersPerRoll: number;
  quantity: number;
  currency: 'USD' | 'UZS';
  priceValue: number;
}

export interface ReceiveItemState {
  productId: string;
  productName: string;
  model: string;
  unitType: UnitType;
  rollsCount: number;
  metersPerRoll: number;
  quantity: number;
  currency: 'USD' | 'UZS';
  priceValue: number;      // Tannarx / Kirim narxi
  salePriceValue: number;  // Sotish narxi
}

export const SheriklarView: React.FC = () => {
  const {
    partnerStores,
    partnerTransactions,
    products,
    settings,
    updateSettings,
    addPartnerStore,
    updatePartnerStore,
    deletePartnerStore,
    sendStockToPartner,
    receiveStockFromPartner,
    settlePartnerPayment,
    deletePartnerTransaction,
  } = useERP();

  const rate = settings.usdRate || 12800;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  // Section Title Editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(settings.partnerTabName || "Sherik Do'konlar");

  // Modals state
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerStore | null>(null);

  // Oldi-Berdi Modals
  const [showSendStockModal, setShowSendStockModal] = useState(false);
  const [showReceiveStockModal, setShowReceiveStockModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Partner Form State
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  // Tovar Berish (Send Stock) Form
  const [sendForm, setSendForm] = useState<{
    partnerId: string;
    items: SendItemState[];
    note: string;
  }>({
    partnerId: '',
    items: [],
    note: '',
  });

  // Tovar Olish (Receive Stock) Form
  const [receiveForm, setReceiveForm] = useState<{
    partnerId: string;
    items: ReceiveItemState[];
    note: string;
  }>({
    partnerId: '',
    items: [],
    note: '',
  });

  // Payment Settlement Form
  const [paymentForm, setPaymentForm] = useState({
    partnerId: '',
    amountUzs: 0,
    direction: 'partner_paid_us' as 'partner_paid_us' | 'we_paid_partner',
    paymentType: 'naqd' as 'naqd' | 'karta',
    note: '',
  });

  // Save editable title
  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      updateSettings({ partnerTabName: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  // Open add/edit partner modal
  const handleOpenAddPartner = (partner?: PartnerStore) => {
    if (partner) {
      setEditingPartner(partner);
      setPartnerForm({
        name: partner.name,
        phone: partner.phone,
        address: partner.address || '',
        notes: partner.notes || '',
      });
    } else {
      setEditingPartner(null);
      setPartnerForm({ name: '', phone: '', address: '', notes: '' });
    }
    setShowAddPartnerModal(true);
  };

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name.trim()) return;

    if (editingPartner) {
      updatePartnerStore(editingPartner.id, partnerForm);
    } else {
      addPartnerStore(partnerForm);
    }
    setShowAddPartnerModal(false);
  };

  // --- TOVAR BERISH (SEND STOCK) HANDLERS ---
  const handleOpenSendStock = (partnerId: string) => {
    const defaultP = products[0];
    const initialItem: SendItemState = {
      productId: defaultP?.id || '',
      productName: defaultP?.name || '',
      model: defaultP?.model || 'Standart',
      unitType: defaultP?.unitType || 'metr',
      rollsCount: 1,
      metersPerRoll: defaultP?.metersPerRoll || (defaultP?.unitType === 'metr' ? 50 : 1),
      quantity: defaultP?.metersPerRoll || 1,
      currency: 'UZS',
      priceValue: defaultP?.salePrice || 0,
    };

    setSendForm({
      partnerId,
      items: [initialItem],
      note: '',
    });
    setShowSendStockModal(true);
  };

  const handleAddSendRow = () => {
    const defaultP = products[0];
    const newItem: SendItemState = {
      productId: defaultP?.id || '',
      productName: defaultP?.name || '',
      model: defaultP?.model || 'Standart',
      unitType: defaultP?.unitType || 'metr',
      rollsCount: 1,
      metersPerRoll: defaultP?.metersPerRoll || 50,
      quantity: defaultP?.metersPerRoll || 1,
      currency: 'UZS',
      priceValue: defaultP?.salePrice || 0,
    };
    setSendForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveSendRow = (index: number) => {
    setSendForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSelectSendExistingProduct = (index: number, productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    setSendForm((prev) => {
      const updated = [...prev.items];
      if (p) {
        const mpr = p.metersPerRoll || (p.unitType === 'metr' ? 50 : 1);
        updated[index] = {
          ...updated[index],
          productId: p.id,
          productName: p.name,
          model: p.model || 'Standart',
          unitType: p.unitType,
          rollsCount: 1,
          metersPerRoll: mpr,
          quantity: mpr,
          currency: 'UZS',
          priceValue: p.salePrice || 0,
        };
      } else {
        updated[index] = {
          ...updated[index],
          productId: '',
        };
      }
      return { ...prev, items: updated };
    });
  };

  const updateSendItem = (index: number, patch: Partial<SendItemState>) => {
    setSendForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], ...patch };
      return { ...prev, items: updated };
    });
  };

  const handleSendStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendForm.partnerId || sendForm.items.length === 0) return;

    const validItems = sendForm.items
      .filter((i) => i.productName.trim() && i.quantity > 0 && i.priceValue >= 0)
      .map((i) => {
        const priceInUzs = i.currency === 'USD' ? Math.round(i.priceValue * rate) : i.priceValue;
        return {
          productId: i.productId,
          productName: i.productName,
          model: i.model,
          unitType: i.unitType,
          rollsCount: i.rollsCount,
          metersPerRoll: i.metersPerRoll,
          quantity: i.quantity,
          currency: i.currency,
          priceValue: i.priceValue,
          priceUzs: priceInUzs,
        };
      });

    if (validItems.length === 0) return;

    sendStockToPartner(sendForm.partnerId, validItems, sendForm.note);
    setShowSendStockModal(false);
  };

  // --- TOVAR OLISH (RECEIVE STOCK) HANDLERS ---
  const handleOpenReceiveStock = (partnerId: string) => {
    const initialItem: ReceiveItemState = {
      productId: '',
      productName: '',
      model: 'Standart',
      unitType: 'metr',
      rollsCount: 1,
      metersPerRoll: 50,
      quantity: 50,
      currency: 'USD',
      priceValue: 0,
      salePriceValue: 0,
    };

    setReceiveForm({
      partnerId,
      items: [initialItem],
      note: '',
    });
    setShowReceiveStockModal(true);
  };

  const handleAddReceiveRow = () => {
    const newItem: ReceiveItemState = {
      productId: '',
      productName: '',
      model: 'Standart',
      unitType: 'metr',
      rollsCount: 1,
      metersPerRoll: 50,
      quantity: 50,
      currency: 'USD',
      priceValue: 0,
      salePriceValue: 0,
    };
    setReceiveForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveReceiveRow = (index: number) => {
    setReceiveForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSelectReceiveExistingProduct = (index: number, productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    setReceiveForm((prev) => {
      const updated = [...prev.items];
      if (p) {
        const mpr = p.metersPerRoll || (p.unitType === 'metr' ? 50 : 1);
        updated[index] = {
          ...updated[index],
          productId: p.id,
          productName: p.name,
          model: p.model || 'Standart',
          unitType: p.unitType,
          rollsCount: 1,
          metersPerRoll: mpr,
          quantity: mpr,
          currency: 'UZS',
          priceValue: p.costPrice || 0,
          salePriceValue: p.salePrice || 0,
        };
      } else {
        updated[index] = {
          ...updated[index],
          productId: '',
        };
      }
      return { ...prev, items: updated };
    });
  };

  const updateReceiveItem = (index: number, patch: Partial<ReceiveItemState>) => {
    setReceiveForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], ...patch };
      return { ...prev, items: updated };
    });
  };

  const handleReceiveStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.partnerId || receiveForm.items.length === 0) return;

    const validItems = receiveForm.items
      .filter((i) => i.productName.trim() && i.quantity > 0)
      .map((i) => {
        const costPriceUzs = i.currency === 'USD' ? Math.round(i.priceValue * rate) : i.priceValue;
        const salePriceUzs = i.currency === 'USD' ? Math.round(i.salePriceValue * rate) : i.salePriceValue;

        return {
          productId: i.productId,
          productName: i.productName,
          model: i.model,
          unitType: i.unitType,
          rollsCount: i.rollsCount,
          metersPerRoll: i.metersPerRoll,
          quantity: i.quantity,
          currency: i.currency,
          priceValue: i.priceValue,
          costPrice: costPriceUzs,
          salePrice: salePriceUzs > 0 ? salePriceUzs : Math.round(costPriceUzs * 1.2),
        };
      });

    if (validItems.length === 0) return;

    receiveStockFromPartner(receiveForm.partnerId, validItems, receiveForm.note);
    setShowReceiveStockModal(false);
  };

  // Open Payment Settlement Modal
  const handleOpenPaymentModal = (partnerId: string, direction: 'partner_paid_us' | 'we_paid_partner') => {
    setPaymentForm({
      partnerId,
      amountUzs: 0,
      direction,
      paymentType: 'naqd',
      note: '',
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.partnerId || paymentForm.amountUzs <= 0) return;

    settlePartnerPayment(
      paymentForm.partnerId,
      paymentForm.amountUzs,
      paymentForm.direction,
      paymentForm.paymentType,
      paymentForm.note
    );
    setShowPaymentModal(false);
  };

  // Filtering partner stores
  const filteredPartners = partnerStores.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Financial aggregates
  let totalTheyOweUsUzs = 0;
  let totalWeOweThemUzs = 0;

  partnerStores.forEach((p) => {
    if (p.debtBalanceUzs > 0) {
      totalTheyOweUsUzs += p.debtBalanceUzs;
    } else if (p.debtBalanceUzs < 0) {
      totalWeOweThemUzs += Math.abs(p.debtBalanceUzs);
    }
  });

  const netBalanceUzs = totalTheyOweUsUzs - totalWeOweThemUzs;

  // Selected partner history transactions
  const selectedPartner = partnerStores.find((p) => p.id === selectedPartnerId);
  const activeTransactions = selectedPartnerId
    ? partnerTransactions.filter((t) => t.partnerId === selectedPartnerId)
    : partnerTransactions;

  return (
    <div className="space-y-4 pb-20 lg:pb-10">
      {/* HEADER SECTION WITH EDITABLE TITLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-black shrink-0">
            <Handshake className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="px-2.5 py-1 text-sm font-black bg-slate-100 dark:bg-slate-800 border border-amber-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 truncate">
                <span className="truncate">{settings.partnerTabName || "Sherik Do'konlar"}</span>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors shrink-0"
                  title="Tahrirlash"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </h1>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setSelectedPartnerId(null);
              setShowHistoryModal(true);
            }}
            className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1 transition-all"
          >
            <History className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden xs:inline">Tarix</span>
          </button>

          <button
            onClick={() => handleOpenAddPartner()}
            className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi</span>
          </button>
        </div>
      </div>

      {/* SUMMARY STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Total Partners */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sheriklar</div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {partnerStores.length} ta
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        {/* They Owe Us */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 uppercase tracking-wider truncate">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span className="truncate">Bizdan qarz</span>
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              +{totalTheyOweUsUzs.toLocaleString()} UZS
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 ml-1">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* We Owe Them */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-rose-500/30 dark:border-rose-500/20 shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 uppercase tracking-wider truncate">
              <TrendingDown className="w-3 h-3 shrink-0" />
              <span className="truncate">Bizning qarz</span>
            </div>
            <div className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 mt-0.5 truncate">
              -{totalWeOweThemUzs.toLocaleString()} UZS
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 ml-1">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-amber-500/30 dark:border-amber-500/20 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Sof Balans</div>
            <div className={`text-sm sm:text-base font-black mt-0.5 truncate ${
              netBalanceUzs > 0 ? 'text-emerald-500' : netBalanceUzs < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'
            }`}>
              {netBalanceUzs >= 0 ? '+' : ''}{netBalanceUzs.toLocaleString()} UZS
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 ml-1">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* SEARCH AND GRID OF PARTNERS */}
      <div className="space-y-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Sherik do'kon nomi yoki telefon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-amber-500"
          />
        </div>

        {filteredPartners.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
            <Handshake className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Sherik do'konlar topilmadi
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredPartners.map((partner) => {
              const debt = partner.debtBalanceUzs;
              const debtUsd = debt / rate;

              return (
                <div
                  key={partner.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-sm hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3"
                >
                  {/* Top info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-black text-xs shrink-0">
                          {partner.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {partner.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium truncate">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>{partner.phone}</span>
                            </span>
                            {partner.address && (
                              <span className="truncate border-l border-slate-700/50 pl-2">
                                {partner.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenAddPartner(partner)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`${partner.name} ni o'chirishni tasdiqlaysizmi?`)) {
                              deletePartnerStore(partner.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Balance Pill */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Balans:</span>
                        <span className={`text-xs font-black ${
                          debt > 0 ? 'text-emerald-500' : debt < 0 ? 'text-rose-500' : 'text-slate-400'
                        }`}>
                          {debt > 0 ? `+${debt.toLocaleString()} UZS` : debt < 0 ? `${debt.toLocaleString()} UZS` : "0 UZS (Qarzsiz)"}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        ${debtUsd.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenSendStock(partner.id)}
                      className="py-1.5 px-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] flex items-center justify-center gap-1 transition-all"
                      title="Tovar Berish"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span className="truncate">Berish</span>
                    </button>

                    <button
                      onClick={() => handleOpenReceiveStock(partner.id)}
                      className="py-1.5 px-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] flex items-center justify-center gap-1 transition-all"
                      title="Tovar Olish"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span className="truncate">Olish</span>
                    </button>

                    <button
                      onClick={() => handleOpenPaymentModal(partner.id, 'partner_paid_us')}
                      className="py-1.5 px-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] flex items-center justify-center gap-1 transition-all"
                      title="Pul Olish"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="truncate">To'lov</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPartnerId(partner.id);
                        setShowHistoryModal(true);
                      }}
                      className="py-1.5 px-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] flex items-center justify-center gap-1 transition-all"
                      title="Tarix"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">Tarix</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT PARTNER STORE */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span>{editingPartner ? "Sherik Do'konni Tahrirlash" : "Yangi Sherik Do'kon Qo'shish"}</span>
              </h3>
              <button
                onClick={() => setShowAddPartnerModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Do'kon / Firma Nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Sharq Optom Baza"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Telefon Raqami *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+998 90 123 45 67"
                  value={partnerForm.phone}
                  onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Manzil
                </label>
                <input
                  type="text"
                  placeholder="Qo'yliq bozori 12-do'kon"
                  value={partnerForm.address}
                  onChange={(e) => setPartnerForm({ ...partnerForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartnerModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black shadow-md border-b-2 border-amber-700 active:translate-y-0.5"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOVAR BERISH (SEND STOCK TO PARTNER) */}
      {showSendStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-500" />
                <span>Sherik Do'konga Tovar Berish (Chiqim)</span>
              </h3>
              <button
                onClick={() => setShowSendStockModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendStockSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Sherik Do'kon *
                </label>
                <select
                  required
                  value={sendForm.partnerId}
                  onChange={(e) => setSendForm({ ...sendForm, partnerId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Sherik Do'konni Tanlang --</option>
                  {partnerStores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List (Mobile-Optimized Cards) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Beriladigan Tovarlar
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSendRow}
                    className="py-1 px-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold hover:bg-amber-500/20 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yangi qator</span>
                  </button>
                </div>

                {sendForm.items.map((item, idx) => {
                  const lineTotalUzs = item.currency === 'USD'
                    ? Math.round(item.quantity * item.priceValue * rate)
                    : Math.round(item.quantity * item.priceValue);
                  const lineTotalUsd = item.currency === 'USD'
                    ? item.quantity * item.priceValue
                    : (item.quantity * item.priceValue) / rate;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 space-y-3"
                    >
                      {/* Top row: # + Existing Product Picker + Delete */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/50 pb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <select
                            value={item.productId}
                            onChange={(e) => handleSelectSendExistingProduct(idx, e.target.value)}
                            className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                          >
                            <option value="">-- Ombordagi tovarlardan tanlash --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.model})
                              </option>
                            ))}
                          </select>
                        </div>

                        {sendForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSendRow(idx)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 shrink-0"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Inputs Row 1: Nomi & Modeli */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-0.5">
                            Tovar Nomi *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="masalan: Gilam Silk"
                            value={item.productName}
                            onChange={(e) => updateSendItem(idx, { productName: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-0.5">
                              Modeli
                            </label>
                            <input
                              type="text"
                              placeholder="Standart"
                              value={item.model}
                              onChange={(e) => updateSendItem(idx, { model: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-0.5">
                              Birligi
                            </label>
                            <select
                              value={item.unitType}
                              onChange={(e) => updateSendItem(idx, { unitType: e.target.value as UnitType })}
                              className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                            >
                              <option value="metr">Metr</option>
                              <option value="dona">Dona</option>
                              <option value="kg">Kg</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Inputs Row 2: Rulon soni & Metrlar & Total */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-100/70 dark:bg-slate-900/50 p-2 rounded-xl">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-0.5">
                            {item.unitType === 'metr' ? 'Rulon soni' : item.unitType === 'kg' ? 'Qop soni' : 'Quti soni'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={item.rollsCount || ''}
                            onChange={(e) => {
                              const rc = parseInt(e.target.value) || 0;
                              const qty = rc * (item.metersPerRoll || 0);
                              updateSendItem(idx, { rollsCount: rc, quantity: qty });
                            }}
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-black text-center"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-0.5">
                            {item.unitType === 'metr' ? '1 Rulon metri' : item.unitType === 'kg' ? '1 Qop (kg)' : '1 Quti (dona)'}
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.metersPerRoll || ''}
                            onChange={(e) => {
                              const mpr = parseFloat(e.target.value) || 0;
                              const qty = (item.rollsCount || 0) * mpr;
                              updateSendItem(idx, { metersPerRoll: mpr, quantity: qty });
                            }}
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-black text-center"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-amber-600 dark:text-amber-400 mb-0.5">
                            Jami ({item.unitType})
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.quantity || ''}
                            onChange={(e) => {
                              const q = parseFloat(e.target.value) || 0;
                              updateSendItem(idx, { quantity: q });
                            }}
                            className="w-full px-2.5 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black text-center"
                          />
                        </div>
                      </div>

                      {/* Inputs Row 3: Valyuta & Narxi */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-0.5">
                            Valyuta & Narx (1 {item.unitType} uchun)
                          </label>
                          <div className="flex items-center gap-1.5">
                            {/* Currency Toggle */}
                            <div className="flex items-center rounded-xl bg-slate-200 dark:bg-slate-900 p-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateSendItem(idx, { currency: 'USD' })}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                  item.currency === 'USD'
                                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                $ USD
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSendItem(idx, { currency: 'UZS' })}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                  item.currency === 'UZS'
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                UZS
                              </button>
                            </div>

                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              placeholder={item.currency === 'USD' ? '5.5' : '70000'}
                              value={item.priceValue || ''}
                              onChange={(e) => updateSendItem(idx, { priceValue: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-black focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        {/* Row Calculation Summary */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 bg-slate-200/60 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl text-xs font-black">
                          <span className="text-slate-400 font-bold text-[10px] uppercase">Qator Summasi:</span>
                          <div className="text-right">
                            {item.currency === 'USD' ? (
                              <div>
                                <span className="text-emerald-500">${lineTotalUsd.toFixed(2)} USD</span>
                                <span className="block text-[10px] text-slate-400 font-semibold">
                                  ~{lineTotalUzs.toLocaleString()} UZS
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-amber-500">{lineTotalUzs.toLocaleString()} UZS</span>
                                <span className="block text-[10px] text-slate-400 font-semibold">
                                  ~${lineTotalUsd.toFixed(2)} USD
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Calculation Card */}
              {(() => {
                let grandTotalUzs = 0;
                let grandTotalUsd = 0;

                sendForm.items.forEach((item) => {
                  if (item.currency === 'USD') {
                    const usd = item.quantity * item.priceValue;
                    grandTotalUsd += usd;
                    grandTotalUzs += usd * rate;
                  } else {
                    const uzs = item.quantity * item.priceValue;
                    grandTotalUzs += uzs;
                    grandTotalUsd += uzs / rate;
                  }
                });

                return (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase">
                      Jami Chiqim Summasi:
                    </span>
                    <div className="text-right">
                      <div className="text-base font-black text-amber-600 dark:text-amber-300">
                        {Math.round(grandTotalUzs).toLocaleString()} UZS
                      </div>
                      <div className="text-[11px] font-bold text-emerald-500">
                        ${grandTotalUsd.toFixed(2)} USD
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Izoh / Yuk Xati
                </label>
                <input
                  type="text"
                  placeholder="masalan: Haydovchi Akmal orqali yuborildi"
                  value={sendForm.note}
                  onChange={(e) => setSendForm({ ...sendForm, note: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSendStockModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black shadow-md border-b-2 border-amber-700 active:translate-y-0.5"
                >
                  Tovarni Chiqim Qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOVAR OLISH (RECEIVE STOCK FROM PARTNER) */}
      {showReceiveStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-indigo-500" />
                <span>Sherik Do'kondan Tovar Olish (Kirim)</span>
              </h3>
              <button
                onClick={() => setShowReceiveStockModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveStockSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Sherik Do'kon *
                </label>
                <select
                  required
                  value={receiveForm.partnerId}
                  onChange={(e) => setReceiveForm({ ...receiveForm, partnerId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Sherik Do'konni Tanlang --</option>
                  {partnerStores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List (Mobile-Optimized Cards) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Qabul Qilinayotgan Tovarlar
                  </label>
                  <button
                    type="button"
                    onClick={handleAddReceiveRow}
                    className="py-1 px-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold hover:bg-indigo-500/20 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yangi qator</span>
                  </button>
                </div>

                {receiveForm.items.map((item, idx) => {
                  const lineTotalUzs = item.currency === 'USD'
                    ? Math.round(item.quantity * item.priceValue * rate)
                    : Math.round(item.quantity * item.priceValue);
                  const lineTotalUsd = item.currency === 'USD'
                    ? item.quantity * item.priceValue
                    : (item.quantity * item.priceValue) / rate;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 space-y-3"
                    >
                      {/* Top row: # + Existing Product Picker + Delete */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/50 pb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <select
                            value={item.productId}
                            onChange={(e) => handleSelectReceiveExistingProduct(idx, e.target.value)}
                            className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                          >
                            <option value="">-- Ombordagi tovar bo'lsa tanlang (ixtiyoriy) --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.model})
                              </option>
                            ))}
                          </select>
                        </div>

                        {receiveForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveReceiveRow(idx)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 shrink-0"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Inputs Row 1: Nomi & Modeli */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-0.5">
                            Tovar Nomi *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="masalan: Turkiya Gilam Premium"
                            value={item.productName}
                            onChange={(e) => updateReceiveItem(idx, { productName: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-0.5">
                              Modeli
                            </label>
                            <input
                              type="text"
                              placeholder="Standart"
                              value={item.model}
                              onChange={(e) => updateReceiveItem(idx, { model: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-0.5">
                              Birligi
                            </label>
                            <select
                              value={item.unitType}
                              onChange={(e) => updateReceiveItem(idx, { unitType: e.target.value as UnitType })}
                              className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                            >
                              <option value="metr">Metr</option>
                              <option value="dona">Dona</option>
                              <option value="kg">Kg</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Inputs Row 2: Rulon soni & Metrlar & Total */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-100/70 dark:bg-slate-900/50 p-2 rounded-xl">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-0.5">
                            {item.unitType === 'metr' ? 'Rulon soni' : item.unitType === 'kg' ? 'Qop soni' : 'Quti soni'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={item.rollsCount || ''}
                            onChange={(e) => {
                              const rc = parseInt(e.target.value) || 0;
                              const qty = rc * (item.metersPerRoll || 0);
                              updateReceiveItem(idx, { rollsCount: rc, quantity: qty });
                            }}
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-black text-center"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-0.5">
                            {item.unitType === 'metr' ? '1 Rulon metri' : item.unitType === 'kg' ? '1 Qop (kg)' : '1 Quti (dona)'}
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.metersPerRoll || ''}
                            onChange={(e) => {
                              const mpr = parseFloat(e.target.value) || 0;
                              const qty = (item.rollsCount || 0) * mpr;
                              updateReceiveItem(idx, { metersPerRoll: mpr, quantity: qty });
                            }}
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-black text-center"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 mb-0.5">
                            Jami ({item.unitType})
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.quantity || ''}
                            onChange={(e) => {
                              const q = parseFloat(e.target.value) || 0;
                              updateReceiveItem(idx, { quantity: q });
                            }}
                            className="w-full px-2.5 py-1 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-black text-center"
                          />
                        </div>
                      </div>

                      {/* Inputs Row 3: Valyuta & Tannarx & Sotish Narxi */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-0.5">
                            Valyuta & Tannarx (1 {item.unitType})
                          </label>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center rounded-xl bg-slate-200 dark:bg-slate-900 p-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateReceiveItem(idx, { currency: 'USD' })}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                  item.currency === 'USD'
                                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                $ USD
                              </button>
                              <button
                                type="button"
                                onClick={() => updateReceiveItem(idx, { currency: 'UZS' })}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                  item.currency === 'UZS'
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                UZS
                              </button>
                            </div>

                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              placeholder={item.currency === 'USD' ? '4.8' : '60000'}
                              value={item.priceValue || ''}
                              onChange={(e) => updateReceiveItem(idx, { priceValue: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-black focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-0.5">
                            Do'konda Sotilish Narxi ({item.currency})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder={item.currency === 'USD' ? '6.0' : '75000'}
                            value={item.salePriceValue || ''}
                            onChange={(e) => updateReceiveItem(idx, { salePriceValue: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-black focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Row Calculation Summary */}
                      <div className="flex items-center justify-between gap-2 bg-slate-200/60 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl text-xs font-black">
                        <span className="text-slate-400 font-bold text-[10px] uppercase">Qator Summasi (Tannarx):</span>
                        <div className="text-right">
                          {item.currency === 'USD' ? (
                            <div>
                              <span className="text-emerald-500">${lineTotalUsd.toFixed(2)} USD</span>
                              <span className="block text-[10px] text-slate-400 font-semibold">
                                ~{lineTotalUzs.toLocaleString()} UZS
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-indigo-500">{lineTotalUzs.toLocaleString()} UZS</span>
                              <span className="block text-[10px] text-slate-400 font-semibold">
                                ~${lineTotalUsd.toFixed(2)} USD
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Calculation Card */}
              {(() => {
                let grandTotalUzs = 0;
                let grandTotalUsd = 0;

                receiveForm.items.forEach((item) => {
                  if (item.currency === 'USD') {
                    const usd = item.quantity * item.priceValue;
                    grandTotalUsd += usd;
                    grandTotalUzs += usd * rate;
                  } else {
                    const uzs = item.quantity * item.priceValue;
                    grandTotalUzs += uzs;
                    grandTotalUsd += uzs / rate;
                  }
                });

                return (
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase">
                      Jami Kirim Summasi:
                    </span>
                    <div className="text-right">
                      <div className="text-base font-black text-indigo-600 dark:text-indigo-300">
                        {Math.round(grandTotalUzs).toLocaleString()} UZS
                      </div>
                      <div className="text-[11px] font-bold text-emerald-500">
                        ${grandTotalUsd.toFixed(2)} USD
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Izoh / Qabul Hujjati
                </label>
                <input
                  type="text"
                  placeholder="masalan: Sharq baza qabul xati #52"
                  value={receiveForm.note}
                  onChange={(e) => setReceiveForm({ ...receiveForm, note: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowReceiveStockModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md border-b-2 border-indigo-900 active:translate-y-0.5"
                >
                  Tovarlarni Kirim Qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PUL HISOB-KITOBI (PAYMENT SETTLEMENT) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span>O'zaro Pul Hisob-kitobi</span>
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Sherik Do'kon *
                </label>
                <select
                  required
                  value={paymentForm.partnerId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, partnerId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Sherik Do'konni Tanlang --</option>
                  {partnerStores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  To'lov Yo'nalishi *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, direction: 'partner_paid_us' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black border flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentForm.direction === 'partner_paid_us'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Ular Bizga Berdi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, direction: 'we_paid_partner' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black border flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentForm.direction === 'we_paid_partner'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Biz Ularga Berdik</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  To'lov Summasi (UZS) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1000"
                  required
                  placeholder="1,000,000"
                  value={paymentForm.amountUzs || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amountUzs: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-black focus:outline-none focus:border-amber-500"
                />
                {paymentForm.amountUzs > 0 && (
                  <div className="text-[11px] font-bold text-slate-400 mt-1">
                    ~${(paymentForm.amountUzs / rate).toFixed(2)} USD
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  To'lov Turi
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="payType"
                      checked={paymentForm.paymentType === 'naqd'}
                      onChange={() => setPaymentForm({ ...paymentForm, paymentType: 'naqd' })}
                      className="accent-amber-500"
                    />
                    <span>Naqd Pul</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="payType"
                      checked={paymentForm.paymentType === 'karta'}
                      onChange={() => setPaymentForm({ ...paymentForm, paymentType: 'karta' })}
                      className="accent-amber-500"
                    />
                    <span>Plastik Karta / O'tkazma</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Izoh
                </label>
                <input
                  type="text"
                  placeholder="masalan: Qarz yopildi"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black shadow-md border-b-2 border-emerald-700 active:translate-y-0.5"
                >
                  To'lovni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSACTIONS HISTORY (OPERATSIYALAR TARIXI) */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 w-full max-w-4xl shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <span>
                  {selectedPartner
                    ? `${selectedPartner.name} — Amallar Tarixi`
                    : "Barcha Sheriklar Bo'yicha Operatsiyalar Tarixi"}
                </span>
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
              <button
                onClick={() => setSelectedPartnerId(null)}
                className={`py-1.5 px-3 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  selectedPartnerId === null
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Barchasi
              </button>
              {partnerStores.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPartnerId(p.id)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    selectedPartnerId === p.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* History List Table */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {activeTransactions.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-bold text-xs">
                  Aktiv operatsiyalar topilmadi.
                </div>
              ) : (
                activeTransactions.map((t) => {
                  const dateStr = new Date(t.date).toLocaleString('uz-UZ', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={t.id}
                      className="bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {t.type === 'tovar_berildi' && (
                            <span className="py-1 px-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Tovar Berildi (Chiqim)
                            </span>
                          )}
                          {t.type === 'tovar_olindi' && (
                            <span className="py-1 px-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black flex items-center gap-1">
                              <ArrowDownLeft className="w-3.5 h-3.5" /> Tovar Olindi (Kirim)
                            </span>
                          )}
                          {t.type === 'pul_olindi' && (
                            <span className="py-1 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-black flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" /> Pul Qabul Qilindi
                            </span>
                          )}
                          {t.type === 'pul_berildi' && (
                            <span className="py-1 px-2.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-black flex items-center gap-1">
                              <CreditCard className="w-3.5 h-3.5" /> Pul Berildi
                            </span>
                          )}

                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                            {t.partnerName}
                          </span>
                        </div>

                        {/* Items list if available */}
                        {t.items && t.items.length > 0 && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1.5">
                            {t.items.map((itm, i) => {
                              const rollInfo = itm.unitType === 'metr' && itm.rollsCount
                                ? `(${itm.rollsCount} rulon x ${itm.metersPerRoll || 0}m = ${itm.quantity}m)`
                                : `${itm.quantity} ${itm.unitType}`;

                              const priceFormatted = itm.currency === 'USD'
                                ? `$${itm.priceValue || (itm.priceUzs / rate).toFixed(2)} USD`
                                : `${itm.priceUzs.toLocaleString()} UZS`;

                              return (
                                <div key={i} className="flex flex-wrap items-center gap-1.5 font-medium bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <Package className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {itm.productName} ({itm.model || 'Standart'})
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-400">
                                    — {rollInfo} x {priceFormatted} = <b className="text-amber-500">{itm.totalUzs.toLocaleString()} UZS</b>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {dateStr}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> {t.addedBy}
                          </span>
                          {t.note && <span className="italic">"{t.note}"</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200 dark:border-slate-700">
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900 dark:text-white">
                            {t.amountUzs.toLocaleString()} UZS
                          </div>
                          <div className="text-[10px] font-bold text-emerald-500">
                            ~${(t.amountUzs / rate).toFixed(2)} USD
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm("Ushbu operatsiya yozuvini o'chirishni tasdiqlaysizmi?")) {
                              deletePartnerTransaction(t.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Yozuvni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end shrink-0 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
