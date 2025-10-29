import { jsPDF } from 'jspdf';

interface ContractData {
  applicantName: string;
  applicantEmail: string;
  position: string;
  startDate: Date;
}

export async function generateEmploymentContract(data: ContractData): Promise<Buffer> {
  const doc = new jsPDF();
  const { applicantName, position, startDate } = data;

  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Speedy Van Limited';
  const companyAddress = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || 'Office 2.18, 1 Barrack street, Hamilton ML3 0DG';
  const companyPhone = process.env.NEXT_PUBLIC_COMPANY_PHONE || '+44 1202129746';
  const companyEmail = process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'support@speedy-van.co.uk';

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYMENT CONTRACT', 105, 20, { align: 'center' });

  // Company Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companyName, 20, 40);
  doc.text(companyAddress, 20, 45);
  doc.text(`Phone: ${companyPhone}`, 20, 50);
  doc.text(`Email: ${companyEmail}`, 20, 55);

  // Date
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 20, 65);

  // Employee Details
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYEE DETAILS', 20, 75);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${applicantName}`, 20, 82);
  doc.text(`Position: ${position}`, 20, 87);
  doc.text(`Start Date: ${startDate.toLocaleDateString('en-GB')}`, 20, 92);

  // Contract Terms
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS AND CONDITIONS', 20, 105);
  doc.setFont('helvetica', 'normal');

  let yPosition = 112;
  const lineHeight = 5;
  const maxWidth = 170;

  const sections = [
    {
      title: '1. Position and Duties',
      content: `You are employed as a ${position}. You will report to the Operations Manager and perform duties as assigned by the company. You may be required to perform other reasonable duties as directed by management.`,
    },
    {
      title: '2. Place of Work',
      content: `Your principal place of work will be at ${companyAddress}, though you may be required to work at other locations as necessary for business needs.`,
    },
    {
      title: '3. Hours of Work',
      content: `Your normal working hours will be 40 hours per week, Monday to Friday, 9:00 AM to 5:00 PM, with a one-hour unpaid lunch break. You may be required to work additional hours as necessary.`,
    },
    {
      title: '4. Salary',
      content: `Your starting salary will be discussed and confirmed during your onboarding. Salary is paid monthly via bank transfer on the last working day of each month.`,
    },
    {
      title: '5. Holidays',
      content: `You are entitled to 28 days of paid annual leave per year (including public holidays), pro-rated for part-time employees. Holiday requests must be submitted in advance and approved by your manager.`,
    },
    {
      title: '6. Probation Period',
      content: `You will be subject to a probationary period of 3 months from your start date. During this time, either party may terminate employment with one week's notice.`,
    },
    {
      title: '7. Notice Period',
      content: `After successful completion of the probationary period, either party must give a minimum of 4 weeks' written notice to terminate employment.`,
    },
    {
      title: '8. Confidentiality',
      content: `You must not disclose any confidential information obtained during your employment to any third party without prior written consent from the company.`,
    },
    {
      title: '9. Data Protection',
      content: `The company will process your personal data in accordance with the UK General Data Protection Regulation (GDPR) and Data Protection Act 2018.`,
    },
  ];

  sections.forEach((section) => {
    // Check if we need a new page
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 20;
    }

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 20, yPosition);
    yPosition += lineHeight;

    // Section content
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(section.content, maxWidth);
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += lineHeight;
    });

    yPosition += lineHeight; // Extra space between sections
  });

  // Signature section
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }

  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES', 20, yPosition);
  yPosition += 10;

  doc.setFont('helvetica', 'normal');
  doc.text('Employee:', 20, yPosition);
  doc.text('_____________________________', 20, yPosition + 10);
  doc.text(`${applicantName}`, 20, yPosition + 17);
  doc.text('Date: _____________________', 20, yPosition + 22);

  doc.text('Employer:', 120, yPosition);
  doc.text('_____________________________', 120, yPosition + 10);
  doc.text('Speedy Van Limited', 120, yPosition + 17);
  doc.text('Date: _____________________', 120, yPosition + 22);

  // Generate PDF as buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

