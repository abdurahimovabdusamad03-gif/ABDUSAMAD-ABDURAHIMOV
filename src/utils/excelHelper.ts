import ExcelJS from 'exceljs';
import { Product, UnitType } from '../types';

export interface ImportedProductRaw {
  name: string;
  model: string;
  unitType: UnitType;
  costPrice: number; // in UZS (So'm)
  costPriceUsd?: number; // in USD ($)
  salePrice: number; // in UZS (So'm)
  salePriceUsd?: number; // in USD ($)
  currency?: 'UZS' | 'USD';
  quantityWarehouse: number;
  quantityStore: number;
  barcode: string;
  minAlertStock: number;
  containerCapacity?: number;
  containersList?: number[]; // Array of roll/container lengths e.g. [50, 45.5, 74.3]
  rawRollsText?: string; // Original input text e.g. "50+45.5+74.3"
}

export interface ParseOptions {
  usdRate?: number;
  currencyMode?: 'auto' | 'USD' | 'UZS';
  mergeDuplicates?: boolean;
}

/**
 * Extracts and sums rolls/containers from a string expression like:
 * "50+45.5+74.3", "=50+45.5+74.3", "50 + 45,5 + 74,3", "50, 45.5, 74.3", or "50; 45.5; 74.3"
 */
export function parseRollsExpression(raw: any): number[] {
  if (raw === null || raw === undefined) return [];
  
  // If already a number
  if (typeof raw === 'number') {
    return raw > 0 ? [Math.round(raw * 100) / 100] : [];
  }

  let str = String(raw).trim();
  if (!str) return [];

  // Remove leading '=' if it was an excel formula string
  if (str.startsWith('=')) {
    str = str.substring(1).trim();
  }

  // If contains '+' sign e.g. "50+45.5+74.3" or "50 + 45,5 + 74,3"
  if (str.includes('+')) {
    const parts = str.split('+');
    const result: number[] = [];
    for (const p of parts) {
      const clean = p.trim().replace(',', '.').replace(/[^0-9.]/g, '');
      const num = parseFloat(clean);
      if (!isNaN(num) && num > 0) {
        result.push(Math.round(num * 100) / 100);
      }
    }
    return result;
  }

  // If contains comma, semicolon, space or tab separated numbers e.g. "50, 45.5, 74.3" or "50 45,5 74.3"
  // First normalize decimal commas that are between digits (e.g. 45,5 -> 45.5)
  const normalizedStr = str.replace(/(\d+),(\d+)/g, '$1.$2');

  const splitParts = normalizedStr.split(/[,;\s\t]+/).map((s) => s.trim()).filter(Boolean);
  const result: number[] = [];
  for (const part of splitParts) {
    const clean = part.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    if (!isNaN(num) && num > 0) {
      result.push(Math.round(num * 100) / 100);
    }
  }

  return result;
}

/**
 * Intelligent Price Parser supporting UZS and USD with '$' symbol, comma decimals, and rate conversion
 */
