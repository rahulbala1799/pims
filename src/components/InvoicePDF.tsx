'use client';

import { useState } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define the styles for the PDF
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 60,
    marginBottom: 10,
  },
  companyInfo: {
    fontSize: 10,
    fontWeight: 'light',
    textAlign: 'right',
    width: '40%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1px solid #000',
    paddingBottom: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  clientInfo: {
    width: '50%',
    fontSize: 10,
  },
  invoiceInfo: {
    width: '40%',
    fontSize: 10,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
  },
  table: {
    display: 'flex' as any,
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#bfbfbf',
    minHeight: 25,
    alignItems: 'center',
  },
  tableHeaderRow: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
  tableCol: {
    borderRightWidth: 1,
    borderColor: '#bfbfbf',
    paddingHorizontal: 5,
    paddingVertical: 3,
    textAlign: 'left',
    fontSize: 9,
  },
  tableCell: {
    fontSize: 9,
    textAlign: 'left',
  },
  colDescription: { width: '40%' },
  colQuantity: { width: '10%', textAlign: 'center' },
  colDimensions: { width: '20%', textAlign: 'center' },
  colUnitPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  totals: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 10,
  },
  totalsTable: {
    width: '40%',
  },
  totalsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#bfbfbf',
    paddingVertical: 3,
  },
  totalsLabel: {
    width: '60%',
    fontSize: 10,
    textAlign: 'right',
    paddingRight: 10,
  },
  totalsValue: {
    width: '40%',
    fontSize: 10,
    textAlign: 'right',
  },
  grandTotal: {
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderColor: '#bfbfbf',
    paddingTop: 10,
    fontSize: 8,
    color: '#555555',
    textAlign: 'center',
  },
  notes: {
    marginTop: 20,
    fontSize: 9,
    borderTopWidth: 1,
    borderColor: '#bfbfbf',
    paddingTop: 5,
  },
});

// PDF Document component
const InvoicePDFDocument = ({ invoice, customer }: { invoice: any, customer: any }) => {
  // Format date strings
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  // Ensure we have items to map over (handle both items and invoiceItems properties)
  const invoiceItems = invoice.items || invoice.invoiceItems || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with logo and company info */}
        <View style={styles.header}>
          <View>
            {/* Use an absolute path for the logo, which works better with react-pdf */}
            <Image 
              style={styles.logo} 
              src={typeof window !== 'undefined' ? window.location.origin + '/images/logo.png' : '/images/logo.png'} 
            />
            <Text style={styles.title}>PrintNPack Ltd</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text>PrintNPack Ltd</Text>
            <Text>Unit 14 Ashbourne Business Centre</Text>
            <Text>Ashbourne A84KV57</Text>
            <Text>Tel: 020 7123 4567</Text>
            <Text>Email: info@printnpack.com</Text>
            <Text>VAT Reg: GB123456789</Text>
          </View>
        </View>

        {/* Invoice title */}
        <View>
          <Text style={styles.title}>INVOICE</Text>
        </View>

        {/* Customer and Invoice Info */}
        <View style={styles.infoContainer}>
          <View style={styles.clientInfo}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={styles.text}>{customer.name}</Text>
            <Text style={styles.text}>{customer.email}</Text>
            {customer.phone && <Text style={styles.text}>{customer.phone}</Text>}
            {customer.address && <Text style={styles.text}>{customer.address}</Text>}
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.text}>Invoice #: {invoice.invoiceNumber}</Text>
            <Text style={styles.text}>Invoice Date: {formatDate(invoice.issueDate)}</Text>
            <Text style={styles.text}>Due Date: {formatDate(invoice.dueDate)}</Text>
            <Text style={styles.text}>Status: {invoice.status}</Text>
          </View>
        </View>

        {/* Invoice Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <View style={[styles.tableCol, styles.colDescription]}>
              <Text style={styles.tableCell}>Description</Text>
            </View>
            <View style={[styles.tableCol, styles.colQuantity]}>
              <Text style={styles.tableCell}>Qty</Text>
            </View>
            <View style={[styles.tableCol, styles.colDimensions]}>
              <Text style={styles.tableCell}>Dimensions</Text>
            </View>
            <View style={[styles.tableCol, styles.colUnitPrice]}>
              <Text style={styles.tableCell}>Unit Price</Text>
            </View>
            <View style={[styles.tableCol, styles.colTotal]}>
              <Text style={styles.tableCell}>Total</Text>
            </View>
          </View>

          {/* Table Rows */}
          {invoiceItems.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCol, styles.colDescription]}>
                <Text style={styles.tableCell}>{item.description}</Text>
              </View>
              <View style={[styles.tableCol, styles.colQuantity]}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCol, styles.colDimensions]}>
                <Text style={styles.tableCell}>
                  {item.length && item.width
                    ? `${item.length.toFixed(2)}m × ${item.width.toFixed(2)}m = ${item.area?.toFixed(2)}m²`
                    : '-'}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.colUnitPrice]}>
                <Text style={styles.tableCell}>{formatCurrency(item.unitPrice)}</Text>
              </View>
              <View style={[styles.tableCol, styles.colTotal]}>
                <Text style={styles.tableCell}>{formatCurrency(item.totalPrice)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal:</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.subtotalAmount)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax ({(invoice.taxRate * 100).toFixed(0)}%):</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.taxAmount)}
              </Text>
            </View>
            <View style={[styles.totalsRow, styles.grandTotal]}>
              <Text style={styles.totalsLabel}>Total:</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes:</Text>
            <Text style={styles.text}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business! Payment is due within 30 days of issue.</Text>
          <Text>Please make all cheques payable to PrintNPack Ltd or pay by bank transfer using the invoice number as reference.</Text>
          <Text>Bank: National Bank | Sort Code: 01-02-03 | Account Number: 12345678</Text>
        </View>
      </Page>
    </Document>
  );
};

