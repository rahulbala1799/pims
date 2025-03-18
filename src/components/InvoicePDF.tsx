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
  section: {
    margin: 10,
    padding: 10,
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  customerInfo: {
    width: '50%',
  },
  invoiceDetails: {
    width: '50%',
    textAlign: 'right',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderCell: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
  },
  tableCell: {
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#bfbfbf',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
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
        {/* Header with company info */}
        <View style={styles.header}>
          <View>
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
        
        {/* Invoice Title */}
        <View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>INVOICE</Text>
        </View>
        
        {/* Customer & Invoice Info */}
        <View style={styles.invoiceInfo}>
          <View style={styles.customerInfo}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Bill To:</Text>
            <Text>{customer?.name || 'N/A'}</Text>
            <Text>{customer?.company || ''}</Text>
            <Text>{customer?.address?.line1 || ''}</Text>
            <Text>{customer?.address?.line2 || ''}</Text>
            <Text>{customer?.address?.city || ''}{customer?.address?.city ? ', ' : ''}{customer?.address?.postcode || ''}</Text>
            <Text>{customer?.phone || ''}</Text>
            <Text>{customer?.email || ''}</Text>
          </View>
          <View style={styles.invoiceDetails}>
            <Text>Invoice #: {invoice.invoiceNumber || 'N/A'}</Text>
            <Text>Invoice Date: {formatDate(invoice.createdAt || new Date())}</Text>
            <Text>Due Date: {formatDate(invoice.dueDate || new Date())}</Text>
            <Text>Status: {invoice.status || 'N/A'}</Text>
          </View>
        </View>
        
        {/* Items Table */}
        <View style={{ marginTop: 20 }}>
          <View style={[styles.tableRow, { backgroundColor: '#f2f2f2' }]}>
            <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Dimensions</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Total</Text>
          </View>
          
          {invoiceItems.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>{item.description || 'N/A'}</Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>{item.quantity || '0'}</Text>
              <Text style={[styles.tableCell, { width: '20%', textAlign: 'center' }]}>{item.dimensions || 'N/A'}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(Number(item.unitPrice) || 0)}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(Number(item.totalPrice) || 0)}</Text>
            </View>
          ))}
        </View>
        
        {/* Totals */}
        <View style={{ marginTop: 20, marginLeft: 'auto', width: '40%' }}>
          <View style={styles.tableRow}>
            <Text style={{ width: '60%', textAlign: 'right', padding: 5 }}>Subtotal:</Text>
            <Text style={{ width: '40%', textAlign: 'right', padding: 5 }}>{formatCurrency(Number(invoice.subtotalAmount || invoice.subtotal) || 0)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ width: '60%', textAlign: 'right', padding: 5 }}>VAT (20%):</Text>
            <Text style={{ width: '40%', textAlign: 'right', padding: 5 }}>{formatCurrency(Number(invoice.vatAmount || invoice.vat) || 0)}</Text>
          </View>
          <View style={[styles.tableRow, { fontWeight: 'bold' }]}>
            <Text style={{ width: '60%', textAlign: 'right', padding: 5 }}>Total:</Text>
            <Text style={{ width: '40%', textAlign: 'right', padding: 5 }}>{formatCurrency(Number(invoice.totalAmount || invoice.total) || 0)}</Text>
          </View>
        </View>
        
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

// InvoicePDF component with download link
export default function InvoicePDF({ invoice, customer }: { invoice: any, customer: any }) {
  const [isClient, setIsClient] = useState(false);
  
  // Use useEffect to ensure we're on the client side before rendering PDFDownloadLink
  useState(() => {
    setIsClient(true);
  });
  
  if (!isClient) {
    return <div>Loading PDF...</div>;
  }
  
  return (
    <div className="mt-4">
      <PDFDownloadLink 
        document={<InvoicePDFDocument invoice={invoice} customer={customer} />} 
        fileName={`invoice-${invoice.invoiceNumber || 'download'}.pdf`}
        className="py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 inline-block"
      >
        {({ blob, url, loading, error }) =>
          loading ? 'Generating PDF...' : 'Download PDF'
        }
      </PDFDownloadLink>
    </div>
  );
}

// Function to directly generate and download PDF using jsPDF
export const generateInvoicePDF = (invoice: any, customer: any, fileName = 'invoice.pdf') => {
  try {
    console.log('Generating PDF with invoice data:', invoice);
    
    // Create new document with autotable plugin
    const doc = new jsPDF();
    // Add autotable functionality to jsPDF instance
    autoTable(doc, {}); // Initialize the plugin
    
    // Add company info
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PrintNPack Ltd', 14, 22);
    
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
    doc.text('INVOICE', 14, 45);
    doc.setLineWidth(0.5);
    doc.line(14, 48, 195, 48);
    
    // Add customer info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Format customer info safely
    const customerInfo = [
      customer?.name || 'N/A',
      customer?.company || '',
      customer?.address?.line1 || '',
      customer?.address?.line2 || '',
      `${customer?.address?.city || ''}${customer?.address?.city ? ', ' : ''}${customer?.address?.postcode || ''}`,
      customer?.phone || '',
      customer?.email || ''
    ].filter(line => line.trim() !== '');
    
    doc.text(customerInfo, 14, 65);
    
    // Format date safely
    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };
    
    // Add invoice details
    doc.text([
      `Invoice #: ${invoice.invoiceNumber || 'N/A'}`,
      `Invoice Date: ${formatDate(invoice.createdAt)}`,
      `Due Date: ${formatDate(invoice.dueDate)}`,
      `Status: ${invoice.status || 'N/A'}`
    ], 195, 60, { align: 'right' });
    
    // Ensure we have items to map over (handle different data structures)
    const invoiceItems = invoice.items || invoice.invoiceItems || [];
    console.log('Invoice items for PDF:', invoiceItems);
    
    // Prepare table data
    const tableData = invoiceItems.map((item: any) => [
      item.description || 'N/A',
      item.quantity || '0',
      item.dimensions || 'N/A',
      `£${Number(item.unitPrice || 0).toFixed(2)}`,
      `£${Number(item.totalPrice || 0).toFixed(2)}`
    ]);
    
    // Add invoice items table - use the proper autoTable syntax
    autoTable(doc, {
      startY: 85,
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
    
    // Add total section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Subtotal:', 150, finalY);
    doc.text(`£${Number(invoice.subtotalAmount || invoice.subtotal || 0).toFixed(2)}`, 195, finalY, { align: 'right' });
    
    doc.text('VAT (20%):', 150, finalY + 5);
    doc.text(`£${Number(invoice.vatAmount || invoice.vat || 0).toFixed(2)}`, 195, finalY + 5, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 150, finalY + 10);
    doc.text(`£${Number(invoice.totalAmount || invoice.total || 0).toFixed(2)}`, 195, finalY + 10, { align: 'right' });
    
    // Save PDF
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please check the console for details.');
  }
}; 