export function parsePriceWithCurrency(
  raw: any,
  options: { usdRate?: number; defaultCurrency?: 'auto' | 'USD' | 'UZS'; isHeaderUsd?: boolean } = {}
): { uzs: number; usd: number; detectedCurrency: 'UZS' | 'USD' } {
  const usdRate = options.usdRate && options.usdRate > 0 ? options.usdRate : 12800;
  const defaultCurrency = options.defaultCurrency || 'auto';

  if (raw === null || raw === undefined || raw === '') {
    return { uzs: 0, usd: 0, detectedCurrency: 'UZS' };
  }

  const str = String(raw).trim();
  const hasDollarSymbol = str.includes('$') || /usd/i.test(str) || !!options.isHeaderUsd;
  const hasSomSymbol = /so['`]?m|som|uzs/i.test(str);

  // Clean numeric string (turn comma to dot)
  const cleanNumeric = str.replace(/[$so'`mUZS\s]/gi, '').replace(',', '.').trim();
  const rawNum = parseFloat(cleanNumeric) || 0;

  if (rawNum <= 0) {
    return { uzs: 0, usd: 0, detectedCurrency: 'UZS' };
  }

  let isUsd = false;

  if (defaultCurrency === 'USD') {
    isUsd = true;
  } else if (defaultCurrency === 'UZS') {
    isUsd = false;
  } else {
    // 'auto' mode
    if (hasDollarSymbol) {
      isUsd = true;
    } else if (hasSomSymbol) {
      isUsd = false;
    } else if (rawNum > 0 && rawNum <= 1000 && (cleanNumeric.includes('.') || rawNum < 100)) {
      // Small number like 4.4, 5.2, 12.5 or 25 is almost always USD in fabric/carpet retail
      isUsd = true;
    } else {
      isUsd = false;
    }
  }

  if (isUsd) {
    const usdVal = Math.round(rawNum * 100) / 100;
    const uzsVal = Math.round(usdVal * usdRate);
    return { uzs: uzsVal, usd: usdVal, detectedCurrency: 'USD' };
  } else {
    const uzsVal = Math.round(rawNum);
    const usdVal = Math.round((uzsVal / usdRate) * 100) / 100;
    return { uzs: uzsVal, usd: usdVal, detectedCurrency: 'UZS' };
  }
}

/**
 * Parses Excel (.xlsx / .xls) buffer into array of product objects with advanced roll and currency parsing
 */
export async function parseExcelFile(
  arrayBuffer: ArrayBuffer,
  options: ParseOptions = {}
): Promise<ImportedProductRaw[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Excel faylida varaq topilmadi!");
  }

  const usdRate = options.usdRate || 12800;
  const currencyMode = options.currencyMode || 'auto';

  // Read header row (row 1) to inspect column names
  const headerRow = worksheet.getRow(1);
  const headerMap: { [key: string]: number } = {};
  const rollColIndices: number[] = [];
  let costColIdx = -1;
  let saleColIdx = -1;
  let nameColIdx = -1;
  let modelColIdx = -1;
  let unitColIdx = -1;
  let rollsExprColIdx = -1;
  let storeQtyColIdx = -1;
  let barcodeColIdx = -1;
  let minStockColIdx = -1;

  headerRow.eachCell((cell, colNumber) => {
    const val = String(cell.value || '').toLowerCase().trim();
    headerMap[val] = colNumber;

    if (val.includes('nomi') || val.includes('tovar') || val.includes('name') || val.includes('mahsulot')) {
      if (nameColIdx === -1) nameColIdx = colNumber;
    } else if (val.includes('model') || val.includes('artikul') || val.includes('rusum')) {
      if (modelColIdx === -1) modelColIdx = colNumber;
    } else if (val.includes('birlik') || val.includes('unit')) {
      if (unitColIdx === -1) unitColIdx = colNumber;
    } else if (val.includes('tannarx') || val.includes('cost') || val.includes('kirim narx')) {
      if (costColIdx === -1) costColIdx = colNumber;
    } else if (val.includes('sotish') || val.includes('sale') || val.includes('narx')) {
      if (saleColIdx === -1) saleColIdx = colNumber;
    } else if (val.includes('rulonlar metraji') || val.includes('metraj (+') || val.includes('yacheyka')) {
      if (rollsExprColIdx === -1) rollsExprColIdx = colNumber;
    } else if (val.includes("do'kon") || val.includes('dokon') || val.includes('store') || val.includes('magazin')) {
      if (storeQtyColIdx === -1) storeQtyColIdx = colNumber;
    } else if (val.includes('shtrix') || val.includes('barcode') || val.includes('barkod')) {
      if (barcodeColIdx === -1) barcodeColIdx = colNumber;
    } else if (val.includes('min') || val.includes('ogohlantirish')) {
      if (minStockColIdx === -1) minStockColIdx = colNumber;
    } else if (val.includes('rulon') || val.includes('roll') || val.includes('idish')) {
      rollColIndices.push(colNumber);
    }
  });

  // Fallback default column indices if headers weren't named exactly
  if (nameColIdx === -1) nameColIdx = 1;
  if (modelColIdx === -1) modelColIdx = 2;
  if (unitColIdx === -1) unitColIdx = 3;
  if (costColIdx === -1) costColIdx = 4;
  if (saleColIdx === -1) saleColIdx = 5;
  if (rollsExprColIdx === -1) rollsExprColIdx = 6;
  if (storeQtyColIdx === -1) storeQtyColIdx = 7;

  // Check if header specifies USD currency
  const headerKeys = Object.keys(headerMap);
  const costHeaderIsUsd = headerKeys.some(
    (h) => h && (h.includes('tannarx ($') || h.includes('tannarx (usd') || h.includes('cost ($') || h.includes('cost (usd'))
  );
  const saleHeaderIsUsd = headerKeys.some(
    (h) => h && (h.includes('sotish ($') || h.includes('sotish (usd') || h.includes('sale ($') || h.includes('sale (usd'))
  );

  const rawProducts: ImportedProductRaw[] = [];

  // Iterate rows starting from row 2
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const rowValues = row.values as Array<any>;
    if (!rowValues || rowValues.length < 2) return;

    // Helper to extract cell raw / text
    const getCellRaw = (idx: number): any => {
      if (idx <= 0) return '';
      const val = rowValues[idx];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') {
        if ('result' in val && val.result !== undefined && val.result !== null) return val.result;
        if ('text' in val && val.text !== undefined && val.text !== null) return val.text;
        if ('formula' in val && val.formula) return `=${val.formula}`;
      }
      return val;
    };

    const getCellStr = (idx: number): string => {
      const raw = getCellRaw(idx);
      return String(raw ?? '').trim();
    };

    const name = getCellStr(nameColIdx) || `Tovar #${rowNumber - 1}`;
    const model = getCellStr(modelColIdx) || 'Standard';

    // Unit type (Default is 'metr' if not specified or contains meter/m)
    const unitRaw = getCellStr(unitColIdx).toLowerCase();
    let unitType: UnitType = 'dona';
    if (unitRaw.includes('metr') || unitRaw.includes('meter') || unitRaw === 'm' || unitRaw === 'м' || unitRaw === '') {
      unitType = 'metr';
    } else if (unitRaw.includes('kg') || unitRaw.includes('kilo') || unitRaw === 'кг') {
      unitType = 'kg';
    }

    // Cost Price & Sale Price parsing
    const costRaw = getCellRaw(costColIdx);
    const saleRaw = getCellRaw(saleColIdx);

    const costParsed = parsePriceWithCurrency(costRaw, {
      usdRate,
      defaultCurrency: currencyMode,
      isHeaderUsd: costHeaderIsUsd,
    });

    const saleParsed = parsePriceWithCurrency(saleRaw, {
      usdRate,
      defaultCurrency: currencyMode,
      isHeaderUsd: saleHeaderIsUsd,
    });

    // Check roll/quantity fields
    // A. Single cell with '+' formula or rolls expression
    let parsedRolls: number[] = [];
    let rawRollsExpression = '';

    const rollsExprStr = getCellStr(rollsExprColIdx);
    if (rollsExprStr) {
      rawRollsExpression = rollsExprStr;
      parsedRolls = parseRollsExpression(rollsExprStr);
    }

    // B. Check designated roll columns or consecutive roll columns (e.g. col 8, 9, 10, 11...)
    const consecutiveRolls: number[] = [];

    // If explicit roll columns were detected in header
    if (rollColIndices.length > 0) {
      for (const colIdx of rollColIndices) {
        const val = getCellStr(colIdx);
        if (val) {
          const sub = parseRollsExpression(val);
          consecutiveRolls.push(...sub);
        }
      }
    } else {
      // Otherwise scan from column 6 or 8 onwards
      const startScanCol = Math.max(6, (storeQtyColIdx > 0 ? storeQtyColIdx + 1 : 8));
      for (let c = startScanCol; c < rowValues.length; c++) {
        // Skip barcode or min stock column if mapped
        if (c === barcodeColIdx || c === minStockColIdx || c === storeQtyColIdx) continue;

        const cellStr = getCellStr(c);
        if (!cellStr) continue;

        // Skip long barcodes (>= 8 digits)
        const numericOnly = cellStr.replace(/[^0-9]/g, '');
        if (numericOnly.length >= 8 && numericOnly.length <= 14) {
          continue;
        }

        const sub = parseRollsExpression(cellStr);
        consecutiveRolls.push(...sub);
      }
    }

    // Merge or pick rolls
    if (parsedRolls.length === 0 && consecutiveRolls.length > 0) {
      parsedRolls = consecutiveRolls;
      rawRollsExpression = consecutiveRolls.join(' + ');
    } else if (consecutiveRolls.length > 0 && parsedRolls.length > 0) {
      // Combine if distinct
      const combined = [...parsedRolls, ...consecutiveRolls];
      parsedRolls = combined;
      rawRollsExpression = combined.join(' + ');
    }

    // Calculate total quantity warehouse
    let quantityWarehouse = 0;
    if (parsedRolls.length > 0) {
      quantityWarehouse = Math.round(parsedRolls.reduce((sum, r) => sum + r, 0) * 100) / 100;
    } else {
      quantityWarehouse = parseFloat(getCellStr(rollsExprColIdx).replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
    }

    const quantityStore = parseFloat(getCellStr(storeQtyColIdx).replace(',', '.').replace(/[^0-9.]/g, '')) || 0;

    // Barcode detection
    let barcode = barcodeColIdx > 0 ? getCellStr(barcodeColIdx).replace(/[^0-9]/g, '') : '';
    if (!barcode || barcode.length < 8) {
      for (let c = 1; c < rowValues.length; c++) {
        const cellStr = getCellStr(c);
        const digitsOnly = cellStr.replace(/[^0-9]/g, '');
        if (digitsOnly.length >= 10 && digitsOnly.length <= 14) {
          barcode = digitsOnly;
          break;
        }
      }
    }
    if (!barcode || barcode.length < 8) {
      barcode = `478${Math.floor(100000000 + Math.random() * 900000000)}`;
    }

    const minAlertStock = (minStockColIdx > 0 ? parseInt(getCellStr(minStockColIdx).replace(/[^0-9]/g, '')) : 10) || 10;
    const containerCapacity = parsedRolls.length > 0 ? parsedRolls[0] : 50;

    rawProducts.push({
      name,
      model,
      unitType,
      costPrice: costParsed.uzs,
      costPriceUsd: costParsed.usd,
      salePrice: saleParsed.uzs,
      salePriceUsd: saleParsed.usd,
      currency: costParsed.detectedCurrency,
      quantityWarehouse,
      quantityStore,
      barcode,
      minAlertStock,
      containerCapacity,
      containersList: parsedRolls.length > 0 ? parsedRolls : undefined,
      rawRollsText: rawRollsExpression || (parsedRolls.length > 0 ? parsedRolls.join(' + ') : undefined),
    });
  });

  // If mergeDuplicates is enabled, combine products with identical Name + Model
  if (options.mergeDuplicates) {
    return mergeDuplicateProducts(rawProducts);
  }

  return rawProducts;
}

