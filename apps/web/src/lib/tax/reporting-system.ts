import { prisma } from '@/lib/prisma';
import { taxCalculator, VatRateType } from './calculator';

type VatBreakdownKey = 'standardRate' | 'reducedRate' | 'zeroRate' | 'exempt';

interface PeriodRange {
  label: string;
  start: Date;
  end: Date;
}

export interface VATReport {
  period: string;
  summary: {
    totalSales: number;
    totalPurchases: number;
    vatOnSales: number;
    vatOnPurchases: number;
    netVATDue: number;
    vatReclaimed: number;
  };
  breakdown: Record<VatBreakdownKey, { sales: number; vat: number; purchases: number; vatReclaimed: number }>;
  invoices: Array<{
    invoiceNumber: string;
    date: Date;
    customer: string;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
    vatRate: number;
  }>;
  expenses: Array<{
    description: string;
    date: Date;
    amount: number;
    vatAmount: number;
    isVATReclaimable: boolean;
    category: string;
  }>;
  compliance: {
    filingStatus: string;
    paymentStatus: string;
    deadline: Date;
    isCompliant: boolean;
  };
}

export interface CorporationTaxReport {
  accountingPeriod: {
    start: Date;
    end: Date;
  };
  profitAndLoss: {
    turnover: number;
    costOfSales: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingProfit: number;
    otherIncome: number;
    profitBeforeTax: number;
    corporationTax: number;
    profitAfterTax: number;
  };
  taxCalculation: {
    profitBeforeTax: number;
    taxFreeAllowance: number;
    taxableProfit: number;
    corporationTaxRate: number;
    corporationTax: number;
    effectiveRate: number;
  };
  allowances: {
    capitalAllowances: number;
    researchAndDevelopment: number;
    otherAllowances: number;
    totalAllowances: number;
  };
  compliance: {
    filingStatus: string;
    paymentStatus: string;
    deadline: Date;
    isCompliant: boolean;
  };
}

export interface TaxForecast {
  period: string;
  projections: {
    turnover: number;
    expenses: number;
    profit: number;
    vatDue: number;
    corporationTax: number;
  };
  scenarios: {
    optimistic: { turnover: number; profit: number; tax: number };
    realistic: { turnover: number; profit: number; tax: number };
    pessimistic: { turnover: number; profit: number; tax: number };
  };
  recommendations: Array<{
    type: string;
    description: string;
    potentialSavings: number;
    implementationEffort: string;
  }>;
}

export interface ComplianceReport {
  overallScore: number;
  isCompliant: boolean;
  checks: Array<{
    checkType: string;
    score: number;
    isCompliant: boolean;
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      actionRequired: string;
    }>;
    recommendations: Array<{
      action: string;
      priority: 'low' | 'medium' | 'high';
      description: string;
    }>;
  }>;
  deadlines: Array<{
    type: string;
    title: string;
    dueDate: Date;
    status: 'upcoming' | 'due_soon' | 'overdue';
    daysRemaining: number;
  }>;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    overdueDeadlines: number;
    complianceTrend: 'improving' | 'stable' | 'declining';
  };
}

export interface TaxAnalytics {
  trends: {
    monthly: Array<{
      month: string;
      turnover: number;
      vatCollected: number;
      vatPaid: number;
      netVAT: number;
    }>;
    quarterly: Array<{
      quarter: string;
      turnover: number;
      vatCollected: number;
      vatPaid: number;
      netVAT: number;
    }>;
  };
  comparisons: {
    yearOverYear: {
      currentYear: number;
      previousYear: number;
      growth: number;
      percentage: number;
    };
    industryBenchmarks: {
      average: number;
      topQuartile: number;
      bottomQuartile: number;
      ourPosition: number;
    };
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }>;
}

function resolvePeriod(period?: string | null): PeriodRange {
  const now = new Date();
  const year = now.getFullYear();

  if (!period || period === 'current') {
    const quarter = Math.floor(now.getMonth() / 3);
    const start = new Date(year, quarter * 3, 1);
    const end = new Date(year, quarter * 3 + 3, 0);
    return { label: `${year}-Q${quarter + 1}`, start, end };
  }

  if (/^\d{4}$/.test(period)) {
    const start = new Date(Number(period), 0, 1);
    const end = new Date(Number(period), 11, 31);
    return { label: period, start, end };
  }

  const quarterMatch = period.match(/^(\d{4})-Q([1-4])$/);
  if (quarterMatch) {
    const qYear = Number(quarterMatch[1]);
    const q = Number(quarterMatch[2]) - 1;
    const start = new Date(qYear, q * 3, 1);
    const end = new Date(qYear, q * 3 + 3, 0);
    return { label: `${qYear}-Q${q + 1}`, start, end };
  }

  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const mYear = Number(monthMatch[1]);
    const monthIndex = Number(monthMatch[2]) - 1;
    const start = new Date(mYear, monthIndex, 1);
    const end = new Date(mYear, monthIndex + 1, 0);
    return { label: `${mYear}-${monthMatch[2]}`, start, end };
  }

  return resolvePeriod(null);
}

