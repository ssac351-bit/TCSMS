/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  ArrowLeft,
  FileText,
  DollarSign,
  PiggyBank,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Organization, Staff, Transaction } from '../types';

interface InterestProvisionPanelProps {
  org: Organization;
  staff: Staff;
  workingDay: string;
  savingsAccounts: any[];
  cbsAccounts: any[];
  ltsAccounts: any[];
  groupMembers: any[];
  setSavingsAccounts: React.Dispatch<React.SetStateAction<any[]>>;
  setCbsAccounts: React.Dispatch<React.SetStateAction<any[]>>;
  setLtsAccounts: React.Dispatch<React.SetStateAction<any[]>>;
  setGroupMembers: React.Dispatch<React.SetStateAction<any[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  onClose: () => void;
}

export default function InterestProvisionPanel({
  org,
  staff,
  workingDay,
  savingsAccounts,
  cbsAccounts,
  ltsAccounts,
  groupMembers,
  setSavingsAccounts,
  setCbsAccounts,
  setLtsAccounts,
  setGroupMembers,
  setTransactions,
  onClose
}: InterestProvisionPanelProps) {
  const branchId = staff.branchId || 'default-branch';

  const getRate = (key: string, fallback: number) => {
    try {
      const saved = localStorage.getItem(`tanzil_${key}_${org.id}`);
      if (!saved) return fallback;
      const eng = saved.replace(/[০-৯]/g, d => String.fromCharCode(d.charCodeAt(0) - 2406 + 48));
      const parsed = parseFloat(eng);
      return isNaN(parsed) ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  };

  // Get current Bengali month & year for provisioning cycle
  const currentMonthName = useMemo(() => {
    const d = new Date(workingDay);
    return d.toLocaleString('bn-BD', { month: 'long', year: 'numeric' });
  }, [workingDay]);

  // Read already provisioned list from localStorage to prevent duplicate postings
  const [provisionHistory, setProvisionHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`tanzil_provision_history_${org.id}_${branchId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const currentMonthKey = useMemo(() => {
    const d = new Date(workingDay);
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
  }, [workingDay]);

  const hasProvisionedThisMonth = useMemo(() => {
    return provisionHistory.some((h: any) => h.monthKey === currentMonthKey && h.type === 'provision');
  }, [provisionHistory, currentMonthKey]);

  const hasPaidOutThisMonth = useMemo(() => {
    return provisionHistory.some((h: any) => h.monthKey === currentMonthKey && h.type === 'payout');
  }, [provisionHistory, currentMonthKey]);

  // Interest Calculations Engine
  const interestCalculations = useMemo(() => {
    let gsCount = 0;
    let gsBalance = 0;
    let gsInterest = 0;

    let cbsCount = 0;
    let cbsBalance = 0;
    let cbsInterest = 0;

    let ltsCount = 0;
    let ltsBalance = 0;
    let ltsInterest = 0;

    let fdrCount = 0;
    let fdrBalance = 0;
    let fdrInterest = 0;

    const defaultGsRate = getRate('sav_profit_gs', 6);
    const defaultCbsRate = getRate('sav_profit_cbs', 8.5);
    const defaultLtsRate = getRate('sav_profit_lts', 12);
    const defaultFdrRate = getRate('sav_profit_fdr', 12);

    // 1. Mandatory & General Savings (GS & FDR)
    savingsAccounts.forEach(acc => {
      if (acc.status !== 'active') return;
      const bal = acc.balance || 0;
      if (acc.type === 'FDR') {
        fdrCount++;
        fdrBalance += bal;
        // FDR Rate default 12% annual
        const rate = acc.interestRate || defaultFdrRate;
        fdrInterest += Math.round((bal * rate / 100) / 12);
      } else {
        gsCount++;
        gsBalance += bal;
        // GS Rate default 6% annual
        const rate = acc.interestRate || defaultGsRate;
        gsInterest += Math.round((bal * rate / 100) / 12);
      }
    });

    // 2. Voluntarty/CBS Savings
    cbsAccounts.forEach(acc => {
      if (acc.status !== 'active') return;
      const bal = acc.balance || 0;
      cbsCount++;
      cbsBalance += bal;
      // CBS Rate default 8.5% annual
      const rate = acc.interestRate || defaultCbsRate;
      cbsInterest += Math.round((bal * rate / 100) / 12);
    });

    // 3. LTS / Term Savings
    ltsAccounts.forEach(acc => {
      if (acc.status !== 'active') return;
      const bal = acc.balance || 0;
      ltsCount++;
      ltsBalance += bal;
      // LTS Rate default 12% annual
      const rate = acc.interestRate || defaultLtsRate;
      ltsInterest += Math.round((bal * rate / 100) / 12);
    });

    const totalAccounts = gsCount + fdrCount + cbsCount + ltsCount;
    const totalBalance = gsBalance + fdrBalance + cbsBalance + ltsBalance;
    const totalInterest = gsInterest + fdrInterest + cbsInterest + ltsInterest;

    return {
      gsCount, gsBalance, gsInterest,
      cbsCount, cbsBalance, cbsInterest,
      ltsCount, ltsBalance, ltsInterest,
      fdrCount, fdrBalance, fdrInterest,
      totalAccounts, totalBalance, totalInterest
    };
  }, [savingsAccounts, cbsAccounts, ltsAccounts]);

  // 1. Perform Interest Provision Accounting entry (Dr. Interest Expense, Cr. Accrued Interest Payable)
  const handleCreateProvisionVoucher = () => {
    if (interestCalculations.totalInterest <= 0) {
      alert("প্রোভিশন করার মতো সঞ্চয়ী হিসাবের কোনো উদ্বৃত্ত বা লাভ খুঁজে পাওয়া যায়নি।");
      return;
    }

    if (hasProvisionedThisMonth) {
      if (!window.confirm(`${currentMonthName} মাসের জন্য ইতিপূর্বে একবার লাভ/ইন্টারেস্ট প্রোভিশন করা হয়েছে। আপনি কি পুনরায় প্রোভিশন করতে চান? (পূর্ববর্তী এন্ট্রি ওভাররাইট হবে না)`)) {
        return;
      }
    }

    // Insert accounting Journal Voucher
    const provisionAmount = interestCalculations.totalInterest;
    const voucherId = `VOU-PROV-${Date.now()}`;
    
    const debitVoucher = {
      id: `${voucherId}-DR`,
      voucherId: voucherId,
      orgId: org.id,
      branchId: branchId,
      type: 'expense',
      category: 'সদস্য সঞ্চয়ের ওপর প্রদত্ত সুদ (Interest paid on savings)',
      amount: provisionAmount,
      date: workingDay,
      addDate: workingDay,
      debitAcc: 'savings_interest',  // Expense Head
      creditAcc: 'interest_payable', // Liability Head
      note: `${currentMonthName} মাসের জন্য স্বয়ংক্রিয় সঞ্চয়ী হিসাবের লাভ প্রোভিশন (Monthly Accrued Interest Provision)`,
      paymentMode: 'journal_entry',
      operator: staff.name,
      synced: false
    };

    setTransactions(prev => [debitVoucher, ...prev]);

    // Save cycle record in history
    const newHistory = [
      ...provisionHistory,
      {
        id: `prov-hist-${Date.now()}`,
        monthKey: currentMonthKey,
        monthName: currentMonthName,
        type: 'provision',
        amount: provisionAmount,
        date: workingDay,
        voucherId: voucherId,
        scannedAccounts: interestCalculations.totalAccounts
      }
    ];

    setProvisionHistory(newHistory);
    localStorage.setItem(`tanzil_provision_history_${org.id}_${branchId}`, JSON.stringify(newHistory));

    alert(`${currentMonthName} মাসের জন্য সফলভাবে ৳${provisionAmount.toLocaleString('bn-BD')} লাভ/ইন্টারেস্ট প্রোভিশন ভাউচার সংরক্ষণ করা হয়েছে!\n(ডেবিট: সদস্য সঞ্চয়ের সুদ খরচ, ক্রেডিট: সঞ্চয়ী সুদের সঞ্চিতি)`);
  };

  // 2. Perform Interest Payout Post (Credit directly to member savings, Dr. Accrued Interest Payable, Cr. Member Compulsory/Voluntary Savings)
  const handlePostActualPayout = () => {
    if (interestCalculations.totalInterest <= 0) {
      alert("বিতরণ করার মতো সঞ্চয়ী হিসাবের কোনো উদ্বৃত্ত বা লাভ খুঁজে পাওয়া যায়নি।");
      return;
    }

    if (!hasProvisionedThisMonth) {
      alert("লভ্যাংশ বিতরণের পূর্বে অনুগ্রহ করে লভ্যাংশ প্রোভিশন করুন!");
      return;
    }

    if (hasPaidOutThisMonth) {
      if (!window.confirm(`${currentMonthName} মাসের জন্য ইতিপূর্বে একবার লভ্যাংশ বণ্টন করা হয়েছে। আপনি কি নিশ্চিতভাবে পুনরায় বণ্টন করতে চান?`)) {
        return;
      }
    }

    const confirmText = `${currentMonthName} মাসের জন্য মোট ${interestCalculations.totalAccounts} টি সঞ্চয় হিসাবে সর্বমোট ৳${interestCalculations.totalInterest.toLocaleString('bn-BD')} লভ্যাংশ বণ্টন ও সদস্যদের হিসাবে ক্রেডিট করতে চান?`;
    if (!window.confirm(confirmText)) return;

    const now = Date.now();
    const newMemberTxs: any[] = [];
    
    const payoutGsRate = getRate('sav_profit_gs', 6);
    const payoutCbsRate = getRate('sav_profit_cbs', 8.5);
    const payoutLtsRate = getRate('sav_profit_lts', 12);
    const payoutFdrRate = getRate('sav_profit_fdr', 12);

    // Create detailed transactions & update balances for each account type
    
    // A. General Savings
    const updatedSavings = savingsAccounts.map((acc, idx) => {
      if (acc.status !== 'active') return acc;
      
      const rate = acc.interestRate || (acc.type === 'FDR' ? payoutFdrRate : payoutGsRate);
      const interest = Math.round(((acc.balance || 0) * rate / 100) / 12);
      
      if (interest > 0) {
        newMemberTxs.push({
          id: `tx-gs-prov-int-${now}-gs-${idx}`,
          orgId: org.id,
          memberId: acc.memberId,
          memberName: acc.memberName,
          type: 'savings_deposit',
          amount: interest,
          date: workingDay,
          category: acc.type === 'FDR' ? 'fdr_interest' : 'savings_interest',
          description: `${currentMonthName} লভ্যাংশ বণ্টন (স্বয়ংক্রিয়): ${acc.accountNo}`
        });

        return {
          ...acc,
          balance: (acc.balance || 0) + interest,
          lastInterestPostDate: workingDay
        };
      }
      return acc;
    });

    // B. CBS Savings
    const updatedCbs = cbsAccounts.map((acc, idx) => {
      if (acc.status !== 'active') return acc;
      
      const rate = acc.interestRate || payoutCbsRate;
      const interest = Math.round(((acc.balance || 0) * rate / 100) / 12);
      
      if (interest > 0) {
        newMemberTxs.push({
          id: `tx-cbs-prov-int-${now}-cbs-${idx}`,
          orgId: org.id,
          memberId: acc.memberId,
          memberName: acc.memberName,
          type: 'savings_deposit',
          amount: interest,
          date: workingDay,
          category: 'savings_interest',
          description: `${currentMonthName} লভ্যাংশ বণ্টন (CBS স্বয়ংক্রিয়): ${acc.accountNo}`
        });

        return {
          ...acc,
          balance: (acc.balance || 0) + interest,
          lastInterestPostDate: workingDay
        };
      }
      return acc;
    });

    // C. LTS Savings
    const updatedLts = ltsAccounts.map((acc, idx) => {
      if (acc.status !== 'active') return acc;
      
      const rate = acc.interestRate || payoutLtsRate;
      const interest = Math.round(((acc.balance || 0) * rate / 100) / 12);
      
      if (interest > 0) {
        newMemberTxs.push({
          id: `tx-lts-prov-int-${now}-lts-${idx}`,
          orgId: org.id,
          memberId: acc.memberId,
          memberName: acc.memberName,
          type: 'savings_deposit',
          amount: interest,
          date: workingDay,
          category: 'savings_interest',
          description: `${currentMonthName} লভ্যাংশ বণ্টন (LTS স্বয়ংক্রিয়): ${acc.accountNo}`
        });

        return {
          ...acc,
          balance: (acc.balance || 0) + interest,
          lastInterestPostDate: workingDay
        };
      }
      return acc;
    });

    // D. Update member composite gsBalances in groupMembers list
    const updatedMembers = groupMembers.map(m => {
      let extraGs = 0;
      let extraCbs = 0;
      let extraLts = 0;

      // Find member's corresponding accounts
      const memberGs = savingsAccounts.find(s => s.memberId === m.id || s.memberId === m.memberId);
      const memberCbs = cbsAccounts.find(s => s.memberId === m.id || s.memberId === m.memberId);
      const memberLts = ltsAccounts.find(s => s.memberId === m.id || s.memberId === m.memberId);

      if (memberGs && memberGs.status === 'active') {
        const rate = memberGs.interestRate || (memberGs.type === 'FDR' ? payoutFdrRate : payoutGsRate);
        extraGs = Math.round(((memberGs.balance || 0) * rate / 100) / 12);
      }
      if (memberCbs && memberCbs.status === 'active') {
        const rate = memberCbs.interestRate || payoutCbsRate;
        extraCbs = Math.round(((memberCbs.balance || 0) * rate / 100) / 12);
      }
      if (memberLts && memberLts.status === 'active') {
        const rate = memberLts.interestRate || payoutLtsRate;
        extraLts = Math.round(((memberLts.balance || 0) * rate / 100) / 12);
      }

      if (extraGs > 0 || extraCbs > 0 || extraLts > 0) {
        const currentGs = m.savingsBalance ?? m.gsBalance ?? 0;
        const currentCbs = m.cbsBalance ?? 0;
        const currentLts = m.ltsBalance ?? 0;

        return {
          ...m,
          savingsBalance: currentGs + extraGs,
          gsBalance: currentGs + extraGs,
          cbsBalance: currentCbs + extraCbs,
          ltsBalance: currentLts + extraLts
        };
      }
      return m;
    });

    // E. Double entry closing Journal Voucher (Debit: interest_payable, Credit: general_savings, cbs_savings, lts_savings)
    const payoutAmount = interestCalculations.totalInterest;
    const voucherId = `VOU-PAYOUT-${Date.now()}`;
    
    // Create debit to provision liability
    const debitVoucher = {
      id: `${voucherId}-DR`,
      voucherId: voucherId,
      orgId: org.id,
      branchId: branchId,
      type: 'liability',
      category: 'সঞ্চয়ী সুদের সঞ্চিতি (Accrued Interest Payable)',
      amount: payoutAmount,
      date: workingDay,
      addDate: workingDay,
      debitAcc: 'interest_payable', // Dr. Accrued Liability
      creditAcc: 'general_savings', // Cr. Member Deposit Liability
      note: `${currentMonthName} মাসের স্বয়ংক্রিয় লভ্যাংশ বণ্টন ক্রেডিট বিতরণ (Deposit Allocation to Members)`,
      paymentMode: 'journal_entry',
      operator: staff.name,
      synced: false
    };

    // Apply state updates
    setSavingsAccounts(updatedSavings);
    setCbsAccounts(updatedCbs);
    setLtsAccounts(updatedLts);
    setGroupMembers(updatedMembers);
    setTransactions(prev => [debitVoucher, ...newMemberTxs, ...prev]);

    // Save cycle record in history
    const newHistory = [
      ...provisionHistory,
      {
        id: `payout-hist-${Date.now()}`,
        monthKey: currentMonthKey,
        monthName: currentMonthName,
        type: 'payout',
        amount: payoutAmount,
        date: workingDay,
        voucherId: voucherId,
        scannedAccounts: interestCalculations.totalAccounts
      }
    ];

    setProvisionHistory(newHistory);
    localStorage.setItem(`tanzil_provision_history_${org.id}_${branchId}`, JSON.stringify(newHistory));

    // Save individual account states to localStorage immediately to guarantee offline preservation
    localStorage.setItem(`tanzil_savings_accounts_${org.id}`, JSON.stringify(updatedSavings));
    localStorage.setItem(`tanzil_cbs_accounts_${org.id}`, JSON.stringify(updatedCbs));
    localStorage.setItem(`tanzil_lts_accounts_${org.id}`, JSON.stringify(updatedLts));
    localStorage.setItem(`tanzil_group_members_${org.id}`, JSON.stringify(updatedMembers));

    alert(`${currentMonthName} মাসের জন্য সর্বমোট ৳${payoutAmount.toLocaleString('bn-BD')} লভ্যাংশ সফলভাবে বণ্টন ও সদস্যদের হিসাব ব্যালেন্সে ক্রেডিট করে দেওয়া হয়েছে!\n(হিসাবসমূহ সচল ও রিয়েল-টাইম ব্যালেন্স আপডেট সম্পন্ন হয়েছে)`);
  };

  const gsRate = getRate('sav_profit_gs', 6);
  const cbsRate = getRate('sav_profit_cbs', 8.5);
  const ltsRate = getRate('sav_profit_lts', 12);
  const fdrRate = getRate('sav_profit_fdr', 12);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs select-none text-left">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2 font-sans leading-tight">
            <Coins className="text-emerald-600 animate-bounce-short" size={20} />
            স্বয়ংক্রিয় লাভ/ইন্টারেস্ট প্রোভিশন ও বণ্টন প্যানেল
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            সদস্য সঞ্চয় আমানতের ওপর মাসিক অর্জিত লভ্যাংশ প্রোভিশন এবং সরাসরি সদস্য হিসাব ব্যালেন্সে পোস্টিং
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 cursor-pointer font-sans border-0 bg-transparent"
        >
          <ArrowLeft size={12} /> প্রধান মেনু
        </button>
      </div>

      {/* Cycle Indicator Row */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2.5 rounded-xl text-blue-700 border border-blue-200">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">বর্তমান হিসাব চক্র (Current Cycle):</span>
            <span className="text-sm font-black text-slate-800 font-sans">{currentMonthName}</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full border ${
            hasProvisionedThisMonth 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {hasProvisionedThisMonth ? <Check size={12} strokeWidth={3} /> : <AlertCircle size={12} />}
            প্রভিশন: {hasProvisionedThisMonth ? 'সম্পন্ন হয়েছে' : 'বাকি আছে'}
          </span>

          <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full border ${
            hasPaidOutThisMonth 
              ? 'bg-blue-50 text-blue-700 border-blue-200' 
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            {hasPaidOutThisMonth ? <Check size={12} strokeWidth={3} /> : <AlertCircle size={12} />}
            বণ্টন: {hasPaidOutThisMonth ? 'ক্রেডিট বিতরণ সম্পন্ন' : 'অপেক্ষমান'}
          </span>
        </div>
      </div>

      {/* Dashboard Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total stats card */}
        <div className="md:col-span-1 bg-gradient-to-br from-emerald-650 to-teal-800 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <Calculator size={32} className="opacity-80" />
            <h4 className="text-white/80 font-bold text-xs tracking-wider uppercase">মোট সঞ্চয়ী লভ্যাংশ</h4>
            <span className="text-3xl font-black block font-mono">
              ৳{interestCalculations.totalInterest.toLocaleString('bn-BD')}
            </span>
          </div>
          
          <div className="border-t border-white/20 pt-4 grid grid-cols-2 gap-2 text-left">
            <div>
              <span className="text-[10px] text-white/70 block font-bold uppercase">মোট হিসাব সংখ্যা:</span>
              <span className="text-xs font-black font-mono">{interestCalculations.totalAccounts} টি</span>
            </div>
            <div>
              <span className="text-[10px] text-white/70 block font-bold uppercase">মোট সঞ্চয় আমানত:</span>
              <span className="text-xs font-black font-mono">৳{interestCalculations.totalBalance.toLocaleString('bn-BD')}</span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Columns (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">সঞ্চয় প্রোডাক্ট ভিত্তিক লভ্যাংশ বিশ্লেষণ</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* GS Savings */}
            <div className="border border-slate-150 p-4 bg-white rounded-2xl flex items-center justify-between gap-3 shadow-3xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <PiggyBank className="text-blue-500" size={16} />
                  <span className="font-extrabold text-slate-700 text-xs">বাধ্যতামূলক সঞ্চয় (GS)</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-semibold">আমানত: ৳{interestCalculations.gsBalance.toLocaleString('bn-BD')} ({interestCalculations.gsCount} টি হিসাব)</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">বার্ষিক হার: {gsRate.toLocaleString('bn-BD')}%</span>
                <span className="text-sm font-black text-blue-600 font-mono">৳{interestCalculations.gsInterest.toLocaleString('bn-BD')}</span>
              </div>
            </div>

            {/* CBS Savings */}
            <div className="border border-slate-150 p-4 bg-white rounded-2xl flex items-center justify-between gap-3 shadow-3xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <PiggyBank className="text-emerald-500" size={16} />
                  <span className="font-extrabold text-slate-700 text-xs">ঐচ্ছিক সঞ্চয় (CBS)</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-semibold">আমানত: ৳{interestCalculations.cbsBalance.toLocaleString('bn-BD')} ({interestCalculations.cbsCount} টি হিসাব)</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">বার্ষিক হার: {cbsRate.toLocaleString('bn-BD')}%</span>
                <span className="text-sm font-black text-emerald-600 font-mono">৳{interestCalculations.cbsInterest.toLocaleString('bn-BD')}</span>
              </div>
            </div>

            {/* LTS Savings */}
            <div className="border border-slate-150 p-4 bg-white rounded-2xl flex items-center justify-between gap-3 shadow-3xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <PiggyBank className="text-purple-500" size={16} />
                  <span className="font-extrabold text-slate-700 text-xs">মেয়াদী স্কিম (LTS)</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-semibold">আমানত: ৳{interestCalculations.ltsBalance.toLocaleString('bn-BD')} ({interestCalculations.ltsCount} টি হিসাব)</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">বার্ষিক হার: {ltsRate.toLocaleString('bn-BD')}%</span>
                <span className="text-sm font-black text-purple-600 font-mono">৳{interestCalculations.ltsInterest.toLocaleString('bn-BD')}</span>
              </div>
            </div>

            {/* FDR Savings */}
            <div className="border border-slate-150 p-4 bg-white rounded-2xl flex items-center justify-between gap-3 shadow-3xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <PiggyBank className="text-rose-500" size={16} />
                  <span className="font-extrabold text-slate-700 text-xs">স্থায়ী আমানত (FDR)</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-semibold">আমানত: ৳{interestCalculations.fdrBalance.toLocaleString('bn-BD')} ({interestCalculations.fdrCount} টি হিসাব)</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">বার্ষিক হার: {fdrRate.toLocaleString('bn-BD')}%</span>
                <span className="text-sm font-black text-rose-600 font-mono">৳{interestCalculations.fdrInterest.toLocaleString('bn-BD')}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Action panels and instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
        
        {/* Step 1: Provision block */}
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center font-black text-xs font-mono">১</span>
              <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider">মাসিক লাভ প্রোভিশন (Accrued Provision)</h5>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              হিসাববিজ্ঞানের অর্জিত ব্যয় নীতিমালা (Accrual Concept) অনুযায়ী সদস্যদের সঞ্চয়ের উপর সুদ ব্যয় প্রাক্কলন করে চলতি মাসের জন্য প্রোভিশন ভাউচার এন্ট্রি করুন।
            </p>
            <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl text-[10px] text-amber-800 flex gap-1.5 items-start">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>এটি করার ফলে <strong>আর্থিক ব্যয় (সঞ্চয় সুদ)</strong> ডেবিট এবং <strong>চলতি দায় (Accrued Interest Payable)</strong> ক্রেডিট হবে।</span>
            </div>
          </div>

          <button
            onClick={handleCreateProvisionVoucher}
            className={`w-full py-2.5 px-4 font-extrabold text-xs rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 border shadow-3xs ${
              hasProvisionedThisMonth 
                ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' 
                : 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
            }`}
          >
            <FileText size={14} />
            <span>{hasProvisionedThisMonth ? 'পুনরায় লাভ প্রোভিশন করুন' : 'লভ্যাংশ প্রভিশন ভাউচার তৈরি করুন'}</span>
          </button>
        </div>

        {/* Step 2: Distribution/Post block */}
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xs font-mono">২</span>
              <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider">লভ্যাংশ ক্রেডিট বণ্টন (Post Interest Payout)</h5>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              প্রোভিশন করা লাভ সদস্যদের সঞ্চয়ী হিসাব ব্যালেন্সে ক্রেডিট (বণ্টন) করুন। এটি সদস্যদের পাশবই ও হিসাব ব্যালেন্সকে রিয়েল-টাইম বৃদ্ধি করবে।
            </p>
            <div className="bg-blue-500/5 border border-blue-500/10 p-2.5 rounded-xl text-[10px] text-blue-800 flex gap-1.5 items-start">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>এটি করার ফলে <strong>সঞ্চয়ী সুদের সঞ্চিতি (Accrued Liability)</strong> ডেবিট এবং <strong>সদস্যদের সঞ্চয় আমানত</strong> ক্রেডিট হবে।</span>
            </div>
          </div>

          <button
            onClick={handlePostActualPayout}
            disabled={!hasProvisionedThisMonth}
            className={`w-full py-2.5 px-4 font-extrabold text-xs rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 border shadow-3xs disabled:opacity-40 disabled:cursor-not-allowed ${
              hasPaidOutThisMonth 
                ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' 
                : 'bg-blue-600 hover:bg-blue-700 border-blue-700 text-white'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>{hasPaidOutThisMonth ? 'পুনরায় বণ্টন ও ক্রেডিট করুন' : 'সরাসরি সদস্যদের ব্যালেন্সে ক্রেডিট বণ্টন করুন'}</span>
          </button>
        </div>

      </div>

      {/* Cycle History Table */}
      {provisionHistory.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">লভ্যাংশ প্রোভিশন ও বণ্টন কার্যবিবরণী</h4>
          <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white max-h-48 overflow-y-auto">
            <table className="w-full text-xs font-sans text-left">
              <thead className="bg-slate-50 border-b border-slate-150 font-black text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">তারিখ</th>
                  <th className="py-2.5 px-4">হিসাব চক্র</th>
                  <th className="py-2.5 px-4">অপারেশন টাইপ</th>
                  <th className="py-2.5 px-4">হিসাব সংখ্যা</th>
                  <th className="py-2.5 px-4 text-right">টাকা (Amount)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {provisionHistory.slice().reverse().map((h: any) => (
                  <tr key={h.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-2.5 px-4 font-mono">{new Date(h.date).toLocaleDateString('bn-BD')}</td>
                    <td className="py-2.5 px-4">{h.monthName}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        h.type === 'provision' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {h.type === 'provision' ? 'লাভ প্রোভিশন' : 'ব্যালেন্স ক্রেডিট বণ্টন'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono">{h.scannedAccounts} টি</td>
                    <td className="py-2.5 px-4 text-right font-black font-mono text-slate-900">৳{h.amount.toLocaleString('bn-BD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
