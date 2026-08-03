/**
 * Loan Settlement / Savings Adjustment Module
 * Sequential loan adjustment against member savings (GS, LTS with premature profit, CBS with profit, and Share Capital)
 */

export interface AdjustmentResult {
  gsAdjusted: number;
  ltsAdjusted: number;
  cbsAdjusted: number;
  shareAdjusted: number;
  remainingLoan: number;
  isShareInactive: boolean;
  finalGsBalance: number;
  finalLtsBalance: number;
  finalCbsBalance: number;
  finalShareBalance: number;
}

/**
 * Calculates premature profit on Long Term Savings (LTS / DPS) account.
 * Uses accrued profit or premature interest rate (e.g. 6% p.a.) if withdrawn prematurely.
 */
export function calculatePrematureLtsProfit(memberLts: any): number {
  if (!memberLts) return 0;
  
  // If explicitly provided accumulated profit or profit field
  if (typeof memberLts.accumulatedProfit === 'number' && memberLts.accumulatedProfit > 0) {
    return memberLts.accumulatedProfit;
  }
  if (typeof memberLts.profit === 'number' && memberLts.profit > 0) {
    return memberLts.profit;
  }

  // Calculate based on principal balance, duration months, and premature rate (e.g. 6% annual)
  const principal = Number(memberLts.balance) || Number(memberLts.principal) || 0;
  if (principal <= 0) return 0;

  const openingDateStr = memberLts.openingDate || memberLts.addDate;
  if (!openingDateStr) return 0;

  const openingDate = new Date(openingDateStr);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - openingDate.getTime());
  const elapsedMonths = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30)));

  // Premature interest rate default 6% annual (0.5% monthly)
  const prematureAnnualRate = memberLts.prematureRate ?? 6.0;
  const monthlyRate = prematureAnnualRate / 100 / 12;
  const calculatedProfit = Math.round(principal * monthlyRate * elapsedMonths);

  return calculatedProfit;
}

/**
 * Calculates accrued profit on Child Savings / Special Deposit (CBS) account.
 */
export function calculateCbsProfit(memberCbs: any): number {
  if (!memberCbs) return 0;

  if (typeof memberCbs.accumulatedProfit === 'number' && memberCbs.accumulatedProfit > 0) {
    return memberCbs.accumulatedProfit;
  }
  if (typeof memberCbs.profit === 'number' && memberCbs.profit > 0) {
    return memberCbs.profit;
  }

  const principal = Number(memberCbs.balance) || Number(memberCbs.principal) || 0;
  if (principal <= 0) return 0;

  const openingDateStr = memberCbs.openingDate || memberCbs.addDate;
  if (!openingDateStr) return 0;

  const openingDate = new Date(openingDateStr);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - openingDate.getTime());
  const elapsedMonths = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30)));

  // Standard CBS interest rate 8.5% annual
  const cbsAnnualRate = memberCbs.interestRate ?? 8.5;
  const monthlyRate = cbsAnnualRate / 100 / 12;
  const calculatedProfit = Math.round(principal * monthlyRate * elapsedMonths);

  return calculatedProfit;
}

export interface LoanAdjustmentParams {
  currentGsBalance: number;
  currentLtsPrincipal: number;
  memberLts?: any;
  currentCbsPrincipal: number;
  memberCbs?: any;
  currentShareBalance: number;
}

/**
 * Core Loan Adjustment Process
 * Adjusts outstanding loan sequentially:
 * 1. General Savings (retaining minimum 10 BDT)
 * 2. LTS principal + premature profit
 * 3. CBS principal + profit
 * 4. Share balance (share becomes inactive if final balance reaches 0)
 */
export function processLoanAdjustment(
  memberId: string,
  outstandingLoan: number,
  params: LoanAdjustmentParams
): AdjustmentResult {
  let neededAmount = Math.max(0, outstandingLoan);

  const {
    currentGsBalance = 0,
    currentLtsPrincipal = 0,
    memberLts,
    currentCbsPrincipal = 0,
    memberCbs,
    currentShareBalance = 0
  } = params;

  // 1. General Savings Adjustment (Retaining 10 BDT)
  const availableGS = Math.max(0, currentGsBalance - 10);
  const gsDeduction = Math.min(availableGS, neededAmount);
  neededAmount -= gsDeduction;

  // 2. LTS Premature Calculation & Adjustment
  const ltsProfit = calculatePrematureLtsProfit(memberLts);
  const totalLtsAvailable = currentLtsPrincipal + ltsProfit;
  const ltsDeduction = Math.min(totalLtsAvailable, neededAmount);
  neededAmount -= ltsDeduction;

  // 3. CBS Adjustment
  const cbsProfit = calculateCbsProfit(memberCbs);
  const totalCbsAvailable = currentCbsPrincipal + cbsProfit;
  const cbsDeduction = Math.min(totalCbsAvailable, neededAmount);
  neededAmount -= cbsDeduction;

  // 4. Share Adjustment & Status Update
  const shareDeduction = Math.min(currentShareBalance, neededAmount);
  neededAmount -= shareDeduction;

  // Account Status Updates
  const finalShareBalance = currentShareBalance - shareDeduction;
  const isShareInactive = finalShareBalance === 0;

  const finalGsBalance = currentGsBalance - gsDeduction;
  const finalLtsBalance = Math.max(0, totalLtsAvailable - ltsDeduction);
  const finalCbsBalance = Math.max(0, totalCbsAvailable - cbsDeduction);

  return {
    gsAdjusted: gsDeduction,
    ltsAdjusted: ltsDeduction,
    cbsAdjusted: cbsDeduction,
    shareAdjusted: shareDeduction,
    remainingLoan: neededAmount, // 0 means loan is fully settled/paid
    isShareInactive,
    finalGsBalance,
    finalLtsBalance,
    finalCbsBalance,
    finalShareBalance
  };
}