function vatBreakdownKey(rateType?: VatRateType | null): VatBreakdownKey {
  switch (rateType) {
    case VatRateType.REDUCED:
      return 'reducedRate';
    case VatRateType.ZERO:
      return 'zeroRate';
    case VatRateType.EXEMPT:
      return 'exempt';
    default:
      return 'standardRate';
  }
}

function poundsFromPence(value?: number | null): number {
  return value ? Number(value) / 100 : 0;
}

function deadlineStatus(daysRemaining: number): 'upcoming' | 'due_soon' | 'overdue' {
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 7) return 'due_soon';
  return 'upcoming';
}

export class TaxReportingSystem {
  async generateVATReport(
    period: string,
    includeDetailedBreakdown: boolean = true
  ): Promise<VATReport> {
    const range = resolvePeriod(period);

    const invoices = await prisma.taxInvoice.findMany({
      where: {
        issueDate: {
          gte: range.start,
          lte: range.end
        }
      },
      include: {
        User: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { issueDate: 'asc' }
    });

    const summary = invoices.reduce(
      (acc, invoice) => {
        const net = Number(invoice.netAmount);
        const vat = Number(invoice.vatAmount);
        acc.totalSales += net;
        acc.vatOnSales += vat;
        return acc;
      },
      {
        totalSales: 0,
        totalPurchases: 0,
        vatOnSales: 0,
        vatOnPurchases: 0
      }
    );

    const breakdown: VATReport['breakdown'] = {
      standardRate: { sales: 0, vat: 0, purchases: 0, vatReclaimed: 0 },
      reducedRate: { sales: 0, vat: 0, purchases: 0, vatReclaimed: 0 },
      zeroRate: { sales: 0, vat: 0, purchases: 0, vatReclaimed: 0 },
      exempt: { sales: 0, vat: 0, purchases: 0, vatReclaimed: 0 }
    };

    invoices.forEach(invoice => {
      const key = vatBreakdownKey(invoice.vatRateType as VatRateType);
      breakdown[key].sales += Number(invoice.netAmount);
      breakdown[key].vat += Number(invoice.vatAmount);
    });

    const formattedInvoices = includeDetailedBreakdown
      ? invoices.map(invoice => ({
          invoiceNumber: invoice.invoiceNumber,
          date: invoice.issueDate,
          customer: invoice.User?.name || invoice.User?.email || 'Customer',
          netAmount: Number(invoice.netAmount),
          vatAmount: Number(invoice.vatAmount),
          grossAmount: Number(invoice.grossAmount),
          vatRate: Number(invoice.vatRate)
        }))
      : [];

    const complianceDeadline = new Date(range.end);
    complianceDeadline.setMonth(complianceDeadline.getMonth() + 1);

    return {
      period: range.label,
      summary: {
        ...summary,
        netVATDue: summary.vatOnSales - summary.vatOnPurchases,
        vatReclaimed: breakdown.standardRate.vatReclaimed + breakdown.reducedRate.vatReclaimed
      },
      breakdown,
      invoices: formattedInvoices,
      expenses: [],
      compliance: {
        filingStatus: summary.vatOnSales > 0 ? 'pending' : 'not_required',
        paymentStatus: summary.vatOnSales > 0 ? 'unpaid' : 'n/a',
        deadline: complianceDeadline,
        isCompliant: summary.vatOnSales === 0
      }
    };
  }

  async generateCorporationTaxReport(
    taxYear: number,
    includeDetailedBreakdown: boolean = true
  ): Promise<CorporationTaxReport> {
    void includeDetailedBreakdown;
    const start = new Date(taxYear, 0, 1);
    const end = new Date(taxYear, 11, 31, 23, 59, 59, 999);

    const invoices = await prisma.taxInvoice.findMany({
      where: {
        issueDate: {
          gte: start,
          lte: end
        }
      }
    });

    const driverEarnings = await prisma.driverEarnings.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        netAmountPence: true,
        feeAmountPence: true,
        platformFeePence: true
      }
    });

    const turnover = invoices.reduce((sum, invoice) => sum + Number(invoice.netAmount), 0);
    const costOfSales = driverEarnings.reduce((sum, earning) => sum + poundsFromPence(earning.netAmountPence), 0);
    const operatingExpenses =
      driverEarnings.reduce(
        (sum, earning) =>
          sum + poundsFromPence(earning.feeAmountPence) + poundsFromPence(earning.platformFeePence),
        0
      );

    const grossProfit = turnover - costOfSales;
    const operatingProfit = grossProfit - operatingExpenses;
    const otherIncome = 0;
    const profitBeforeTax = operatingProfit + otherIncome;

    const taxCalculation = taxCalculator.calculateCorporationTax(
      profitBeforeTax,
      start,
      end
    );

    const allowances = {
      capitalAllowances: 0,
      researchAndDevelopment: 0,
      otherAllowances: 0,
      totalAllowances: 0
    };

    return {
      accountingPeriod: { start, end },
      profitAndLoss: {
        turnover,
        costOfSales,
        grossProfit,
        operatingExpenses,
        operatingProfit,
        otherIncome,
        profitBeforeTax,
        corporationTax: taxCalculation.corporationTax,
        profitAfterTax: profitBeforeTax - taxCalculation.corporationTax
      },
      taxCalculation: {
        profitBeforeTax,
        taxFreeAllowance: taxCalculation.taxFreeAllowance,
        taxableProfit: taxCalculation.taxableProfit,
        corporationTaxRate: 0.19,
        corporationTax: taxCalculation.corporationTax,
        effectiveRate: taxCalculation.effectiveRate
      },
      allowances,
      compliance: {
        filingStatus: 'pending',
        paymentStatus: 'unpaid',
        deadline: new Date(taxYear + 1, 8, 30),
        isCompliant: profitBeforeTax <= 0
      }
    };
  }

  async generateTaxForecast(months: number = 12): Promise<TaxForecast> {
    const monthsBack = Math.max(months, 1);
    const current = new Date();
    const start = new Date(current.getFullYear(), current.getMonth() - 12, 1);

    const invoices = await prisma.taxInvoice.findMany({
      where: { issueDate: { gte: start, lte: current } },
      orderBy: { issueDate: 'asc' }
    });

    const driverEarnings = await prisma.driverEarnings.findMany({
      where: { createdAt: { gte: start, lte: current } },
      select: { netAmountPence: true, createdAt: true }
    });

    const monthlyBuckets = new Map<string, { turnover: number; expenses: number }>();
    invoices.forEach(invoice => {
      const key = `${invoice.issueDate.getFullYear()}-${invoice.issueDate.getMonth()}`;
      const bucket = monthlyBuckets.get(key) || { turnover: 0, expenses: 0 };
      bucket.turnover += Number(invoice.netAmount);
      monthlyBuckets.set(key, bucket);
    });

    driverEarnings.forEach(earning => {
      if (!earning.createdAt) return;
      const key = `${earning.createdAt.getFullYear()}-${earning.createdAt.getMonth()}`;
      const bucket = monthlyBuckets.get(key) || { turnover: 0, expenses: 0 };
      bucket.expenses += poundsFromPence(earning.netAmountPence);
      monthlyBuckets.set(key, bucket);
    });

    const monthlyValues = Array.from(monthlyBuckets.values());
    const averageTurnover =
      monthlyValues.reduce((sum, value) => sum + value.turnover, 0) /
      (monthlyValues.length || 1);
    const averageExpenses =
      monthlyValues.reduce((sum, value) => sum + value.expenses, 0) /
      (monthlyValues.length || 1);

    const projections = {
      turnover: averageTurnover * monthsBack,
      expenses: averageExpenses * monthsBack,
      profit: (averageTurnover - averageExpenses) * monthsBack,
      vatDue: averageTurnover * monthsBack * 0.2,
      corporationTax: Math.max((averageTurnover - averageExpenses) * monthsBack, 0) * 0.19
    };

    return {
      period: `${monthsBack} months`,
      projections,
      scenarios: {
        optimistic: {
          turnover: projections.turnover * 1.15,
          profit: projections.profit * 1.2,
          tax: projections.corporationTax * 1.2
        },
        realistic: {
          turnover: projections.turnover,
          profit: projections.profit,
          tax: projections.corporationTax
        },
        pessimistic: {
          turnover: projections.turnover * 0.85,
          profit: projections.profit * 0.7,
          tax: projections.corporationTax * 0.7
        }
      },
      recommendations: [
        {
          type: 'cash_flow',
          description: 'Maintain at least one quarter of VAT liability in reserve.',
          potentialSavings: projections.vatDue * 0.05,
          implementationEffort: 'Low'
        },
        {
          type: 'tax_planning',
          description: 'Review planned capital expenditures to optimize Corporation Tax.',
          potentialSavings: projections.corporationTax * 0.08,
          implementationEffort: 'Medium'
        }
      ]
    };
  }

  async generateComplianceReport(): Promise<ComplianceReport> {
    const now = new Date();
    const currentQuarter = resolvePeriod('current');

    const invoicesThisQuarter = await prisma.taxInvoice.count({
      where: {
        issueDate: {
          gte: currentQuarter.start,
          lte: currentQuarter.end
        }
      }
    });

    const invoicesLastYear = await prisma.taxInvoice.count({
      where: {
        issueDate: {
          gte: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
          lte: now
        }
      }
    });

    const deadlines = this.buildUpcomingDeadlines(now, currentQuarter);

    const checks: ComplianceReport['checks'] = [
      {
        checkType: 'vat_filings',
        score: invoicesThisQuarter > 0 ? 90 : 65,
        isCompliant: invoicesThisQuarter > 0,
        issues:
          invoicesThisQuarter > 0
            ? []
            : [
                {
                  type: 'missing_vat_data',
                  severity: 'medium',
                  description: 'No VAT invoices recorded for the current period.',
                  actionRequired: 'Verify booking sync and regenerate VAT report.'
                }
              ],
        recommendations: invoicesThisQuarter > 0
          ? []
          : [
              {
                action: 'sync_bookings',
                priority: 'medium',
                description: 'Run booking → invoice sync before filing.'
              }
            ]
      },
      {
        checkType: 'record_keeping',
        score: invoicesLastYear > 100 ? 85 : 70,
        isCompliant: invoicesLastYear > 0,
        issues:
          invoicesLastYear > 0
            ? []
            : [
                {
                  type: 'insufficient_records',
                  severity: 'high',
                  description: 'No invoices recorded in the last 12 months.',
                  actionRequired: 'Investigate why tax invoices are missing.'
                }
              ],
        recommendations: invoicesLastYear > 0
          ? []
          : [
              {
                action: 'enable_invoice_generation',
                priority: 'high',
                description: 'Ensure every paid booking generates a TaxInvoice entry.'
              }
            ]
      },
      {
        checkType: 'payment_deadlines',
        score: deadlines.some(d => d.status === 'overdue') ? 60 : 90,
        isCompliant: !deadlines.some(d => d.status === 'overdue'),
        issues: deadlines
          .filter(d => d.status === 'overdue')
          .map(overdue => ({
            type: 'missed_deadline',
            severity: 'high',
            description: `${overdue.title} deadline was missed.`,
            actionRequired: 'Submit outstanding return and notify finance lead.'
          })),
        recommendations: deadlines
          .filter(d => d.status !== 'overdue')
          .map(deadline => ({
            action: 'prepare_submission',
            priority: deadline.status === 'due_soon' ? 'high' : 'medium',
            description: `Prepare documents for ${deadline.title} due on ${deadline.dueDate.toDateString()}.`
          }))
      }
    ];

    const overallScore = Math.round(
      checks.reduce((sum, check) => sum + check.score, 0) / (checks.length || 1)
    );

    const totalIssues = checks.reduce((sum, check) => sum + check.issues.length, 0);
    const criticalIssues = checks.reduce(
      (sum, check) => sum + check.issues.filter(issue => issue.severity === 'high').length,
      0
    );
    const overdueDeadlines = deadlines.filter(deadline => deadline.status === 'overdue').length;

    return {
      overallScore,
      isCompliant: overallScore >= 80,
      checks,
      deadlines,
      summary: {
        totalIssues,
        criticalIssues,
        overdueDeadlines,
        complianceTrend: overallScore >= 80 ? 'stable' : 'declining'
      }
    };
  }

  async generateTaxAnalytics(): Promise<TaxAnalytics> {
    const now = new Date();
    const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const invoices = await prisma.taxInvoice.findMany({
      where: {
        issueDate: {
          gte: start,
          lte: now
        }
      },
      orderBy: { issueDate: 'asc' }
    });

    const monthlyMap = new Map<
      string,
      { label: string; turnover: number; vatCollected: number }
    >();

    invoices.forEach(invoice => {
      const key = `${invoice.issueDate.getFullYear()}-${invoice.issueDate.getMonth()}`;
      const label = invoice.issueDate.toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric'
      });
      const bucket = monthlyMap.get(key) || { label, turnover: 0, vatCollected: 0 };
      bucket.turnover += Number(invoice.netAmount);
      bucket.vatCollected += Number(invoice.vatAmount);
      monthlyMap.set(key, bucket);
    });

    const monthly = Array.from(monthlyMap.values());
    const monthlyTrends = monthly.map(entry => ({
      month: entry.label,
      turnover: entry.turnover,
      vatCollected: entry.vatCollected,
      vatPaid: 0,
      netVAT: entry.vatCollected
    }));

    const quarterlyTrends = [];
    for (let i = 0; i < monthly.length; i += 3) {
      const quarterSlice = monthly.slice(i, i + 3);
      if (!quarterSlice.length) continue;
      const reference = quarterSlice[0].label;
      const [monthLabel, yearLabel] = reference.split(' ');
      const monthIndex = new Date(`${monthLabel} 1, ${yearLabel}`).getMonth();
      const quarterNumber = Math.floor(monthIndex / 3) + 1;

      quarterlyTrends.push({
        quarter: `Q${quarterNumber} ${yearLabel}`,
        turnover: quarterSlice.reduce((sum, value) => sum + value.turnover, 0),
        vatCollected: quarterSlice.reduce((sum, value) => sum + value.vatCollected, 0),
        vatPaid: 0,
        netVAT: quarterSlice.reduce((sum, value) => sum + value.vatCollected, 0)
      });
    }

    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;
    const currentYearTotal = invoices
      .filter(invoice => invoice.issueDate.getFullYear() === currentYear)
      .reduce((sum, invoice) => sum + Number(invoice.netAmount), 0);
    const previousYearTotal = invoices
      .filter(invoice => invoice.issueDate.getFullYear() === previousYear)
      .reduce((sum, invoice) => sum + Number(invoice.netAmount), 0);
    const growth = currentYearTotal - previousYearTotal;
    const percentage = previousYearTotal > 0 ? (growth / previousYearTotal) * 100 : 0;

    const insights: TaxAnalytics['insights'] = [];
    if (monthlyTrends.length) {
      insights.push({
        type: 'growth',
        title: 'Revenue trend',
        description:
          growth >= 0
            ? `Revenue increased ${percentage.toFixed(1)}% versus last year.`
            : `Revenue decreased ${Math.abs(percentage).toFixed(1)}% versus last year.`,
        impact: growth >= 0 ? 'positive' : 'negative',
        confidence: 80
      });
    }

    return {
      trends: {
        monthly: monthlyTrends,
        quarterly: quarterlyTrends
      },
      comparisons: {
        yearOverYear: {
          currentYear: currentYearTotal,
          previousYear: previousYearTotal,
          growth,
          percentage
        },
        industryBenchmarks: {
          average: currentYearTotal * 0.85,
          topQuartile: currentYearTotal * 1.15,
          bottomQuartile: currentYearTotal * 0.6,
          ourPosition: currentYearTotal
        }
      },
      insights
    };
  }

  private buildUpcomingDeadlines(now: Date, currentQuarter: PeriodRange): ComplianceReport['deadlines'] {
    const deadlines: ComplianceReport['deadlines'] = [];

    const vatDueDate = new Date(currentQuarter.end);
    vatDueDate.setMonth(vatDueDate.getMonth() + 1);
    const vatPaymentDate = new Date(vatDueDate);
    vatPaymentDate.setDate(vatPaymentDate.getDate() + 7);

    deadlines.push(vatDeadline('VAT Return submission', vatDueDate, now));
    deadlines.push(vatDeadline('VAT Payment', vatPaymentDate, now));

    const corpTaxPayment = new Date(now.getFullYear() + 1, 8, 30);
    deadlines.push(vatDeadline('Corporation Tax payment', corpTaxPayment, now));

    return deadlines;

    function vatDeadline(title: string, dueDate: Date, reference: Date) {
      const daysRemaining = Math.ceil(
        (dueDate.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        type: 'tax_deadline',
        title,
        dueDate,
        daysRemaining,
        status: deadlineStatus(daysRemaining)
      };
    }
  }
}

export const taxReportingSystem = new TaxReportingSystem();
