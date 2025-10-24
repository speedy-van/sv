/**
 * AI-POWERED TAX ANALYSIS SERVICE FOR SPEEDY-VAN
 * 
 * Advanced AI integration using DeepSeek API for:
 * - Anomaly detection in tax data
 * - Intelligent tax optimization recommendations
 * - Predictive tax liability forecasting
 * - Automated compliance checking
 * - Natural language tax queries
 */

import OpenAI from 'openai';

export interface TaxAnomalyDetection {
  anomalies: TaxAnomaly[];
  overallRiskScore: number;
  recommendations: string[];
  analysisDate: Date;
}

export interface TaxAnomaly {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedPeriod: string;
  potentialImpact: number;
  recommendation: string;
  confidence: number;
}

export interface TaxOptimization {
  currentTaxLiability: number;
  optimizedTaxLiability: number;
  potentialSavings: number;
  strategies: OptimizationStrategy[];
  implementationPriority: string[];
}

export interface OptimizationStrategy {
  strategy: string;
  description: string;
  estimatedSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  legalCompliance: boolean;
  timeline: string;
}

export interface TaxForecast {
  period: string;
  estimatedRevenue: number;
  estimatedVAT: number;
  estimatedCorporationTax: number;
  totalTaxLiability: number;
  confidence: number;
  factors: string[];
}

export interface ComplianceAnalysis {
  isCompliant: boolean;
  complianceScore: number;
  issues: ComplianceIssue[];
  recommendations: string[];
  nextActions: string[];
}

export interface ComplianceIssue {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolution: string;
  deadline?: string;
}

export class AITaxAnalyzer {
  private client: OpenAI;
  private readonly model = 'deepseek-chat';