/**
 * Parses raw CSV or pasted Google Sheets text into array of products
 */
export function parseCSVToProductsList(
  rawText: string,
  options: ParseOptions = {}
): ImportedProductRaw[] {
  if (!rawText.trim()) return [];

  const usdRate = options.usdRate || 12800;
  const currencyMode = options.currencyMode || 'auto';

  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLineLower = lines[0].toLowerCase();
  const hasHeader =
    firstLineLower.includes('nomi') ||
    firstLineLower.includes('tovar') ||
    firstLineLower.includes('model') ||
    firstLineLower.includes('name') ||
    firstLineLower.includes('birlik') ||
    firstLineLower.includes('tannarx') ||
    firstLineLower.includes('rulon');

  const startIndex = hasHeader ? 1 : 0;
  const result: ImportedProductRaw[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Split by tab (Google Sheets / Excel paste) or semicolon or comma (if not inside quotes)
    const cols = line.split(/\t|;|,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((col) => col.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) continue;

    const name = cols[0] || `Tovar #${i + 1}`;
    const model = cols[1] || 'Standard';

    const unitRaw = (cols[2] || '').toLowerCase();
    let unitType: UnitType = 'metr';
    if (unitRaw.includes('metr') || unitRaw.includes('meter') || unitRaw === 'm' || unitRaw === 'м' || unitRaw === '') {
      unitType = 'metr';
    } else if (unitRaw.includes('kg') || unitRaw.includes('kilo') || unitRaw === 'кг') {
      unitType = 'kg';
    } else if (unitRaw.includes('dona') || unitRaw.includes('pcs') || unitRaw === 'шт') {
      unitType = 'dona';
    }

    const costParsed = parsePriceWithCurrency(cols[3] || '0', {
      usdRate,
      defaultCurrency: currencyMode,
    });

    const saleParsed = parsePriceWithCurrency(cols[4] || '0', {
      usdRate,
      defaultCurrency: currencyMode,
    });

    // Check for '+' or consecutive roll entries
    let parsedRolls: number[] = [];
    let rawRollsExpression = '';

    // Check all remaining columns
    const consecutiveRolls: number[] = [];
    for (let c = 5; c < cols.length; c++) {
      const colVal = cols[c];
      if (!colVal) continue;

      if (colVal.includes('+')) {
        const sub = parseRollsExpression(colVal);
        consecutiveRolls.push(...sub);
        rawRollsExpression = colVal;
        continue;
      }

      // Check if it's barcode
      const digitsOnly = colVal.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= 10 && digitsOnly.length <= 14) {
        continue;
      }

      const num = parseFloat(colVal.replace(',', '.'));
      if (!isNaN(num) && num > 0) {
        consecutiveRolls.push(Math.round(num * 100) / 100);
      }
    }

    if (consecutiveRolls.length > 0) {
      parsedRolls = consecutiveRolls;
      if (!rawRollsExpression) {
        rawRollsExpression = consecutiveRolls.join(' + ');
      }
    }

    let quantityWarehouse = 0;
    if (parsedRolls.length > 0) {
      quantityWarehouse = Math.round(parsedRolls.reduce((sum, r) => sum + r, 0) * 100) / 100;
    } else {
      quantityWarehouse = parseFloat((cols[5] || '0').replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
    }

    const quantityStore = parseFloat((cols[6] || '0').replace(',', '.').replace(/[^0-9.]/g, '')) || 0;

    let barcode = (cols[7] || '').replace(/[^0-9]/g, '');
    if (!barcode || barcode.length < 8) {
      barcode = `478${Math.floor(100000000 + Math.random() * 900000000)}`;
    }

    const minAlertStock = parseInt((cols[8] || '10').replace(/[^0-9]/g, '')) || 10;
    const containerCapacity = parseFloat((cols[9] || '50').replace(',', '.').replace(/[^0-9.]/g, '')) || 50;

    result.push({
      name,
      model,
      unitType,
      costPrice: costParsed.uzs,
      costPriceUsd: costParsed.usd,
      salePrice: saleParsed.uzs,
      salePriceUsd: saleParsed.usd,
      currency: costParsed.detectedCurrency,
      quantityWarehouse,
      quantityStore,
      barcode,
      minAlertStock,
      containerCapacity,
      containersList: parsedRolls.length > 0 ? parsedRolls : undefined,
      rawRollsText: rawRollsExpression || undefined,
    });
  }

  if (options.mergeDuplicates) {
    return mergeDuplicateProducts(result);
  }

  return result;
}

/**
 * Combines items that share the exact same Name + Model into one item with combined roll list & total quantity
 */
export function mergeDuplicateProducts(items: ImportedProductRaw[]): ImportedProductRaw[] {
  const map = new Map<string, ImportedProductRaw>();

  for (const item of items) {
    const key = `${item.name.toLowerCase().trim()}___${item.model.toLowerCase().trim()}`;
    if (!map.has(key)) {
      map.set(key, {
        ...item,
        containersList: item.containersList ? [...item.containersList] : undefined,
      });
    } else {
      const existing = map.get(key)!;
      // Merge rolls
      let combinedRolls: number[] | undefined = undefined;
      if (existing.containersList || item.containersList) {
        combinedRolls = [
          ...(existing.containersList || (existing.quantityWarehouse > 0 ? [existing.quantityWarehouse] : [])),
          ...(item.containersList || (item.quantityWarehouse > 0 ? [item.quantityWarehouse] : [])),
        ];
      }

      existing.quantityWarehouse = Math.round((existing.quantityWarehouse + item.quantityWarehouse) * 100) / 100;
      existing.quantityStore = Math.round((existing.quantityStore + item.quantityStore) * 100) / 100;
      existing.containersList = combinedRolls;
      if (combinedRolls && combinedRolls.length > 0) {
        existing.rawRollsText = combinedRolls.join(' + ');
      }
      // Update price if existing was 0
      if (existing.costPrice === 0 && item.costPrice > 0) {
        existing.costPrice = item.costPrice;
        existing.costPriceUsd = item.costPriceUsd;
      }
      if (existing.salePrice === 0 && item.salePrice > 0) {
        existing.salePrice = item.salePrice;
        existing.salePriceUsd = item.salePriceUsd;
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Downloads a modern, crystal-clear sample Excel (.xlsx) file matching the new dual-currency and roll input formats
 */
export async function downloadExcelSampleTemplate(usdRate: number = 12800) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tovarlar Shablon', {
    views: [{ showGridLines: true }]
  });

  // Columns setup
  worksheet.columns = [
    { header: 'Tovar Nomi', key: 'name', width: 22 },
    { header: 'Modeli / Artikul', key: 'model', width: 20 },
    { header: 'Birlik (metr/kg/dona)', key: 'unitType', width: 22 },
    { header: 'Tannarx ($ yoki So\'m)', key: 'costPrice', width: 22 },
    { header: 'Sotish Narxi ($ yoki So\'m)', key: 'salePrice', width: 24 },
    { header: 'Rulonlar Metraji (1 yacheykada + bilan)', key: 'rollsExpression', width: 34 },
    { header: 'Do\'kon Qoldiq', key: 'quantityStore', width: 16 },
    { header: 'Rulon 1', key: 'roll1', width: 12 },
    { header: 'Rulon 2', key: 'roll2', width: 12 },
    { header: 'Rulon 3', key: 'roll3', width: 12 },
    { header: 'Rulon 4', key: 'roll4', width: 12 },
    { header: 'Shtrix-kod (Barcode)', key: 'barcode', width: 22 },
    { header: 'Min Qoldiq', key: 'minAlertStock', width: 14 },
  ];

  // Header style
  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' }, // Slate 900
    };
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'F8FAFC' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  // Sample data rows showcasing:
  // 1. Single cell with '+' (e.g. 50+45.5+74.3) + Dollar price ($4.4)
  // 2. Multiple roll columns (50, 45.5, 74.3) + Dollar price ($5.2)
  // 3. UZS prices with '+' meters
  // 4. Kg / dona units
  const sampleRows = [
    {
      name: '5942',
      model: '3002',
      unitType: 'metr',
      costPrice: '$4.4',
      salePrice: '$6.5',
      rollsExpression: '50+45.5+74.3',
      quantityStore: 0,
      roll1: '',
      roll2: '',
      roll3: '',
      roll4: '',
      barcode: '478123456781',
      minAlertStock: 20,
    },
    {
      name: 'Gilam Silk Royal',
      model: 'Classic Gold 3x4',
      unitType: 'metr',
      costPrice: '$5.5',
      salePrice: '$8.0',
      rollsExpression: '',
      quantityStore: 0,
      roll1: 50,
      roll2: 45.5,
      roll3: 60,
      roll4: 38.5,
      barcode: '478123456782',
      minAlertStock: 20,
    },
    {
      name: 'Mato Shoyi Atlas',
      model: 'Art-770',
      unitType: 'metr',
      costPrice: '56,000',
      salePrice: '85,000',
      rollsExpression: '32+28.5+45+50',
      quantityStore: 28.5,
      roll1: '',
      roll2: '',
      roll3: '',
      roll4: '',
      barcode: '478123456783',
      minAlertStock: 15,
    },
    {
      name: 'Sement Qizilqum M500',
      model: 'Qop 50kg',
      unitType: 'kg',
      costPrice: '$4.2',
      salePrice: '$5.8',
      rollsExpression: '50+50+50+50+50',
      quantityStore: 50,
      roll1: 50,
      roll2: 50,
      roll3: 50,
      roll4: 50,
      barcode: '478123456784',
      minAlertStock: 100,
    },
    {
      name: 'Laminat Swiss Krono',
      model: 'Oak 8mm Class 32',
      unitType: 'dona',
      costPrice: '85,000',
      salePrice: '115,000',
      rollsExpression: '10+10+10+10',
      quantityStore: 10,
      roll1: 10,
      roll2: 10,
      roll3: 10,
      roll4: 10,
      barcode: '478123456785',
      minAlertStock: 15,
    },
  ];

  sampleRows.forEach((item) => {
    worksheet.addRow(item);
  });

  // Format data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 24;
      row.alignment = { vertical: 'middle' };
      row.getCell(1).font = { bold: true };
      row.getCell(3).alignment = { horizontal: 'center' };
      row.getCell(4).alignment = { horizontal: 'right' };
      row.getCell(5).alignment = { horizontal: 'right' };
      row.getCell(6).alignment = { horizontal: 'center' };
      row.getCell(7).alignment = { horizontal: 'center' };
      row.getCell(8).alignment = { horizontal: 'center' };
      row.getCell(9).alignment = { horizontal: 'center' };
      row.getCell(10).alignment = { horizontal: 'center' };
      row.getCell(11).alignment = { horizontal: 'center' };
      row.getCell(12).alignment = { horizontal: 'center' };
    }
  });

  // Generate buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Tovarlar_Import_Shabloni_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export current inventory products to Excel (.xlsx) file
 */
