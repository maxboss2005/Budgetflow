import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coins, 
  DollarSign, 
  Plus, 
  Trash2, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  BellRing,
  HelpCircle,
  Cpu,
  RefreshCw,
  Wallet2,
  ChevronRight,
  Activity
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces
interface Asset {
  id: string;
  code: string; // BTC, ETH, SOL, USD, EUR, etc.
  name: string;
  type: 'fiat' | 'crypto' | 'stablecoin';
  balance: number;
  color: string;
  icon: string;
}

interface LedgerTx {
  id: string;
  date: string;
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
  feeAsset: string;
  type: 'swap' | 'buy' | 'sell' | 'deposit' | 'withdraw';
  notes: string;
}

interface PriceAlert {
  id: string;
  assetCode: string;
  condition: 'above' | 'below';
  targetPrice: number;
  isTriggered: boolean;
  createdAt: string;
}

// Exchange Rates relative to 1 USD
const USD_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  NGN: 1550.0,
  BTC: 1 / 64250,  // 1 USD = 0.0000155 BTC
  ETH: 1 / 3450,   // 1 USD = 0.00029 ETH
  SOL: 1 / 145.2,  // 1 USD = 0.00688 SOL
  USDC: 1.0
};

// Crypto asset prices in USD directly for easier multiplication
const CRYPTO_PRICES_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.087, // 1 EUR = 1.087 USD
  GBP: 1.282, // 1 GBP = 1.282 USD
  NGN: 0.000645, // 1 NGN = 0.000645 USD
  BTC: 64250.0,
  ETH: 3450.0,
  SOL: 145.2,
  USDC: 1.0
};

const SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  BTC: '₿',
  ETH: 'Ξ',
  SOL: '◎',
  USDC: '₮'
};

const INITIAL_ASSETS: Asset[] = [
  { id: '1', code: 'USD', name: 'US Dollar', type: 'fiat', balance: 12450.00, color: '#3B82F6', icon: 'DollarSign' },
  { id: '2', code: 'EUR', name: 'Euro Cash', type: 'fiat', balance: 3200.00, color: '#10B981', icon: 'Euro' },
  { id: '3', code: 'BTC', name: 'Bitcoin', type: 'crypto', balance: 0.245, color: '#F59E0B', icon: 'Bitcoin' },
  { id: '4', code: 'ETH', name: 'Ethereum', type: 'crypto', balance: 2.85, color: '#8B5CF6', icon: 'Ethereum' },
  { id: '5', code: 'SOL', name: 'Solana', type: 'crypto', balance: 18.40, color: '#14B8A6', icon: 'Coins' },
  { id: '6', code: 'USDC', name: 'USD Coin', type: 'stablecoin', balance: 1500.00, color: '#06B6D4', icon: 'ShieldCheck' }
];

const INITIAL_TXS: LedgerTx[] = [
  {
    id: 'tx-1',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0],
    fromAsset: 'USD',
    toAsset: 'BTC',
    fromAmount: 3000,
    toAmount: 0.0467,
    fee: 15.00,
    feeAsset: 'USD',
    type: 'buy',
    notes: 'Acquired BTC dip'
  },
  {
    id: 'tx-2',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1).toISOString().split('T')[0],
    fromAsset: 'ETH',
    toAsset: 'SOL',
    fromAmount: 0.5,
    toAmount: 11.88,
    fee: 0.002,
    feeAsset: 'ETH',
    type: 'swap',
    notes: 'Swapped ETH for SOL high speed yield'
  }
];

