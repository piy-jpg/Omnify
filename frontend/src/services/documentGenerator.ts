import jsPDF from 'jspdf';

export interface ResumeData {
  fullName: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: { title: string; company: string; period: string; points: string[] }[];
  education: { degree: string; school: string; year: string }[];
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  senderName: string;
  senderEmail: string;
  items: { description: string; quantity: number; rate: number }[];
  taxRate: number;
  notes: string;
}

export interface ReportData {
  title: string;
  author: string;
  date: string;
  executiveSummary: string;
  sections: { title: string; content: string }[];
  metrics: { label: string; value: string; change: string }[];
}

export class DocumentGenerator {
  /**
   * Generate Professional PDF Resume
   */
  static generateResumePDF(data: ResumeData): { blob: Blob; downloadName: string } {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header background banner
    doc.setFillColor(79, 70, 229); // brand indigo
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Name & Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(data.fullName, 15, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(229, 231, 235);
    doc.text(data.role, 15, 26);

    // Contact info line
    doc.setFontSize(9);
    doc.setTextColor(209, 213, 219);
    doc.text(`${data.email}  |  ${data.phone}  |  ${data.location}`, 15, 34);

    let y = 52;

    // Summary Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('PROFESSIONAL SUMMARY', 15, y);
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const splitSummary = doc.splitTextToSize(data.summary, pageWidth - 30);
    doc.text(splitSummary, 15, y);
    y += splitSummary.length * 5 + 6;

    // Experience Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('WORK EXPERIENCE', 15, y);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;

    data.experience.forEach(exp => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${exp.title} — ${exp.company}`, 15, y);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(exp.period, pageWidth - 15, y, { align: 'right' });
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      exp.points.forEach(pt => {
        const lines = doc.splitTextToSize(`• ${pt}`, pageWidth - 35);
        doc.text(lines, 18, y);
        y += lines.length * 4.5;
      });
      y += 3;
    });

    // Skills Section
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('CORE COMPETENCIES & TECH STACK', 15, y);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const skillsText = data.skills.join('  •  ');
    const splitSkills = doc.splitTextToSize(skillsText, pageWidth - 30);
    doc.text(splitSkills, 15, y);
    y += splitSkills.length * 5 + 6;

    // Education Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('EDUCATION', 15, y);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;

    data.education.forEach(edu => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${edu.degree} — ${edu.school}`, 15, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(edu.year, pageWidth - 15, y, { align: 'right' });
      y += 6;
    });

    const blob = doc.output('blob');
    return {
      blob,
      downloadName: `${data.fullName.replace(/\s+/g, '_')}_Resume.pdf`
    };
  }

  /**
   * Generate Modern Professional Invoice PDF
   */
  static generateInvoicePDF(data: InvoiceData): { blob: Blob; downloadName: string } {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Accent Bar
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageWidth, 6, 'F');

    // Title & Invoice Num
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59);
    doc.text('INVOICE', 15, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Invoice #${data.invoiceNumber}`, 15, 32);
    doc.text(`Date: ${data.date}   |   Due: ${data.dueDate}`, 15, 38);

    // Sender Info (Right aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(data.senderName, pageWidth - 15, 25, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(data.senderEmail, pageWidth - 15, 31, { align: 'right' });
    doc.text('ConvertPro Verified Billing', pageWidth - 15, 36, { align: 'right' });

    // Client Info Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 46, pageWidth - 30, 24, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(99, 102, 241);
    doc.text('BILLED TO:', 20, 53);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(data.clientName, 20, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${data.clientEmail} • ${data.clientAddress}`, 20, 66);

    // Items Table Header
    let y = 80;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, pageWidth - 30, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('DESCRIPTION', 20, y + 5.5);
    doc.text('QTY', 120, y + 5.5, { align: 'center' });
    doc.text('RATE ($)', 150, y + 5.5, { align: 'right' });
    doc.text('AMOUNT ($)', pageWidth - 20, y + 5.5, { align: 'right' });

    y += 12;

    let subtotal = 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    data.items.forEach(item => {
      const lineTotal = item.quantity * item.rate;
      subtotal += lineTotal;

      doc.text(item.description, 20, y);
      doc.text(item.quantity.toString(), 120, y, { align: 'center' });
      doc.text(item.rate.toFixed(2), 150, y, { align: 'right' });
      doc.text(lineTotal.toFixed(2), pageWidth - 20, y, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 3, pageWidth - 15, y + 3);
      y += 8;
    });

    const taxAmount = (subtotal * data.taxRate) / 100;
    const total = subtotal + taxAmount;

    // Totals Box
    y += 6;
    const totalsX = 130;
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, y);
    doc.text(`$${subtotal.toFixed(2)}`, pageWidth - 20, y, { align: 'right' });
    y += 6;

    doc.text(`Tax (${data.taxRate}%):`, totalsX, y);
    doc.text(`$${taxAmount.toFixed(2)}`, pageWidth - 20, y, { align: 'right' });
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(79, 70, 229);
    doc.text('Total Due:', totalsX, y);
    doc.text(`$${total.toFixed(2)}`, pageWidth - 20, y, { align: 'right' });

    // Payment notes
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Notes & Payment Instructions:', 15, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(data.notes || 'Payment due within 14 days. Thank you for your business!', 15, y + 6);

    const blob = doc.output('blob');
    return {
      blob,
      downloadName: `Invoice_${data.invoiceNumber}.pdf`
    };
  }
}