export async function exportProductsToExcel(products: Product[], usdRate: number = 12800) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Mavjud Tovarlar', {
    views: [{ showGridLines: true }]
  });

  worksheet.columns = [
    { header: 'Tovar Nomi', key: 'name', width: 24 },
    { header: 'Modeli', key: 'model', width: 20 },
    { header: 'Birlik', key: 'unitType', width: 14 },
    { header: 'Tannarx (So\'m)', key: 'costPrice', width: 16 },
    { header: 'Tannarx ($ USD)', key: 'costPriceUsd', width: 16 },
    { header: 'Sotish Narxi (So\'m)', key: 'salePrice', width: 18 },
    { header: 'Sotish Narxi ($ USD)', key: 'salePriceUsd', width: 18 },
    { header: 'Ombor Qoldiq', key: 'quantityWarehouse', width: 16 },
    { header: 'Do\'kon Qoldiq', key: 'quantityStore', width: 16 },
    { header: 'Rulonlar / Idishlar Listi', key: 'containersList', width: 34 },
    { header: 'Shtrix-kod', key: 'barcode', width: 20 },
    { header: 'Min Qoldiq', key: 'minAlertStock', width: 14 },
  ];

  // Header style
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F766E' }, // Teal 700
    };
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFF' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  products.forEach((p) => {
    const whQty = p.unitType === 'metr'
      ? (p.totalMetersWarehouse || 0)
      : p.unitType === 'kg'
      ? (p.totalKgWarehouse || 0)
      : (p.quantityWarehouse || 0);

    const storeQty = p.unitType === 'metr'
      ? (p.totalMetersStore || 0)
      : p.unitType === 'kg'
      ? (p.totalKgStore || 0)
      : (p.quantityStore || 0);

    const list = p.unitType === 'metr'
      ? p.warehouseRollsList
      : p.unitType === 'kg'
      ? p.warehouseBagsList
      : p.warehouseBoxesList;

    const costUsd = p.costPriceUsd || (p.costPrice > 0 ? Math.round((p.costPrice / usdRate) * 100) / 100 : 0);
    const saleUsd = p.salePriceUsd || (p.salePrice > 0 ? Math.round((p.salePrice / usdRate) * 100) / 100 : 0);

    worksheet.addRow({
      name: p.name,
      model: p.model,
      unitType: p.unitType,
      costPrice: p.costPrice,
      costPriceUsd: costUsd > 0 ? `$${costUsd}` : '',
      salePrice: p.salePrice,
      salePriceUsd: saleUsd > 0 ? `$${saleUsd}` : '',
      quantityWarehouse: whQty,
      quantityStore: storeQty,
      containersList: list && list.length > 0 ? list.join(' + ') : '',
      barcode: p.barcode || '',
      minAlertStock: p.minAlertStock || 10,
    });
  });

  // Formatting
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 22;
      row.alignment = { vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'center' };
      row.getCell(4).numFmt = '#,##0';
      row.getCell(6).numFmt = '#,##0';
      row.getCell(8).numFmt = '#,##0.0';
      row.getCell(9).numFmt = '#,##0.0';
      row.getCell(11).alignment = { horizontal: 'center' };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Ombor_Tovarlar_Eksport_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
