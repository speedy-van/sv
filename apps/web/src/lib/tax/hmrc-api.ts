/**
 * HMRC API INTEGRATION FOR SPEEDY-VAN TAX SYSTEM
 * 
 * Comprehensive integration with HMRC APIs for:
 * - VAT returns submission
 * - Corporation Tax submissions
 * - Making Tax Digital (MTD) compliance
 * - OAuth2 authentication
 * - Real-time VAT validation
 */

import { NextRequest } from 'next/server';

export interface HMRCOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
}

export interface VATReturnData {
  periodKey: string;
  vatDueSales: number;
  vatDueAcquisitions: number;
  totalVatDue: number;
  vatReclaimedCurrPeriod: number;
  netVatDue: number;
  totalValueSalesExVAT: number;
  totalValuePurchasesExVAT: number;
  totalValueGoodsSuppliedExVAT: number;
  totalAcquisitionsExVAT: number;
  finalised: boolean;
}

export interface VATSubmissionResponse {
  processingDate: string;
  paymentIndicator: string;
  formBundleNumber: string;
  chargeRefNumber: string;
}

export interface CorporationTaxData {
  accountingPeriodStart: string;
  accountingPeriodEnd: string;
  corporationTaxDue: number;
  taxableProfit: number;
  profitBeforeTax: number;
  turnover: number;
}

export interface HMRCError {
  code: string;
  message: string;
  path?: string;
  value?: any;
}

export class HMRCAPIService {
  private readonly baseURL = 'https://api.service.hmrc.gov.uk';
  private readonly sandboxURL = 'https://test-api.service.hmrc.gov.uk';
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor() {
    this.validateEnvironment();
  }

  /**
   * Initialize OAuth2 flow for HMRC API access
   */
  async initializeOAuth2(): Promise<{ authUrl: string; state: string }> {
    const clientId = process.env.HMRC_CLIENT_ID;
    const redirectUri = process.env.HMRC_REDIRECT_URI;
    const state = this.generateState();

    if (!clientId || !redirectUri) {
      throw new Error('HMRC OAuth2 credentials not configured');
    }

    const authUrl = `${this.getBaseURL()}/oauth/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=write:vat+read:vat+write:corporation-tax+read:corporation-tax&` +
      `state=${state}`;

    return { authUrl, state };
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(
    code: string,
    state: string
  ): Promise<HMRCOAuthTokens> {
    const clientId = process.env.HMRC_CLIENT_ID;
    const clientSecret = process.env.HMRC_CLIENT_SECRET;
    const redirectUri = process.env.HMRC_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('HMRC OAuth2 credentials not configured');
    }

    const response = await fetch(`${this.getBaseURL()}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HMRC OAuth token exchange failed: ${error.error_description}`);
    }

    const tokenData = await response.json();
    
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      scope: tokenData.scope.split(' ')
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<HMRCOAuthTokens> {
    const clientId = process.env.HMRC_CLIENT_ID;
    const clientSecret = process.env.HMRC_CLIENT_SECRET;

    const response = await fetch(`${this.getBaseURL()}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HMRC token refresh failed: ${error.error_description}`);
    }

