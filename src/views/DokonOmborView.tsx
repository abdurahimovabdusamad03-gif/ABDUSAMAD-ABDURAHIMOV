import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { translations } from '../translations';
import { Product, UnitType } from '../types';
import {
  parseExcelFile,
  parseCSVToProductsList,
  parseRollsExpression,
  downloadExcelSampleTemplate,
  exportProductsToExcel,
  ImportedProductRaw,
} from '../utils/excelHelper';
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  X,
  DollarSign,
  TrendingUp,
  Pencil,
  Store,
  Warehouse,
  Save,
  Eye,
  Info,
  Barcode,
  Camera,
  ImageIcon,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Download,
  CheckSquare,
  Square,
  Layers,
  FileText,
} from 'lucide-react';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ImagePickerModal } from '../components/ImagePickerModal';
import { BarcodePrintModal } from '../components/BarcodePrintModal';

export const DokonOmborView: React.FC = () => {
  const {
    products,
    addProduct,
    addMultipleProducts,
    updateProduct,
    deleteProduct,
    deleteMultipleProducts,
    clearZeroStockProducts,
    clearAllProducts,
    transferStock,
    stockTransfers,
    settings,
  } = useERP();

  const t = translations[settings.language || 'uz'];
  const usdRate = settings.usdRate || 12030;

  // View Filter tab: 'all' | 'store' | 'warehouse'
  const [viewTab, setViewTab] = useState<'all' | 'store' | 'warehouse'>('all');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodePrintProducts, setBarcodePrintProducts] = useState<Product[]>([]);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [confirmWipeAll, setConfirmWipeAll] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Multi-select & Batch Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // File Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importTab, setImportTab] = useState<'upload' | 'paste' | 'preview'>('upload');
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedImportProducts, setParsedImportProducts] = useState<ImportedProductRaw[]>([]);
  const [importCurrencyMode, setImportCurrencyMode] = useState<'auto' | 'USD' | 'UZS'>('auto');
  const [importMergeDuplicates, setImportMergeDuplicates] = useState<boolean>(true);

  // Toggle selection for a product
  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CSV / Google Sheets Text Parser
  const parseCSVToProducts = (rawText: string) => {
    setImportError(null);
    if (!rawText.trim()) {
      setImportError("Iltimos, fayl biriktiring yoki CSV/Sheets matn kiriting!");
      return;
    }

    try {
      const items = parseCSVToProductsList(rawText, {
        usdRate,
        currencyMode: importCurrencyMode,
        mergeDuplicates: importMergeDuplicates,
      });

      if (items.length === 0) {
        setImportError("Fayldan tovarlar ajratib olinmadi. Ustunlarni tekshiring (Nomi, Model, Birlik, Tannarx, Sotish, Rulonlar).");
        return;
      }

      setParsedImportProducts(items);
      setImportTab('preview');
    } catch (err: any) {
      console.error("CSV parse error:", err);
      setImportError("CSV/Matnni tahlil qilishda xatolik yuz berdi.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      try {
        const buffer = await file.arrayBuffer();
        const items = await parseExcelFile(buffer, {
          usdRate,
          currencyMode: importCurrencyMode,
          mergeDuplicates: importMergeDuplicates,
        });
        if (items.length === 0) {
          setImportError("Excel faylida tovar ma'lumotlari topilmadi!");
          return;
        }
        setParsedImportProducts(items);
        setImportTab('preview');
      } catch (err: any) {
        console.error("Excel parse error:", err);
        setImportError("Excel faylini o'qishda xatolik yuz berdi. Fayl formati to'g'riligini tekshiring.");
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportText(content);
        parseCSVToProducts(content);
      };
      reader.readAsText(file);
    }
  };

  const handleExecuteImport = () => {
    if (parsedImportProducts.length === 0) return;

    const newProductsToInsert: Omit<Product, 'id'>[] = parsedImportProducts.map((item) => {
      const whQty = item.quantityWarehouse || 0;
      const storeQty = item.quantityStore || 0;

      let defaultCap = item.containerCapacity || (item.unitType === 'metr' ? 50 : item.unitType === 'kg' ? 25 : 10);

      let whContainers = Math.max(0, Math.ceil(whQty / defaultCap));
      let storeContainers = Math.max(0, Math.ceil(storeQty / defaultCap));

      let rollsList: number[] | undefined = undefined;
      let bagsList: number[] | undefined = undefined;
      let boxesList: number[] | undefined = undefined;

      if (item.containersList && item.containersList.length > 0) {
        whContainers = item.containersList.length;
        if (item.unitType === 'metr') rollsList = item.containersList;
        if (item.unitType === 'kg') bagsList = item.containersList;
        if (item.unitType === 'dona') boxesList = item.containersList;
      }

      return {
        name: item.name,
        model: item.model,
        unitType: item.unitType,
        costPrice: item.costPrice,
        costPriceUsd: item.costPriceUsd,
        salePrice: item.salePrice,
        salePriceUsd: item.salePriceUsd,
        minAlertStock: item.minAlertStock || 10,
        barcode: item.barcode,

        rollsInWarehouse: item.unitType === 'metr' ? whContainers : undefined,
        metersPerRoll: item.unitType === 'metr' ? defaultCap : undefined,
        totalMetersWarehouse: item.unitType === 'metr' ? whQty : undefined,
        rollsInStore: item.unitType === 'metr' ? storeContainers : 0,
        totalMetersStore: item.unitType === 'metr' ? storeQty : 0,
        warehouseRollsList: item.unitType === 'metr' ? rollsList : undefined,

        bagsInWarehouse: item.unitType === 'kg' ? whContainers : undefined,
        kgPerBag: item.unitType === 'kg' ? defaultCap : undefined,
        totalKgWarehouse: item.unitType === 'kg' ? whQty : undefined,
        bagsInStore: item.unitType === 'kg' ? storeContainers : 0,
        totalKgStore: item.unitType === 'kg' ? storeQty : 0,
        warehouseBagsList: item.unitType === 'kg' ? bagsList : undefined,

        boxesInWarehouse: item.unitType === 'dona' ? whContainers : undefined,
        itemsPerBox: item.unitType === 'dona' ? defaultCap : undefined,
        quantityWarehouse: item.unitType === 'dona' ? whQty : undefined,
        boxesInStore: item.unitType === 'dona' ? storeContainers : 0,
        quantityStore: item.unitType === 'dona' ? storeQty : 0,
        warehouseBoxesList: item.unitType === 'dona' ? boxesList : undefined,
      };
    });

    addMultipleProducts(newProductsToInsert);
    setShowImportModal(false);
    setParsedImportProducts([]);
    setImportText('');
    setDeleteNotice(`Muvaffaqiyatli! ${newProductsToInsert.length} ta tovar Excel/Sheets va fayldan import qilindi.`);
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = `Tovar Nomi,Modeli / Artikul,Birlik,Tannarx ($ yoki So'm),Sotish Narxi ($ yoki So'm),Rulonlar Metraji (1 yacheykada + bilan),Do'kon Qoldiq,Rulon 1,Rulon 2,Rulon 3,Rulon 4,Shtrix-kod,Min Qoldiq\n5942,3002,metr,$4.4,$6.5,50+45.5+74.3,0,,,,478123456781,20\nGilam Silk Royal,Classic Gold,metr,$5.5,$8.0,,0,50,45.5,60,38.5,478123456782,20\nMato Shoyi Atlas,Art-770,metr,56000,85000,32+28.5+45+50,28.5,,,,478123456783,15\nSement Qizilqum,M500 50kg,kg,$4.2,$5.8,50+50+50+50+50,50,50,50,50,50,478123456784,100\nLaminat Swiss,Oak 8mm,dona,85000,115000,10+10+10+10,10,10,10,10,10,478123456785,15`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tovarlar_import_namuna.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete Selected Products
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    deleteMultipleProducts(selectedIds);
    setSelectedIds([]);
    setDeleteNotice(`${count} ta tanlangan tovar o'chirildi.`);
  };

  // Clear Out-Of-Stock (Zero Stock) Products
  const handleClearZeroStock = () => {
    const zeroCount = products.filter((p) => {
      const wh = p.unitType === 'metr' ? p.totalMetersWarehouse || 0 : p.unitType === 'kg' ? p.totalKgWarehouse || 0 : p.quantityWarehouse || 0;
      const store = p.unitType === 'metr' ? p.totalMetersStore || 0 : p.unitType === 'kg' ? p.totalKgStore || 0 : p.quantityStore || 0;
      return wh + store <= 0;
    }).length;

    if (zeroCount === 0) {
      setDeleteNotice("Tizimda stogi 0 bo'lgan (tugagan) tovarlar yo'q.");
      return;
    }

    const deleted = clearZeroStockProducts();
    setSelectedIds([]);
    setDeleteNotice(`Muvaffaqiyatli! ${deleted} ta keraksiz (tugagan) tovar o'chirildi.`);
  };

  // Helper to extract individual container breakdown (rolls / bags / boxes)
  const getProductContainers = (p: Product, location: 'warehouse' | 'store') => {
    const isWh = location === 'warehouse';
    if (p.unitType === 'metr') {
      const list = isWh ? p.warehouseRollsList : p.storeRollsList;
      const count = isWh ? (p.rollsInWarehouse || 0) : (p.rollsInStore || 0);
      const total = isWh ? (p.totalMetersWarehouse || 0) : (p.totalMetersStore || 0);

      let items: number[] = [];
      if (list && list.length > 0) {
        items = list;
      } else if (count > 0) {
        const avg = p.metersPerRoll || (total > 0 ? Math.round((total / count) * 10) / 10 : 50);
        items = Array(count).fill(avg);
      }
      return items.map((val, idx) => ({
        num: idx + 1,
        label: `${idx + 1}-Rulon`,
        shortLabel: `${val}m`,
        value: val,
        unit: 'metr',
      }));
    } else if (p.unitType === 'kg') {
      const list = isWh ? p.warehouseBagsList : p.storeBagsList;
      const count = isWh ? (p.bagsInWarehouse || 0) : (p.bagsInStore || 0);
      const total = isWh ? (p.totalKgWarehouse || 0) : (p.totalKgStore || 0);

      let items: number[] = [];
      if (list && list.length > 0) {
        items = list;
      } else if (count > 0) {
        const avg = p.kgPerBag || (total > 0 ? Math.round((total / count) * 10) / 10 : 25);
        items = Array(count).fill(avg);
      }
      return items.map((val, idx) => ({
        num: idx + 1,
        label: `${idx + 1}-Qop`,
        shortLabel: `${val}kg`,
        value: val,
        unit: 'kg',
      }));
    } else {
      // dona
      const list = isWh ? p.warehouseBoxesList : p.storeBoxesList;
      const count = isWh ? (p.boxesInWarehouse || 0) : (p.boxesInStore || 0);
      const total = isWh ? (p.quantityWarehouse || 0) : (p.quantityStore || 0);

      let items: number[] = [];
      if (list && list.length > 0) {
        items = list;
      } else if (count > 0) {
        const avg = p.itemsPerBox || (total > 0 ? Math.round((total / count) * 10) / 10 : 10);
        items = Array(count).fill(avg);
      }
      return items.map((val, idx) => ({
        num: idx + 1,
        label: `${idx + 1}-Karopka`,
        shortLabel: `${val}dona`,
        value: val,
        unit: 'dona',
      }));
    }
  };

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const showEditModal = !!editingProduct;
  const [editName, setEditName] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editCostCurrency, setEditCostCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [editCostInput, setEditCostInput] = useState<number>(0);
  const [editSaleCurrency, setEditSaleCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [editSaleInput, setEditSaleInput] = useState<number>(0);
  const [editWhQty, setEditWhQty] = useState<number>(0);
  const [editStoreQty, setEditStoreQty] = useState<number>(0);
  const [editMinAlert, setEditMinAlert] = useState<number>(10);
  const [editBarcode, setEditBarcode] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Individual rolls/containers state in Edit Modal
  const [editWhRollsList, setEditWhRollsList] = useState<number[]>([]);
  const [editStoreRollsList, setEditStoreRollsList] = useState<number[]>([]);
  const [editNewRollInput, setEditNewRollInput] = useState<string>('');
  const [editNewStoreRollInput, setEditNewStoreRollInput] = useState<string>('');

  const [editWhBagsList, setEditWhBagsList] = useState<number[]>([]);
  const [editStoreBagsList, setEditStoreBagsList] = useState<number[]>([]);
  const [editNewBagInput, setEditNewBagInput] = useState<string>('');

  const [editWhBoxesList, setEditWhBoxesList] = useState<number[]>([]);
  const [editStoreBoxesList, setEditStoreBoxesList] = useState<number[]>([]);
  const [editNewBoxInput, setEditNewBoxInput] = useState<string>('');

  // Add / Remove Roll in Edit Modal
  const handleAddEditWhRoll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseRollsExpression(editNewRollInput);
    if (parsed.length > 0) {
      setEditWhRollsList((prev) => [...prev, ...parsed]);
      setEditNewRollInput('');
    }
  };

  const handleRemoveEditWhRoll = (index: number) => {
    setEditWhRollsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddEditStoreRoll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseRollsExpression(editNewStoreRollInput);
    if (parsed.length > 0) {
      setEditStoreRollsList((prev) => [...prev, ...parsed]);
      setEditNewStoreRollInput('');
    }
  };

  const handleRemoveEditStoreRoll = (index: number) => {
    setEditStoreRollsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Open Edit Modal with product prefilled
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditModel(p.model);

    const hasCostUsd = !!p.costPriceUsd && p.costPriceUsd > 0;
    setEditCostCurrency(hasCostUsd ? 'USD' : 'UZS');
    setEditCostInput(hasCostUsd ? p.costPriceUsd! : (p.costPrice || 0));

    const hasSaleUsd = !!p.salePriceUsd && p.salePriceUsd > 0;
    setEditSaleCurrency(hasSaleUsd ? 'USD' : 'UZS');
    setEditSaleInput(hasSaleUsd ? p.salePriceUsd! : (p.salePrice || 0));

    setEditMinAlert(p.minAlertStock || 10);
    setEditBarcode(p.barcode || '');
    setEditImageUrl(p.imageUrl || '');

    const wh = p.unitType === 'metr' ? p.totalMetersWarehouse || 0 : p.unitType === 'kg' ? p.totalKgWarehouse || 0 : p.quantityWarehouse || 0;
    const st = p.unitType === 'metr' ? p.totalMetersStore || 0 : p.unitType === 'kg' ? p.totalKgStore || 0 : p.quantityStore || 0;

    setEditWhQty(wh);
    setEditStoreQty(st);

    setEditWhRollsList(p.warehouseRollsList ? [...p.warehouseRollsList] : (p.unitType === 'metr' && (p.totalMetersWarehouse || 0) > 0 ? [p.totalMetersWarehouse!] : []));
    setEditStoreRollsList(p.storeRollsList ? [...p.storeRollsList] : (p.unitType === 'metr' && (p.totalMetersStore || 0) > 0 ? [p.totalMetersStore!] : []));
    setEditNewRollInput('');
    setEditNewStoreRollInput('');

    setEditWhBagsList(p.warehouseBagsList ? [...p.warehouseBagsList] : []);
    setEditStoreBagsList(p.storeBagsList ? [...p.storeBagsList] : []);
    setEditNewBagInput('');

    setEditWhBoxesList(p.warehouseBoxesList ? [...p.warehouseBoxesList] : []);
    setEditStoreBoxesList(p.storeBoxesList ? [...p.storeBoxesList] : []);
    setEditNewBoxInput('');
  };

  // Save Edit Product
  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editName.trim() || !editModel.trim()) {
      alert("Iltimos, tovar nomi va modelini kiriting!");
      return;
    }

    let finalCostPrice = 0;
    let finalCostPriceUsd: number | undefined = undefined;
    if (editCostCurrency === 'USD') {
      finalCostPriceUsd = Math.round(editCostInput * 100) / 100;
      finalCostPrice = Math.round(finalCostPriceUsd * usdRate);
    } else {
      finalCostPrice = Math.round(editCostInput);
      finalCostPriceUsd = finalCostPrice > 0 ? Math.round((finalCostPrice / usdRate) * 100) / 100 : 0;
    }

    let finalSalePrice = 0;
    let finalSalePriceUsd: number | undefined = undefined;
    if (editSaleCurrency === 'USD') {
      finalSalePriceUsd = Math.round(editSaleInput * 100) / 100;
      finalSalePrice = Math.round(finalSalePriceUsd * usdRate);
    } else {
      finalSalePrice = Math.round(editSaleInput);
      finalSalePriceUsd = finalSalePrice > 0 ? Math.round((finalSalePrice / usdRate) * 100) / 100 : 0;
    }

    const updatedFields: Partial<Product> = {
      name: editName,
      model: editModel,
      costPrice: finalCostPrice,
      costPriceUsd: finalCostPriceUsd,
      salePrice: finalSalePrice,
      salePriceUsd: finalSalePriceUsd,
      minAlertStock: editMinAlert,
      barcode: editBarcode || undefined,
      imageUrl: editImageUrl || undefined,
    };

    if (editingProduct.unitType === 'metr') {
      const avgMeters = editingProduct.metersPerRoll || 50;
      if (editWhRollsList.length > 0) {
        const whSum = Math.round(editWhRollsList.reduce((a, b) => a + b, 0) * 100) / 100;
        updatedFields.warehouseRollsList = editWhRollsList;
        updatedFields.rollsInWarehouse = editWhRollsList.length;
        updatedFields.totalMetersWarehouse = whSum;
      } else {
        updatedFields.warehouseRollsList = undefined;
        updatedFields.totalMetersWarehouse = editWhQty;
        updatedFields.rollsInWarehouse = Math.ceil(editWhQty / avgMeters);
      }

      if (editStoreRollsList.length > 0) {
        const stSum = Math.round(editStoreRollsList.reduce((a, b) => a + b, 0) * 100) / 100;
        updatedFields.storeRollsList = editStoreRollsList;
        updatedFields.rollsInStore = editStoreRollsList.length;
        updatedFields.totalMetersStore = stSum;
      } else {
        updatedFields.storeRollsList = undefined;
        updatedFields.totalMetersStore = editStoreQty;
        updatedFields.rollsInStore = Math.ceil(editStoreQty / avgMeters);
      }
    } else if (editingProduct.unitType === 'kg') {
      const avgKg = editingProduct.kgPerBag || 25;
      if (editWhBagsList.length > 0) {
        const whSum = Math.round(editWhBagsList.reduce((a, b) => a + b, 0) * 100) / 100;
        updatedFields.warehouseBagsList = editWhBagsList;
        updatedFields.bagsInWarehouse = editWhBagsList.length;
        updatedFields.totalKgWarehouse = whSum;
      } else {
        updatedFields.warehouseBagsList = undefined;
        updatedFields.totalKgWarehouse = editWhQty;
        updatedFields.bagsInWarehouse = Math.ceil(editWhQty / avgKg);
      }

      if (editStoreBagsList.length > 0) {
        const stSum = Math.round(editStoreBagsList.reduce((a, b) => a + b, 0) * 100) / 100;
        updatedFields.storeBagsList = editStoreBagsList;
        updatedFields.bagsInStore = editStoreBagsList.length;
        updatedFields.totalKgStore = stSum;
      } else {
        updatedFields.storeBagsList = undefined;
        updatedFields.totalKgStore = editStoreQty;
        updatedFields.bagsInStore = Math.ceil(editStoreQty / avgKg);
      }
    } else {
      const avgItems = editingProduct.itemsPerBox || 10;
      if (editWhBoxesList.length > 0) {
        const whSum = Math.round(editWhBoxesList.reduce((a, b) => a + b, 0) * 100) / 100;
        updatedFields.warehouseBoxesList = editWhBoxesList;
        updatedFields.boxesInWarehouse = editWhBoxesList.length;
        updatedFields.quantityWarehouse = whSum;
      } else {
        updatedFields.warehouseBoxesList = undefined;
        updatedFields.quantityWarehouse = editWhQty;
        updatedFields.boxesInWarehouse = Math.ceil(editWhQty / avgItems);
      }

      if (editStoreBoxesList.length > 0) {
        const stSum = Math.round(editStoreBoxesList.reduce((a, b) => a + b, 0) * 100) / 100;
        updatedFields.storeBoxesList = editStoreBoxesList;
        updatedFields.boxesInStore = editStoreBoxesList.length;
        updatedFields.quantityStore = stSum;
      } else {
        updatedFields.storeBoxesList = undefined;
        updatedFields.quantityStore = editStoreQty;
        updatedFields.boxesInStore = Math.ceil(editStoreQty / avgItems);
      }
    }

    updateProduct(editingProduct.id, updatedFields);
    setEditingProduct(null);
  };

  // New Product Form state
  const [pName, setPName] = useState('');
  const [pModel, setPModel] = useState('');
  const [pUnitType, setPUnitType] = useState<UnitType>('metr');
  const [pLocation, setPLocation] = useState<'store' | 'warehouse' | 'both'>('warehouse');
  const [pMinAlert, setPMinAlert] = useState<number>(10);
  const [pBarcode, setPBarcode] = useState('');
  const [pImageUrl, setPImageUrl] = useState('');

  // Barcode & Image Modals State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerMode, setScannerMode] = useState<'search' | 'add' | 'edit'>('search');

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<'add' | 'edit'>('add');

  // Helper to generate a 12-digit Barcode starting with Uzbekistan 478 prefix
  const generateNewBarcode = () => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
    return `478${randomDigits}`;
  };

  // Barcode scanned callback
  const handleBarcodeScanned = (scannedCode: string) => {
    if (scannerMode === 'search') {
      setSearchTerm(scannedCode);
      const matched = products.find((p) => p.barcode?.toLowerCase() === scannedCode.toLowerCase());
      if (matched) {
        setDetailProduct(matched);
      }
    } else if (scannerMode === 'add') {
      setPBarcode(scannedCode);
    } else if (scannerMode === 'edit') {
      setEditBarcode(scannedCode);
    }
  };

  // Prices and Currency Toggles
  const [costCurrency, setCostCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [saleCurrency, setSaleCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [pCostInput, setPCostInput] = useState<number>(0);
  const [pSaleInput, setPSaleInput] = useState<number>(0);

  // Dynamic Lists of Roll / Bag / Box lengths for New Product
  const [rollList, setRollList] = useState<number[]>([]);
  const [newRollInput, setNewRollInput] = useState<string>('');

  const [bagList, setBagList] = useState<number[]>([]);
  const [newBagInput, setNewBagInput] = useState<string>('');

  const [boxList, setBoxList] = useState<number[]>([]);
  const [newBoxInput, setNewBoxInput] = useState<string>('');

  // Fallback single batch values
  const [pRollsWh, setPRollsWh] = useState<number>(1);
  const [pMetersPerRoll, setPMetersPerRoll] = useState<number>(50);

  const [pBagsWh, setPBagsWh] = useState<number>(1);
  const [pKgPerBag, setPKgPerBag] = useState<number>(25);

  const [pBoxesWh, setPBoxesWh] = useState<number>(1);
  const [pItemsPerBox, setPItemsPerBox] = useState<number>(10);

  // Calculate total stock from rolls / bags / boxes list or fallback
  const calculatedTotalStock = useMemo(() => {
    if (pUnitType === 'metr') {
      if (rollList.length > 0) return rollList.reduce((a, b) => a + b, 0);
      return pRollsWh * pMetersPerRoll;
    }
    if (pUnitType === 'kg') {
      if (bagList.length > 0) return bagList.reduce((a, b) => a + b, 0);
      return pBagsWh * pKgPerBag;
    }
    if (boxList.length > 0) return boxList.reduce((a, b) => a + b, 0);
    return pBoxesWh * pItemsPerBox;
  }, [pUnitType, rollList, pRollsWh, pMetersPerRoll, bagList, pBagsWh, pKgPerBag, boxList, pBoxesWh, pItemsPerBox]);

  const calculatedContainerCount = useMemo(() => {
    if (pUnitType === 'metr') return rollList.length > 0 ? rollList.length : pRollsWh;
    if (pUnitType === 'kg') return bagList.length > 0 ? bagList.length : pBagsWh;
    return boxList.length > 0 ? boxList.length : pBoxesWh;
  }, [pUnitType, rollList, pRollsWh, bagList, pBagsWh, boxList, pBoxesWh]);

  // Add / Remove Roll Handlers
  const handleAddRoll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseRollsExpression(newRollInput);
    if (parsed.length > 0) {
      setRollList((prev) => [...prev, ...parsed]);
      setNewRollInput('');
    }
  };

  const handleRemoveRoll = (index: number) => {
    setRollList((prev) => prev.filter((_, i) => i !== index));
  };

  // Add / Remove Bag Handlers
  const handleAddBag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseRollsExpression(newBagInput);
    if (parsed.length > 0) {
      setBagList((prev) => [...prev, ...parsed]);
      setNewBagInput('');
    }
  };

  const handleRemoveBag = (index: number) => {
    setBagList((prev) => prev.filter((_, i) => i !== index));
  };

  // Add / Remove Box Handlers
  const handleAddBox = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseRollsExpression(newBoxInput);
    if (parsed.length > 0) {
      setBoxList((prev) => [...prev, ...parsed]);
      setNewBoxInput('');
    }
  };

  const handleRemoveBox = (index: number) => {
    setBoxList((prev) => prev.filter((_, i) => i !== index));
  };

  // Transfer Form state
  const [transferProductId, setTransferProductId] = useState('');
  const [transferSearch, setTransferSearch] = useState('');
  const [selectedContainerIndices, setSelectedContainerIndices] = useState<number[]>([]);
  const [transferByContainer, setTransferByContainer] = useState<boolean>(true);
  const [transferContainerCount, setTransferContainerCount] = useState<number>(1);
  const [transferDirectQty, setTransferDirectQty] = useState<number>(10);

  const selectedTransferProduct = products.find((p) => p.id === transferProductId);

  // Available containers (individual roll lengths, bag weights, or box sizes in warehouse)
  const availableWarehouseContainers = useMemo(() => {
    if (!selectedTransferProduct) return [];
    if (selectedTransferProduct.unitType === 'metr') {
      if (selectedTransferProduct.warehouseRollsList && selectedTransferProduct.warehouseRollsList.length > 0) {
        return selectedTransferProduct.warehouseRollsList;
      }
      const count = selectedTransferProduct.rollsInWarehouse || 0;
      const per = selectedTransferProduct.metersPerRoll || (count > 0 ? Math.round((selectedTransferProduct.totalMetersWarehouse || 0) / count) : 50);
      return Array(count).fill(per);
    } else if (selectedTransferProduct.unitType === 'kg') {
      if (selectedTransferProduct.warehouseBagsList && selectedTransferProduct.warehouseBagsList.length > 0) {
        return selectedTransferProduct.warehouseBagsList;
      }
      const count = selectedTransferProduct.bagsInWarehouse || 0;
      const per = selectedTransferProduct.kgPerBag || (count > 0 ? Math.round((selectedTransferProduct.totalKgWarehouse || 0) / count) : 25);
      return Array(count).fill(per);
    } else {
      if (selectedTransferProduct.warehouseBoxesList && selectedTransferProduct.warehouseBoxesList.length > 0) {
        return selectedTransferProduct.warehouseBoxesList;
      }
      const count = selectedTransferProduct.boxesInWarehouse || 0;
      const per = selectedTransferProduct.itemsPerBox || (count > 0 ? Math.round((selectedTransferProduct.quantityWarehouse || 0) / count) : 10);
      return Array(count).fill(per);
    }
  }, [selectedTransferProduct]);

  // Selected containers total quantity
  const selectedContainersTotalQty = useMemo(() => {
    return selectedContainerIndices.reduce((sum, idx) => sum + (availableWarehouseContainers[idx] || 0), 0);
  }, [selectedContainerIndices, availableWarehouseContainers]);

  // Toggle selection of a specific container index
  const toggleSelectContainer = (index: number) => {
    setSelectedContainerIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAllContainers = () => {
    setSelectedContainerIndices(availableWarehouseContainers.map((_, i) => i));
  };

  const handleClearSelectedContainers = () => {
    setSelectedContainerIndices([]);
  };

  // Filter products for transfer modal search
  const filteredTransferProducts = useMemo(() => {
    const term = transferSearch.toLowerCase().trim();
    if (!term) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(term) || p.model.toLowerCase().includes(term)
    );
  }, [products, transferSearch]);

  // Calculate container capacity for selected transfer product
  const containerCapacity = useMemo(() => {
    if (!selectedTransferProduct) return 1;
    if (selectedTransferProduct.unitType === 'metr') return selectedTransferProduct.metersPerRoll || 50;
    if (selectedTransferProduct.unitType === 'kg') return selectedTransferProduct.kgPerBag || 25;
    return selectedTransferProduct.itemsPerBox || 10;
  }, [selectedTransferProduct]);

  // Actual quantity being transferred
  const actualTransferQty = useMemo(() => {
    if (selectedContainerIndices.length > 0) {
      return selectedContainersTotalQty;
    }
    return transferByContainer
      ? transferContainerCount * containerCapacity
      : transferDirectQty;
  }, [selectedContainerIndices, selectedContainersTotalQty, transferByContainer, transferContainerCount, containerCapacity, transferDirectQty]);

  // Count of items in Store and Warehouse
  const storeItemsCount = useMemo(() => {
    return products.filter((p) => {
      const storeQty = p.unitType === 'metr' ? p.totalMetersStore || 0 : p.unitType === 'kg' ? p.totalKgStore || 0 : p.quantityStore || 0;
      return storeQty > 0;
    }).length;
  }, [products]);

  const warehouseItemsCount = useMemo(() => {
    return products.filter((p) => {
      const whQty = p.unitType === 'metr' ? p.totalMetersWarehouse || 0 : p.unitType === 'kg' ? p.totalKgWarehouse || 0 : p.quantityWarehouse || 0;
      return whQty > 0;
    }).length;
  }, [products]);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.model.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.toLowerCase().includes(term));
    if (!matchesSearch) return false;

    const whQty = p.unitType === 'metr' ? p.totalMetersWarehouse || 0 : p.unitType === 'kg' ? p.totalKgWarehouse || 0 : p.quantityWarehouse || 0;
    const storeQty = p.unitType === 'metr' ? p.totalMetersStore || 0 : p.unitType === 'kg' ? p.totalKgStore || 0 : p.quantityStore || 0;

    if (viewTab === 'store') return storeQty > 0;
    if (viewTab === 'warehouse') return whQty > 0;
    return true;
  });

  // Dynamic Overall Inventory Statistics (Eng tepadagi xulosa)
  const summaryStats = useMemo(() => {
    let totalTypes = 0;
    let totalUnits = 0;
    let totalCostUzs = 0;
    let totalSaleUzs = 0;

    products.forEach((p) => {
      const whQty =
        p.unitType === 'metr'
          ? p.totalMetersWarehouse || 0
          : p.unitType === 'kg'
          ? p.totalKgWarehouse || 0
          : p.quantityWarehouse || 0;

      const storeQty =
        p.unitType === 'metr'
          ? p.totalMetersStore || 0
          : p.unitType === 'kg'
          ? p.totalKgStore || 0
          : p.quantityStore || 0;

      let qty = 0;
      if (viewTab === 'all') {
        qty = whQty + storeQty;
      } else if (viewTab === 'store') {
        qty = storeQty;
      } else {
        qty = whQty;
      }

      if (qty > 0 || viewTab === 'all') {
        if (qty > 0) totalTypes += 1;
        totalUnits += qty;
        totalCostUzs += qty * (p.costPrice || 0);
        totalSaleUzs += qty * (p.salePrice || 0);
      }
    });

    const totalCostUsd = totalCostUzs / usdRate;
    const totalSaleUsd = totalSaleUzs / usdRate;

    return {
      totalTypes: viewTab === 'all' ? products.length : totalTypes,
      totalUnits,
      totalCostUzs,
      totalCostUsd,
      totalSaleUzs,
      totalSaleUsd,
    };
  }, [products, viewTab, usdRate]);

  // Open Add Product Modal with proper initial state
  const handleOpenAddModal = () => {
    setPLocation(viewTab === 'store' ? 'store' : 'warehouse');
    setPName('');
    setPModel('');
    setPUnitType('metr');
    setPMinAlert(10);
    setPBarcode(generateNewBarcode());
    setPImageUrl('');
    setPCostInput(0);
    setPSaleInput(0);
    setRollList([]);
    setBagList([]);
    setBoxList([]);
    setPRollsWh(1);
    setPMetersPerRoll(50);
    setPBagsWh(1);
    setPKgPerBag(25);
    setPBoxesWh(1);
    setPItemsPerBox(10);
    setShowAddModal(true);
  };

  // Submit New Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pModel) {
      alert("Iltimos, tovar nomi va modelini kiriting!");
      return;
    }

    const costPriceUzs = costCurrency === 'USD' ? Math.round(pCostInput * usdRate) : pCostInput;
    const salePriceUzs = pSaleInput > 0
      ? (saleCurrency === 'USD' ? Math.round(pSaleInput * usdRate) : pSaleInput)
      : costPriceUzs;

    const totalQty = calculatedTotalStock > 0 ? calculatedTotalStock : 1;
    const containerCount = calculatedContainerCount > 0 ? calculatedContainerCount : 1;
    const avgCapacity = containerCount > 0 ? Math.max(1, Math.round(totalQty / containerCount)) : 1;

    let rollsWh = 0, metersWh = 0, whRollsList: number[] = [];
    let rollsSt = 0, metersSt = 0, stRollsList: number[] = [];

    let bagsWh = 0, kgWh = 0, whBagsList: number[] = [];
    let bagsSt = 0, kgSt = 0, stBagsList: number[] = [];

    let boxesWh = 0, qtyWh = 0, whBoxesList: number[] = [];
    let boxesSt = 0, qtySt = 0, stBoxesList: number[] = [];

    if (pLocation === 'store') {
      if (pUnitType === 'metr') {
        rollsSt = containerCount;
        metersSt = totalQty;
        stRollsList = rollList.length > 0 ? [...rollList] : Array(containerCount).fill(avgCapacity);
      } else if (pUnitType === 'kg') {
        bagsSt = containerCount;
        kgSt = totalQty;
        stBagsList = bagList.length > 0 ? [...bagList] : Array(containerCount).fill(avgCapacity);
      } else {
        boxesSt = containerCount;
        qtySt = totalQty;
        stBoxesList = boxList.length > 0 ? [...boxList] : Array(containerCount).fill(avgCapacity);
      }
    } else if (pLocation === 'warehouse') {
      if (pUnitType === 'metr') {
        rollsWh = containerCount;
        metersWh = totalQty;
        whRollsList = rollList.length > 0 ? [...rollList] : Array(containerCount).fill(avgCapacity);
      } else if (pUnitType === 'kg') {
        bagsWh = containerCount;
        kgWh = totalQty;
        whBagsList = bagList.length > 0 ? [...bagList] : Array(containerCount).fill(avgCapacity);
      } else {
        boxesWh = containerCount;
        qtyWh = totalQty;
        whBoxesList = boxList.length > 0 ? [...boxList] : Array(containerCount).fill(avgCapacity);
      }
    } else {
      // Both (Ikkalasiga)
      const halfContainer = Math.max(1, Math.floor(containerCount / 2));
      const remainingContainer = Math.max(1, containerCount - halfContainer);
      const halfQty = Math.round(totalQty / 2);
      const remainingQty = totalQty - halfQty;

      if (pUnitType === 'metr') {
        rollsSt = halfContainer;
        metersSt = halfQty;
        stRollsList = Array(halfContainer).fill(Math.max(1, Math.round(halfQty / halfContainer)));
        rollsWh = remainingContainer;
        metersWh = remainingQty;
        whRollsList = Array(remainingContainer).fill(Math.max(1, Math.round(remainingQty / remainingContainer)));
      } else if (pUnitType === 'kg') {
        bagsSt = halfContainer;
        kgSt = halfQty;
        stBagsList = Array(halfContainer).fill(Math.max(1, Math.round(halfQty / halfContainer)));
        bagsWh = remainingContainer;
        kgWh = remainingQty;
        whBagsList = Array(remainingContainer).fill(Math.max(1, Math.round(remainingQty / remainingContainer)));
      } else {
        boxesSt = halfContainer;
        qtySt = halfQty;
        stBoxesList = Array(halfContainer).fill(Math.max(1, Math.round(halfQty / halfContainer)));
        boxesWh = remainingContainer;
        qtyWh = remainingQty;
        whBoxesList = Array(remainingContainer).fill(Math.max(1, Math.round(remainingQty / remainingContainer)));
      }
    }

    const costPriceUsd = costCurrency === 'USD' ? pCostInput : (pCostInput > 0 ? Math.round((costPriceUzs / usdRate) * 100) / 100 : undefined);
    const salePriceUsd = saleCurrency === 'USD' ? pSaleInput : (salePriceUzs > 0 ? Math.round((salePriceUzs / usdRate) * 100) / 100 : undefined);

    addProduct({
      name: pName.trim(),
      model: pModel.trim(),
      unitType: pUnitType,
      costPrice: costPriceUzs,
      costPriceUsd: costPriceUsd,
      salePrice: salePriceUzs,
      salePriceUsd: salePriceUsd,
      minAlertStock: pMinAlert,
      barcode: pBarcode.trim() || generateNewBarcode(),
      imageUrl: pImageUrl.trim() || undefined,

      rollsInWarehouse: pUnitType === 'metr' ? rollsWh : undefined,
      metersPerRoll: pUnitType === 'metr' ? avgCapacity : undefined,
      totalMetersWarehouse: pUnitType === 'metr' ? metersWh : undefined,
      warehouseRollsList: pUnitType === 'metr' ? whRollsList : undefined,
      rollsInStore: pUnitType === 'metr' ? rollsSt : undefined,
      totalMetersStore: pUnitType === 'metr' ? metersSt : undefined,
      storeRollsList: pUnitType === 'metr' ? stRollsList : undefined,

      bagsInWarehouse: pUnitType === 'kg' ? bagsWh : undefined,
      kgPerBag: pUnitType === 'kg' ? avgCapacity : undefined,
      totalKgWarehouse: pUnitType === 'kg' ? kgWh : undefined,
      warehouseBagsList: pUnitType === 'kg' ? whBagsList : undefined,
      bagsInStore: pUnitType === 'kg' ? bagsSt : undefined,
      totalKgStore: pUnitType === 'kg' ? kgSt : undefined,
      storeBagsList: pUnitType === 'kg' ? stBagsList : undefined,

      boxesInWarehouse: pUnitType === 'dona' ? boxesWh : undefined,
      itemsPerBox: pUnitType === 'dona' ? avgCapacity : undefined,
      quantityWarehouse: pUnitType === 'dona' ? qtyWh : undefined,
      warehouseBoxesList: pUnitType === 'dona' ? whBoxesList : undefined,
      boxesInStore: pUnitType === 'dona' ? boxesSt : undefined,
      quantityStore: pUnitType === 'dona' ? qtySt : undefined,
      storeBoxesList: pUnitType === 'dona' ? stBoxesList : undefined,
    });

    setShowAddModal(false);
    setPName('');
    setPModel('');
    setPBarcode('');
    setPImageUrl('');
    setPCostInput(0);
    setPSaleInput(0);
    setRollList([]);
    setBagList([]);
    setBoxList([]);
  };

  // Submit Transfer
  const handleExecuteTransfer = () => {
    if (!selectedTransferProduct || actualTransferQty <= 0) return;

    let unitsCountObj: { rolls?: number; bags?: number; boxes?: number } | undefined = undefined;
    let selectedValuesArray: number[] | undefined = undefined;

    if (selectedContainerIndices.length > 0) {
      selectedValuesArray = selectedContainerIndices.map((idx) => availableWarehouseContainers[idx]);
      const count = selectedContainerIndices.length;
      if (selectedTransferProduct.unitType === 'metr') unitsCountObj = { rolls: count };
      else if (selectedTransferProduct.unitType === 'kg') unitsCountObj = { bags: count };
      else unitsCountObj = { boxes: count };
    } else if (transferByContainer) {
      if (selectedTransferProduct.unitType === 'metr') unitsCountObj = { rolls: transferContainerCount };
      else if (selectedTransferProduct.unitType === 'kg') unitsCountObj = { bags: transferContainerCount };
      else unitsCountObj = { boxes: transferContainerCount };
    }

    const ok = transferStock(selectedTransferProduct.id, actualTransferQty, unitsCountObj, selectedValuesArray);
    if (ok) {
      setShowTransferModal(false);
      setTransferProductId('');
      setSelectedContainerIndices([]);
      setTransferSearch('');
    } else {
      alert("Omborda yetarli tovar mavjud emas!");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-5 pb-20">
      
      {/* TOP HEADER WITH ACTIONS */}
      <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between transition-colors">
        
        {/* Title & Secondary Quick Icons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-500/20 text-amber-500">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white">{t.dokon_ombor}</h2>
            </div>
          </div>

          {/* Quick Action Icons on Mobile */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-all active:scale-95"
              title="Tovarlarni o'chirish"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exportProductsToExcel(products)}
              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all active:scale-95"
              title="Excel Export"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-1 sm:gap-2">
          {/* Delete Button (Desktop) */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="hidden sm:flex px-2.5 py-1.5 sm:py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all items-center gap-1 shrink-0 active:scale-95"
            title="Tovarlarni o'chirish"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden md:inline">O'chirish</span>
          </button>

          {/* Excel Export (Desktop) */}
          <button
            type="button"
            onClick={() => exportProductsToExcel(products)}
            className="hidden sm:flex px-2.5 py-1.5 sm:py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-extrabold transition-all items-center gap-1.5 shrink-0 active:scale-95"
            title="Excel Export"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => {
              setImportText('');
              setParsedImportProducts([]);
              setImportError(null);
              setImportTab('upload');
              setShowImportModal(true);
            }}
            className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-[11px] sm:text-xs font-extrabold shadow-sm active:scale-95 flex items-center justify-center gap-1 transition-all shrink-0"
            title="Import"
          >
            <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">Import</span>
          </button>

          {/* Transfer Button */}
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-black border-b-2 sm:border-b-4 border-indigo-900 shadow-sm active:translate-y-0.5 flex items-center justify-center gap-1 transition-all shrink-0"
          >
            <ArrowRightLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-200 shrink-0" />
            <span className="truncate">{t.transfer}</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={handleOpenAddModal}
            className="px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] sm:text-xs border-b-2 sm:border-b-4 border-amber-700 shadow-sm active:translate-y-0.5 flex items-center justify-center gap-1 transition-all shrink-0"
          >
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">+ Tovar</span>
          </button>
        </div>

      </div>

      {/* OVERALL STOCK STATS / SUMMARY CARDS (COMPACT MOBILE & DESKTOP) */}
      <div className="grid grid-cols-3 gap-1 sm:gap-4">
        
        {/* Total Types & Units */}
        <div className="p-1.5 sm:p-3.5 rounded-lg sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 sm:gap-3 min-w-0">
          <div className="p-1 sm:p-2.5 rounded-md sm:rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Package className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[8px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">
              {viewTab === 'all' ? 'JAMI' : viewTab === 'store' ? t.store : t.warehouse}
            </div>
            <div className="text-[11px] sm:text-lg font-black text-slate-900 dark:text-white truncate leading-tight">
              {summaryStats.totalUnits.toLocaleString()}
            </div>
            <div className="text-[7.5px] sm:text-[10px] text-slate-400 font-medium truncate">
              {summaryStats.totalTypes} xil
            </div>
          </div>
        </div>

        {/* Total Cost Value */}
        <div className="p-1.5 sm:p-3.5 rounded-lg sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 sm:gap-3 min-w-0">
          <div className="p-1 sm:p-2.5 rounded-md sm:rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <DollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[8px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">
              TANNARX
            </div>
            <div className="text-[11px] sm:text-lg font-black text-amber-600 dark:text-amber-400 truncate leading-tight">
              {(summaryStats.totalCostUzs / 1000000).toFixed(1)} mln UZS
            </div>
            <div className="text-[7.5px] sm:text-[10px] text-slate-400 font-bold truncate">
              ${Math.round(summaryStats.totalCostUsd).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Total Selling Value */}
        <div className="p-1.5 sm:p-3.5 rounded-lg sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 sm:gap-3 min-w-0">
          <div className="p-1 sm:p-2.5 rounded-md sm:rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[8px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">
              SOTISH
            </div>
            <div className="text-[11px] sm:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate leading-tight">
              {(summaryStats.totalSaleUzs / 1000000).toFixed(1)} mln UZS
            </div>
            <div className="text-[7.5px] sm:text-[10px] text-slate-400 font-bold truncate">
              ${Math.round(summaryStats.totalSaleUsd).toLocaleString()}
            </div>
          </div>
        </div>

      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="p-1.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-2 transition-colors">
        
        {/* View mode switcher */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
          <button
            onClick={() => setViewTab('all')}
            className={`px-1 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black transition-all text-center ${
              viewTab === 'all'
                ? 'bg-amber-500 text-slate-950 border-b-2 border-amber-700 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="sm:hidden">Barchasi ({products.length})</span>
            <span className="hidden sm:inline">{t.all_locations} ({products.length})</span>
          </button>
          <button
            onClick={() => setViewTab('store')}
            className={`px-1 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
              viewTab === 'store'
                ? 'bg-amber-500 text-slate-950 border-b-2 border-amber-700 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>{t.store} ({storeItemsCount})</span>
          </button>
          <button
            onClick={() => setViewTab('warehouse')}
            className={`px-1 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
              viewTab === 'warehouse'
                ? 'bg-amber-500 text-slate-950 border-b-2 border-amber-700 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Warehouse className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>{t.warehouse} ({warehouseItemsCount})</span>
          </button>
        </div>

        {/* Search Input & Barcode Scanner */}
        <div className="flex items-center gap-1.5 w-full sm:w-80">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nomi, modeli, shtrix-kod..."
              className="w-full pl-7 pr-2.5 py-1 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setScannerMode('search');
              setShowScannerModal(true);
            }}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 shrink-0 active:scale-95"
            title="Shtrix-kod skaner orqali izlash"
          >
            <Barcode className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] sm:text-xs">Skaner</span>
          </button>
        </div>

      </div>

      {/* PRODUCTS DISPLAY: MOBILE CARDS & DESKTOP TABLE */}
      <div className="p-2.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3 transition-colors">
        
        {/* BATCH SELECTION & ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (filteredProducts.length === 0) return;
                const allSelected = filteredProducts.every((p) => selectedIds.includes(p.id));
                if (allSelected) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(filteredProducts.map((p) => p.id));
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              {filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.includes(p.id)) ? (
                <CheckSquare className="w-4 h-4 text-amber-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                Barchasini belgilash ({selectedIds.length}/{filteredProducts.length})
              </span>
            </button>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const selectedProds = products.filter((p) => selectedIds.includes(p.id));
                    setBarcodePrintProducts(selectedProds);
                    setShowBarcodeModal(true);
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Barkod Pechat ({selectedIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>O'chirish ({selectedIds.length})</span>
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Jami: <strong className="text-slate-900 dark:text-white font-bold">{filteredProducts.length}</strong> ta tovar
          </div>
        </div>

        {/* MOBILE CARDS VIEW (VISIBLE ON MOBILE ONLY) */}
        <div className="sm:hidden space-y-2">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              Tovarlar topilmadi
            </div>
          ) : (
            filteredProducts.map((p) => {
              const whQty = p.unitType === 'metr' ? p.totalMetersWarehouse || 0 : p.unitType === 'kg' ? p.totalKgWarehouse || 0 : p.quantityWarehouse || 0;
              const storeQty = p.unitType === 'metr' ? p.totalMetersStore || 0 : p.unitType === 'kg' ? p.totalKgStore || 0 : p.quantityStore || 0;

              const whContainers = getProductContainers(p, 'warehouse');
              const storeContainers = getProductContainers(p, 'store');
              const isSelected = selectedIds.includes(p.id);

              // Distinct Location Badge
              let locationBadge = null;
              if (storeQty > 0 && whQty > 0) {
                locationBadge = (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shrink-0 max-w-[95px] truncate">
                    <Store className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                    <Warehouse className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                    <span className="truncate">Do'kon+Ombor</span>
                  </span>
                );
              } else if (storeQty > 0) {
                locationBadge = (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0 max-w-[95px] truncate">
                    <Store className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Do'konda</span>
                  </span>
                );
              } else if (whQty > 0) {
                locationBadge = (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0 max-w-[95px] truncate">
                    <Warehouse className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                    <span className="truncate">Omborda</span>
                  </span>
                );
              } else {
                locationBadge = (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 shrink-0 max-w-[80px] truncate">
                    <XCircle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                    <span className="truncate">Tugagan</span>
                  </span>
                );
              }

              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-xl border space-y-2 text-xs transition-all ${
                    isSelected
                      ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-500/60 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Card Header with Checkbox & Image */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSelectProduct(p.id)}
                      className="p-1 text-slate-400 hover:text-amber-500 shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 flex items-center gap-2.5 cursor-pointer" onClick={() => setDetailProduct(p)}>
                      <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700/60 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs truncate hover:text-amber-500 transition-colors">
                          <span className="truncate">{p.name}</span>
                          <span className="uppercase text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 shrink-0">
                            {p.unitType}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{p.model}</div>
                        {p.barcode && (
                          <div className="text-[9px] text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-1 mt-0.5">
                            <Barcode className="w-3 h-3 text-amber-500" />
                            <span>{p.barcode}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {locationBadge}
                  </div>

                  {/* Quantities in Store vs Warehouse vs All */}
                  {viewTab === 'store' ? (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Store className="w-3 h-3 text-emerald-500" />
                          <span>Do'kondagi Qoldiq:</span>
                        </div>
                        <span className="text-[9px] opacity-80 font-medium">
                          {p.unitType === 'metr' ? `${storeContainers.length} rulon` : p.unitType === 'kg' ? `${storeContainers.length} qop` : `${storeContainers.length} karopka`}
                        </span>
                      </div>
                      <div className="font-black text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {storeQty} {p.unitType}
                      </div>
                      {storeContainers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {storeContainers.map((c, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[9px] font-bold text-emerald-800 dark:text-emerald-300">
                              {c.label}: {c.shortLabel}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : viewTab === 'warehouse' ? (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Warehouse className="w-3 h-3 text-amber-500" />
                          <span>Ombordagi Qoldiq:</span>
                        </div>
                        <span className="text-[9px] opacity-80 font-medium">
                          {p.unitType === 'metr' ? `${whContainers.length} rulon` : p.unitType === 'kg' ? `${whContainers.length} qop` : `${whContainers.length} karopka`}
                        </span>
                      </div>
                      <div className="font-black text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                        {whQty} {p.unitType}
                      </div>
                      {whContainers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {whContainers.map((c, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                              {c.label}: {c.shortLabel}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                      <div className={`p-1 rounded ${whQty > 0 ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200' : 'text-slate-400'}`}>
                        <div className="text-[9px] text-slate-400 font-bold flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Warehouse className="w-2.5 h-2.5 text-amber-500" />
                            <span>Ombor:</span>
                          </div>
                          <span className="text-[8px] opacity-75 font-medium">
                            {p.unitType === 'metr' ? `${whContainers.length} rulon` : p.unitType === 'kg' ? `${whContainers.length} qop` : `${whContainers.length} karopka`}
                          </span>
                        </div>
                        <div className="font-black text-xs">
                          {whQty} {p.unitType}
                        </div>
                        {whContainers.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {whContainers.slice(0, 4).map((c, idx) => (
                              <span key={idx} className="px-1 py-0.2 rounded bg-amber-500/20 text-[8px] font-bold text-amber-800 dark:text-amber-300">
                                {c.shortLabel}
                              </span>
                            ))}
                            {whContainers.length > 4 && (
                              <span className="px-1 py-0.2 rounded bg-amber-500/20 text-[8px] font-bold text-amber-800 dark:text-amber-300">
                                +{whContainers.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={`p-1 rounded ${storeQty > 0 ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-200' : 'text-slate-400'}`}>
                        <div className="text-[9px] text-slate-400 font-bold flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Store className="w-2.5 h-2.5 text-emerald-500" />
                            <span>Do'kon:</span>
                          </div>
                          <span className="text-[8px] opacity-75 font-medium">
                            {p.unitType === 'metr' ? `${storeContainers.length} rulon` : p.unitType === 'kg' ? `${storeContainers.length} qop` : `${storeContainers.length} karopka`}
                          </span>
                        </div>
                        <div className="font-black text-xs">
                          {storeQty} {p.unitType}
                        </div>
                        {storeContainers.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {storeContainers.slice(0, 4).map((c, idx) => (
                              <span key={idx} className="px-1 py-0.2 rounded bg-emerald-500/20 text-[8px] font-bold text-emerald-800 dark:text-emerald-300">
                                {c.shortLabel}
                              </span>
                            ))}
                            {storeContainers.length > 4 && (
                              <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-[8px] font-bold text-emerald-800 dark:text-emerald-300">
                                +{storeContainers.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price & Actions Row */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 dark:border-slate-700/80 text-[10px]">
                    <div>
                      <span className="text-slate-400 font-medium">Sotish: </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{p.salePrice.toLocaleString()} UZS</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Barkod Print Button */}
                      <button
                        onClick={() => {
                          setBarcodePrintProducts([p]);
                          setShowBarcodeModal(true);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                        title="Barkod Stikerini Chop Etish"
                      >
                        <Barcode className="w-3 h-3 text-emerald-500" />
                        <span>Barkod</span>
                      </button>

                      {/* Detailed View Button */}
                      <button
                        onClick={() => setDetailProduct(p)}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                        title="Batafsil ma'lumot"
                      >
                        <Eye className="w-3 h-3 text-amber-500" />
                        <span>Batafsil</span>
                      </button>

                      {/* Transfer Shortcut Button */}
                      {whQty > 0 && (
                        <button
                          onClick={() => {
                            setTransferProductId(p.id);
                            setSelectedContainerIndices([]);
                            setShowTransferModal(true);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Transfer</span>
                        </button>
                      )}

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 rounded-lg text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                        title="Tahrirlash"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setProductToDelete(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (HIDDEN ON MOBILE) */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (filteredProducts.length === 0) return;
                      const allSelected = filteredProducts.every((p) => selectedIds.includes(p.id));
                      if (allSelected) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(filteredProducts.map((p) => p.id));
                      }
                    }}
                    className="p-1 hover:text-amber-500 transition-colors"
                  >
                    {filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.includes(p.id)) ? (
                      <CheckSquare className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-3">Tovar & Model</th>
                <th className="p-3">O'lchov</th>
                {viewTab === 'all' && (
                  <>
                    <th className="p-3 text-amber-600 dark:text-amber-400">Ombordagi Qoldiq</th>
                    <th className="p-3 text-emerald-600 dark:text-emerald-400">Do'kondagi Qoldiq</th>
                  </>
                )}
                {viewTab === 'warehouse' && (
                  <th className="p-3 text-amber-600 dark:text-amber-400 font-black">Ombordagi Qoldiq & Rulon / Qop / Karopkalar</th>
                )}
                {viewTab === 'store' && (
                  <th className="p-3 text-emerald-600 dark:text-emerald-400 font-black">Do'kondagi Qoldiq & Rulon / Qop / Karopkalar</th>
                )}
                <th className="p-3">Tannarx / Sotish</th>
                {viewTab === 'all' && <th className="p-3">Joylashuvi</th>}
                <th className="p-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={viewTab === 'all' ? 8 : 6} className="text-center py-8 text-slate-400">
                    Tovarlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const whQty = p.unitType === 'metr' ? p.totalMetersWarehouse || 0 : p.unitType === 'kg' ? p.totalKgWarehouse || 0 : p.quantityWarehouse || 0;
                  const storeQty = p.unitType === 'metr' ? p.totalMetersStore || 0 : p.unitType === 'kg' ? p.totalKgStore || 0 : p.quantityStore || 0;

                  const whContainers = getProductContainers(p, 'warehouse');
                  const storeContainers = getProductContainers(p, 'store');
                  const isSelected = selectedIds.includes(p.id);

                  let locationBadge = null;
                  if (storeQty > 0 && whQty > 0) {
                    locationBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1 w-fit">
                        <Store className="w-3 h-3 text-indigo-500" />
                        <Warehouse className="w-3 h-3 text-amber-500" />
                        <span>Do'kon + Ombor</span>
                      </span>
                    );
                  } else if (storeQty > 0) {
                    locationBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                        <Store className="w-3 h-3 text-emerald-500" />
                        <span>Faqat Do'konda</span>
                      </span>
                    );
                  } else if (whQty > 0) {
                    locationBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                        <Warehouse className="w-3 h-3 text-amber-500" />
                        <span>Faqat Omborda</span>
                      </span>
                    );
                  } else {
                    locationBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3 text-rose-500" />
                        <span>Stok Tugagan</span>
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-amber-50/70 dark:bg-amber-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectProduct(p.id)}
                          className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer"
                            onClick={() => setDetailProduct(p)}
                          >
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div
                              className="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-amber-500 transition-colors flex items-center gap-1.5"
                              onClick={() => setDetailProduct(p)}
                            >
                              <span>{p.name}</span>
                              <Eye className="w-3.5 h-3.5 text-amber-500 opacity-60" />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{p.model}</div>
                            {p.barcode && (
                              <div className="text-[9px] text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-1 mt-0.5">
                                <Barcode className="w-3 h-3 text-amber-500" />
                                <span>{p.barcode}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="uppercase text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-300">
                          {p.unitType}
                        </span>
                      </td>

                      {/* Warehouse Column (when 'all' or 'warehouse') */}
                      {(viewTab === 'all' || viewTab === 'warehouse') && (
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                          <div>
                            <strong className="text-amber-600 dark:text-amber-400 font-black">{whQty} {p.unitType}</strong>{' '}
                            <span className="text-[10px] text-slate-400 inline-block ml-1">
                              ({p.unitType === 'metr' ? `${whContainers.length} rulon` : p.unitType === 'kg' ? `${whContainers.length} qop` : `${whContainers.length} karopka`})
                            </span>
                          </div>
                          {whContainers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-[280px]">
                              {whContainers.slice(0, 5).map((c, idx) => (
                                <span key={idx} className="px-1.5 py-0.2 rounded bg-amber-500/15 text-[9px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                  {c.label}: {c.value}{c.unit === 'metr' ? 'm' : c.unit}
                                </span>
                              ))}
                              {whContainers.length > 5 && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500">
                                  +{whContainers.length - 5} ta
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Store Column (when 'all' or 'store') */}
                      {(viewTab === 'all' || viewTab === 'store') && (
                        <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                          <div>
                            <strong className="text-emerald-600 dark:text-emerald-400 font-black">{storeQty} {p.unitType}</strong>{' '}
                            <span className="text-[10px] text-slate-400 inline-block ml-1">
                              ({p.unitType === 'metr' ? `${storeContainers.length} rulon` : p.unitType === 'kg' ? `${storeContainers.length} qop` : `${storeContainers.length} karopka`})
                            </span>
                          </div>
                          {storeContainers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-[280px]">
                              {storeContainers.slice(0, 5).map((c, idx) => (
                                <span key={idx} className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                  {c.label}: {c.value}{c.unit === 'metr' ? 'm' : c.unit}
                                </span>
                              ))}
                              {storeContainers.length > 5 && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500">
                                  +{storeContainers.length - 5} ta
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                      <td className="p-3">
                        <div className="text-slate-500 dark:text-slate-400 font-medium">{p.costPrice.toLocaleString()} UZS</div>
                        <div className="font-extrabold text-emerald-600 dark:text-emerald-400">{p.salePrice.toLocaleString()} UZS</div>
                      </td>

                      {viewTab === 'all' && <td className="p-3">{locationBadge}</td>}

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setBarcodePrintProducts([p]);
                              setShowBarcodeModal(true);
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Barkod Stikerini Chop Etish"
                          >
                            <Barcode className="w-4 h-4 text-emerald-500" />
                          </button>
                          <button
                            onClick={() => setDetailProduct(p)}
                            className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            title="Batafsil ma'lumot (Rulon / Qop / Karopkalar)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                            title="Tahrirlash"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT STOCK TRANSFERS HISTORY */}
      {stockTransfers.length > 0 && (
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md transition-colors">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2.5 flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
            <span>So'nggi Transferlar</span>
          </h3>

          <div className="space-y-1.5">
            {stockTransfers.slice(0, 5).map((st) => (
              <div
                key={st.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{st.productName} ({st.model})</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    O'tkazuvchi: {st.transferredBy} | {new Date(st.date).toLocaleDateString('uz-UZ')}
                  </div>
                </div>
                <div className="font-extrabold text-amber-600 dark:text-amber-400">
                  +{st.quantityTransferred} {st.unitType}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW PRODUCT (MOBILE OPTIMIZED SCROLL WITH FIXED FOOTER) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col min-h-0 text-slate-900 dark:text-slate-100 overflow-hidden">
            
            {/* MODAL HEADER */}
            <div className="shrink-0 px-3.5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Yangi Tovar Kiritish</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL FORM & BODY */}
            <form onSubmit={handleCreateProduct} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 text-xs overscroll-contain">
                
                {/* Image & Barcode Section */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                        {pImageUrl ? (
                          <img src={pImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Tovar Rasmi</div>
                        <p className="text-[9px] text-slate-400">Rasm yuklash yoki galereyadan tanlash</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('add');
                        setShowImagePicker(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold text-[11px] flex items-center gap-1 border border-amber-500/30 shrink-0 transition-all active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-500" />
                      <span>{pImageUrl ? "O'zgartirish" : "Rasm Qo'shish"}</span>
                    </button>
                  </div>

                  {/* Barcode row */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Barcode className="w-3.5 h-3.5 text-amber-500" />
                        Shtrix-kod (Barcode)
                      </label>
                      <button
                        type="button"
                        onClick={() => setPBarcode(generateNewBarcode())}
                        className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-0.5"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Auto Yasash</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={pBarcode}
                        onChange={(e) => setPBarcode(e.target.value)}
                        placeholder="Masalan: 478123456789"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScannerMode('add');
                          setShowScannerModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shrink-0 shadow-sm active:scale-95"
                      >
                        <Barcode className="w-3.5 h-3.5" />
                        <span>Skaner</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Name & Model row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-700 dark:text-slate-300 font-bold mb-1">Tovar nomi</label>
                    <input
                      type="text"
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      placeholder="Masalan: Gilam Silk"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 dark:text-slate-300 font-bold mb-1">Modeli</label>
                    <input
                      type="text"
                      value={pModel}
                      onChange={(e) => setPModel(e.target.value)}
                      placeholder="Masalan: Classic 3x4"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Location Selection: Do'konda / Omborda / Ikkalasiga */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Tovar qayerga qo'shilsin? (Joylashuvi)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPLocation('store')}
                      className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all border ${
                        pLocation === 'store'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-600 shadow-md scale-[1.02]'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Do'konga</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPLocation('warehouse')}
                      className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all border ${
                        pLocation === 'warehouse'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md scale-[1.02]'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Warehouse className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Omborga</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPLocation('both')}
                      className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all border ${
                        pLocation === 'both'
                          ? 'bg-indigo-500 text-white border-indigo-600 shadow-md scale-[1.02]'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Ikkalasiga</span>
                    </button>
                  </div>
                </div>

                {/* Unit & Min Alert row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-700 dark:text-slate-300 font-bold mb-1">Birlik</label>
                    <select
                      value={pUnitType}
                      onChange={(e) => setPUnitType(e.target.value as UnitType)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                    >
                      <option value="metr">Metr (Rulon)</option>
                      <option value="kg">Kg (Qop)</option>
                      <option value="dona">Dona (Karopka)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 dark:text-slate-300 font-bold mb-1">Min qoldiq</label>
                    <input
                      type="number"
                      value={pMinAlert}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setPMinAlert(parseInt(e.target.value) || 10)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* DYNAMIC ROLL / BAG / BOX INPUTS WITH '+' BUTTON */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  
                  {/* METR (RULONLAR) */}
                  {pUnitType === 'metr' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                          Rulonlar (m)
                        </label>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {rollList.length} ta rulon
                        </span>
                      </div>

                      {/* Input + Button for Roll Length */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={newRollInput}
                          placeholder="Rulon uzunligi (m)..."
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setNewRollInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddRoll();
                            }
                          }}
                          className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddRoll()}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 shadow-sm shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Rulon</span>
                        </button>
                      </div>

                      {/* Display Added Rolls Chips */}
                      {rollList.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {rollList.map((m, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-[10px] font-bold"
                            >
                              <span>{idx + 1}: <strong>{m} m</strong></span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRoll(idx)}
                                className="p-0.5 rounded hover:bg-rose-500/20 text-rose-500 transition-colors ml-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        /* Fallback single inputs if list empty */
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <div>
                            <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-medium mb-0.5">
                              Rulonlar soni
                            </label>
                            <input
                              type="number"
                              value={pRollsWh}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPRollsWh(parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-medium mb-0.5">
                              1 Rulonda metr
                            </label>
                            <input
                              type="number"
                              value={pMetersPerRoll}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPMetersPerRoll(parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* KG (QOPLAR) */}
                  {pUnitType === 'kg' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                          Qoplar (kg)
                        </label>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {bagList.length} ta qop
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={newBagInput}
                          placeholder="Qop og'irligi (kg)..."
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setNewBagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddBag();
                            }
                          }}
                          className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddBag()}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 shadow-sm shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Qop</span>
                        </button>
                      </div>

                      {bagList.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {bagList.map((kg, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-[10px] font-bold"
                            >
                              <span>{idx + 1}: <strong>{kg} kg</strong></span>
                              <button
                                type="button"
                                onClick={() => handleRemoveBag(idx)}
                                className="p-0.5 rounded hover:bg-rose-500/20 text-rose-500 ml-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <div>
                            <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-medium mb-0.5">Qoplar soni</label>
                            <input
                              type="number"
                              value={pBagsWh}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPBagsWh(parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-medium mb-0.5">1 Qopda kg</label>
                            <input
                              type="number"
                              value={pKgPerBag}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPKgPerBag(parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DONA (KAROPKALAR) */}
                  {pUnitType === 'dona' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                          Karopkalar (dona)
                        </label>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {boxList.length} ta karopka
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={newBoxInput}
                          placeholder="Karopkadagi dona..."
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setNewBoxInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddBox();
                            }
                          }}
                          className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddBox()}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 shadow-sm shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Karopka</span>
                        </button>
                      </div>

                      {boxList.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {boxList.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-[10px] font-bold"
                            >
                              <span>{idx + 1}: <strong>{item} dona</strong></span>
                              <button
                                type="button"
                                onClick={() => handleRemoveBox(idx)}
                                className="p-0.5 rounded hover:bg-rose-500/20 text-rose-500 ml-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <div>
                            <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-medium mb-0.5">Karopkalar soni</label>
                            <input
                              type="number"
                              value={pBoxesWh}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPBoxesWh(parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-medium mb-0.5">1 Karopkada dona</label>
                            <input
                              type="number"
                              value={pItemsPerBox}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPItemsPerBox(parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Calculated Stock Total summary */}
                  <div className="pt-1 flex items-center justify-between border-t border-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    <span>Jami miqdor:</span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      {calculatedTotalStock.toLocaleString()} {pUnitType} ({calculatedContainerCount} {pUnitType === 'metr' ? 'rulon' : pUnitType === 'kg' ? 'qop' : 'karopka'})
                    </span>
                  </div>

                </div>

                {/* Prices in UZS or $ USD */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">Tannarx</label>
                      <button
                        type="button"
                        onClick={() => setCostCurrency(costCurrency === 'UZS' ? 'USD' : 'UZS')}
                        className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                      >
                        {costCurrency === 'UZS' ? 'So\'m' : '$ USD'}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={pCostInput || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setPCostInput(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                    />
                    {costCurrency === 'USD' && pCostInput > 0 && (
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        = {(pCostInput * usdRate).toLocaleString()} UZS
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">Sotish narxi</label>
                      <button
                        type="button"
                        onClick={() => setSaleCurrency(saleCurrency === 'UZS' ? 'USD' : 'UZS')}
                        className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                      >
                        {saleCurrency === 'UZS' ? 'So\'m' : '$ USD'}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={pSaleInput || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setPSaleInput(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold text-xs focus:outline-none"
                    />
                    {saleCurrency === 'USD' && pSaleInput > 0 && (
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        = {(pSaleInput * usdRate).toLocaleString()} UZS
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* MODAL FOOTER - PINNED ALWAYS VISIBLE AT BOTTOM */}
              <div className="shrink-0 p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                >
                  Saqlash
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: STOCK TRANSFER (OMBOR -> DO'KON) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
          <div className="relative w-full max-w-md h-[92dvh] sm:h-auto sm:max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col min-h-0 text-slate-900 dark:text-slate-100 overflow-hidden">
            
            {/* HEADER */}
            <div className="shrink-0 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
                <span>Ombordan Do'konga Transfer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY - SCROLLABLE CONTENT */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2.5 text-xs overscroll-contain">
              
              {/* Product Search / Select */}
              <div className="space-y-1">
                <label className="block text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                  Tovarni Qidirish va Tanlash
                </label>
                
                {/* Search Model Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={transferSearch}
                    onChange={(e) => setTransferSearch(e.target.value)}
                    placeholder="Model yoki nomini kiriting (masalan: 3002)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                  />
                  {transferSearch && (
                    <button
                      type="button"
                      onClick={() => setTransferSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Select */}
                <select
                  value={transferProductId}
                  onChange={(e) => {
                    setTransferProductId(e.target.value);
                    setSelectedContainerIndices([]);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-extrabold text-xs"
                >
                  <option value="">-- Tovarni tanlang --</option>
                  {filteredTransferProducts.map((p) => {
                    const stock = p.unitType === 'metr' ? p.totalMetersWarehouse || 0 : p.unitType === 'kg' ? p.totalKgWarehouse || 0 : p.quantityWarehouse || 0;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} | Model: {p.model} ({stock} {p.unitType} omborda)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Product Details & Capacity Breakdown */}
              {selectedTransferProduct && (
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-200 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <div>
                      <div className="text-xs font-black text-indigo-950 dark:text-indigo-100">{selectedTransferProduct.name}</div>
                      <div className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-300">Model: {selectedTransferProduct.model}</div>
                    </div>
                    <span className="uppercase text-[9px] px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-900 font-black text-indigo-800 dark:text-indigo-200">
                      {selectedTransferProduct.unitType}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center font-bold text-[11px]">
                    <div className="p-1 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-800">
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">
                        {selectedTransferProduct.unitType === 'metr' ? 'Rulonlar:' : selectedTransferProduct.unitType === 'kg' ? 'Qoplar:' : 'Karopkalar:'}
                      </div>
                      <div className="text-indigo-900 dark:text-indigo-100 font-black">
                        {selectedTransferProduct.unitType === 'metr' ? selectedTransferProduct.rollsInWarehouse || 0 : selectedTransferProduct.unitType === 'kg' ? selectedTransferProduct.bagsInWarehouse || 0 : selectedTransferProduct.boxesInWarehouse || 0} ta
                      </div>
                    </div>

                    <div className="p-1 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-800">
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">
                        {selectedTransferProduct.unitType === 'metr' ? '1 Rulonda:' : selectedTransferProduct.unitType === 'kg' ? '1 Qopda:' : '1 Karopkada:'}
                      </div>
                      <div className="text-indigo-900 dark:text-indigo-100 font-black">
                        {selectedTransferProduct.unitType === 'metr' ? selectedTransferProduct.metersPerRoll || 0 : selectedTransferProduct.unitType === 'kg' ? selectedTransferProduct.kgPerBag || 0 : selectedTransferProduct.itemsPerBox || 0} {selectedTransferProduct.unitType}
                      </div>
                    </div>

                    <div className="p-1 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-800">
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">Ombor Qoldig'i:</div>
                      <div className="text-amber-600 dark:text-amber-400 font-black">
                        {selectedTransferProduct.unitType === 'metr' ? selectedTransferProduct.totalMetersWarehouse || 0 : selectedTransferProduct.unitType === 'kg' ? selectedTransferProduct.totalKgWarehouse || 0 : selectedTransferProduct.quantityWarehouse || 0} {selectedTransferProduct.unitType}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INDIVIDUAL CONTAINERS SELECTION WITH + BUTTON */}
              {selectedTransferProduct && (
                <div className="space-y-2.5">
                  
                  {/* Container List Card */}
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <span>Ombordagi mavjud {selectedTransferProduct.unitType === 'metr' ? 'Rulonlar' : selectedTransferProduct.unitType === 'kg' ? 'Qoplar' : 'Karopkalar'}:</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                          {availableWarehouseContainers.length} ta
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllContainers}
                          className="text-[10px] font-extrabold text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 underline"
                        >
                          + Barchasi
                        </button>
                        {selectedContainerIndices.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearSelectedContainers}
                            className="text-[10px] font-extrabold text-rose-600 hover:text-rose-700 dark:text-rose-400 underline"
                          >
                            Tozalash
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Individual items list */}
                    {availableWarehouseContainers.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5 max-h-28 sm:max-h-36 overflow-y-auto p-1.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-500/20">
                        {availableWarehouseContainers.map((val, idx) => {
                          const isSelected = selectedContainerIndices.includes(idx);
                          const containerLabel = selectedTransferProduct.unitType === 'metr' ? 'Rulon' : selectedTransferProduct.unitType === 'kg' ? 'Qop' : 'Karopka';
                          const unitSymbol = selectedTransferProduct.unitType === 'metr' ? 'metr' : selectedTransferProduct.unitType === 'kg' ? 'kg' : 'dona';

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleSelectContainer(idx)}
                              className={`p-1.5 rounded-lg text-left border transition-all flex items-center justify-between gap-1 active:scale-95 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 shadow-sm font-black'
                                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-500/50 font-bold'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className={`text-[9px] uppercase tracking-wider ${isSelected ? 'text-slate-950 opacity-80' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {idx + 1}-{containerLabel}
                                </div>
                                <div className="text-xs truncate">
                                  {val} <span className="text-[10px]">{unitSymbol}</span>
                                </div>
                              </div>

                              <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-black text-xs shadow-sm transition-transform ${
                                isSelected
                                  ? 'bg-slate-950 text-emerald-400 scale-105'
                                  : 'bg-amber-500 text-slate-950'
                              }`}>
                                {isSelected ? '✓' : '+'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-2 text-center text-slate-500 dark:text-slate-400 font-semibold italic">
                        Omborda hech qanday {selectedTransferProduct.unitType === 'metr' ? 'rulon' : selectedTransferProduct.unitType === 'kg' ? 'qop' : 'karopka'} qolmagan!
                      </div>
                    )}

                    {/* Selection Live Info */}
                    {selectedContainerIndices.length > 0 && (
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs font-black">
                        <span>Tanlandi: {selectedContainerIndices.length} ta {selectedTransferProduct.unitType === 'metr' ? 'rulon' : selectedTransferProduct.unitType === 'kg' ? 'qop' : 'karopka'}</span>
                        <span className="text-sm font-extrabold">{selectedContainersTotalQty} {selectedTransferProduct.unitType}</span>
                      </div>
                    )}
                  </div>

                  {/* Fallback count input if no specific roll selected */}
                  {selectedContainerIndices.length === 0 && (
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Yoki soni/miqdori bo'yicha kiriting:
                      </div>

                      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-900/70">
                        <button
                          type="button"
                          onClick={() => setTransferByContainer(true)}
                          className={`flex-1 py-1 rounded text-[10px] font-extrabold transition-all ${
                            transferByContainer ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {selectedTransferProduct.unitType === 'metr' ? 'Rulon bo\'yicha' : selectedTransferProduct.unitType === 'kg' ? 'Qop bo\'yicha' : 'Karopka bo\'yicha'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransferByContainer(false)}
                          className={`flex-1 py-1 rounded text-[10px] font-extrabold transition-all ${
                            !transferByContainer ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {selectedTransferProduct.unitType.toUpperCase()} bo'yicha
                        </button>
                      </div>

                      {transferByContainer ? (
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-[10px]">
                            O'tkaziladigan {selectedTransferProduct.unitType === 'metr' ? 'Rulonlar' : selectedTransferProduct.unitType === 'kg' ? 'Qoplar' : 'Karopkalar'} soni
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={transferContainerCount}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setTransferContainerCount(parseInt(e.target.value) || 0)}
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-black text-xs focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-[10px]">
                            O'tkaziladigan miqdor ({selectedTransferProduct.unitType})
                          </label>
                          <input
                            type="number"
                            value={transferDirectQty}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setTransferDirectQty(parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-black text-xs focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transfer Action Summary Card */}
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs font-bold">
                    <div>
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Do'konga o'tkaziladigan jami:</div>
                      <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                        {actualTransferQty} {selectedTransferProduct.unitType}
                        {selectedContainerIndices.length > 0 && ` (${selectedContainerIndices.length} ta ${selectedTransferProduct.unitType === 'metr' ? 'rulon' : selectedTransferProduct.unitType === 'kg' ? 'qop' : 'karopka'})`}
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>

                </div>
              )}

            </div>

            {/* FOOTER - ALWAYS PINNED AT BOTTOM */}
            <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-100 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={!transferProductId || actualTransferQty <= 0}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>O'tkazish</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md h-[92dvh] sm:h-auto sm:max-h-[90vh] flex flex-col min-h-0 overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Modal Header */}
            <div className="shrink-0 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Tovarni Tahrirlash
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {editingProduct.name} ({editingProduct.model})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-3">

              {/* Image & Barcode Section */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                      {editImageUrl ? (
                        <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Tovar Rasmi</div>
                      <p className="text-[9px] text-slate-400">Rasm o'zgartirish</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePickerTarget('edit');
                      setShowImagePicker(true);
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] flex items-center gap-1 border border-amber-500/30 shrink-0 transition-all active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>{editImageUrl ? "O'zgartirish" : "Tanlash"}</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Barcode className="w-3.5 h-3.5 text-amber-500" />
                      Shtrix-kod (Barcode)
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditBarcode(generateNewBarcode())}
                      className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-0.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Auto Yasash</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editBarcode}
                      onChange={(e) => setEditBarcode(e.target.value)}
                      placeholder="Masalan: 478123456789"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScannerMode('edit');
                        setShowScannerModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shrink-0 shadow-sm active:scale-95"
                    >
                      <Barcode className="w-3.5 h-3.5" />
                      <span>Skaner</span>
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tovar Nomi *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Model / Artikul *
                </label>
                <input
                  type="text"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Dual Currency Pricing Section */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                    <span>Narxlar va Valyuta</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    Kurs: 1$ = {usdRate.toLocaleString()} UZS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Tannarx */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                        Tannarx (Kirim)
                      </label>
                      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            if (editCostCurrency !== 'UZS') {
                              const uzs = Math.round(editCostInput * usdRate);
                              setEditCostInput(uzs);
                              setEditCostCurrency('UZS');
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all ${
                            editCostCurrency === 'UZS'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          UZS
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (editCostCurrency !== 'USD') {
                              const usd = editCostInput > 0 ? Math.round((editCostInput / usdRate) * 100) / 100 : 0;
                              setEditCostInput(usd);
                              setEditCostCurrency('USD');
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all ${
                            editCostCurrency === 'USD'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          USD ($)
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step={editCostCurrency === 'USD' ? '0.01' : '1'}
                        value={editCostInput}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setEditCostInput(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Tengligi:</span>
                      <strong className="text-slate-600 dark:text-slate-300">
                        {editCostCurrency === 'USD'
                          ? `≈ ${(Math.round(editCostInput * usdRate)).toLocaleString()} UZS`
                          : `≈ $${(editCostInput > 0 ? Math.round((editCostInput / usdRate) * 100) / 100 : 0).toLocaleString()} USD`}
                      </strong>
                    </div>
                  </div>

                  {/* Sotish Narxi */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                        Sotish Narxi
                      </label>
                      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            if (editSaleCurrency !== 'UZS') {
                              const uzs = Math.round(editSaleInput * usdRate);
                              setEditSaleInput(uzs);
                              setEditSaleCurrency('UZS');
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all ${
                            editSaleCurrency === 'UZS'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          UZS
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (editSaleCurrency !== 'USD') {
                              const usd = editSaleInput > 0 ? Math.round((editSaleInput / usdRate) * 100) / 100 : 0;
                              setEditSaleInput(usd);
                              setEditSaleCurrency('USD');
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all ${
                            editSaleCurrency === 'USD'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          USD ($)
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step={editSaleCurrency === 'USD' ? '0.01' : '1'}
                        value={editSaleInput}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setEditSaleInput(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Tengligi:</span>
                      <strong className="text-slate-600 dark:text-slate-300">
                        {editSaleCurrency === 'USD'
                          ? `≈ ${(Math.round(editSaleInput * usdRate)).toLocaleString()} UZS`
                          : `≈ $${(editSaleInput > 0 ? Math.round((editSaleInput / usdRate) * 100) / 100 : 0).toLocaleString()} USD`}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rulonlar / Qoplar / Idishlar va Qoldiqlar Bo'limi */}
              {editingProduct.unitType === 'metr' ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-black text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      <span>Rulonlar Metraji Tahrirlash (Ombor & Do'kon)</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black">
                      + bilan bir nechta qo'shish mumkin
                    </span>
                  </div>

                  {/* Warehouse Rolls Section */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Warehouse className="w-3 h-3 text-amber-500" />
                        <span>Ombordagi Rulonlar ({editWhRollsList.length} ta)</span>
                      </span>
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 font-mono">
                        Jami: {Math.round(editWhRollsList.reduce((a, b) => a + b, 0) * 100) / 100} metr
                      </span>
                    </div>

                    {/* Existing Rolls Chips */}
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      {editWhRollsList.length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic p-1">Rulonlar kiritilmagan</span>
                      ) : (
                        editWhRollsList.map((val, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-slate-900 dark:text-white font-mono text-[10px] font-bold"
                          >
                            <span>#{idx + 1}: {val}m</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditWhRoll(idx)}
                              className="text-slate-400 hover:text-rose-500 ml-0.5 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add New Roll Input (+ support) */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={editNewRollInput}
                        onChange={(e) => setEditNewRollInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEditWhRoll();
                          }
                        }}
                        placeholder="Masalan: 45.5 yoki 50+45+32"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddEditWhRoll}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Qo'shish</span>
                      </button>
                    </div>
                  </div>

                  {/* Store Rolls Section */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Store className="w-3 h-3 text-indigo-500" />
                        <span>Do'kondagi Rulonlar ({editStoreRollsList.length} ta)</span>
                      </span>
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        Jami: {Math.round(editStoreRollsList.reduce((a, b) => a + b, 0) * 100) / 100} metr
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      {editStoreRollsList.length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic p-1">Rulonlar kiritilmagan</span>
                      ) : (
                        editStoreRollsList.map((val, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-slate-900 dark:text-white font-mono text-[10px] font-bold"
                          >
                            <span>#{idx + 1}: {val}m</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditStoreRoll(idx)}
                              className="text-slate-400 hover:text-rose-500 ml-0.5 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={editNewStoreRollInput}
                        onChange={(e) => setEditNewStoreRollInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEditStoreRoll();
                          }
                        }}
                        placeholder="Masalan: 35 yoki 20+15"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddEditStoreRoll}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] shadow flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Qo'shish</span>
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="text-[11px] font-black text-amber-800 dark:text-amber-300">
                    Qoldiqlar Miqdori ({editingProduct.unitType}):
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Omborda Jami ({editingProduct.unitType})
                      </label>
                      <input
                        type="number"
                        value={editWhQty}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setEditWhQty(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Do'konda Jami ({editingProduct.unitType})
                      </label>
                      <input
                        type="number"
                        value={editStoreQty}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setEditStoreQty(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-amber-600 dark:text-amber-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSaveEditProduct}
                className="flex-1 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Saqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL (Rulonlar / Qoplar / Karopkalar bo'yicha batafsil ko'rish) */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg h-[92dvh] sm:h-auto sm:max-h-[90vh] flex flex-col min-h-0 overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="shrink-0 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{detailProduct.name}</span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      {detailProduct.unitType}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Model: <strong className="text-slate-700 dark:text-slate-200">{detailProduct.model}</strong>
                    </p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                      viewTab === 'store' 
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                        : viewTab === 'warehouse' 
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {viewTab === 'store' ? "Do'kondagi Ma'lumotlar" : viewTab === 'warehouse' ? "Ombordagi Ma'lumotlar" : "Barchasi (Ombor + Do'kon)"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3 sm:p-5 overflow-y-auto space-y-4">

              {/* Product Banner: Image & Barcode */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  {detailProduct.imageUrl ? (
                    <img src={detailProduct.imageUrl} alt={detailProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {detailProduct.name} ({detailProduct.model})
                  </div>
                  {detailProduct.barcode ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold">
                      <Barcode className="w-4 h-4 text-amber-500" />
                      <span>{detailProduct.barcode}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400">Shtrix-kod biriktirilmagan</div>
                  )}
                </div>
              </div>
              {/* Prices summary */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Tannarx:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                    {detailProduct.costPrice.toLocaleString()} UZS
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Sotish Narxi:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    {detailProduct.salePrice.toLocaleString()} UZS
                  </span>
                </div>
              </div>

              {/* OMBOR QOLDIQLARI (Faqat 'all' yoki 'warehouse' rejimida chiqadi) */}
              {(viewTab === 'all' || viewTab === 'warehouse') && (() => {
                const whItems = getProductContainers(detailProduct, 'warehouse');
                const totalWh = detailProduct.unitType === 'metr'
                  ? (detailProduct.totalMetersWarehouse || 0)
                  : detailProduct.unitType === 'kg'
                  ? (detailProduct.totalKgWarehouse || 0)
                  : (detailProduct.quantityWarehouse || 0);

                const containerName = detailProduct.unitType === 'metr' ? 'Rulon' : detailProduct.unitType === 'kg' ? 'Qop' : 'Karopka';

                return (
                  <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-black text-xs">
                        <Warehouse className="w-4 h-4 text-amber-500" />
                        <span>OMBORDAGI MAVJUD QOLDIQ:</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 font-black text-xs">
                        {totalWh} {detailProduct.unitType} ({whItems.length} {containerName.toLowerCase()})
                      </span>
                    </div>

                    {whItems.length === 0 ? (
                      <div className="text-center py-3 text-slate-400 text-xs">Omborda mavjud emas</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {whItems.map((item, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 flex flex-col items-center justify-center text-center shadow-sm"
                          >
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
                              {item.label}
                            </span>
                            <span className="font-black text-amber-600 dark:text-amber-400 text-base">
                              {item.value} <span className="text-xs font-bold text-slate-500">{item.unit}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* DO'KON QOLDIQLARI (Faqat 'all' yoki 'store' rejimida chiqadi) */}
              {(viewTab === 'all' || viewTab === 'store') && (() => {
                const storeItems = getProductContainers(detailProduct, 'store');
                const totalStore = detailProduct.unitType === 'metr'
                  ? (detailProduct.totalMetersStore || 0)
                  : detailProduct.unitType === 'kg'
                  ? (detailProduct.totalKgStore || 0)
                  : (detailProduct.quantityStore || 0);

                const containerName = detailProduct.unitType === 'metr' ? 'Rulon' : detailProduct.unitType === 'kg' ? 'Qop' : 'Karopka';

                return (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-black text-xs">
                        <Store className="w-4 h-4 text-emerald-500" />
                        <span>DO'KONDAGI MAVJUD QOLDIQ:</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-black text-xs">
                        {totalStore} {detailProduct.unitType} ({storeItems.length} {containerName.toLowerCase()})
                      </span>
                    </div>

                    {storeItems.length === 0 ? (
                      <div className="text-center py-3 text-slate-400 text-xs">Do'konda mavjud emas</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {storeItems.map((item, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 flex flex-col items-center justify-center text-center shadow-sm"
                          >
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
                              {item.label}
                            </span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                              {item.value} <span className="text-xs font-bold text-slate-500">{item.unit}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60">
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Yopish
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBarcodePrintProducts([detailProduct]);
                    setShowBarcodeModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Barcode className="w-4 h-4" />
                  <span>Barkod Stikeri</span>
                </button>

                {((detailProduct.totalMetersWarehouse || 0) > 0 || (detailProduct.totalKgWarehouse || 0) > 0 || (detailProduct.quantityWarehouse || 0) > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTransferProductId(detailProduct.id);
                      setSelectedContainerIndices([]);
                      setDetailProduct(null);
                      setShowTransferModal(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transfer</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const p = detailProduct;
                    setDetailProduct(null);
                    handleOpenEditModal(p);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Tahrirlash</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DELETE PRODUCTS CONTROL MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl relative text-slate-900 dark:text-slate-100 my-8 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Tovarlarni O'chirish
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ombor va do'kondagi tovarlarni boshqarish
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions List */}
            <div className="space-y-2.5">
              {/* Option 1: Delete Zero Stock Products */}
              <button
                type="button"
                onClick={() => {
                  handleClearZeroStock();
                  setShowDeleteModal(false);
                }}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/20 border border-slate-200 dark:border-slate-700 hover:border-amber-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    1. Stogi 0 bo'lgan (tugagan) tovarlarni o'chirish
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                    {products.filter((p) => {
                      const wh = p.unitType === 'metr' ? p.totalMetersWarehouse || 0 : p.unitType === 'kg' ? p.totalKgWarehouse || 0 : p.quantityWarehouse || 0;
                      const store = p.unitType === 'metr' ? p.totalMetersStore || 0 : p.unitType === 'kg' ? p.totalKgStore || 0 : p.quantityStore || 0;
                      return wh + store <= 0;
                    }).length} ta
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Ombor va do'konda miqdori tugagan tovarlarni ro'yxatdan tozalaydi.
                </p>
              </button>

              {/* Option 2: Delete Selected Products */}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteSelected();
                    setShowDeleteModal(false);
                  }}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-slate-700 hover:border-rose-500/40 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-xs text-rose-600 dark:text-rose-400">
                      2. Tanlangan ({selectedIds.length} ta) tovarlarni o'chirish
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black">
                      {selectedIds.length} ta
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Ro'yxatdan qushcha bilan belgilangan tovarlarni o'chiradi.
                  </p>
                </button>
              )}

              {/* Option 3: Clear ALL Products (Complete Wipe) */}
              {!confirmWipeAll ? (
                <button
                  type="button"
                  onClick={() => setConfirmWipeAll(true)}
                  className="w-full p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-xs text-rose-600 dark:text-rose-400">
                      {selectedIds.length > 0 ? "3. Barcha tovarlarni to'liq o'chirish (Baza Tozalash)" : "2. Barcha tovarlarni to'liq o'chirish (Baza Tozalash)"}
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black">
                      Jami: {products.length} ta
                    </span>
                  </div>
                  <p className="text-[10px] text-rose-500/80 mt-1">
                    Barcha test yoki mavjud tovarlarni bazadan to'liq tozalash uchun.
                  </p>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-rose-600 text-white space-y-2 border border-rose-700">
                  <div className="font-extrabold text-xs">
                    DIQQAT! BARCHA ({products.length} ta) tovarlar o'chirilishini tasdiqlaysizmi?
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmWipeAll(false)}
                      className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const count = products.length;
                        clearAllProducts();
                        setSelectedIds([]);
                        setConfirmWipeAll(false);
                        setShowDeleteModal(false);
                        setDeleteNotice(`Barcha (${count} ta) tovarlar muvaffaqiyatli o'chirildi!`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 text-rose-400 font-black text-xs hover:bg-black active:scale-95 transition-all"
                    >
                      Ha, Barchasini O'chirish
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Yopish
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FILE IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-3.5 sm:p-5 shadow-2xl relative text-slate-900 dark:text-slate-100 my-auto space-y-3">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-1.5">
                    <span>Excel / Sheets / CSV Import</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[9px] font-black">
                      .XLSX / .CSV
                    </span>
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {importError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Navigation Tabs & Settings */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setImportTab('upload')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${
                    importTab === 'upload'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Fayl Yuklash (.xlsx / .csv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportTab('paste')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${
                    importTab === 'paste'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Matn / Sheets (Paste)</span>
                </button>

                {parsedImportProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setImportTab('preview')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${
                      importTab === 'preview'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Natija ({parsedImportProducts.length})</span>
                  </button>
                )}
              </div>

              {/* Currency & Merge Options */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Valyuta:</span>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-200 dark:bg-slate-700/80 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setImportCurrencyMode('auto')}
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                        importCurrencyMode === 'auto'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-200'
                      }`}
                    >
                      Auto ($ / So'm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportCurrencyMode('USD')}
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                        importCurrencyMode === 'USD'
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-200'
                      }`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportCurrencyMode('UZS')}
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                        importCurrencyMode === 'UZS'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-500 hover:text-slate-200'
                      }`}
                    >
                      UZS (So'm)
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-bold">
                  <input
                    type="checkbox"
                    checked={importMergeDuplicates}
                    onChange={(e) => setImportMergeDuplicates(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Bir xil modeldagi rulonlarni qo'shib birlashtirish</span>
                </label>
              </div>
            </div>

            {/* TAB 1: FILE UPLOAD */}
            {importTab === 'upload' && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-5 sm:p-7 text-center bg-slate-50 dark:bg-slate-800/40 transition-all">
                  <FileSpreadsheet className="w-10 h-10 text-indigo-500 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Excel (.xlsx, .xls) yoki CSV (.csv, .txt) faylingizni yuklang
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">
                    Rulonlarni <span className="font-mono font-bold text-amber-500">50+45.5+74.3</span> qilib bitta yacheykada yoki alohida yacheykalarda kiritish mumkin
                  </p>
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg cursor-pointer active:scale-95 transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Faylni Tanlash (.xlsx / .csv)</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv, .txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Sample Download Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                        <span>Excel (.xlsx) Namuna</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        $ dollar & so'm va rulonlar (+) shabloni
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadExcelSampleTemplate(usdRate)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] shadow flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                    >
                      <Download className="w-3 h-3" />
                      <span>Yuklab olish</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>CSV Namuna</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Google Sheets va matnli import uchun
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadSampleCSV}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] shadow flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                    >
                      <Download className="w-3 h-3" />
                      <span>Namuna CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PASTE TEXT / SHEETS */}
            {importTab === 'paste' && (
              <div className="space-y-2.5">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Google Sheets yoki Excel jadvallaridan nusxa olib (Ctrl+C), ushbu maydonga joylang (Ctrl+V):
                </p>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Tovar Nomi\tModeli\tBirlik\tTannarx\tSotish Narxi\tRulonlar\n5942\t3002\tmetr\t$4.4\t$6.5\t50+45.5+74.3\nGilam Silk\tClassic Gold\tmetr\t$5.5\t$8.0\t50+45+60\nSement Qizilqum\tM500\tkg\t$4.2\t$5.8\t50+50+50`}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadExcelSampleTemplate(usdRate)}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Excel Shablon</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSampleCSV}
                      className="text-[11px] text-amber-500 hover:underline font-bold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV Shablon</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => parseCSVToProducts(importText)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tahlil Qilish</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PREVIEW & CONFIRM */}
            {importTab === 'preview' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{parsedImportProducts.length} ta tovar muvaffaqiyatli tahlil qilindi</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setParsedImportProducts([]);
                      setImportTab('upload');
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                  >
                    Qaytadan
                  </button>
                </div>

                {/* Mobile Friendly Card List for Preview */}
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {parsedImportProducts.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                          <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                          <span className="truncate">{item.name}</span>
                          <span className="text-slate-400 font-medium">({item.model})</span>
                          <span className="uppercase text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300">
                            {item.unitType}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setParsedImportProducts((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-400 block">Tannarx:</span>
                          <strong className="font-mono text-amber-600 dark:text-amber-400">
                            {item.costPriceUsd ? `$${item.costPriceUsd} (${item.costPrice.toLocaleString()} UZS)` : `${item.costPrice.toLocaleString()} UZS`}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Sotish:</span>
                          <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                            {item.salePriceUsd ? `$${item.salePriceUsd} (${item.salePrice.toLocaleString()} UZS)` : `${item.salePrice.toLocaleString()} UZS`}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Ombor Qoldiq:</span>
                          <strong className="font-mono text-slate-800 dark:text-slate-200">
                            {item.quantityWarehouse} {item.unitType}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Do'kon Qoldiq:</span>
                          <strong className="font-mono text-indigo-500">
                            {item.quantityStore || 0} {item.unitType}
                          </strong>
                        </div>
                      </div>

                      {item.containersList && item.containersList.length > 0 && (
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 flex-wrap text-[10px]">
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            Rulonlar ({item.containersList.length} ta):
                          </span>
                          <div className="flex items-center gap-1 flex-wrap font-mono">
                            {item.containersList.map((m, mIdx) => (
                              <span
                                key={mIdx}
                                className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20"
                              >
                                {m}m
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Confirm Import Button */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Jami import qilinadigan: <strong>{parsedImportProducts.length} ta</strong> tovar
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                    >
                      Bekor qilish
                    </button>

                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Tasdiqlash va Import Qilish</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* BARCODE SCANNER MODAL */}
      {showScannerModal && (
        <BarcodeScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          onScanSuccess={handleBarcodeScanned}
        />
      )}

      {/* IMAGE PICKER MODAL */}
      {showImagePicker && (
        <ImagePickerModal
          isOpen={showImagePicker}
          onClose={() => setShowImagePicker(false)}
          onSelectImage={(url) => {
            if (imagePickerTarget === 'add') {
              setPImageUrl(url);
            } else {
              setEditImageUrl(url);
            }
            setShowImagePicker(false);
          }}
        />
      )}

      {/* SINGLE PRODUCT DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Tovarni O'chirish</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Ushbu tovar bazadan batamom o'chiriladi</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-extrabold text-slate-900 dark:text-white">{productToDelete.name}</div>
              <div className="text-[11px] text-slate-500 font-medium">Model: {productToDelete.model}</div>
              {productToDelete.barcode && (
                <div className="text-[10px] text-amber-600 font-mono font-bold">Shtrixkod: {productToDelete.barcode}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setDeleteNotice(`"${productToDelete.name}" tovari o'chirildi`);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                Ha, O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE NOTICE TOAST */}
      {deleteNotice && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl flex items-center gap-3 text-xs animate-slideUp">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">{deleteNotice}</span>
          <button
            onClick={() => setDeleteNotice(null)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BARCODE PRINT MODAL */}
      <BarcodePrintModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        products={barcodePrintProducts}
      />

    </div>
  );
};
