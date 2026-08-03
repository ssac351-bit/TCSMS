/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Building, 
  CalendarRange, 
  Lock, 
  Unlock, 
  Scale, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Coins, 
  FileSpreadsheet, 
  Printer, 
  HelpCircle,
  Loader2,
  ListFilter
} from 'lucide-react';
import { Organization, Staff } from '../types';

interface YearEndClosingPanelProps {
  org: Organization;
  staff: Staff;
  workingDay: string;
  transactions: any[];
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  onClose: () => void;
}

export default function YearEndClosingPanel({
  org,
  staff,
  workingDay,
  transactions,
  setTransactions,
  onClose
}: YearEndClosingPanelProps) {
  const branchId = staff.branchId || 'default-branch';

  // State: Wizard Step
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('২০২৫-২০২৬');
  const [targetLockDate, setTargetLockDate] = useState('2026-06-30');
  const [isClosingInProgress, setIsClosingInProgress] = useState(false);
  const [closedSucess, setClosedSuccess] = useState(false);

  // Load already closed financial years list from localStorage
  const [closedYears, setClosedYears] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`tanzil_closed_fiscal_years_${org.id}_${branchId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const isAlreadyClosed = useMemo(() => {
    return closedYears.some((y: any) => y.fiscalYear === selectedFiscalYear);
  }, [closedYears, selectedFiscalYear]);

  // Step 1: Pre-closing audit validation
  const auditChecks = useMemo(() => {
    // 1. Working date check (must be July 1st or later to close previous year ending June 30th)
    const workDate = new Date(workingDay);
    const targetLimit = new Date(targetLockDate);
    const dateCheck = workDate >= targetLimit;

    // 2. Unsynced transactions check
    const unsyncedCount = transactions.filter(t => t.synced === false && new Date(t.date || t.addDate) <= targetLimit).length;
    const unsyncedCheck = unsyncedCount === 0;

    // 3. Pending Savings Refunds Check
    let pendingRefunds = 0;
    try {
      const saved = localStorage.getItem(`tanzil_savings_refunds_${org.id}`);
      if (saved) {
        pendingRefunds = JSON.parse(saved).filter((r: any) => (r.approvalStatus || 'pending') === 'pending').length;
      }
    } catch (e) {}
    const refundsCheck = pendingRefunds === 0;

    return {
      dateCheck,
      unsyncedCheck,
      unsyncedCount,
      refundsCheck,
      pendingRefunds,
      isAllPassed: dateCheck && refundsCheck
    };
  }, [workingDay, targetLockDate, transactions, org.id]);

  // Step 2: Financial Income & Expense Analysis for the closed year
  const financialPerformance = useMemo(() => {
    let serviceChargeIncome = 0;
    let admissionFeeIncome = 0;
    let passbookSaleIncome = 0;
    let bankInterestIncome = 0;
    let miscIncome = 0;

    let savingsInterestExpense = 0;
    let loanInterestExpense = 0;
    let staffSalariesExpense = 0;
    let officeRentExpense = 0;
    let utilitiesExpense = 0;
    let stationeryExpense = 0;
    let auditFeesExpense = 0;
    let badDebtExpense = 0;

    const limitDate = new Date(targetLockDate);

    transactions.forEach(t => {
      const txDate = new Date(t.date || t.addDate);
      if (txDate > limitDate) return; // Only scan closed fiscal year transactions

      const amt = Number(t.amount || 0);

      // Map to incomes (operating/non-operating)
      if (t.creditAcc === 'service_charge' || t.category?.includes('সার্ভিস চার্জ')) {
        serviceChargeIncome += amt;
      } else if (t.creditAcc === 'admission_fee' || t.category?.includes('ভর্তি ফি')) {
        admissionFeeIncome += amt;
      } else if (t.creditAcc === 'passbook_fee' || t.category?.includes('পাসবই')) {
        passbookSaleIncome += amt;
      } else if (t.creditAcc === 'bank_interest' || t.category?.includes('ব্যাংক প্রাপ্ত সুদ')) {
        bankInterestIncome += amt;
      } else if (t.type === 'income' || t.category?.includes('বিবিধ আয়')) {
        miscIncome += amt;
      }

      // Map to expenses (financial/administrative)
      if (t.debitAcc === 'savings_interest' || t.category?.includes('সঞ্চয় লভ্যাংশ') || t.category?.includes('সঞ্চয় সুদ')) {
        savingsInterestExpense += amt;
      } else if (t.debitAcc === 'loan_interest_exp' || t.category?.includes('ঋণের সুদ খরচ')) {
        loanInterestExpense += amt;
      } else if (t.debitAcc === 'staff_salaries' || t.category?.includes('বেতন ও ভাতা')) {
        staffSalariesExpense += amt;
      } else if (t.debitAcc === 'office_rent' || t.category?.includes('অফিস ভাড়া')) {
        officeRentExpense += amt;
      } else if (t.debitAcc === 'utilities_expense' || t.category?.includes('ইউটিলিটি')) {
        utilitiesExpense += amt;
      } else if (t.debitAcc === 'printing_stationery' || t.category?.includes('স্টেশনারি')) {
        stationeryExpense += amt;
      } else if (t.debitAcc === 'audit_fees' || t.category?.includes('অডিট ফি')) {
        auditFeesExpense += amt;
      } else if (t.debitAcc === 'bad_debt' || t.category?.includes('কুঋণ অবলোপন')) {
        badDebtExpense += amt;
      }
    });

    const totalIncome = serviceChargeIncome + admissionFeeIncome + passbookSaleIncome + bankInterestIncome + miscIncome;
    const totalExpense = savingsInterestExpense + loanInterestExpense + staffSalariesExpense + officeRentExpense + utilitiesExpense + stationeryExpense + auditFeesExpense + badDebtExpense;
    const netSurplus = totalIncome - totalExpense;

    return {
      serviceChargeIncome, admissionFeeIncome, passbookSaleIncome, bankInterestIncome, miscIncome,
      savingsInterestExpense, loanInterestExpense, staffSalariesExpense, officeRentExpense, utilitiesExpense, stationeryExpense, auditFeesExpense, badDebtExpense,
      totalIncome, totalExpense, netSurplus
    };
  }, [transactions, targetLockDate]);

  // Step 3: Run Year-End Closing double entry generation & year lock
  const handlePerformYearEndClosing = () => {
    if (isAlreadyClosed) {
      alert("উক্ত অর্থবছর ইতিপূর্বে ক্লোজ করা হয়েছে। ডুপ্লিকেট ক্লোজিং সম্ভব নয়।");
      return;
    }

    setIsClosingInProgress(true);
    
    setTimeout(() => {
      try {
        const netSurplus = financialPerformance.netSurplus;
        const voucherId = `VOU-YREND-${selectedFiscalYear}-${Date.now()}`;
        
        // 1. Create statutory closing journal entries
        const closingEntries: any[] = [];

        // Debit Income Heads to reduce balances to zero
        if (financialPerformance.totalIncome > 0) {
          closingEntries.push({
            id: `${voucherId}-INC-DR`,
            voucherId: voucherId,
            orgId: org.id,
            branchId: branchId,
            type: 'income_closing',
            category: 'বছর সমাপনী আয় স্থানান্তর',
            amount: financialPerformance.totalIncome,
            date: targetLockDate,
            addDate: targetLockDate,
            debitAcc: 'operating_income_sum',
            creditAcc: 'capital_fund', // Surplus moves to Capital Fund Equity
            note: `${selectedFiscalYear} অর্থবছর ক্লোজিং: অপারেটিং আয় উদ্বৃত্ত মূলধন তহবিলে স্থানান্তর`,
            paymentMode: 'journal_entry',
            operator: staff.name,
            synced: false
          });
        }

        // Credit Expense Heads to reduce balances to zero
        if (financialPerformance.totalExpense > 0) {
          closingEntries.push({
            id: `${voucherId}-EXP-CR`,
            voucherId: voucherId,
            orgId: org.id,
            branchId: branchId,
            type: 'expense_closing',
            category: 'বছর সমাপনী ব্যয় স্থানান্তর',
            amount: financialPerformance.totalExpense,
            date: targetLockDate,
            addDate: targetLockDate,
            debitAcc: 'capital_fund', // Expenses debit the Surplus Capital Fund Equity
            creditAcc: 'expense_group',
            note: `${selectedFiscalYear} অর্থবছর ক্লোজিং: পরিচালন ব্যয় মূলধন তহবিলে সমন্বয়`,
            paymentMode: 'journal_entry',
            operator: staff.name,
            synced: false
          });
        }

        // Apply Entries to transaction list
        setTransactions(prev => [...closingEntries, ...prev]);

        // 2. Lock the fiscal year by storing its status
        const newClosedRecord = {
          id: `closed-yr-${Date.now()}`,
          fiscalYear: selectedFiscalYear,
          lockDate: targetLockDate,
          closedAt: new Date().toISOString(),
          closedBy: staff.name,
          totalIncome: financialPerformance.totalIncome,
          totalExpense: financialPerformance.totalExpense,
          surplus: netSurplus,
          voucherId: voucherId
        };

        const updatedYears = [...closedYears, newClosedRecord];
        setClosedYears(updatedYears);
        localStorage.setItem(`tanzil_closed_fiscal_years_${org.id}_${branchId}`, JSON.stringify(updatedYears));

        // Save year lock metadata globally
        localStorage.setItem(`tanzil_lock_date_${org.id}_${branchId}`, targetLockDate);

        setClosedSuccess(true);
        setCurrentStep(4);
        alert(`${selectedFiscalYear} অর্থবছর সফলভাবে ক্লোজ করা হয়েছে!\nসমস্ত আর্থিক লেনদেন লক করা হয়েছে এবং সমাপনী রেভিনিউ ইকুইটি মূলধন তহবিলে স্থানান্তর করা হয়েছে।`);
      } catch (e: any) {
        console.error(e);
        alert('অর্থবছর ক্লোজ করার সময় সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
      } finally {
        setIsClosingInProgress(false);
      }
    }, 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs select-none text-left">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2 font-sans leading-tight">
            <CalendarRange className="text-indigo-600 animate-bounce-short" size={20} />
            ফাইন্যান্সিয়াল ইয়ার-এন্ড ক্লোজিং উইজার্ড (Year-End Closing)
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            হিসাববছরের চূড়ান্ত সমাপনী নিরূপণ, আয়-ব্যয় বন্ধকরণ এবং পরবর্তী অর্থবছরে উদ্বৃত্ত স্থানান্তর
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 cursor-pointer font-sans border-0 bg-transparent"
        >
          <ArrowLeft size={12} /> প্রধান মেনু
        </button>
      </div>

      {/* Progress Wizard Header */}
      <div className="flex items-center justify-between border-y border-slate-50 py-3 text-xs font-bold text-slate-400 font-sans">
        <div className={`flex items-center gap-1.5 ${currentStep === 1 ? 'text-indigo-600 font-black' : currentStep > 1 ? 'text-emerald-600' : ''}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${currentStep >= 1 ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200'}`}>১</span>
          <span>অডিট ও চেকস</span>
        </div>
        <div className="w-8 h-px bg-slate-200" />
        <div className={`flex items-center gap-1.5 ${currentStep === 2 ? 'text-indigo-600 font-black' : currentStep > 2 ? 'text-emerald-600' : ''}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${currentStep >= 2 ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200'}`}>২</span>
          <span>আয়-ব্যয় বিশ্লেষণ</span>
        </div>
        <div className="w-8 h-px bg-slate-200" />
        <div className={`flex items-center gap-1.5 ${currentStep === 3 ? 'text-indigo-600 font-black' : currentStep > 3 ? 'text-emerald-600' : ''}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${currentStep >= 3 ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200'}`}>৩</span>
          <span>ক্লোজিং ভাউচার</span>
        </div>
        <div className="w-8 h-px bg-slate-200" />
        <div className={`flex items-center gap-1.5 ${currentStep === 4 ? 'text-emerald-600 font-black' : ''}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${currentStep === 4 ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}>৪</span>
          <span>সমাপ্ত</span>
        </div>
      </div>

      {/* STEP 1: PRE-CLOSING AUDIT CHECKS */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Year Selector card */}
            <div className="md:col-span-1 border border-slate-150 rounded-2xl p-4 bg-slate-50 space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">ক্লোজিং অর্থবছর নির্ধারণ</h4>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block">অর্থবছর (Fiscal Year):</label>
                  <select
                    value={selectedFiscalYear}
                    onChange={(e) => {
                      setSelectedFiscalYear(e.target.value);
                      if (e.target.value === '২০২৫-২০২৬') setTargetLockDate('2026-06-30');
                      else if (e.target.value === '২০২৪-২০২৫') setTargetLockDate('2025-06-30');
                    }}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="২০২৫-২০২৬">২০২৫-২০২৬ (জুলাই ০১, ২০২৫ - জুন ৩০, ২০২৬)</option>
                    <option value="২০২৪-২০২৫">২০২৪-২০২৫ (জুলাই ০১, ২০২৪ - জুন ৩০, ২০২৫)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block">চূড়ান্ত লক করার তারিখ:</label>
                  <input 
                    type="date"
                    value={targetLockDate}
                    onChange={(e) => setTargetLockDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white font-mono"
                    disabled
                  />
                </div>
              </div>

              {isAlreadyClosed && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-[11px] font-bold flex gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>মনোযোগ দিন! এই অর্থবছরটি ইতিপূর্বে ক্লোজড ও চূড়ান্ত লক করা হয়েছে।</span>
                </div>
              )}
            </div>

            {/* Verification checklist (2 cols) */}
            <div className="md:col-span-2 space-y-4 text-xs font-semibold text-slate-700">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">সমাপনী অডিট ও যাচাইকরণ চেকলিস্ট</h4>
              
              <div className="space-y-3">
                
                {/* Check 1: Working Date >= Lock Date */}
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  auditChecks.dateCheck ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' : 'bg-rose-50/50 border-rose-200 text-rose-800'
                }`}>
                  <div className="space-y-1">
                    <h5 className="font-bold flex items-center gap-1.5">
                      {auditChecks.dateCheck ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertCircle size={14} className="text-rose-600" />}
                      ১. কর্মদিবসের সীমা পরীক্ষা (Working Date Check)
                    </h5>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      অর্থবছর ক্লোজ করতে হলে আপনার বর্তমান ব্র্যাঞ্চ কর্মদিবস অবশ্যই সমাপনী তারিখ বা তার পরবর্তী হতে হবে।
                    </p>
                  </div>
                  <span className="font-black text-right font-sans shrink-0">
                    {workingDay}
                  </span>
                </div>

                {/* Check 2: Unsynced local work */}
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  auditChecks.unsyncedCheck ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' : 'bg-amber-50/50 border-amber-200 text-amber-800'
                }`}>
                  <div className="space-y-1">
                    <h5 className="font-bold flex items-center gap-1.5">
                      {auditChecks.unsyncedCheck ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertCircle size={14} className="text-amber-600" />}
                      ২. অফলাইন ডাটা সিঙ্ক স্থিতি (Offline Sync Check)
                    </h5>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      বছরের সমাপনী এন্ট্রির আগে লোকাল কাজের হিসাবসমূহ ক্লাউডে ব্যাকআপ নেওয়া হয়েছে কি না পরীক্ষা।
                    </p>
                  </div>
                  <span className="font-black text-right font-sans shrink-0">
                    {auditChecks.unsyncedCheck ? 'সিঙ্কড' : `${auditChecks.unsyncedCount} টি অফলাইন বাকি`}
                  </span>
                </div>

                {/* Check 3: Pending Refunds */}
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  auditChecks.refundsCheck ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' : 'bg-rose-50/50 border-rose-200 text-rose-800'
                }`}>
                  <div className="space-y-1">
                    <h5 className="font-bold flex items-center gap-1.5">
                      {auditChecks.refundsCheck ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertCircle size={14} className="text-rose-600" />}
                      ৩. অনুমোদনের অপেক্ষায় থাকা সঞ্চয় উত্তোলন (Pending Refunds Check)
                    </h5>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      অর্থবছরের শেষ কর্মদিবসের পূর্বে কোনো সঞ্চয় উত্তোলন বা সমন্বয় আবেদন অনুমোদনের অপেক্ষায় থাকা যাবে না।
                    </p>
                  </div>
                  <span className="font-black text-right font-sans shrink-0">
                    {auditChecks.refundsCheck ? 'কোনোটি নেই' : `${auditChecks.pendingRefunds} টি অপেক্ষমান`}
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* Nav Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              বাতিল
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              disabled={isAlreadyClosed || !auditChecks.isAllPassed}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
            >
              পরবর্তী ধাপ (আয়-ব্যয় বিশ্লেষণ)
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: INCOME & EXPENSE ANALYSIS */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Income breakdown (Left) */}
            <div className="border border-emerald-150 bg-emerald-50/15 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins size={14} />
                  পরিচালন ও অন্যান্য আয়
                </h4>
                <span className="font-black font-mono text-emerald-700 text-sm">৳{financialPerformance.totalIncome.toLocaleString('bn-BD')}</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 font-bold">
                <div className="flex justify-between">
                  <span>ঋণের সার্ভিস চার্জ (Service Charges):</span>
                  <span className="font-mono text-slate-800">৳{financialPerformance.serviceChargeIncome.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>সদস্য ভর্তি ফি (Admission Fees):</span>
                  <span className="font-mono text-slate-800">৳{financialPerformance.admissionFeeIncome.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>পাসবই ও ফর্ম বিক্রি (Passbook Sales):</span>
                  <span className="font-mono text-slate-800">৳{financialPerformance.passbookSaleIncome.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>ব্যাংক জমার ওপর প্রাপ্ত সুদ:</span>
                  <span className="font-mono text-slate-800">৳{financialPerformance.bankInterestIncome.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>বিবিধ অন্যান্য আয়:</span>
                  <span className="font-mono text-slate-800">৳{financialPerformance.miscIncome.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>

            {/* Expense breakdown (Right) */}
            <div className="border border-rose-150 bg-rose-50/15 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-rose-100 pb-2">
                <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins size={14} />
                  পরিচালন ও অ-পরিচালন ব্যয়
                </h4>
                <span className="font-black font-mono text-rose-700 text-sm">৳{financialPerformance.totalExpense.toLocaleString('bn-BD')}</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 font-bold">
                <div className="flex justify-between">
                  <span>সদস্য সঞ্চয়ের ওপর প্রদত্ত সুদ:</span>
                  <span className="font-mono text-slate-800">৳{financialPerformance.savingsInterestExpense.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>ব্যাংক/PKSF ঋণের সুদ:</span>
                  <span className="font-mono text-slate-800">৳{financialPerformance.loanInterestExpense.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>স্টাফ বেতন ও ভাতা:</span>
                  <span className="font-mono text-slate-800">৳{financialPerformance.staffSalariesExpense.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>অফিস ভাড়া ও ইউটিলিটি:</span>
                  <span className="font-mono text-slate-800">৳{(financialPerformance.officeRentExpense + financialPerformance.utilitiesExpense).toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>প্রিন্টিং ও স্টেশনারি:</span>
                  <span className="font-mono text-slate-800">৳{financialPerformance.stationeryExpense.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>কুঋণ অবলোপন (Bad Debt):</span>
                  <span className="font-mono text-slate-800">৳{financialPerformance.badDebtExpense.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Performance Summary Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            financialPerformance.netSurplus >= 0 
              ? 'bg-emerald-550/10 border-emerald-500/25 text-emerald-800' 
              : 'bg-rose-550/10 border-rose-500/25 text-rose-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border font-sans ${
                financialPerformance.netSurplus >= 0 
                  ? 'bg-emerald-500 text-white border-emerald-600' 
                  : 'bg-rose-500 text-white border-rose-600'
              }`}>
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-black uppercase tracking-wider">চূড়ান্ত বছর সমাপনী উদ্বৃত্ত (Net Surplus / Retained Earnings):</span>
                <span className="text-base font-black font-sans">
                  {financialPerformance.netSurplus >= 0 ? 'নিট মুনাফা / সঞ্চিত উদ্বৃত্ত' : 'নিট লোকসান / অবন্টিত ক্ষতি'}
                </span>
              </div>
            </div>

            <span className="text-2xl font-black font-mono">
              ৳{financialPerformance.netSurplus.toLocaleString('bn-BD')}
            </span>
          </div>

          {/* Nav Actions */}
          <div className="flex justify-between gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              পূর্ববর্তী ধাপ
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
            >
              পরবর্তী ধাপ (সমাপনী এন্ট্রি প্রাক্কলন)
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CLOSING JOURNAL GENERATION */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">স্বয়ংক্রিয় বছর সমাপনী ভাউচার প্রাক্কলন</h4>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              বছর সমাপনীতে অস্থায়ী আয় এবং ব্যয় হিসাবসমূহের উদ্বৃত্ত বন্ধ করে বিধিবদ্ধ সংরক্ষিত তহবিল বা মূলধন তহবিলে নিট লাভ স্থানান্তর করার জন্য প্রস্তাবিত ডাবল-এন্ট্রি ভাউচার।
            </p>
          </div>

          {/* Audit Voucher mockup */}
          <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white">
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs">
              <span className="font-extrabold">সমাপনী জার্নাল ভাউচার (Proposed Closing Entry)</span>
              <span className="font-mono">তারিখ: {targetLockDate}</span>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-12 gap-3 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                <div className="col-span-6">হিসাব খাত (Account Ledger)</div>
                <div className="col-span-3 text-right">ডেবিট (Debit)</div>
                <div className="col-span-3 text-right">ক্রেডিট (Credit)</div>
              </div>

              {/* Accounts entry list */}
              <div className="space-y-2.5 text-xs font-semibold text-slate-700 font-sans">
                {/* Debits: Income items */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-6 font-bold text-slate-800">ড. পরিচালন আয় (Operating Income) - Code 4100</div>
                  <div className="col-span-3 text-right font-mono font-bold text-blue-600">৳{financialPerformance.totalIncome.toLocaleString('bn-BD')}</div>
                  <div className="col-span-3 text-right font-mono text-slate-400">৳০.০০</div>
                </div>

                {/* Credits: Expense items */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-6 font-bold text-slate-800">  ক্র. পরিচালন ও প্রশাসনিক ব্যয় (Expenses) - Code 5000</div>
                  <div className="col-span-3 text-right font-mono text-slate-400">৳০.০০</div>
                  <div className="col-span-3 text-right font-mono font-bold text-rose-600">৳{financialPerformance.totalExpense.toLocaleString('bn-BD')}</div>
                </div>

                {/* Difference: Net Surplus to Capital Equity */}
                <div className="grid grid-cols-12 gap-3 border-t border-dashed border-slate-100 pt-2.5">
                  <div className="col-span-6 font-black text-indigo-755">  ক্র. মূলধন তহবিল (Cumulative Surplus / Capital Fund) - Code 3001</div>
                  <div className="col-span-3 text-right font-mono text-slate-400">৳০.০০</div>
                  <div className="col-span-3 text-right font-mono font-black text-indigo-600">৳{financialPerformance.netSurplus.toLocaleString('bn-BD')}</div>
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-12 gap-3 border-t border-slate-200 pt-3 text-xs font-black text-slate-800 font-mono">
                <div className="col-span-6">সর্বমোট যোগফল (Balanced Totals)</div>
                <div className="col-span-3 text-right text-indigo-600">৳{financialPerformance.totalIncome.toLocaleString('bn-BD')}</div>
                <div className="col-span-3 text-right text-indigo-600">৳{(financialPerformance.totalExpense + financialPerformance.netSurplus).toLocaleString('bn-BD')}</div>
              </div>
            </div>
          </div>

          {/* Core Warning box before final submit */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-xs text-amber-900 leading-relaxed font-semibold">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600 animate-pulse" />
            <p>
              <strong>সতর্কতা:</strong> অর্থবছর ক্লোজ ও লক করার পর {selectedFiscalYear} অর্থবছরের (জুলাই ০১, ২০২৫ - জুন ৩০, ২০২৬) পূর্ববর্তী কোনো ঋণ বিতরণ, আদায় বা সঞ্চয় লেনদেন কোনোভাবেই সংশোধন বা মুছে ফেলা যাবে না। দয়া করে সম্পূর্ণ নিশ্চিত হয়ে বছর ক্লোজ বোতামটি চাপুন।
            </p>
          </div>

          {/* Nav Actions */}
          <div className="flex justify-between gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              পূর্ববর্তী ধাপ
            </button>
            
            <button
              onClick={handlePerformYearEndClosing}
              disabled={isClosingInProgress}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              {isClosingInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>সংরক্ষণ ও লক করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>চূড়ান্ত বছর ক্লোজ ও লক করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS SUMMARY */}
      {currentStep === 4 && (
        <div className="text-center py-10 space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md border border-emerald-200">
            <CheckCircle2 size={36} className="animate-bounce-short" />
          </div>

          <div className="space-y-2">
            <h4 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
              {selectedFiscalYear} অর্থবছর ক্লোজিং সফলভাবে সম্পন্ন হয়েছে!
            </h4>
            <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto leading-normal">
              অর্থবছরের আয়-ব্যয় উদ্বৃত্ত বন্ধ করা হয়েছে, ডাবল-এন্ট্রি স্থানান্তরের ভাউচার সংরক্ষিত হয়েছে এবং সমস্ত আগের এন্ট্রি লক করা হয়েছে।
            </p>
          </div>

          {/* Brief performance table */}
          <div className="max-w-md mx-auto border border-slate-150 rounded-2xl overflow-hidden text-xs text-left bg-white shadow-3xs font-sans">
            <div className="bg-slate-50 border-b border-slate-150 p-3 font-black text-slate-700">
              সমাপনী মেটাডাটা ও ফলাফল (Closing Metadata)
            </div>
            <div className="p-4 space-y-2.5 font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>অর্থবছর:</span>
                <span className="font-bold text-slate-800">{selectedFiscalYear}</span>
              </div>
              <div className="flex justify-between">
                <span>লক হওয়া শেষ তারিখ:</span>
                <span className="font-mono font-bold text-slate-800">{targetLockDate}</span>
              </div>
              <div className="flex justify-between">
                <span>মোট আয় (Total Revenues):</span>
                <span className="font-mono text-emerald-700 font-bold">৳{financialPerformance.totalIncome.toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between">
                <span>মোট ব্যয় (Total Expenses):</span>
                <span className="font-mono text-rose-700 font-bold">৳{financialPerformance.totalExpense.toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-150 pt-2.5">
                <span>মূলধন তহবিলে স্থানান্তরিত নিট লাভ:</span>
                <span className="font-mono text-indigo-700 font-black">৳{financialPerformance.netSurplus.toLocaleString('bn-BD')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            প্রধান মেনুতে ফিরে যান
          </button>
        </div>
      )}

    </div>
  );
}