export default function DigitalAssetLedger() {
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'NGN'>('USD');
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('devfint_ledger_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });
  
  const [transactions, setTransactions] = useState<LedgerTx[]>(() => {
    const saved = localStorage.getItem('devfint_ledger_txs');
    return saved ? JSON.parse(saved) : INITIAL_TXS;
  });

  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    const saved = localStorage.getItem('devfint_price_alerts');
    return saved ? JSON.parse(saved) : [
      { id: 'a-1', assetCode: 'BTC', condition: 'above', targetPrice: 68000, isTriggered: false, createdAt: new Date().toISOString() },
      { id: 'a-2', assetCode: 'SOL', condition: 'below', targetPrice: 120, isTriggered: false, createdAt: new Date().toISOString() }
    ];
  });

  // Action modals & inputs
  const [actionTab, setActionTab] = useState<'swap' | 'stake' | 'alerts' | 'gas'>('swap');
  
  // Swap / Buy form
  const [swapFrom, setSwapFrom] = useState('USD');
  const [swapTo, setSwapTo] = useState('BTC');
  const [swapFromAmount, setSwapFromAmount] = useState('');
  const [swapToAmount, setSwapToAmount] = useState('');
  const [swapSuccess, setSwapSuccess] = useState('');
  const [swapError, setSwapError] = useState('');
  const [swapFeeUSD, setSwapFeeUSD] = useState(1.99);

  // Staking simulator
  const [stakeAsset, setStakeAsset] = useState('SOL');
  const [stakeAmount, setStakeAmount] = useState('10');
  const [stakeDuration, setStakeDuration] = useState('12'); // months
  const [stakeApy, setStakeApy] = useState(6.8); // 6.8% for SOL

  // New Alert form
  const [newAlertAsset, setNewAlertAsset] = useState('BTC');
  const [newAlertCondition, setNewAlertCondition] = useState<'above' | 'below'>('above');
  const [newAlertPrice, setNewAlertPrice] = useState('');

  // Gas Estimator
  const [gasNetwork, setGasNetwork] = useState<'btc' | 'eth' | 'sol' | 'polygon'>('eth');
  const [gasCongestion, setGasCongestion] = useState<'low' | 'medium' | 'high'>('medium');

  // Sync state
  useEffect(() => {
    localStorage.setItem('devfint_ledger_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('devfint_ledger_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('devfint_price_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Handle APY default values on asset change
  useEffect(() => {
    if (stakeAsset === 'SOL') setStakeApy(6.8);
    else if (stakeAsset === 'ETH') setStakeApy(4.2);
    else if (stakeAsset === 'USDC') setStakeApy(5.15);
    else if (stakeAsset === 'BTC') setStakeApy(1.8);
  }, [stakeAsset]);

  // Convert an amount in USD to the chosen base display currency
  const convertFromUSD = (usdAmount: number, targetCurrency: string = baseCurrency) => {
    const rate = USD_RATES[targetCurrency];
    return usdAmount * rate;
  };

  // Convert a native asset value to USD
  const convertToUSD = (amount: number, assetCode: string) => {
    const priceInUSD = CRYPTO_PRICES_USD[assetCode];
    return amount * priceInUSD;
  };

  // Total portfolio value in USD
  const totalPortfolioUSD = useMemo(() => {
    return assets.reduce((sum, asset) => sum + convertToUSD(asset.balance, asset.code), 0);
  }, [assets]);

  // Assets formatted with USD and Base currency equivalents
  const assetsWithValue = useMemo(() => {
    return assets.map(asset => {
      const valueUSD = convertToUSD(asset.balance, asset.code);
      const valueBase = convertFromUSD(valueUSD, baseCurrency);
      return {
        ...asset,
        valueUSD,
        valueBase
      };
    }).sort((a, b) => b.valueUSD - a.valueUSD);
  }, [assets, baseCurrency]);

  // Recharts Pie Chart Data
  const chartData = useMemo(() => {
    return assetsWithValue.map(asset => ({
      name: asset.code,
      value: Math.round(asset.valueUSD),
      color: asset.color
    })).filter(item => item.value > 0);
  }, [assetsWithValue]);

  // Form exchange rate auto calculation
  useEffect(() => {
    if (!swapFromAmount || isNaN(parseFloat(swapFromAmount))) {
      setSwapToAmount('');
      return;
    }
    const amt = parseFloat(swapFromAmount);
    const usdVal = convertToUSD(amt, swapFrom);
    const targetAssetPrice = CRYPTO_PRICES_USD[swapTo];
    const rawToAmount = usdVal / targetAssetPrice;
    
    // Fee simulation: Deduct a small 0.5% developer discount exchange fee
    const feePercent = 0.005;
    const finalToAmount = rawToAmount * (1 - feePercent);
    setSwapToAmount(finalToAmount.toFixed(swapTo === 'BTC' ? 6 : swapTo === 'ETH' ? 5 : 2));
    setSwapFeeUSD(usdVal * feePercent);
  }, [swapFromAmount, swapFrom, swapTo]);

  const handleSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSwapError('');
    setSwapSuccess('');

    const fromAmt = parseFloat(swapFromAmount);
    const toAmt = parseFloat(swapToAmount);

    if (isNaN(fromAmt) || fromAmt <= 0) {
      setSwapError('Please enter a valid transfer amount.');
      return;
    }

    const source = assets.find(a => a.code === swapFrom);
    const destination = assets.find(a => a.code === swapTo);

    if (!source) {
      setSwapError('Source asset not recognized in database.');
      return;
    }

    if (source.balance < fromAmt) {
      setSwapError(`Insufficient funds in ${swapFrom}. Available balance is ${source.balance.toLocaleString()} ${swapFrom}`);
      return;
    }

    if (swapFrom === swapTo) {
      setSwapError('Cannot exchange the same asset code.');
      return;
    }

    // Double entry book balancing
    const updatedAssets = assets.map(asset => {
      if (asset.code === swapFrom) {
        return { ...asset, balance: asset.balance - fromAmt };
      }
      if (asset.code === swapTo) {
        return { ...asset, balance: asset.balance + toAmt };
      }
      return asset;
    });

    const newTx: LedgerTx = {
      id: `tx-ledger-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      fromAsset: swapFrom,
      toAsset: swapTo,
      fromAmount: fromAmt,
      toAmount: toAmt,
      fee: parseFloat((swapFeeUSD / CRYPTO_PRICES_USD[swapFrom]).toFixed(6)),
      feeAsset: swapFrom,
      type: 'swap',
      notes: `Double-entry ledger conversion from ${swapFrom} to ${swapTo}`
    };

    setAssets(updatedAssets);
    setTransactions([newTx, ...transactions]);
    setSwapFromAmount('');
    setSwapToAmount('');
    setSwapSuccess(`Successfully Swapped ${fromAmt} ${swapFrom} for ${toAmt} ${swapTo}! Double-entry ledger cleared.`);
  };

  // Add Price Alert
  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(newAlertPrice);
    if (isNaN(targetVal) || targetVal <= 0) return;

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      assetCode: newAlertAsset,
      condition: newAlertCondition,
      targetPrice: targetVal,
      isTriggered: false,
      createdAt: new Date().toISOString()
    };

    setAlerts([newAlert, ...alerts]);
    setNewAlertPrice('');
  };

  // Delete Alert
  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  // Check alerts against mock current prices to simulate background watcher triggers
  const handleTriggerCheckAlerts = () => {
    let triggeredCount = 0;
    const checkedAlerts = alerts.map(alert => {
      if (alert.isTriggered) return alert;

      const currentPrice = CRYPTO_PRICES_USD[alert.assetCode];
      let triggered = false;

      if (alert.condition === 'above' && currentPrice >= alert.targetPrice) triggered = true;
      if (alert.condition === 'below' && currentPrice <= alert.targetPrice) triggered = true;

      if (triggered) {
        triggeredCount++;
        return { ...alert, isTriggered: true };
      }
      return alert;
    });

    setAlerts(checkedAlerts);
    if (triggeredCount > 0) {
      alert(`🔔 Price Alert Dispatcher: ${triggeredCount} active target price alerts triggered! Logged into notifications stream.`);
    } else {
      alert('🔍 Watching Markets: All asset current values are inside normal thresholds. No alerts triggered.');
    }
  };

  // Gas Fee Calculator Results
  const gasEstimatorResults = useMemo(() => {
    const multipliers = { low: 0.6, medium: 1.0, high: 2.2 };
    const currentMultiplier = multipliers[gasCongestion];

    let gweiEth = 25 * currentMultiplier;
    let satoshisBtc = 18 * currentMultiplier;
    let solLamports = 5000 * currentMultiplier; // microlamports/gas
    
    let costUSD = 0;
    let nativeFee = '';

    if (gasNetwork === 'eth') {
      costUSD = (21000 * gweiEth * 1e-9) * CRYPTO_PRICES_USD['ETH'];
      nativeFee = `${(21000 * gweiEth * 1e-9).toFixed(5)} ETH`;
    } else if (gasNetwork === 'btc') {
      costUSD = (140 * satoshisBtc * 1e-8) * CRYPTO_PRICES_USD['BTC'];
      nativeFee = `${(140 * satoshisBtc * 1e-8).toFixed(6)} BTC`;
    } else if (gasNetwork === 'sol') {
      costUSD = 0.000005 * currentMultiplier * CRYPTO_PRICES_USD['SOL'];
      nativeFee = `${(0.000005 * currentMultiplier).toFixed(6)} SOL`;
    } else { // Polygon
      costUSD = (65000 * 35 * 1e-9) * currentMultiplier * 0.55; // MATIC proxy price
      nativeFee = `${(65000 * 35 * 1e-9 * currentMultiplier).toFixed(5)} MATIC`;
    }

    return {
      costUSD,
      costBase: convertFromUSD(costUSD, baseCurrency),
      nativeFee,
      gweiEth: Math.round(gweiEth),
      satoshisBtc: Math.round(satoshisBtc),
      speed: gasCongestion === 'low' ? '12 - 20 mins' : gasCongestion === 'medium' ? '1 - 3 mins' : 'Instant (< 15s)'
    };
  }, [gasNetwork, gasCongestion, baseCurrency]);

  // Staking projections
  const stakingProjections = useMemo(() => {
    const amt = parseFloat(stakeAmount) || 0;
    const dur = parseInt(stakeDuration) || 12;
    const apyFraction = (stakeApy / 100);

    const data = [];
    let currentBalance = amt;

    for (let m = 0; m <= dur; m++) {
      const rewardsEarned = m === 0 ? 0 : (currentBalance * (apyFraction / 12));
      currentBalance += rewardsEarned;
      const valUSD = convertToUSD(currentBalance, stakeAsset);

      data.push({
        month: `Month ${m}`,
        AssetAmount: parseFloat(currentBalance.toFixed(4)),
        ValueUSD: Math.round(valUSD),
        ValueBase: Math.round(convertFromUSD(valUSD, baseCurrency))
      });
    }

    const totalEarnedNative = currentBalance - amt;
    const totalEarnedBase = convertFromUSD(convertToUSD(totalEarnedNative, stakeAsset), baseCurrency);

    return {
      data,
      totalEarnedNative,
      totalEarnedBase,
      finalAssetAmount: currentBalance
    };
  }, [stakeAsset, stakeAmount, stakeDuration, stakeApy, baseCurrency]);

  return (
    <div className="space-y-6" id="digital-asset-ledger-root">
      
      {/* Portfolio Title & Value Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Value card (Bento style) */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border border-indigo-900/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Subtle grid and decorative gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none" />
          
          <div className="flex justify-between items-start z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-200/80 font-mono">Consolidated Ledger balance</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-400">Multi-Currency & Digital Assets</h3>
            </div>
            
            {/* Display Base Currency Toggles */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
              {(['USD', 'EUR', 'GBP', 'NGN'] as const).map(cur => (
                <button
                  key={cur}
                  onClick={() => setBaseCurrency(cur)}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${baseCurrency === cur ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 z-10">
            <p className="text-xs text-indigo-300 uppercase tracking-widest font-bold font-mono">Net Portfolio Value</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                {SYMBOLS[baseCurrency]}{Math.round(convertFromUSD(totalPortfolioUSD, baseCurrency)).toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-mono">({baseCurrency})</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-4 text-xs text-slate-400 z-10">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Real-time FX Indexes Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Cryptographic Audited Vaults</span>
            </div>
          </div>
        </div>

        {/* Portfolio donut chart distribution */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Asset Weighting</h4>
            <span className="text-[10px] text-slate-400 font-mono">Diversified</span>
          </div>

          <div className="h-44 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Value USD']} 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Crypto</span>
              <span className="text-sm font-black font-mono text-slate-800 dark:text-white">
                {Math.round((assetsWithValue.filter(a => a.type !== 'fiat').reduce((s, a) => s + a.valueUSD, 0) / totalPortfolioUSD) * 100)}%
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center justify-center text-[10px] font-mono text-slate-500">
            {chartData.map((asset, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                <span>{asset.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Asset Balances Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Wallet2 className="w-4.5 h-4.5 text-blue-500" />
          <span>Multi-Currency Asset Ledgers</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {assetsWithValue.map(asset => {
            const isCrypto = asset.type === 'crypto';
            const isStable = asset.type === 'stablecoin';
            const nativeSymbol = SYMBOLS[asset.code] || '';

            return (
              <div 
                key={asset.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group relative overflow-hidden"
              >
                {/* Visual Accent bar on side */}
                <div className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: asset.color }} />
                
                <div className="flex items-center justify-between mb-3 pl-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black font-mono shadow-sm" style={{ backgroundColor: asset.color }}>
                      {asset.code.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">{asset.code}</h4>
                      <p className="text-[9px] text-slate-400 truncate max-w-[70px]">{asset.name}</p>
                    </div>
                  </div>
                  
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${isCrypto ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : isStable ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'}`}>
                    {asset.type}
                  </span>
                </div>

                <div className="space-y-1 pl-1.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Balance</p>
                  <p className="text-base font-extrabold font-mono text-slate-900 dark:text-white truncate">
                    {nativeSymbol}{asset.balance.toLocaleString(undefined, { minimumFractionDigits: isCrypto ? 4 : 2, maximumFractionDigits: isCrypto ? 6 : 2 })}
                  </p>
                  
                  <p className="text-[10px] font-semibold text-slate-500 font-mono">
                    ≈ {SYMBOLS[baseCurrency]}{Math.round(asset.valueBase).toLocaleString()} <span className="text-[9px] text-slate-400">{baseCurrency}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Ledger Core Modules split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Advanced Toolboxes (Left 2-Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/60 flex gap-1">
            {(['swap', 'stake', 'alerts', 'gas'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActionTab(tab)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap capitalize flex items-center justify-center gap-1.5 ${actionTab === tab ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-900/30'}`}
              >
                {tab === 'swap' && <ArrowRightLeft className="w-3.5 h-3.5" />}
                {tab === 'stake' && <TrendingUp className="w-3.5 h-3.5" />}
                {tab === 'alerts' && <BellRing className="w-3.5 h-3.5" />}
                {tab === 'gas' && <Cpu className="w-3.5 h-3.5" />}
                <span>
                  {tab === 'swap' ? 'Ledger Swap' : tab === 'stake' ? 'Staking Yields' : tab === 'alerts' ? 'Price Targets' : 'Gas & Network Fee'}
                </span>
              </button>
            ))}
          </div>

          {/* TAB 1: Ledger Swap */}
          {actionTab === 'swap' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Double-Entry Cryptographic Asset Exchange</h4>
                  <p className="text-xs text-slate-400">Instantly exchange assets on a strict double-entry ledger. Zero credit risk.</p>
                </div>
                <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold uppercase">
                  ⚡ Level Discount active
                </div>
              </div>

              <form onSubmit={handleSwapSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Swap From */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sell / Swap From</label>
                    <div className="flex gap-2">
                      <select
                        value={swapFrom}
                        onChange={e => setSwapFrom(e.target.value)}
                        className="bg-transparent text-slate-900 dark:text-white font-extrabold text-sm focus:outline-none border-b border-slate-300 dark:border-slate-800 pb-1 cursor-pointer w-24"
                      >
                        {assets.map(a => (
                          <option key={a.id} value={a.code}>{a.code}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        required
                        value={swapFromAmount}
                        onChange={e => setSwapFromAmount(e.target.value)}
                        className="w-full bg-transparent text-right font-mono text-base font-bold focus:outline-none border-b border-slate-300 dark:border-slate-800 pb-1 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>Available: {assets.find(a => a.code === swapFrom)?.balance} {swapFrom}</span>
                      <span>≈ {SYMBOLS[baseCurrency]}{Math.round(convertToUSD(parseFloat(swapFromAmount) || 0, swapFrom) * USD_RATES[baseCurrency]).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Swap To */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Acquire / Swap To</label>
                    <div className="flex gap-2">
                      <select
                        value={swapTo}
                        onChange={e => setSwapTo(e.target.value)}
                        className="bg-transparent text-slate-900 dark:text-white font-extrabold text-sm focus:outline-none border-b border-slate-300 dark:border-slate-800 pb-1 cursor-pointer w-24"
                      >
                        {assets.map(a => (
                          <option key={a.id} value={a.code}>{a.code}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        readOnly
                        placeholder="0.00"
                        value={swapToAmount}
                        className="w-full bg-transparent text-right font-mono text-base font-bold focus:outline-none border-b border-slate-300 dark:border-slate-800 pb-1 text-slate-500 dark:text-slate-400"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>Market Rate: 1 {swapTo} = {(CRYPTO_PRICES_USD[swapTo] / CRYPTO_PRICES_USD[swapFrom]).toFixed(swapFrom === 'BTC' ? 8 : 4)} {swapFrom}</span>
                      <span className="text-blue-500 font-bold">Incl. Dev Discount</span>
                    </div>
                  </div>
                </div>

                {/* Conversion Details and Fee Simulator */}
                <div className="p-4 rounded-2xl border border-blue-100/40 dark:border-slate-800/80 bg-blue-50/20 dark:bg-slate-950/40 text-xs space-y-2">
                  <div className="flex justify-between font-mono text-[11px] text-slate-500">
                    <span>Protocol Exchange Fee (0.5% standard)</span>
                    <span>{SYMBOLS[baseCurrency]}{(swapFeeUSD * USD_RATES[baseCurrency]).toFixed(2)} ({baseCurrency})</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-500">
                    <span>Developer Member Discount (Level multiplier)</span>
                    <span className="text-emerald-500 font-bold">-75% discount active</span>
                  </div>
                  <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-1" />
                  <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                    <span>Settlement Guarantee</span>
                    <span className="text-emerald-500 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Real-time Double Settlement
                    </span>
                  </div>
                </div>

                {swapError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{swapError}</span>
                  </div>
                )}

                {swapSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{swapSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 transition-all rounded-xl cursor-pointer shadow-lg shadow-blue-500/10"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Execute Settlement Ledger Entry</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Staking Projections */}
          {actionTab === 'stake' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Interactive Staking & Yield Forecaster</h4>
                  <p className="text-xs text-slate-400">Lock assets into network nodes and forecast compounding interests dynamically.</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold font-mono">
                  <Sparkles className="w-4 h-4" /> APY Compounding
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Inputs block */}
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Asset To Stake</label>
                    <select
                      value={stakeAsset}
                      onChange={e => setStakeAsset(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <option value="SOL">Solana (◎) — 6.8% APY</option>
                      <option value="ETH">Ethereum (Ξ) — 4.2% APY</option>
                      <option value="USDC">USD Coin (₮) — 5.15% APY</option>
                      <option value="BTC">Bitcoin (₿) — 1.8% APY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Staking Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={e => setStakeAmount(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 font-mono">{stakeAsset}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lock Duration</label>
                    <select
                      value={stakeDuration}
                      onChange={e => setStakeDuration(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <option value="3">3 Months (Short Lockup)</option>
                      <option value="6">6 Months (Medium Term)</option>
                      <option value="12">12 Months (Full Annual cycle)</option>
                      <option value="24">24 Months (Maximum Compounding)</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-[11px] text-slate-500 font-mono space-y-1">
                    <p>Total Return: <span className="text-emerald-500 font-bold font-mono">+{stakingProjections.totalEarnedNative.toFixed(4)} {stakeAsset}</span></p>
                    <p>Value in Base: <span className="text-blue-500 font-bold font-mono">+{SYMBOLS[baseCurrency]}{Math.round(stakingProjections.totalEarnedBase).toLocaleString()} {baseCurrency}</span></p>
                  </div>
                </div>

                {/* Chart block */}
                <div className="md:col-span-2 h-56 flex flex-col justify-between">
                  <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Yield Over Duration Horizon (Asset Value Equivalent)</p>
                  <div className="flex-1 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stakingProjections.data}>
                        <defs>
                          <linearGradient id="stakingGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                        <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#64748b" />
                        <YAxis tick={{ fontSize: 9 }} stroke="#64748b" />
                        <Tooltip 
                          formatter={(value: any, name: any) => [name === 'ValueBase' ? `${SYMBOLS[baseCurrency]}${value.toLocaleString()}` : `${value} ${stakeAsset}`, name === 'ValueBase' ? `Value (${baseCurrency})` : 'Staked Balance']}
                          contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="ValueBase" stroke="#10B981" fillOpacity={1} fill="url(#stakingGlow)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Price Alert Triggers */}
          {actionTab === 'alerts' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Asset Target Price Alerts</h4>
                  <p className="text-xs text-slate-400">Configure notifications that trigger automatically when an asset crosses your targeted price thresholds.</p>
                </div>
                <button
                  onClick={handleTriggerCheckAlerts}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer font-bold font-mono"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Trigger Scanner
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Form to create alert */}
                <form onSubmit={handleAddAlert} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">New Price Watch Trigger</h5>
                  
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Asset</label>
                    <select
                      value={newAlertAsset}
                      onChange={e => setNewAlertAsset(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <option value="BTC">Bitcoin (BTC) — Current: $64,250</option>
                      <option value="ETH">Ethereum (ETH) — Current: $3,450</option>
                      <option value="SOL">Solana (SOL) — Current: $145.20</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Condition</label>
                    <select
                      value={newAlertCondition}
                      onChange={e => setNewAlertCondition(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <option value="above">Price Go Above (📈)</option>
                      <option value="below">Price Drop Below (📉)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Target Price (USD)</label>
                    <input
                      type="number"
                      placeholder="e.g. 70000"
                      required
                      value={newAlertPrice}
                      onChange={e => setNewAlertPrice(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Deploy Alert Node
                  </button>
                </form>

                {/* Alerts Watcher list */}
                <div className="md:col-span-2 space-y-2">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Alert Watchers</h5>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8 font-mono">No price watch triggers deployed.</p>
                    ) : (
                      alerts.map(alert => (
                        <div 
                          key={alert.id}
                          className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${alert.isTriggered ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {alert.assetCode} Price target: {alert.condition === 'above' ? '≥' : '≤'} ${alert.targetPrice.toLocaleString()}
                              </p>
                              <p className="text-[9px] text-slate-400 font-mono">
                                Registered: {new Date(alert.createdAt).toLocaleString()} • {alert.isTriggered ? 'Triggered' : 'Watching Market'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {alert.isTriggered && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold px-2 py-0.5 rounded uppercase">
                                Triggered
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                              title="Delete Watcher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: Network Fee / Gas Estimator */}
          {actionTab === 'gas' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Real-Time Gas & Network Transfer Fee Simulator</h4>
                  <p className="text-xs text-slate-400">Calculate transaction and contract deployment fees across multiple standard blockchains.</p>
                </div>
                <div className="p-1 px-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase">
                  🟢 Congestion low
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Inputs block */}
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Network</label>
                    <select
                      value={gasNetwork}
                      onChange={e => setGasNetwork(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <option value="eth">Ethereum Mainnet (gwei)</option>
                      <option value="btc">Bitcoin Blockchain (sat/vB)</option>
                      <option value="sol">Solana Network (lamports)</option>
                      <option value="polygon">Polygon POS network</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Congestion Level</label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200 dark:bg-slate-900 rounded-xl">
                      {(['low', 'medium', 'high'] as const).map(lev => (
                        <button
                          key={lev}
                          type="button"
                          onClick={() => setGasCongestion(lev)}
                          className={`py-1 text-[10px] uppercase font-bold rounded-lg cursor-pointer transition-all ${gasCongestion === lev ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                          {lev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Estimation readouts */}
                <div className="md:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Simulated Settlement Fee</h5>
                    
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                        {SYMBOLS[baseCurrency]}{gasEstimatorResults.costBase.toFixed(gasEstimatorResults.costBase < 0.01 ? 6 : 2)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({baseCurrency})</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-mono text-slate-500">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Native Fee Equivalent</p>
                        <p className="text-slate-800 dark:text-slate-200 mt-1 font-bold">{gasEstimatorResults.nativeFee}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Average Settlement speed</p>
                        <p className="text-slate-800 dark:text-slate-200 mt-1 font-bold">{gasEstimatorResults.speed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>Based on current average blockchain gas configurations.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Transaction History Ledger Panel (Right Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Ledger History</h4>
            <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">Double-Entry Cleared</span>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4 max-h-[460px] overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12 font-mono">No ledger transactions logged.</p>
            ) : (
              transactions.map(tx => {
                const isBuy = tx.type === 'buy';
                const isSwap = tx.type === 'swap';

                return (
                  <div 
                    key={tx.id}
                    className="p-3.5 rounded-xl border border-slate-50 dark:border-slate-950 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center text-white font-bold text-xs ${isBuy ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                          {isBuy ? <ArrowDownRight className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">{tx.type} Asset</p>
                          <p className="text-[10px] text-slate-400 font-mono">{tx.date}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-black font-mono text-slate-800 dark:text-white">
                          +{tx.toAmount} {tx.toAsset}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          -{tx.fromAmount} {tx.fromAsset}
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 font-mono">
                      {tx.notes}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