    const tokenData = await response.json();
    
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      scope: tokenData.scope.split(' ')
    };
  }

  /**
   * Submit VAT return to HMRC
   */
  async submitVATReturn(
    vatNumber: string,
    returnData: VATReturnData,
    accessToken: string
  ): Promise<VATSubmissionResponse> {
    const response = await this.makeAuthenticatedRequest(
      `/organisations/vat/${vatNumber}/returns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(returnData)
      },
      accessToken
    );

    return response as VATSubmissionResponse;
  }

  /**
   * Get VAT obligations (due dates and periods)
   */
  async getVATObligations(
    vatNumber: string,
    accessToken: string,
    from?: string,
    to?: string
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await this.makeAuthenticatedRequest(
      `/organisations/vat/${vatNumber}/obligations?${params.toString()}`,
      { method: 'GET' },
      accessToken
    );

    return response.obligations || [];
  }

  /**
   * Get VAT return by period
   */
  async getVATReturn(
    vatNumber: string,
    periodKey: string,
    accessToken: string
  ): Promise<VATReturnData> {
    const response = await this.makeAuthenticatedRequest(
      `/organisations/vat/${vatNumber}/returns/${periodKey}`,
      { method: 'GET' },
      accessToken
    );

    return response as VATReturnData;
  }

  /**
   * Submit Corporation Tax return
   */
  async submitCorporationTaxReturn(
    utr: string,
    taxData: CorporationTaxData,
    accessToken: string
  ): Promise<any> {
    const response = await this.makeAuthenticatedRequest(
      `/organisations/self-assessment/${utr}/corporation-tax`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taxData)
      },
      accessToken
    );

    return response;
  }

  /**
   * Validate VAT number with HMRC
   */
  async validateVATNumber(vatNumber: string): Promise<{
    isValid: boolean;
    name?: string;
    address?: string;
  }> {
    try {
      const response = await fetch(
        `https://api.service.hmrc.gov.uk/organisations/vat/check-vat-number/lookup/${vatNumber}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.hmrc.1.0+json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          isValid: true,
          name: data.target?.name,
          address: data.target?.address
        };
      } else {
        return { isValid: false };
      }
    } catch (error) {
      console.error('VAT number validation error:', error);
      return { isValid: false };
    }
  }

  /**
   * Get Corporation Tax obligations
   */
  async getCorporationTaxObligations(
    utr: string,
    accessToken: string
  ): Promise<any[]> {
    const response = await this.makeAuthenticatedRequest(
      `/organisations/self-assessment/${utr}/obligations`,
      { method: 'GET' },
      accessToken
    );

    return response.obligations || [];
  }

  /**
   * Get tax year information
   */
  async getTaxYearInfo(taxYear: string, accessToken: string): Promise<any> {
    const response = await this.makeAuthenticatedRequest(
      `/tax-years/${taxYear}`,
      { method: 'GET' },
      accessToken
    );

    return response;
  }

  /**
   * Make authenticated request to HMRC API
   */
  private async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit,
    accessToken: string
  ): Promise<any> {
    const url = `${this.getBaseURL()}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.hmrc.1.0+json',
        'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
        'Gov-Client-Device-ID': 'SpeedyVan-TaxSystem',
        'Gov-Client-User-IDs': 'os=web',
        'Gov-Client-Timezone': 'UTC+00:00',
        'Gov-Client-Local-IPs': '127.0.0.1',
        'Gov-Client-MAC-Addresses': 'unknown'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HMRC API request failed: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Generate secure state parameter for OAuth2
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get base URL based on environment
   */
  private getBaseURL(): string {
    return this.isProduction ? this.baseURL : this.sandboxURL;
  }

  /**
   * Validate environment variables
   */
  private validateEnvironment(): void {
    const requiredVars = ['HMRC_CLIENT_ID', 'HMRC_CLIENT_SECRET', 'HMRC_REDIRECT_URI'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`Missing HMRC environment variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Check if tokens are expired
   */
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() >= expiresAt;
  }

  /**
   * Get token expiry time remaining in minutes
   */
  getTokenExpiryMinutes(expiresAt: Date): number {
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  }

  /**
   * Format VAT return data for HMRC submission
   */
  formatVATReturnData(returnData: any): VATReturnData {
    return {
      periodKey: returnData.periodKey,
      vatDueSales: returnData.vatDueSales || 0,
      vatDueAcquisitions: returnData.vatDueAcquisitions || 0,
      totalVatDue: returnData.totalVatDue || 0,
      vatReclaimedCurrPeriod: returnData.vatReclaimedCurrPeriod || 0,
      netVatDue: returnData.netVatDue || 0,
      totalValueSalesExVAT: returnData.totalValueSalesExVAT || 0,
      totalValuePurchasesExVAT: returnData.totalValuePurchasesExVAT || 0,
      totalValueGoodsSuppliedExVAT: returnData.totalValueGoodsSuppliedExVAT || 0,
      totalAcquisitionsExVAT: returnData.totalAcquisitionsExVAT || 0,
      finalised: true
    };
  }

  /**
   * Get Making Tax Digital compliance status
   */
  async getMTDStatus(vatNumber: string, accessToken: string): Promise<{
    isMTDEnrolled: boolean;
    mtdEnrollmentDate?: string;
    obligations: any[];
  }> {
    try {
      const obligations = await this.getVATObligations(vatNumber, accessToken);
      
      return {
        isMTDEnrolled: obligations.length > 0,
        obligations
      };
    } catch (error) {
      console.error('MTD status check failed:', error);
      return {
        isMTDEnrolled: false,
        obligations: []
      };
    }
  }
}

// Export singleton instance
export const hmrcApiService = new HMRCAPIService();

// Types are already exported inline above
