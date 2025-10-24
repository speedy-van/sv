/**
 * TAX SETTINGS API ENDPOINT
 * 
 * Manages tax settings and configuration including:
 * - Company tax information
 * - VAT registration details
 * - HMRC integration settings
 * - Notification preferences
 * - Tax thresholds and rates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { taxCalculator } from '@/lib/tax/calculator';
import { hmrcApiService } from '@/lib/tax/hmrc-api';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company tax settings
    const taxSettings = await prisma.companyTaxSettings.findFirst({
      where: { isActive: true }
    });

    if (!taxSettings) {
      // Return default settings if none exist
      const defaultSettings = {
        id: null,
        companyName: 'Speedy Van',
        companyNumber: null,
        vatRegistrationNumber: null,
        corporationTaxUTR: null,
        isVATRegistered: false,
        vatRegistrationDate: null,
        vatAccountingScheme: 'standard',
        vatReturnFrequency: 'quarterly',
        accountingPeriodStart: null,
        accountingPeriodEnd: null,
        corporationTaxRate: 0.19,
        vatRegistrationThreshold: 85000,
        corporationTaxThreshold: 50000,
        emailNotifications: true,
        notificationEmail: 'admin@speedy-van.co.uk',
        deadlineReminderDays: 14,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: null
      };

      return NextResponse.json({
        success: true,
        data: defaultSettings
      });
    }

    // Get current VAT rates
    const vatRates = taxCalculator.getCurrentVATRates();

    // Get compliance status
    const isVATRegistrationRequired = taxCalculator.isVATRegistrationRequired(
      Number(taxSettings.vatRegistrationThreshold)
    );

    // Prepare settings data
    const settingsData = {
      ...taxSettings,
      vatRates,
      compliance: {
        isVATRegistrationRequired,
        isVATRegistered: taxSettings.isVATRegistered,
        registrationThreshold: Number(taxSettings.vatRegistrationThreshold)
      }
    };

    return NextResponse.json({
      success: true,
      data: settingsData
    });

  } catch (error) {
    console.error('Tax settings GET API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tax settings'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = (session.user as any).id;
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'update_settings':
        return await updateTaxSettings(data, adminId);

      case 'validate_vat_number':
        return await validateVATNumber(data.vatNumber);

      case 'test_hmrc_connection':
        return await testHMRCConnection(data);

      case 'update_hmrc_credentials':
        return await updateHMRCCredentials(data, adminId);

      case 'generate_deadlines':
        return await generateTaxDeadlines(data, adminId);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Tax settings POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process tax settings request'
      },
      { status: 500 }
    );
  }
}

async function updateTaxSettings(data: any, adminId: string) {
  try {
    // Validate VAT number format if provided
    if (data.vatRegistrationNumber && !taxCalculator.validateVATNumber(data.vatRegistrationNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid VAT number format' },
        { status: 400 }
      );
    }

    // Deactivate existing settings
    await prisma.companyTaxSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Create new settings
    const newSettings = await prisma.companyTaxSettings.create({
      data: {
        companyName: data.companyName,
        companyNumber: data.companyNumber,
        vatRegistrationNumber: data.vatRegistrationNumber,
        corporationTaxUTR: data.corporationTaxUTR,
        isVATRegistered: data.isVATRegistered || false,
        vatRegistrationDate: data.vatRegistrationDate ? new Date(data.vatRegistrationDate) : null,
        vatAccountingScheme: data.vatAccountingScheme || 'standard',
        vatReturnFrequency: data.vatReturnFrequency || 'quarterly',
        accountingPeriodStart: data.accountingPeriodStart ? new Date(data.accountingPeriodStart) : null,
        accountingPeriodEnd: data.accountingPeriodEnd ? new Date(data.accountingPeriodEnd) : null,
        corporationTaxRate: data.corporationTaxRate || 0.19,
        vatRegistrationThreshold: data.vatRegistrationThreshold || 85000,
        corporationTaxThreshold: data.corporationTaxThreshold || 50000,
        emailNotifications: data.emailNotifications !== false,
        notificationEmail: data.notificationEmail,
        deadlineReminderDays: data.deadlineReminderDays || 14,
        isActive: true,
        createdBy: adminId
      }
    });

    return NextResponse.json({
      success: true,
      data: newSettings,
      message: 'Tax settings updated successfully'
    });

  } catch (error) {
    throw error;
  }
}

async function validateVATNumber(vatNumber: string) {
  try {
    // Validate format first
    const isValidFormat = taxCalculator.validateVATNumber(vatNumber);
    
    if (!isValidFormat) {
      return NextResponse.json({
        success: false,
        error: 'Invalid VAT number format'
      });
    }

    // Validate with HMRC if it's a UK VAT number
    if (vatNumber.startsWith('GB')) {
      try {
        const validationResult = await hmrcApiService.validateVATNumber(vatNumber);
        
        return NextResponse.json({
          success: true,
          data: {
            isValid: validationResult.isValid,
            name: validationResult.name,
            address: validationResult.address
          },
          message: validationResult.isValid ? 'VAT number is valid' : 'VAT number not found'
        });
      } catch (hmrcError) {
        // If HMRC validation fails, still return format validation result
        return NextResponse.json({
          success: true,
          data: {
            isValid: isValidFormat,
            name: null,
            address: null
          },
          message: 'VAT number format is valid (HMRC validation unavailable)'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isValid: isValidFormat,
        name: null,
        address: null
      },
      message: 'VAT number format is valid'
    });

  } catch (error) {
    throw error;
  }
}

async function testHMRCConnection(data: any) {
  try {
    const { clientId, clientSecret } = data;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: 'Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    // Test HMRC connection by attempting OAuth2 flow
    try {
      const { authUrl } = await hmrcApiService.initializeOAuth2();
      
      return NextResponse.json({
        success: true,
        data: {
          connectionTest: 'successful',
          authUrl
        },
        message: 'HMRC connection test successful'
      });
    } catch (hmrcError) {
      return NextResponse.json({
        success: false,
        error: 'HMRC connection test failed',
        details: hmrcError instanceof Error ? hmrcError.message : 'Unknown error'
      });
    }

  } catch (error) {
    throw error;
  }
}

async function updateHMRCCredentials(data: any, adminId: string) {
  try {
    const { clientId, clientSecret, accessToken, refreshToken, tokenExpiry } = data;

    // Update existing settings with HMRC credentials
    const updatedSettings = await prisma.companyTaxSettings.updateMany({
      where: { isActive: true },
      data: {
        hmrcClientId: clientId,
        hmrcClientSecret: clientSecret,
        hmrcAccessToken: accessToken,
        hmrcRefreshToken: refreshToken,
        hmrcTokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
        updatedBy: adminId
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'HMRC credentials updated successfully'
    });

  } catch (error) {
    throw error;
  }
}

async function generateTaxDeadlines(data: any, adminId: string) {
  try {
    const { taxYear } = data;

    // Generate deadlines for the specified tax year
    const deadlines = [];

    // VAT deadlines (quarterly)
    const quarters = [
      { quarter: 1, dueDate: new Date(taxYear, 3, 30) }, // Q1 ends March 31, due April 30
      { quarter: 2, dueDate: new Date(taxYear, 6, 31) }, // Q2 ends June 30, due July 31
      { quarter: 3, dueDate: new Date(taxYear, 9, 31) }, // Q3 ends September 30, due October 31
      { quarter: 4, dueDate: new Date(taxYear + 1, 0, 31) } // Q4 ends December 31, due January 31 next year
    ];

    for (const quarter of quarters) {
      const periodKey = `${taxYear}-Q${quarter.quarter}`;
      
      // VAT submission deadline
      const submissionDeadline = await prisma.taxDeadline.create({
        data: {
          deadlineType: 'vat_submission',
          title: `VAT Return Submission - Q${quarter.quarter} ${taxYear}`,
          description: `Submit VAT return for quarter ${quarter.quarter} ${taxYear}`,
          dueDate: quarter.dueDate,
          taxYear,
          taxPeriod: periodKey,
          status: 'upcoming',
          isCompleted: false,
          createdBy: adminId
        }
      });

      deadlines.push(submissionDeadline);

      // VAT payment deadline (same as submission for quarterly returns)
      const paymentDeadline = await prisma.taxDeadline.create({
        data: {
          deadlineType: 'vat_payment',
          title: `VAT Payment - Q${quarter.quarter} ${taxYear}`,
          description: `Pay VAT due for quarter ${quarter.quarter} ${taxYear}`,
          dueDate: quarter.dueDate,
          taxYear,
          taxPeriod: periodKey,
          status: 'upcoming',
          isCompleted: false,
          createdBy: adminId
        }
      });

      deadlines.push(paymentDeadline);
    }

    // Corporation Tax deadline (9 months after accounting period end)
    const accountingPeriodEnd = new Date(taxYear, 11, 31); // December 31
    const ctPaymentDeadline = new Date(taxYear + 1, 8, 30); // September 30 next year

    const ctDeadline = await prisma.taxDeadline.create({
      data: {
        deadlineType: 'corporation_tax_payment',
        title: `Corporation Tax Payment - ${taxYear}`,
        description: `Pay Corporation Tax for accounting period ending ${taxYear}`,
        dueDate: ctPaymentDeadline,
        taxYear,
        taxPeriod: taxYear.toString(),
        status: 'upcoming',
        isCompleted: false,
        createdBy: adminId
      }
    });

    deadlines.push(ctDeadline);

    return NextResponse.json({
      success: true,
      data: deadlines,
      message: `Generated ${deadlines.length} tax deadlines for ${taxYear}`
    });

  } catch (error) {
    throw error;
  }
}
