export interface TaxDeadline {
  id: string;
  deadlineType: 'vat' | 'corporation_tax' | 'other';
  title: string;
  dueDate: Date;
  status: 'upcoming' | 'due_soon' | 'overdue';
  isCompleted: boolean;
}

export interface ComplianceCheck {
  checkType: string;
  isCompliant: boolean;
  complianceScore: number;
  issues: string[];
  recommendations: string[];
  lastChecked: Date;
}

export class TaxDeadlineManager {
  async checkUpcomingDeadlines(): Promise<TaxDeadline[]> {
    const now = new Date();
    const vatDueDate = new Date(now.getFullYear(), now.getMonth(), 7);
    const corpTaxDate = new Date(now.getFullYear(), 8, 30);

    return [
      this.buildDeadline('vat', 'VAT Return filing', vatDueDate, now),
      this.buildDeadline('vat', 'VAT Payment', new Date(vatDueDate.getTime() + 7 * 24 * 60 * 60 * 1000), now),
      this.buildDeadline('corporation_tax', 'Corporation Tax payment', corpTaxDate, now)
    ];
  }

  async getComplianceStatus(): Promise<ComplianceCheck[]> {
    const deadlines = await this.checkUpcomingDeadlines();

    return [
      {
        checkType: 'overall_compliance',
        isCompliant: !deadlines.some(d => d.status === 'overdue'),
        complianceScore: deadlines.some(d => d.status === 'overdue') ? 70 : 95,
        issues: deadlines.filter(d => d.status === 'overdue').map(d => `${d.title} is overdue`),
        recommendations: deadlines
          .filter(d => d.status !== 'overdue')
          .map(d => `Prepare documents for ${d.title} (${d.dueDate.toDateString()})`),
        lastChecked: new Date()
      }
    ];
  }

  private buildDeadline(
    type: TaxDeadline['deadlineType'],
    title: string,
    dueDate: Date,
    reference: Date
  ): TaxDeadline {
    const daysRemaining = Math.ceil((dueDate.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
    let status: TaxDeadline['status'] = 'upcoming';
    if (daysRemaining <= 7 && daysRemaining >= 0) {
      status = 'due_soon';
    }
    if (daysRemaining < 0) {
      status = 'overdue';
    }

    return {
      id: `${type}-${dueDate.toISOString()}`,
      deadlineType: type,
      title,
      dueDate,
      status,
      isCompleted: false
    };
  }
}

export const taxDeadlineManager = new TaxDeadlineManager();
