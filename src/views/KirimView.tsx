import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
  FileText,
  Trash2,
  Edit2,
  X,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Store,
  Boxes,
  Tag as TagIcon,
} from 'lucide-react';
import { Supplier, StockIntakeItem, UnitType } from '../types';
import { parseRollsExpression } from '../utils/excelHelper';

export const KirimView: React.FC = () => {
  const {
    suppliers,
    stockIntakes,
    products,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addStockIntake,
    repaySupplierDebt,
    deleteStockIntake,
    settings,
  } = useERP();

  const usdRate = settings.usdRate || 12030;

  const [activeSubTab, setActiveSubTab] = useState<'yangi_kirim' | 'postavshiklar' | 'tarix'>('yangi_kirim');

  // New Supplier Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  // Pay Supplier Debt Modal State
  const [payDebtSupplier, setPayDebtSupplier] = useState<Supplier | null>(null);
  const [payAmountUzs, setPayAmountUzs] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState<'naqd' | 'karta'>('naqd');
  const [payNote, setPayNote] = useState('');

  // Stock Intake Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [targetLocation, setTargetLocation] = useState<'warehouse' | 'store'>('warehouse');
  const [intakeItems, setIntakeItems] = useState<StockIntakeItem[]>([]);

  // Item Form Fields
  const [isNewProductMode, setIsNewProductMode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodModel, setProdModel] = useState('');
  const [prodUnitType, setProdUnitType] = useState<UnitType>('metr');

  // Currency & Prices
  const [costCurrency, setCostCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [prodCostPrice, setProdCostPrice] = useState<number | ''>('');
  
  const [saleCurrency, setSaleCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [prodSalePrice, setProdSalePrice] = useState<number | ''>('');

  // Individual Roll Builder State (Ombor & Do'kon kabi)
  const [rollList, setRollList] = useState<number[]>([]);
  const [singleRollInput, setSingleRollInput] = useState<string>('');
  const [bulkRollCount, setBulkRollCount] = useState<number | ''>(1);
  const [bulkRollLength, setBulkRollLength] = useState<number | ''>(50);

  // Other unit quantity inputs
  const [rollsCount, setRollsCount] = useState<number | ''>(1);
  const [metersPerRoll, setMetersPerRoll] = useState<number | ''>(50);
  const [bagsCount, setBagsCount] = useState<number | ''>(1);
  const [kgPerBag, setKgPerBag] = useState<number | ''>(25);
  const [boxesCount, setBoxesCount] = useState<number | ''>(1);
  const [itemsPerBox, setItemsPerBox] = useState<number | ''>(10);
  const [directQuantity, setDirectQuantity] = useState<number | ''>('');

  // Payment fields for intake
  const [paymentType, setPaymentType] = useState<'naqd' | 'karta' | 'nasiya' | 'aralash'>('naqd');
  const [paidCashUzs, setPaidCashUzs] = useState<number | ''>('');
  const [paidCardUzs, setPaidCardUzs] = useState<number | ''>('');
  const [intakeNote, setIntakeNote] = useState('');

  // Filter and Search states
  const [supplierSearch, setSupplierSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedIntakeDetail, setSelectedIntakeDetail] = useState<any | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Aggregated Summary
  const totalDebtToSuppliers = suppliers.reduce((acc, s) => acc + (s.debtBalanceUzs > 0 ? s.debtBalanceUzs : 0), 0);
  const totalIntakesCount = stockIntakes.length;
  const totalIntakesSum = stockIntakes.reduce((acc, i) => acc + i.totalAmountUzs, 0);

  // Effective cost in UZS & USD
  const costInUzs = useMemo(() => {
    const val = Number(prodCostPrice) || 0;
    if (costCurrency === 'USD') {
      return Math.round(val * usdRate);
    }
    return val;
  }, [prodCostPrice, costCurrency, usdRate]);

  const costInUsd = useMemo(() => {
    const val = Number(prodCostPrice) || 0;
    if (costCurrency === 'USD') {
      return val;
    }
    return usdRate > 0 ? Math.round((val / usdRate) * 100) / 100 : 0;
  }, [prodCostPrice, costCurrency, usdRate]);

  const saleInUzs = useMemo(() => {
    const val = Number(prodSalePrice) || 0;
    if (saleCurrency === 'USD') {
      return Math.round(val * usdRate);
    }
    return val;
  }, [prodSalePrice, saleCurrency, usdRate]);

  const saleInUsd = useMemo(() => {
    const val = Number(prodSalePrice) || 0;
    if (saleCurrency === 'USD') {
      return val;
    }
    return usdRate > 0 ? Math.round((val / usdRate) * 100) / 100 : 0;
  }, [prodSalePrice, saleCurrency, usdRate]);

  // Roll adders
  const handleAddSingleRoll = () => {
    const parsed = parseRollsExpression(singleRollInput);
    if (parsed.length === 0) return;
    setRollList((prev) => [...prev, ...parsed]);
    setSingleRollInput('');
  };

  const handleAddBulkRolls = () => {
    const count = Number(bulkRollCount);
    const len = Number(bulkRollLength);
    if (!count || count <= 0 || !len || len <= 0) return;
    const newRolls = Array(count).fill(len);
    setRollList((prev) => [...prev, ...newRolls]);
  };

  const handleRemoveRoll = (index: number) => {
    setRollList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearRolls = () => {
    setRollList([]);
  };

  // Handle supplier modal open/edit
  const handleOpenSupplierModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierName(supplier.name);
      setCompanyName(supplier.companyName || '');
      setSupplierPhone(supplier.phone);
      setSupplierAddress(supplier.address || '');
      setSupplierNotes(supplier.notes || '');
    } else {
      setEditingSupplier(null);
      setSupplierName('');
      setCompanyName('');
      setSupplierPhone('');
      setSupplierAddress('');
      setSupplierNotes('');
    }
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !supplierPhone.trim()) {
      alert("Iltimos, postavshik ismi va telefon raqamini kiriting!");
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: supplierName.trim(),
        companyName: companyName.trim() || undefined,
        phone: supplierPhone.trim(),
        address: supplierAddress.trim() || undefined,
        notes: supplierNotes.trim() || undefined,
      });
      showToast("Postavshik ma'lumotlari yangilandi!");
    } else {
      const created = addSupplier({
        name: supplierName.trim(),
        companyName: companyName.trim() || undefined,
        phone: supplierPhone.trim(),
        address: supplierAddress.trim() || undefined,
        notes: supplierNotes.trim() || undefined,
      });
      setSelectedSupplierId(created.id);
      showToast("Yangi postavshik muvaffaqiyatli qo'shildi!");
    }

    setIsSupplierModalOpen(false);
  };

  // Handle debt payment submit
  const handlePaySupplierDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDebtSupplier || !payAmountUzs || Number(payAmountUzs) <= 0) {
      alert("Iltimos, to'lov summasini to'g'ri kiriting!");
      return;
    }

    repaySupplierDebt(payDebtSupplier.id, Number(payAmountUzs), payMethod, payNote);
    showToast(`${Number(payAmountUzs).toLocaleString('uz-UZ')} so'm to'lov saqlandi!`);
    setPayDebtSupplier(null);
    setPayAmountUzs('');
    setPayNote('');
  };

  // Handle Product selection in intake form
  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setProdName(prod.name);
      setProdModel(prod.model);
      setProdUnitType(prod.unitType);
      setProdCostPrice(prod.costPrice);
      setCostCurrency('UZS');
      setProdSalePrice(prod.salePrice);
      setSaleCurrency('UZS');
      setIsNewProductMode(false);
      setRollList([]);
    }
  };

  // Calculate total quantity & amount for current item draft
  const calculateDraftItemQuantity = (): number => {
    if (prodUnitType === 'metr') {
      if (rollList.length > 0) {
        return rollList.reduce((acc, curr) => acc + curr, 0);
      }
      const rolls = Number(rollsCount) || 0;
      const meters = Number(metersPerRoll) || 0;
      return directQuantity ? Number(directQuantity) : rolls * meters;
    } else if (prodUnitType === 'kg') {
      const bags = Number(bagsCount) || 0;
      const kg = Number(kgPerBag) || 0;
      return directQuantity ? Number(directQuantity) : bags * kg;
    } else {
      const boxes = Number(boxesCount) || 0;
      const perBox = Number(itemsPerBox) || 1;
      return directQuantity ? Number(directQuantity) : boxes * perBox;
    }
  };

  const handleAddItemToIntake = () => {
    if (!prodName.trim()) {
      alert("Iltimos, tovar nomini kiriting yoki tanlang!");
      return;
    }
    if (!costInUzs || costInUzs <= 0) {
      alert("Iltimos, tovarning kirim tannarxini kiriting!");
      return;
    }

    const qty = calculateDraftItemQuantity();
    if (qty <= 0) {
      alert("Iltimos, miqdorni (rulon, metr, kg yoki dona) to'g'ri kiriting!");
      return;
    }

    const totalItemAmountUzs = qty * costInUzs;
    const totalItemAmountUsd = usdRate > 0 ? Math.round((totalItemAmountUzs / usdRate) * 100) / 100 : 0;

    const newItem: StockIntakeItem = {
      productId: selectedProductId || undefined,
      productName: prodName.trim(),
      model: prodModel.trim() || 'Standart',
      unitType: prodUnitType,
      costPriceUzs: costInUzs,
      costPriceUsd: costInUsd,
      salePriceUzs: saleInUzs || Math.round(costInUzs * 1.3),
      salePriceUsd: saleInUsd,
      currencyUsed: costCurrency,
      quantity: qty,
      rollsCount: prodUnitType === 'metr' ? (rollList.length > 0 ? rollList.length : Number(rollsCount) || undefined) : undefined,
      metersPerRoll: prodUnitType === 'metr' ? (rollList.length === 1 ? rollList[0] : Number(metersPerRoll) || undefined) : undefined,
      rollsList: prodUnitType === 'metr' && rollList.length > 0 ? rollList : undefined,
      bagsCount: prodUnitType === 'kg' ? Number(bagsCount) || undefined : undefined,
      kgPerBag: prodUnitType === 'kg' ? Number(kgPerBag) || undefined : undefined,
      boxesCount: prodUnitType === 'dona' ? Number(boxesCount) || undefined : undefined,
      itemsPerBox: prodUnitType === 'dona' ? Number(itemsPerBox) || undefined : undefined,
      totalAmountUzs: totalItemAmountUzs,
      totalAmountUsd: totalItemAmountUsd,
    };

    setIntakeItems((prev) => [...prev, newItem]);

    // Reset item form fields
    setSelectedProductId('');
    setProdName('');
    setProdModel('');
    setProdCostPrice('');
    setProdSalePrice('');
    setDirectQuantity('');
    setRollList([]);
    setSingleRollInput('');
  };

  const handleRemoveIntakeItem = (index: number) => {
    setIntakeItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Grand Total calculation for intake
  const intakeGrandTotalUzs = intakeItems.reduce((acc, item) => acc + item.totalAmountUzs, 0);

  // Paid and debt calculation
  let calculatedPaidAmountUzs = 0;
  let calculatedDebtAmountUzs = 0;

  if (paymentType === 'naqd') {
    calculatedPaidAmountUzs = paidCashUzs ? Number(paidCashUzs) : intakeGrandTotalUzs;
    calculatedDebtAmountUzs = Math.max(0, intakeGrandTotalUzs - calculatedPaidAmountUzs);
  } else if (paymentType === 'karta') {
    calculatedPaidAmountUzs = paidCardUzs ? Number(paidCardUzs) : intakeGrandTotalUzs;
    calculatedDebtAmountUzs = Math.max(0, intakeGrandTotalUzs - calculatedPaidAmountUzs);
  } else if (paymentType === 'nasiya') {
    calculatedPaidAmountUzs = 0;
    calculatedDebtAmountUzs = intakeGrandTotalUzs;
  } else if (paymentType === 'aralash') {
    calculatedPaidAmountUzs = (Number(paidCashUzs) || 0) + (Number(paidCardUzs) || 0);
    calculatedDebtAmountUzs = Math.max(0, intakeGrandTotalUzs - calculatedPaidAmountUzs);
  }

  // Handle Save Intake
  const handleSaveIntakeSubmit = () => {
    if (!selectedSupplierId) {
      alert("Iltimos, postavshikni (yetkazib beruvchini) tanlang!");
      return;
    }
    if (intakeItems.length === 0) {
      alert("Iltimos, kamida bitta tovar qo'shing!");
      return;
    }

    const supplierObj = suppliers.find((s) => s.id === selectedSupplierId);

    addStockIntake({
      supplierId: selectedSupplierId,
      supplierName: supplierObj?.name || 'Postavshik',
      location: targetLocation,
      items: intakeItems,
      totalAmountUzs: intakeGrandTotalUzs,
      paidAmountUzs: calculatedPaidAmountUzs,
      debtAmountUzs: calculatedDebtAmountUzs,
      paymentType,
      note: intakeNote.trim() || undefined,
    });

    showToast("Kirim muvaffaqiyatli saqlandi va ombor hisobi yangilandi!");

    // Reset whole form
    setIntakeItems([]);
    setPaidCashUzs('');
    setPaidCardUzs('');
    setIntakeNote('');
    setActiveSubTab('tarix');
  };

  // Filtered lists
  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    (s.companyName && s.companyName.toLowerCase().includes(supplierSearch.toLowerCase())) ||
    s.phone.includes(supplierSearch)
  );

  const filteredStockIntakes = stockIntakes.filter((i) =>
    i.intakeNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
    i.supplierName.toLowerCase().includes(historySearch.toLowerCase()) ||
    i.items.some((item) => item.productName.toLowerCase().includes(historySearch.toLowerCase()))
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/50 flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER BLOCK */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Kirim Qilish (Postavka & Optom Kirim)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dollarda ($) yoki So'mda tannarx kiritish va rulonlarni bittalab qo'shib kirim qilish
            </p>
          </div>
        </div>

        {/* SUB TAB BUTTONS */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl self-start md:self-auto overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('yangi_kirim')}
            className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'yangi_kirim'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi Kirim</span>
          </button>
          <button
            onClick={() => setActiveSubTab('postavshiklar')}
            className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'postavshiklar'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Postavshiklar ({suppliers.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('tarix')}
            className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'tarix'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Hujjatlar Tarixi ({stockIntakes.length})</span>
          </button>
        </div>
      </div>

      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Postavshiklar Soni
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {suppliers.length} ta
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-red-500 uppercase tracking-wider">
            Bizning Qarzimiz (Optomga)
          </div>
          <div className="text-lg font-black text-red-600 dark:text-red-400 mt-1">
            {totalDebtToSuppliers.toLocaleString('uz-UZ')} UZS
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Dollar Kursi
          </div>
          <div className="text-lg font-black text-amber-500 mt-1">
            1$ = {usdRate.toLocaleString('uz-UZ')} UZS
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Jami Kirim Summasi
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {totalIntakesSum.toLocaleString('uz-UZ')} UZS
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: YANGI KIRIM (NEW INTAKE FORM) */}
      {activeSubTab === 'yangi_kirim' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: FORM CONTROLS */}
          <div className="lg:col-span-7 space-y-5">
            {/* STEP 1: POSTAVSHIK VA OMBOR SELECTION */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    1
                  </span>
                  <span>Postavshik va Ombor Joylashuvi</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleOpenSupplierModal()}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Yangi Postavshik</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Supplier select */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Yetkazib Beruvchi (Postavshik) *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Postavshikni tanlang --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.companyName ? `(${s.companyName})` : ''} - Qarz: {s.debtBalanceUzs.toLocaleString('uz-UZ')} UZS
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location target select */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Kirim Qilinadigan Joy *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetLocation('warehouse')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        targetLocation === 'warehouse'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Boxes className="w-4 h-4" />
                      <span>Ombor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetLocation('store')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        targetLocation === 'store'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>Do'kon</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: ADD PRODUCT ITEM TO INTAKE */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    2
                  </span>
                  <span>Tovar va Tannarx Kiritish</span>
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    setIsNewProductMode(!isNewProductMode);
                    setSelectedProductId('');
                    setProdName('');
                    setProdModel('');
                    setRollList([]);
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {isNewProductMode ? "Katalogdan Tanlash" : "+ Yangi Tovar Kiritish"}
                </button>
              </div>

              {/* Product selector or manual entry */}
              {!isNewProductMode ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Mavjud Katalogni Qidirish va Tanlash
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Katalogni tanlang --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.model}) - Tannarx: {p.costPrice.toLocaleString('uz-UZ')} UZS (${(p.costPrice / usdRate).toFixed(2)}) | [{p.unitType}]
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Tovar Nomi *
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: Ispaniya Kafel 60x60"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Modeli / Kodi
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: Onyx Marble Gray"
                      value={prodModel}
                      onChange={(e) => setProdModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Unit Type & Currency Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    O'lchov Birligi
                  </label>
                  <select
                    value={prodUnitType}
                    onChange={(e) => setProdUnitType(e.target.value as UnitType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                  >
                    <option value="metr">Metr (Rulonlar / Kvadrat metr)</option>
                    <option value="kg">Kg (Qop / Og'irlik)</option>
                    <option value="dona">Dona (Karopka / Quti)</option>
                  </select>
                </div>

                {/* TANNARX (COST PRICE) WITH DOLLAR & SO'M SWITCHER */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>Kirim Tannarxi (1 {prodUnitType}) *</span>
                    </label>

                    {/* Currency Selector Toggle */}
                    <div className="flex items-center bg-slate-200 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setCostCurrency('UZS')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${
                          costCurrency === 'UZS'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        SO'M (UZS)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCostCurrency('USD')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${
                          costCurrency === 'USD'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        DOLLAR ($)
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder={costCurrency === 'USD' ? "Masalan: 7.50 $" : "Masalan: 90000 So'm"}
                      value={prodCostPrice}
                      onChange={(e) => setProdCostPrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-black focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="absolute right-3 top-2.5 text-xs font-black text-slate-400">
                      {costCurrency === 'USD' ? '$ USD' : 'UZS'}
                    </div>
                  </div>

                  {/* Dynamic Currency Auto-Conversion Preview */}
                  {prodCostPrice !== '' && Number(prodCostPrice) > 0 && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <span>Teng Qiymati:</span>
                      <span className="font-black text-sm">
                        {costCurrency === 'USD'
                          ? `${costInUzs.toLocaleString('uz-UZ')} UZS`
                          : `$ ${costInUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* SOTUV NARXI (SALE PRICE) WITH CURRENCY SWITCHER */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                      <TagIcon className="w-4 h-4 text-indigo-500" />
                      <span>Mijozga Sotish Narxi (1 {prodUnitType})</span>
                    </label>

                    <div className="flex items-center bg-slate-200 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setSaleCurrency('UZS')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${
                          saleCurrency === 'UZS'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        SO'M (UZS)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSaleCurrency('USD')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${
                          saleCurrency === 'USD'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        DOLLAR ($)
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder={saleCurrency === 'USD' ? "Masalan: 12.00 $" : "Masalan: 140000 So'm"}
                      value={prodSalePrice}
                      onChange={(e) => setProdSalePrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-black focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="absolute right-3 top-2.5 text-xs font-black text-slate-400">
                      {saleCurrency === 'USD' ? '$ USD' : 'UZS'}
                    </div>
                  </div>

                  {prodSalePrice !== '' && Number(prodSalePrice) > 0 && (
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                      <span>Sotuv Teng Qiymati:</span>
                      <span className="font-black text-sm">
                        {saleCurrency === 'USD'
                          ? `${saleInUzs.toLocaleString('uz-UZ')} UZS`
                          : `$ ${saleInUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* RULON VA METRAJLASH BOX (OMBOR VA DO'KONGA O'XSHASH RULON QO'SHISH) */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>Miqdor / Rulonlarni Kiritish ({prodUnitType.toUpperCase()})</span>
                  </div>

                  {prodUnitType === 'metr' && rollList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearRolls}
                      className="text-[10px] font-extrabold text-red-500 hover:underline"
                    >
                      Barchasini O'chirish
                    </button>
                  )}
                </div>

                {/* METR UNIT: DYNAMIC INDIVIDUAL ROLL ADDER */}
                {prodUnitType === 'metr' && (
                  <div className="space-y-3">
                    {/* INPUT A: BITTALAB RULON METRINI QO'SHISH */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase">
                        1. Alohida Rulon Metrajini Kiritish va + Qo'shish
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Rulon metrajini kiriting (masalan: 50.5 yoki 50+45.5+60)"
                          value={singleRollInput}
                          onChange={(e) => setSingleRollInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSingleRoll();
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black"
                        />
                        <button
                          type="button"
                          onClick={handleAddSingleRoll}
                          className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Qo'shish</span>
                        </button>
                      </div>
                    </div>

                    {/* INPUT B: BIR XIL RULONLARDAN N TA QO'SHISH */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase">
                        2. Bir nechta teng rulonlar guruhini qo'shish
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <input
                            type="number"
                            placeholder="Rulon Soni (masalan: 5)"
                            value={bulkRollCount}
                            onChange={(e) => setBulkRollCount(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Metri (masalan: 50)"
                            value={bulkRollLength}
                            onChange={(e) => setBulkRollLength(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <button
                            type="button"
                            onClick={handleAddBulkRolls}
                            className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all"
                          >
                            + Rulonlar Qo'shish
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC ROLL LIST BADGES DISPLAY */}
                    {rollList.length > 0 ? (
                      <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
                        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                          <span className="font-extrabold text-amber-400">
                            Qo'shilgan Rulonlar ({rollList.length} ta):
                          </span>
                          <span className="font-black text-emerald-400">
                            Jami: {rollList.reduce((a, b) => a + b, 0)} metr
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 pt-1">
                          {rollList.map((rollLen, index) => (
                            <div
                              key={index}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-extrabold flex items-center gap-1.5 group hover:border-amber-500 transition-colors"
                            >
                              <span className="text-slate-400 text-[10px]">#{index + 1}:</span>
                              <span className="text-amber-400">{rollLen} m</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRoll(index)}
                                className="text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                        Hali alohida rulonlar qo'shilmadi. Yuqorida metrni kiritib <span className="font-black text-amber-500">+ Qo'shish</span> tugmasini bosing.
                      </div>
                    )}
                  </div>
                )}

                {/* KG UNIT SPECIFIC QUANTITY INPUTS */}
                {prodUnitType === 'kg' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        Qoplar Soni
                      </label>
                      <input
                        type="number"
                        value={bagsCount}
                        onChange={(e) => setBagsCount(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        1 Qop Og'irligi (kg)
                      </label>
                      <input
                        type="number"
                        value={kgPerBag}
                        onChange={(e) => setKgPerBag(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        Jami Kg
                      </label>
                      <input
                        type="number"
                        placeholder={`${(Number(bagsCount) || 0) * (Number(kgPerBag) || 0)}kg`}
                        value={directQuantity}
                        onChange={(e) => setDirectQuantity(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-amber-600 dark:text-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* DONA UNIT SPECIFIC QUANTITY INPUTS */}
                {prodUnitType === 'dona' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        Karopkalar Soni
                      </label>
                      <input
                        type="number"
                        value={boxesCount}
                        onChange={(e) => setBoxesCount(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        Karopkadagi Dona
                      </label>
                      <input
                        type="number"
                        value={itemsPerBox}
                        onChange={(e) => setItemsPerBox(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        Jami Dona
                      </label>
                      <input
                        type="number"
                        placeholder={`${(Number(boxesCount) || 0) * (Number(itemsPerBox) || 1)}dona`}
                        value={directQuantity}
                        onChange={(e) => setDirectQuantity(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-amber-600 dark:text-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* Add button */}
                <button
                  type="button"
                  onClick={handleAddItemToIntake}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tovarni Kirim Ro'yxatiga Qo'shish</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: INTAKE SUMMARY & PAYMENT */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  3
                </span>
                <span>Kirim Qilinayotgan Tovarlar ({intakeItems.length})</span>
              </h3>

              {intakeItems.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    Hali tovarlar qo'shilmadi. Chap tomondan tovar, valyuta va miqdorni tanlab qo'shing.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {intakeItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            {item.productName} ({item.model || 'Standart'})
                          </div>
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.quantity} {item.unitType} x {item.costPriceUzs.toLocaleString('uz-UZ')} UZS
                            {item.costPriceUsd ? ` ($${item.costPriceUsd})` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                            {item.totalAmountUzs.toLocaleString('uz-UZ')} UZS
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIntakeItem(idx)}
                            className="p-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Display roll chips if available */}
                      {item.rollsList && item.rollsList.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-amber-500">
                            {item.rollsList.length} ta Rulon:
                          </span>
                          {item.rollsList.map((rLen, rIdx) => (
                            <span
                              key={rIdx}
                              className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold"
                            >
                              #{rIdx + 1}: {rLen}m
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TOTAL & PAYMENT BREAKDOWN */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Jami Kirim Summasi:</span>
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {intakeGrandTotalUzs.toLocaleString('uz-UZ')} UZS
                    </div>
                    {usdRate > 0 && (
                      <div className="text-xs font-extrabold text-emerald-500">
                        = ${(intakeGrandTotalUzs / usdRate).toFixed(2)} USD
                      </div>
                    )}
                  </div>
                </div>

                {/* PAYMENT TYPE SELECT */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    To'lov Usuli
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(['naqd', 'karta', 'nasiya', 'aralash'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPaymentType(type)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all uppercase ${
                          paymentType === type
                            ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {type === 'nasiya' ? 'Qarzga' : type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PAID INPUTS DEPENDING ON TYPE */}
                {(paymentType === 'naqd' || paymentType === 'aralash') && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Naqd To'langan Summa (So'm)
                    </label>
                    <input
                      type="number"
                      placeholder={`Jami: ${intakeGrandTotalUzs.toLocaleString('uz-UZ')}`}
                      value={paidCashUzs}
                      onChange={(e) => setPaidCashUzs(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                )}

                {(paymentType === 'karta' || paymentType === 'aralash') && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Karta O'tkazilgan Summa (So'm)
                    </label>
                    <input
                      type="number"
                      placeholder={`Jami: ${intakeGrandTotalUzs.toLocaleString('uz-UZ')}`}
                      value={paidCardUzs}
                      onChange={(e) => setPaidCardUzs(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                )}

                {/* DEBT AMOUNT CALCULATION DISPLAY */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Postavshikka Qarz Qoldi:</span>
                  <span
                    className={`font-black text-sm ${
                      calculatedDebtAmountUzs > 0 ? 'text-red-500' : 'text-emerald-500'
                    }`}
                  >
                    {calculatedDebtAmountUzs.toLocaleString('uz-UZ')} UZS
                  </span>
                </div>

                {/* NOTE INPUT */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Eslatma / Izoh
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Fura bilan keldi, 1-xona omboriga joylandi"
                    value={intakeNote}
                    onChange={(e) => setIntakeNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                {/* SAVE BUTTON */}
                <button
                  type="button"
                  onClick={handleSaveIntakeSubmit}
                  disabled={intakeItems.length === 0}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Kirimni Saqlash va Omborga Boshqarish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: POSTAVSHIKLAR (SUPPLIERS LIST) */}
      {activeSubTab === 'postavshiklar' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Postavshiklarni qidirish..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <button
              onClick={() => handleOpenSupplierModal()}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yangi Postavshik</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{supplier.name}</span>
                    </h4>
                    {supplier.companyName && (
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                        {supplier.companyName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenSupplierModal(supplier)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`${supplier.name} postavshikni o'chirishni tasdiqlaysizmi?`)) {
                          deleteSupplier(supplier.id);
                          showToast("Postavshik o'chirildi");
                        }
                      }}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold">{supplier.phone}</span>
                  </div>
                  {supplier.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{supplier.address}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Bizning Qarzimiz:</div>
                    <div
                      className={`text-sm font-black ${
                        supplier.debtBalanceUzs > 0 ? 'text-red-500' : 'text-emerald-500'
                      }`}
                    >
                      {supplier.debtBalanceUzs.toLocaleString('uz-UZ')} UZS
                    </div>
                  </div>

                  {supplier.debtBalanceUzs > 0 && (
                    <button
                      onClick={() => setPayDebtSupplier(supplier)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-sm transition-all"
                    >
                      Qarz To'lash
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: HUJJATLAR TARIXI (HISTORY LIST) */}
      {activeSubTab === 'tarix' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Kirim raqami, postavshik yoki tovar..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5">Hujjat #</th>
                    <th className="p-3.5">Sana</th>
                    <th className="p-3.5">Postavshik</th>
                    <th className="p-3.5">Joylashuv</th>
                    <th className="p-3.5">Jami Summa</th>
                    <th className="p-3.5">To'langan</th>
                    <th className="p-3.5">Qarz</th>
                    <th className="p-3.5 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-bold">
                  {filteredStockIntakes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Hujjatlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredStockIntakes.map((intake) => (
                      <tr key={intake.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 font-black text-amber-500">{intake.intakeNumber}</td>
                        <td className="p-3.5 text-slate-500">
                          {new Date(intake.date).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="p-3.5 font-black">{intake.supplierName}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                              intake.location === 'warehouse'
                                ? 'bg-indigo-500/10 text-indigo-500'
                                : 'bg-emerald-500/10 text-emerald-500'
                            }`}
                          >
                            {intake.location === 'warehouse' ? 'Ombor' : "Do'kon"}
                          </span>
                        </td>
                        <td className="p-3.5 font-black">{intake.totalAmountUzs.toLocaleString('uz-UZ')} UZS</td>
                        <td className="p-3.5 text-emerald-600 dark:text-emerald-400">
                          {intake.paidAmountUzs.toLocaleString('uz-UZ')} UZS
                        </td>
                        <td className="p-3.5">
                          <span className={intake.debtAmountUzs > 0 ? 'text-red-500 font-black' : 'text-slate-400'}>
                            {intake.debtAmountUzs.toLocaleString('uz-UZ')} UZS
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedIntakeDetail(intake)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-950 font-bold transition-all"
                            >
                              Batafsil
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`${intake.intakeNumber} kirim hujjatini o'chirishni tasdiqlaysizmi?`)) {
                                  deleteStockIntake(intake.id);
                                  showToast("Kirim hujjati o'chirildi!");
                                }
                              }}
                              className="p-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>{editingSupplier ? "Postavshikni Tahrirlash" : "Yangi Postavshik Qo'shish"}</span>
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Postavshik Ismi / Ma'suli *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Jamshid aka"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Kompaniya / Zavod Nomi
                </label>
                <input
                  type="text"
                  placeholder="Masalan: SilkRoad Textiles LLC"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Telefon Raqami *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+998 90 123 45 67"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Manzili (Ombori)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Toshkent, Abu Sahiy B-12"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PAY SUPPLIER DEBT */}
      {payDebtSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>Postavshikka Qarz To'lash ({payDebtSupplier.name})</span>
              </h3>
              <button
                onClick={() => setPayDebtSupplier(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-bold flex justify-between">
              <span>Hozirgi Jami Qarzimiz:</span>
              <span className="font-black text-sm">{payDebtSupplier.debtBalanceUzs.toLocaleString('uz-UZ')} UZS</span>
            </div>

            <form onSubmit={handlePaySupplierDebtSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To'lanayotgan Summa (So'm) *</label>
                <input
                  type="number"
                  required
                  placeholder={`Maksimal: ${payDebtSupplier.debtBalanceUzs.toLocaleString('uz-UZ')}`}
                  value={payAmountUzs}
                  onChange={(e) => setPayAmountUzs(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To'lov Turi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('naqd')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === 'naqd'
                        ? 'bg-emerald-500 text-slate-950 font-extrabold border-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Naqd Pul
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('karta')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === 'karta'
                        ? 'bg-emerald-500 text-slate-950 font-extrabold border-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Karta
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Izoh</label>
                <input
                  type="text"
                  placeholder="Masalan: Kassa orqali naqd to'landi"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayDebtSupplier(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md"
                >
                  To'lovni Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INTAKE DETAIL VIEW */}
      {selectedIntakeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Kirim Hujjat #{selectedIntakeDetail.intakeNumber}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {new Date(selectedIntakeDetail.date).toLocaleString('uz-UZ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedIntakeDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-bold">
                <span>Postavshik:</span>
                <span className="text-amber-500">{selectedIntakeDetail.supplierName}</span>
              </div>

              <div className="space-y-1.5">
                <div className="font-extrabold uppercase text-[10px] text-slate-400">Tovarlar Ro'yxati:</div>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {selectedIntakeDetail.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col gap-1"
                    >
                      <div className="flex justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{item.productName} ({item.model || 'Standart'})</div>
                          <div className="text-[10px] text-slate-500">
                            {item.quantity} {item.unitType} x {item.costPriceUzs.toLocaleString('uz-UZ')} UZS
                            {item.costPriceUsd ? ` ($${item.costPriceUsd})` : ''}
                          </div>
                        </div>
                        <div className="font-black text-amber-500">
                          {item.totalAmountUzs.toLocaleString('uz-UZ')} UZS
                        </div>
                      </div>

                      {item.rollsList && item.rollsList.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px]">
                          <span className="font-bold text-amber-500">Rulonlar:</span>
                          {item.rollsList.map((rLen: number, rIdx: number) => (
                            <span key={rIdx} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-bold">
                              #{rIdx + 1}: {rLen}m
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Jami Summa:</span>
                  <span className="font-black text-sm">{selectedIntakeDetail.totalAmountUzs.toLocaleString('uz-UZ')} UZS</span>
                </div>
                <div className="flex justify-between text-emerald-500 font-bold">
                  <span>To'landi:</span>
                  <span>{selectedIntakeDetail.paidAmountUzs.toLocaleString('uz-UZ')} UZS</span>
                </div>
                <div className="flex justify-between text-red-500 font-bold">
                  <span>Qarz Qoldi:</span>
                  <span>{selectedIntakeDetail.debtAmountUzs.toLocaleString('uz-UZ')} UZS</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedIntakeDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
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
