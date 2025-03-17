'use client';

import { useState } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
    height: 50,
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with logo and company info */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PrintPack MIS</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text>PrintPack MIS Ltd</Text>
            <Text>123 Print Street</Text>
            <Text>London, W1 2BT</Text>
            <Text>Tel: 020 7123 4567</Text>
            <Text>Email: info@printpackmis.com</Text>
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
          {invoice.items.map((item: any, index: number) => (
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
          <Text>Please make all cheques payable to PrintPack MIS Ltd or pay by bank transfer using the invoice number as reference.</Text>
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
  const doc = new jsPDF();
  
  // Add company info
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PrintPack MIS', 14, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text([
    'PrintPack MIS Ltd',
    '123 Print Street',
    'London, W1 2BT',
    'Tel: 020 7123 4567',
    'Email: info@printpackmis.com',
    'VAT Reg: GB123456789'
  ], 195, 22, { align: 'right' });
  
  // Add invoice title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 14, 45);
  doc.setLineWidth(0.5);
  doc.line(14, 48, 195, 48);
  
  // Add customer info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const customerInfo = [
    customer.name,
    customer.email,
    customer.phone || '',
    customer.address || ''
  ].filter(line => line.trim() !== '');
  
  doc.text(customerInfo, 14, 65);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  
  // Add invoice info
  doc.setFontSize(10);
  doc.text([
    `Invoice #: ${invoice.invoiceNumber}`,
    `Invoice Date: ${formatDate(invoice.issueDate)}`,
    `Due Date: ${formatDate(invoice.dueDate)}`,
    `Status: ${invoice.status}`
  ], 195, 60, { align: 'right' });
  
  // Add invoice items table
  (doc as any).autoTable({
    startY: 85,
    head: [['Description', 'Qty', 'Dimensions', 'Unit Price', 'Total']],
    body: invoice.items.map((item: any) => [
      item.description,
      item.quantity,
      item.length && item.width
        ? `${item.length.toFixed(2)}m × ${item.width.toFixed(2)}m = ${item.area?.toFixed(2)}m²`
        : '-',
      `£${item.unitPrice.toFixed(2)}`,
      `£${item.totalPrice.toFixed(2)}`
    ]),
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
      doc.text('Please make all cheques payable to PrintPack MIS Ltd or pay by bank transfer using the invoice number as reference.', 105, pageHeight - 15, { align: 'center' });
      doc.text('Bank: National Bank | Sort Code: 01-02-03 | Account Number: 12345678', 105, pageHeight - 10, { align: 'center' });
    }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add totals
  doc.setFontSize(10);
  doc.text('Subtotal:', 150, finalY);
  doc.text(`£${invoice.subtotalAmount.toFixed(2)}`, 195, finalY, { align: 'right' });
  
  doc.text(`Tax (${(invoice.taxRate * 100).toFixed(0)}%):`, 150, finalY + 6);
  doc.text(`£${invoice.taxAmount.toFixed(2)}`, 195, finalY + 6, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 150, finalY + 14);
  doc.text(`£${invoice.totalAmount.toFixed(2)}`, 195, finalY + 14, { align: 'right' });
  
  // Add line
  doc.setLineWidth(0.5);
  doc.line(150, finalY + 8, 195, finalY + 8);
  
  // Add notes if any
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, finalY + 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const splitNotes = doc.splitTextToSize(invoice.notes, 180);
    doc.text(splitNotes, 14, finalY + 30);
  }
  
  // Save the PDF
  doc.save(fileName);
};

export default InvoicePDFDocument; 