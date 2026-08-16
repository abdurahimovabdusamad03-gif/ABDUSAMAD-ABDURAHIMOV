import React, { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import { useERP } from '../context/ERPContext';
import { Sparkles, X, Send, Bot, AlertCircle, RefreshCw, ArrowRight, TrendingUp, HelpCircle, MessageSquare } from 'lucide-react';

interface AITaxlilchiModalProps {
  onClose: () => void;
}

export const AITaxlilchiModal: React.FC<AITaxlilchiModalProps> = ({ onClose }) => {
  const { products, sales, customers, getAggregatedStats, getTopSellingProductsMonth, settings } = useERP();

  const [prompt, setPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');

  const stats = getAggregatedStats();
  const topProducts = getTopSellingProductsMonth();
  const totalDebt = customers.reduce((sum, c) => sum + c.currentDebtUzs, 0);

  // Rich sales breakdown and forecasting metrics
  const forecastMetrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yestDate = new Date(now);
    yestDate.setDate(yestDate.getDate() - 1);
    const yesterdayStr = yestDate.toISOString().split('T')[0];

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = Math.max(1, now.getDate());
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let todayRevenue = 0, todayCost = 0, todayProfit = 0, todayCount = 0;
    let yesterdayRevenue = 0, yesterdayCost = 0, yesterdayProfit = 0, yesterdayCount = 0;
    let mtdRevenue = 0, mtdCost = 0, mtdProfit = 0, mtdCount = 0;

    sales.forEach((s) => {
      const sDate = new Date(s.date);
      const sDateStr = s.date.slice(0, 10);
      const sProfit = s.totalAmountUzs - (s.totalCostUzs || 0);

      // Today
      if (sDateStr === todayStr) {
        todayRevenue += s.totalAmountUzs;
        todayCost += s.totalCostUzs || 0;
        todayProfit += sProfit;
        todayCount += 1;
      }

      // Yesterday
      if (sDateStr === yesterdayStr) {
        yesterdayRevenue += s.totalAmountUzs;
        yesterdayCost += s.totalCostUzs || 0;
        yesterdayProfit += sProfit;
        yesterdayCount += 1;
      }

      // Month to date
      if (sDate.getFullYear() === currentYear && sDate.getMonth() === currentMonth) {
        mtdRevenue += s.totalAmountUzs;
        mtdCost += s.totalCostUzs || 0;
        mtdProfit += sProfit;
        mtdCount += 1;
      }
    });

    const avgDailyRevenue = mtdRevenue / currentDay;
    const avgDailyProfit = mtdProfit / currentDay;

    const projectedMonthEndRevenue = Math.round(avgDailyRevenue * daysInMonth);
    const projectedMonthEndProfit = Math.round(avgDailyProfit * daysInMonth);
    const projectedTomorrowRevenue = Math.round((todayRevenue + yesterdayRevenue + avgDailyRevenue) / 3);
    const projectedTomorrowProfit = Math.round((todayProfit + yesterdayProfit + avgDailyProfit) / 3);

    return {
      todayStr,
      yesterdayStr,
      currentDay,
      daysInMonth,
      today: { count: todayCount, revenue: todayRevenue, profit: todayProfit },
      yesterday: { count: yesterdayCount, revenue: yesterdayRevenue, profit: yesterdayProfit },
      mtd: { count: mtdCount, revenue: mtdRevenue, profit: mtdProfit },
      avgDaily: { revenue: avgDailyRevenue, profit: avgDailyProfit },
      projectedTomorrow: { revenue: projectedTomorrowRevenue, profit: projectedTomorrowProfit },
      projectedMonthEnd: { revenue: projectedMonthEndRevenue, profit: projectedMonthEndProfit },
    };
  }, [sales]);

  const samplePrompts = [
    "🔮 Bugungi va kechagi savdolarni solishtirib, ertaga va oy oxiriga savdo hamda foyda prognozini bering.",
    "📊 Do'konimiz va ombordagi tovarlar qoldig'ini tahlil qilib, zaxira bo'yicha maslahat bering.",
    "💳 Nasiya qarzlari va qarzdor mijozlar xavfini baholang.",
    "💡 ERP tizimidan tashqari: Biznes daromadini oshirish va mijozlarni ko'paytirish usullari nimalar?",
  ];

  const handleRunAnalysis = async (userPrompt?: string) => {
    const query = userPrompt || prompt || "Bugungi va kechagi savdo tahlili hamda kelgusi prognozlarni bering.";
    setLoading(true);
    setError(null);

    const storeSnapshot = {
      storeName: settings.storeName,
      usdRate: settings.usdRate,
      dateContext: {
        today: forecastMetrics.todayStr,
        yesterday: forecastMetrics.yesterdayStr,
        currentDayOfMonth: forecastMetrics.currentDay,
        totalDaysInMonth: forecastMetrics.daysInMonth,
      },
      salesBreakdown: {
        today: forecastMetrics.today,
        yesterday: forecastMetrics.yesterday,
        monthToDate: forecastMetrics.mtd,
        averageDaily: {
          revenueUzs: Math.round(forecastMetrics.avgDaily.revenue),
          profitUzs: Math.round(forecastMetrics.avgDaily.profit),
        },
        calculatedForecasts: {
          projectedTomorrowRevenueUzs: forecastMetrics.projectedTomorrow.revenue,
          projectedTomorrowProfitUzs: forecastMetrics.projectedTomorrow.profit,
          projectedMonthEndRevenueUzs: forecastMetrics.projectedMonthEnd.revenue,
          projectedMonthEndProfitUzs: forecastMetrics.projectedMonthEnd.profit,
        },
      },
      overallStats: {
        totalRevenueUzs: stats.totalRevenueUzs,
        totalProfitUzs: stats.totalProfitUzs,
        cashTotalUzs: stats.cashTotalUzs,
        cardTotalUzs: stats.cardTotalUzs,
        nasiyaTotalUzs: stats.nasiyaTotalUzs,
        totalCustomerDebtUzs: totalDebt,
      },
      topSellingProducts: topProducts.map((tp) => ({
        name: tp.productName,
        model: tp.model,
        sold: tp.quantitySold,
        revenue: tp.totalRevenueUzs,
        profit: tp.totalProfitUzs,
      })),
      lowStockProducts: products
        .filter((p) => {
          let qty = p.unitType === 'metr' ? p.totalMetersStore || 0 : p.unitType === 'kg' ? p.totalKgStore || 0 : p.quantityStore || 0;
          return qty <= p.minAlertStock;
        })
        .map((p) => ({ name: p.name, model: p.model, unitType: p.unitType })),
    };

    try {
      const response = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          storeData: storeSnapshot,
          language: settings.language || 'uz',
          model: selectedModel,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI Server xatosi');
      }

      setAnalysisResult(data.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AI tahlilida xatolik yuz berdi. GEMINI API kalitini va tarmoqni tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative text-slate-100 my-8">
        
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 border border-indigo-400/30 text-amber-300 shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>AI Taxlilchi</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  Gemini AI
                </span>
              </h3>
              <p className="text-xs text-slate-400">ERP tizimi, savdo prognozlari va har qanday savollaringizga aqlli AI javoblari</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors self-end sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gemini Model Selector Tabs */}
        <div className="mb-4 p-2 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 flex items-center justify-between">
            <span>Gemini Modelini Tanlang:</span>
            <span className="text-amber-400 font-mono text-[9px]">{selectedModel}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`p-2 rounded-xl border text-left transition-all ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-[11px] font-black flex items-center gap-1">
                <span>⚡ Flash-Lite</span>
              </div>
              <div className="text-[9px] opacity-75 truncate">Tezkor & Yengil</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.5-flash')}
              className={`p-2 rounded-xl border text-left transition-all ${
                selectedModel === 'gemini-3.5-flash'
                  ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-[11px] font-black flex items-center gap-1">
                <span>✨ 3.5 Flash</span>
              </div>
              <div className="text-[9px] opacity-75 truncate">Standart & Muvozanatli</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
              className={`p-2 rounded-xl border text-left transition-all ${
                selectedModel === 'gemini-3.1-pro-preview'
                  ? 'bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-[11px] font-black flex items-center gap-1">
                <span>🧠 3.1 Pro</span>
              </div>
              <div className="text-[9px] opacity-75 truncate">Chuqur Chuqurlashtirilgan</div>
            </button>
          </div>
        </div>

        {/* Realtime KPI Quick Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px]">
          <div>
            <div className="text-slate-400 text-[10px] font-medium">Bugungi Savdo</div>
            <div className="font-black text-emerald-400 text-xs">
              {forecastMetrics.today.revenue.toLocaleString()} UZS
            </div>
            <div className="text-[9px] text-slate-500">{forecastMetrics.today.count} ta sotuv</div>
          </div>

          <div>
            <div className="text-slate-400 text-[10px] font-medium">Kechagi Savdo</div>
            <div className="font-bold text-slate-300 text-xs">
              {forecastMetrics.yesterday.revenue.toLocaleString()} UZS
            </div>
            <div className="text-[9px] text-slate-500">{forecastMetrics.yesterday.count} ta sotuv</div>
          </div>

          <div>
            <div className="text-slate-400 text-[10px] font-medium">Ertangi Prognoz</div>
            <div className="font-black text-amber-400 text-xs">
              ~{forecastMetrics.projectedTomorrow.revenue.toLocaleString()} UZS
            </div>
            <div className="text-[9px] text-amber-500/80">Foyda: ~{forecastMetrics.projectedTomorrow.profit.toLocaleString()} UZS</div>
          </div>

          <div>
            <div className="text-slate-400 text-[10px] font-medium">Oy Oxiri Prognoz</div>
            <div className="font-black text-indigo-400 text-xs">
              ~{forecastMetrics.projectedMonthEnd.revenue.toLocaleString()} UZS
            </div>
            <div className="text-[9px] text-indigo-400/80">Foyda: ~{forecastMetrics.projectedMonthEnd.profit.toLocaleString()} UZS</div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
            <span>Tezkor Tahlil va Prognoz Savollari:</span>
            <span className="text-[10px] text-indigo-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Istalgan turdagi savolingizni yozishingiz mumkin
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(sp);
                  handleRunAnalysis(sp);
                }}
                className="text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/60 border border-slate-700 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-indigo-200 transition-all flex items-center justify-between group"
              >
                <span className="line-clamp-1">{sp}</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Query Input */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
              placeholder="Savdo prognozlari, biznes, marketing yoki har qanday savol yozing..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
            <MessageSquare className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>
          <button
            onClick={() => handleRunAnalysis()}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all shrink-0"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Tahlil qilish</span>
          </button>
        </div>

        {/* AI Output Canvas */}
        <div className="min-h-[260px] max-h-[420px] overflow-y-auto p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-indigo-400">
              <RefreshCw className="w-9 h-9 animate-spin text-amber-400" />
              <div className="font-semibold text-xs text-slate-300 animate-pulse text-center">
                Gemini AI do'koningiz savdolarini, kechagi va bugungi ko'rsatkichlarni tahlil qilmoqda...
              </div>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Xatolik yuz berdi</div>
                <div className="mt-1 text-xs">{error}</div>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="space-y-3 text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>AI Taxlilchi Javobi va Tahlili:</span>
                </div>
                <button
                  onClick={() => handleRunAnalysis()}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg"
                >
                  <RefreshCw className="w-3 h-3" /> Qayta tahlil
                </button>
              </div>

              <div className="markdown-body text-xs leading-relaxed space-y-2">
                <Markdown>{analysisResult}</Markdown>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Bot className="w-12 h-12 mx-auto mb-3 text-indigo-400/60" />
              <p className="font-semibold text-slate-300 text-sm">Gemini AI Taxlilchi ishga tayyor!</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Bugungi va kechagi savdolaringiz tahlil qilinib, ertangi va oy oxirigacha kutilayotgan savdo va foyda miqdori hisoblab beriladi. Shuningdek, ERP tizimidan tashqari har qanday savolingizga javob beradi.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Savdo prognozlari real sotuvlar va kunlik o'rtacha sur'atlar asosida hisoblanadi</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Yopish
          </button>
        </div>

      </div>
    </div>
  );
};

