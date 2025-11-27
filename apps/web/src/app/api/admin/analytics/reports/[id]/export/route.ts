import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Try custom session first
  const customSession = await getCustomSession();
  let isAdmin = customSession?.user?.role === 'admin';
  let userId = customSession?.user?.id;
  
  if (!customSession?.user) {
    // Fallback to NextAuth
    const session = await getServerSession(authOptions);
    isAdmin = (session?.user as any)?.role === 'admin';
    userId = (session?.user as any)?.id;
    if (!session?.user || !isAdmin) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
  
  if (!isAdmin) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Mock report data for export
    const reportData = generateMockExportData();

    let content: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      content = generateCSV(reportData);
      contentType = 'text/csv';
      filename = `report-${(await params).id}.csv`;
    } else {
      content = generateExcel(reportData);
      contentType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `report-${(await params).id}.xlsx`;
    }

    await logAudit(userId || 'unknown', 'export_report', (await params).id, { targetType: 'analytics_report', before: null, after: { reportId: (await params).id, format, filename } });

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export report error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

function generateMockExportData() {
  const headers = [
    'Date',
    'Revenue',
    'Orders',
    'AOV',
    'Completion Rate',
    'Driver',
  ];
  const data = [];

  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    data.push([
      date.toISOString().split('T')[0],
      Math.floor(Math.random() * 10000) + 1000,
      Math.floor(Math.random() * 100) + 10,
      Math.floor(Math.random() * 200) + 50,
      Math.floor(Math.random() * 20) + 80,
      ['John Smith', 'Sarah Johnson', 'Mike Wilson'][
        Math.floor(Math.random() * 3)
      ],
    ]);
  }

  return { headers, data };
}

function generateCSV(reportData: { headers: string[]; data: any[][] }) {
  const { headers, data } = reportData;

  const csvContent = [
    headers.join(','),
    ...data.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

function generateExcel(reportData: { headers: string[]; data: any[][] }) {
  // Mock Excel content (in real implementation, use a library like xlsx)
  const { headers, data } = reportData;

  // For now, return a simple CSV-like format that Excel can open
  const excelContent = [
    headers.join('\t'),
    ...data.map(row => row.join('\t')),
  ].join('\n');

  return excelContent;
}