interface InvoicePDFProps {
  invoice: any;
  customer: any;
  fileName?: string;
}

// Main component with download button
export const InvoicePDFDownloadButton = ({ invoice, customer, fileName = 'invoice.pdf' }: InvoicePDFProps) => {
  return (
    <PDFDownloadLink
      document={<InvoicePDFDocument invoice={invoice} customer={customer} />}
      fileName={fileName}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
    >
      {({ blob, url, loading, error }) =>
        loading ? 'Preparing PDF...' : 'Download PDF'
      }
    </PDFDownloadLink>
  );
};

// Function to directly generate and download PDF using jsPDF
export const generateInvoicePDF = (invoice: any, customer: any, fileName = 'invoice.pdf') => {
  try {
    console.log('Generating PDF with invoice data:', invoice);
    
    // Create new document with autotable plugin
    const doc = new jsPDF();
    // Add autotable functionality to jsPDF instance
    autoTable(doc, {}); // Initialize the plugin
    
    // Add logo (if available)
    try {
      // Try to add logo from public/images directory with correct path
      // In browser environment, we need to use the absolute URL path
      const logoUrl = window.location.origin + '/images/logo.png';
      doc.addImage(logoUrl, 'PNG', 14, 10, 70, 28);
      
      // If logo is successfully added, adjust the company name position
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('PrintNPack Ltd', 14, 45);
    } catch (logoError) {
      console.warn('Could not add logo to PDF, using text header only:', logoError);
      
      // If logo fails, place company name at original position
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('PrintNPack Ltd', 14, 22);
    }
    
    // Add company info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text([
      'PrintNPack Ltd',
      'Unit 14 Ashbourne Business Centre',
      'Ashbourne A84KV57',
      'Tel: 020 7123 4567',
      'Email: info@printnpack.com',
      'VAT Reg: GB123456789'
    ], 195, 22, { align: 'right' });
    
    // Add invoice title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 14, 60);
    doc.setLineWidth(0.5);
    doc.line(14, 63, 195, 63);
    
    // Add customer info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 75);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const customerInfo = [
      customer?.name || 'Customer',
      customer?.email || '',
      customer?.phone || '',
      customer?.address || ''
    ].filter(line => line.trim() !== '');
    
    doc.text(customerInfo, 14, 80);
    
    // Format date safely
    const formatDate = (dateString: string) => {
      try {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      } catch (e) {
        console.error('Error formatting date:', e);
        return 'Invalid Date';
      }
    };
    
    // Add invoice info with fallbacks
    doc.setFontSize(10);
    doc.text([
      `Invoice #: ${invoice.invoiceNumber || 'N/A'}`,
      `Invoice Date: ${formatDate(invoice.issueDate)}`,
      `Due Date: ${formatDate(invoice.dueDate)}`,
      `Status: ${invoice.status || 'N/A'}`
    ], 195, 75, { align: 'right' });
    
    // Ensure we have items to map over (handle different data structures)
    const invoiceItems = invoice.items || invoice.invoiceItems || [];
    console.log('Invoice items for PDF:', invoiceItems);
    
    // Safe formatter functions
    const safeToFixed = (num: any, decimals = 2) => {
      if (num === undefined || num === null) return '0.00';
      const parsedNum = parseFloat(num);
      return isNaN(parsedNum) ? '0.00' : parsedNum.toFixed(decimals);
    };
    
    // Prepare table data with error handling
    const tableData = invoiceItems.map((item: any) => {
      try {
        return [
          item.description || 'No description',
          item.quantity || 0,
          item.length && item.width
            ? `${safeToFixed(item.length)}m × ${safeToFixed(item.width)}m = ${safeToFixed(item.area)}m²`
            : '-',
          `£${safeToFixed(item.unitPrice)}`,
          `£${safeToFixed(item.totalPrice)}`
        ];
      } catch (e) {
        console.error('Error processing invoice item:', e, item);
        return ['Error processing item', '', '', '', ''];
      }
    });
    
    // Add invoice items table - use the proper autoTable syntax
    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Qty', 'Dimensions', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: function(data: any) {
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(100);
        const pageHeight = doc.internal.pageSize.height;
        doc.text('Thank you for your business! Payment is due within 30 days of issue.', 105, pageHeight - 20, { align: 'center' });
        doc.text('Please make all cheques payable to PrintNPack Ltd or pay by bank transfer using the invoice number as reference.', 105, pageHeight - 15, { align: 'center' });
        doc.text('Bank: National Bank | Sort Code: 01-02-03 | Account Number: 12345678', 105, pageHeight - 10, { align: 'center' });
      }
    });
    
    // Get the final position using proper docs
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Handle different invoice data structures for amounts
    const subtotal = invoice.subtotalAmount || invoice.subtotal || 0;
    const taxRate = invoice.taxRate || 0;
    const taxAmount = invoice.taxAmount || 0;
    const totalAmount = invoice.totalAmount || invoice.total || 0;
    
    // Add totals
    doc.setFontSize(10);
    doc.text('Subtotal:', 150, finalY);
    doc.text(`£${safeToFixed(subtotal)}`, 195, finalY, { align: 'right' });
    
    doc.text(`Tax (${(taxRate * 100).toFixed(0)}%):`, 150, finalY + 6);
    doc.text(`£${safeToFixed(taxAmount)}`, 195, finalY + 6, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 150, finalY + 14);
    doc.text(`£${safeToFixed(totalAmount)}`, 195, finalY + 14, { align: 'right' });
    
    // Add line
    doc.setLineWidth(0.5);
    doc.line(150, finalY + 8, 195, finalY + 8);
    
    // Add notes if any
    if (invoice.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 14, finalY + 25);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      const splitNotes = doc.splitTextToSize(invoice.notes.toString(), 180);
      doc.text(splitNotes, 14, finalY + 30);
    }
    
    // Save the PDF
    doc.save(fileName);
    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please check the console for details.');
  }
};

export default InvoicePDFDocument; 