  constructor() {
    // Initialize DeepSeek client using OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || 'sk-dbc85858f63d44aebc7e9ef9ae2a48da',
      baseURL: 'https://api.deepseek.com'
    });
  }

  /**
   * Detect anomalies in tax data using AI
   */
  async detectAnomalies(taxData: {
    period: string;
    revenue: number;
    vatCollected: number;
    vatReclaimed: number;
    expenses: number;
    transactions: number;
    historicalData?: Array<{
      period: string;
      revenue: number;
      vatCollected: number;
    }>;
  }): Promise<TaxAnomalyDetection> {
    try {
      const prompt = this.buildAnomalyDetectionPrompt(taxData);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert UK tax analyst specializing in VAT and Corporation Tax compliance. Analyze tax data for anomalies, inconsistencies, and potential issues. Provide detailed, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const analysis = response.choices[0]?.message?.content;
      if (!analysis) {
        throw new Error('No response from AI service');
      }

      return this.parseAnomalyDetectionResponse(analysis, taxData);

    } catch (error) {
      console.error('AI anomaly detection error:', error);
      
      // Fallback to rule-based detection
      return this.fallbackAnomalyDetection(taxData);
    }
  }

  /**
   * Generate tax optimization recommendations
   */
  async generateOptimizationRecommendations(taxProfile: {
    annualRevenue: number;
    annualExpenses: number;
    vatCollected: number;
    vatReclaimed: number;
    corporationTaxPaid: number;
    businessType: string;
    employeeCount: number;
  }): Promise<TaxOptimization> {
    try {
      const prompt = this.buildOptimizationPrompt(taxProfile);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a UK tax optimization expert. Provide legal, compliant strategies to minimize tax liability while maintaining full HMRC compliance. Focus on practical, implementable advice for UK businesses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 2500
      });

      const recommendations = response.choices[0]?.message?.content;
      if (!recommendations) {
        throw new Error('No response from AI service');
      }

      return this.parseOptimizationResponse(recommendations, taxProfile);

    } catch (error) {
      console.error('AI optimization error:', error);
      
      // Fallback to basic recommendations
      return this.fallbackOptimizationRecommendations(taxProfile);
    }
  }

  /**
   * Forecast future tax liability using AI
   */
  async forecastTaxLiability(historicalData: Array<{
    period: string;
    revenue: number;
    expenses: number;
    vatCollected: number;
    corporationTax: number;
  }>, forecastPeriods: number = 4): Promise<TaxForecast[]> {
    try {
      const prompt = this.buildForecastPrompt(historicalData, forecastPeriods);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a financial forecasting expert specializing in UK tax predictions. Analyze historical data and provide realistic, data-driven forecasts for future tax liabilities.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      const forecast = response.choices[0]?.message?.content;
      if (!forecast) {
        throw new Error('No response from AI service');
      }

      return this.parseForecastResponse(forecast, forecastPeriods);

    } catch (error) {
      console.error('AI forecast error:', error);
      
      // Fallback to simple trend-based forecast
      return this.fallbackForecast(historicalData, forecastPeriods);
    }
  }

  /**
   * Analyze compliance status using AI
   */
  async analyzeCompliance(complianceData: {
    vatReturnsSubmitted: number;
    vatReturnsOnTime: number;
    corporationTaxFiled: boolean;
    payrollCompliant: boolean;
    recordKeepingScore: number;
    mtdEnrolled: boolean;
    overdueDeadlines: number;
    recentIssues: string[];
  }): Promise<ComplianceAnalysis> {
    try {
      const prompt = this.buildCompliancePrompt(complianceData);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a UK tax compliance expert. Analyze compliance data and provide clear, actionable recommendations to maintain HMRC compliance and avoid penalties.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const analysis = response.choices[0]?.message?.content;
      if (!analysis) {
        throw new Error('No response from AI service');
      }

      return this.parseComplianceResponse(analysis, complianceData);

    } catch (error) {
      console.error('AI compliance analysis error:', error);
      
      // Fallback to rule-based compliance check
      return this.fallbackComplianceAnalysis(complianceData);
    }
  }

  /**
   * Answer natural language tax queries
   */
  async answerTaxQuery(query: string, context?: any): Promise<string> {
    try {
      const contextStr = context ? `\n\nContext: ${JSON.stringify(context, null, 2)}` : '';

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a UK tax expert assistant. Provide clear, accurate answers about UK VAT, Corporation Tax, and tax compliance. Always emphasize legal compliance and recommend consulting with qualified tax professionals for specific advice.'
          },
          {
            role: 'user',
            content: `${query}${contextStr}`
          }
        ],
        temperature: 0.4,
        max_tokens: 1000
      });

      return response.choices[0]?.message?.content || 'Unable to process query';

    } catch (error) {
      console.error('AI query error:', error);
      return 'I apologize, but I am unable to process your query at this time. Please consult with a qualified tax professional.';
    }
  }

  /**
   * Build anomaly detection prompt
   */
  private buildAnomalyDetectionPrompt(taxData: any): string {
    return `Analyze the following UK tax data for anomalies and potential issues:

Period: ${taxData.period}
Revenue: £${taxData.revenue.toLocaleString()}
VAT Collected: £${taxData.vatCollected.toLocaleString()}
VAT Reclaimed: £${taxData.vatReclaimed.toLocaleString()}
Expenses: £${taxData.expenses.toLocaleString()}
Number of Transactions: ${taxData.transactions}

${taxData.historicalData ? `Historical Data:\n${taxData.historicalData.map((d: any) => 
  `${d.period}: Revenue £${d.revenue.toLocaleString()}, VAT £${d.vatCollected.toLocaleString()}`
).join('\n')}` : ''}

Please identify:
1. Any unusual patterns or anomalies
2. VAT calculation inconsistencies
3. Potential compliance issues
4. Risk assessment (low/medium/high/critical)
5. Specific recommendations for each issue

Format your response as JSON with the following structure:
{
  "anomalies": [
    {
      "type": "string",
      "severity": "low|medium|high|critical",
      "description": "string",
      "recommendation": "string",
      "confidence": 0-100
    }
  ],
  "overallRiskScore": 0-100,
  "recommendations": ["string"]
}`;
  }

  /**
   * Build optimization prompt
   */
  private buildOptimizationPrompt(taxProfile: any): string {
    return `Analyze this UK business tax profile and provide optimization strategies:

Annual Revenue: £${taxProfile.annualRevenue.toLocaleString()}
Annual Expenses: £${taxProfile.annualExpenses.toLocaleString()}
VAT Collected: £${taxProfile.vatCollected.toLocaleString()}
VAT Reclaimed: £${taxProfile.vatReclaimed.toLocaleString()}
Corporation Tax Paid: £${taxProfile.corporationTaxPaid.toLocaleString()}
Business Type: ${taxProfile.businessType}
Employee Count: ${taxProfile.employeeCount}

Provide legal, HMRC-compliant strategies to:
1. Optimize VAT reclaim
2. Reduce corporation tax liability
3. Improve tax efficiency
4. Maximize allowances and reliefs

Format as JSON:
{
  "strategies": [
    {
      "strategy": "string",
      "description": "string",
      "estimatedSavings": number,
      "implementationEffort": "low|medium|high",
      "legalCompliance": true,
      "timeline": "string"
    }
  ],
  "implementationPriority": ["string"]
}`;
  }

  /**
   * Build forecast prompt
   */
  private buildForecastPrompt(historicalData: any[], periods: number): string {
    const dataStr = historicalData.map(d => 
      `${d.period}: Revenue £${d.revenue.toLocaleString()}, VAT £${d.vatCollected.toLocaleString()}, Corp Tax £${d.corporationTax.toLocaleString()}`
    ).join('\n');

    return `Based on this historical UK tax data, forecast the next ${periods} periods:

${dataStr}

Provide realistic forecasts considering:
1. Historical trends
2. Seasonal variations
3. UK economic factors
4. Current tax rates (VAT 20%, Corporation Tax 19-25%)

Format as JSON array:
[
  {
    "period": "string",
    "estimatedRevenue": number,
    "estimatedVAT": number,
    "estimatedCorporationTax": number,
    "confidence": 0-100,
    "factors": ["string"]
  }
]`;
  }

  /**
   * Build compliance prompt
   */
  private buildCompliancePrompt(complianceData: any): string {
    return `Analyze this UK tax compliance status:

VAT Returns Submitted: ${complianceData.vatReturnsSubmitted}
VAT Returns On Time: ${complianceData.vatReturnsOnTime}
Corporation Tax Filed: ${complianceData.corporationTaxFiled ? 'Yes' : 'No'}
Payroll Compliant: ${complianceData.payrollCompliant ? 'Yes' : 'No'}
Record Keeping Score: ${complianceData.recordKeepingScore}/100
MTD Enrolled: ${complianceData.mtdEnrolled ? 'Yes' : 'No'}
Overdue Deadlines: ${complianceData.overdueDeadlines}
Recent Issues: ${complianceData.recentIssues.join(', ') || 'None'}

Provide:
1. Overall compliance assessment
2. Critical issues requiring immediate attention
3. Recommendations for improvement
4. Next actions with priorities

Format as JSON:
{
  "isCompliant": boolean,
  "complianceScore": 0-100,
  "issues": [
    {
      "category": "string",
      "severity": "low|medium|high|critical",
      "description": "string",
      "resolution": "string"
    }
  ],
  "recommendations": ["string"],
  "nextActions": ["string"]
}`;
  }

  /**
   * Parse AI responses and handle fallbacks
   */
  private parseAnomalyDetectionResponse(response: string, taxData: any): TaxAnomalyDetection {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          anomalies: parsed.anomalies || [],
          overallRiskScore: parsed.overallRiskScore || 0,
          recommendations: parsed.recommendations || [],
          analysisDate: new Date()
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    return this.fallbackAnomalyDetection(taxData);
  }

  private parseOptimizationResponse(response: string, taxProfile: any): TaxOptimization {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const totalSavings = parsed.strategies?.reduce((sum: number, s: any) => sum + (s.estimatedSavings || 0), 0) || 0;
        
        return {
          currentTaxLiability: taxProfile.corporationTaxPaid + (taxProfile.vatCollected - taxProfile.vatReclaimed),
          optimizedTaxLiability: Math.max(0, (taxProfile.corporationTaxPaid + (taxProfile.vatCollected - taxProfile.vatReclaimed)) - totalSavings),
          potentialSavings: totalSavings,
          strategies: parsed.strategies || [],
          implementationPriority: parsed.implementationPriority || []
        };
      }
    } catch (error) {
      console.error('Error parsing optimization response:', error);
    }

    return this.fallbackOptimizationRecommendations(taxProfile);
  }

  private parseForecastResponse(response: string, periods: number): TaxForecast[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((f: any) => ({
          period: f.period,
          estimatedRevenue: f.estimatedRevenue || 0,
          estimatedVAT: f.estimatedVAT || 0,
          estimatedCorporationTax: f.estimatedCorporationTax || 0,
          totalTaxLiability: (f.estimatedVAT || 0) + (f.estimatedCorporationTax || 0),
          confidence: f.confidence || 50,
          factors: f.factors || []
        }));
      }
    } catch (error) {
      console.error('Error parsing forecast response:', error);
    }

    return [];
  }

  private parseComplianceResponse(response: string, complianceData: any): ComplianceAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isCompliant: parsed.isCompliant ?? true,
          complianceScore: parsed.complianceScore || 0,
          issues: parsed.issues || [],
          recommendations: parsed.recommendations || [],
          nextActions: parsed.nextActions || []
        };
      }
    } catch (error) {
      console.error('Error parsing compliance response:', error);
    }

    return this.fallbackComplianceAnalysis(complianceData);
  }

  /**
   * Fallback methods for when AI is unavailable
   */
  private fallbackAnomalyDetection(taxData: any): TaxAnomalyDetection {
    const anomalies: TaxAnomaly[] = [];
    
    // Check VAT rate
    const expectedVAT = taxData.revenue * 0.20 / 1.20;
    const vatDifference = Math.abs(taxData.vatCollected - expectedVAT);
    
    if (vatDifference > expectedVAT * 0.1) {
      anomalies.push({
        type: 'VAT_CALCULATION_ANOMALY',
        severity: 'high',
        description: 'VAT collected differs significantly from expected amount',
        affectedPeriod: taxData.period,
        potentialImpact: vatDifference,
        recommendation: 'Review VAT calculations and ensure correct rates are applied',
        confidence: 85
      });
    }

    return {
      anomalies,
      overallRiskScore: anomalies.length > 0 ? 60 : 20,
      recommendations: ['Review tax calculations', 'Verify transaction records'],
      analysisDate: new Date()
    };
  }

  private fallbackOptimizationRecommendations(taxProfile: any): TaxOptimization {
    const strategies: OptimizationStrategy[] = [
      {
        strategy: 'Maximize VAT Reclaim',
        description: 'Ensure all eligible business expenses have VAT reclaimed',
        estimatedSavings: taxProfile.annualExpenses * 0.20 * 0.1,
        implementationEffort: 'low',
        legalCompliance: true,
        timeline: '1-2 months'
      }
    ];

    const totalSavings = strategies.reduce((sum, s) => sum + s.estimatedSavings, 0);

    return {
      currentTaxLiability: taxProfile.corporationTaxPaid,
      optimizedTaxLiability: taxProfile.corporationTaxPaid - totalSavings,
      potentialSavings: totalSavings,
      strategies,
      implementationPriority: strategies.map(s => s.strategy)
    };
  }

  private fallbackForecast(historicalData: any[], periods: number): TaxForecast[] {
    const forecasts: TaxForecast[] = [];
    
    if (historicalData.length === 0) return forecasts;

    // Simple average-based forecast
    const avgRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length;
    const avgVAT = historicalData.reduce((sum, d) => sum + d.vatCollected, 0) / historicalData.length;

    for (let i = 1; i <= periods; i++) {
      forecasts.push({
        period: `Forecast Period ${i}`,
        estimatedRevenue: avgRevenue,
        estimatedVAT: avgVAT,
        estimatedCorporationTax: avgRevenue * 0.19,
        totalTaxLiability: avgVAT + (avgRevenue * 0.19),
        confidence: 50,
        factors: ['Historical average']
      });
    }

    return forecasts;
  }

  private fallbackComplianceAnalysis(complianceData: any): ComplianceAnalysis {
    const issues: ComplianceIssue[] = [];

    if (complianceData.overdueDeadlines > 0) {
      issues.push({
        category: 'Deadlines',
        severity: 'critical',
        description: `${complianceData.overdueDeadlines} overdue deadline(s)`,
        resolution: 'Complete and submit overdue returns immediately'
      });
    }

    if (!complianceData.mtdEnrolled) {
      issues.push({
        category: 'MTD',
        severity: 'high',
        description: 'Not enrolled in Making Tax Digital',
        resolution: 'Enroll in MTD for VAT compliance'
      });
    }

    const complianceScore = Math.max(0, 100 - (issues.length * 20));

    return {
      isCompliant: issues.length === 0,
      complianceScore,
      issues,
      recommendations: ['Address overdue items', 'Maintain regular filing schedule'],
      nextActions: ['Review compliance checklist', 'Set up automated reminders']
    };
  }
}

// Export singleton instance
export const aiTaxAnalyzer = new AITaxAnalyzer();

