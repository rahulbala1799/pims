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
  // Adding styles for the new table layout
  tableContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 10,
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
  },
  tableCol1: {
    width: '40%',
    padding: 5,
  },
  tableCol2: {
    width: '10%',
    padding: 5,
    textAlign: 'center',
  },
  tableCol3: {
    width: '20%',
    padding: 5,
    textAlign: 'center',
  },
  tableCol4: {
    width: '15%',
    padding: 5,
    textAlign: 'right',
  },
  tableCol5: {
    width: '15%',
    padding: 5,
    textAlign: 'right',
  },
  summary: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
  },
  summaryTotal: {
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderTopColor: '#bfbfbf',
    paddingTop: 5,
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

// Define proper interfaces for Invoice and Customer
interface ProductInfo {
  sku: string;
  name: string;
  productClass: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  length?: number;
  width?: number;
  area?: number;
  product?: ProductInfo;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  invoiceItems?: InvoiceItem[];
  items?: InvoiceItem[];
  subtotal?: number;
  subtotalAmount?: number;
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// PDF Document component
const InvoicePDFDocument = ({ invoice, customer }: { invoice: Invoice, customer: Customer }) => {
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  // Ensure we handle both 'items' and 'invoiceItems'
  const items = invoice.invoiceItems || invoice.items || [];
  
  // Ensure we handle both 'subtotal' and 'subtotalAmount'
  const subtotal = invoice.subtotal || invoice.subtotalAmount || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text>PrintNPack Ltd</Text>
            <Text>123 Print Avenue</Text>
            <Text>Dublin, D02 A123</Text>
            <Text>info@printnpack.ie</Text>
            <Text>+353 1 234 5678</Text>
          </View>
        </View>

        <View style={styles.invoiceInfo}>
          <View style={styles.customerInfo}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>Bill To:</Text>
            <Text>{customer.name}</Text>
            <Text>{customer.email}</Text>
            {customer.phone && <Text>{customer.phone}</Text>}
            {customer.address && <Text>{customer.address}</Text>}
          </View>
          
          <View style={styles.invoiceDetails}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>Invoice Details:</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text>Invoice Number:</Text>
              <Text>{invoice.invoiceNumber}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text>Issue Date:</Text>
              <Text>{formatDate(invoice.issueDate)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text>Due Date:</Text>
              <Text>{formatDate(invoice.dueDate)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text>Status:</Text>
              <Text>{invoice.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <View style={styles.tableCol1}><Text>Description</Text></View>
            <View style={styles.tableCol2}><Text>Qty</Text></View>
            <View style={styles.tableCol3}><Text>Dimensions</Text></View>
            <View style={styles.tableCol4}><Text>Unit Price</Text></View>
            <View style={styles.tableCol5}><Text>Total</Text></View>
          </View>
          
          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.tableCol1}>
                <Text>{item.description}</Text>
                <Text style={{ fontSize: 8 }}>SKU: {item.product?.sku || 'N/A'}</Text>
              </View>
              <View style={styles.tableCol2}><Text>{item.quantity}</Text></View>
              <View style={styles.tableCol3}>
                {item.length && item.width ? (
                  <Text>
                    {Number(item.length).toFixed(2)}m × {Number(item.width).toFixed(2)}m
                    {item.area && ` = ${Number(item.area).toFixed(2)}m²`}
                  </Text>
                ) : (
                  <Text>-</Text>
                )}
              </View>
              <View style={styles.tableCol4}><Text>{formatCurrency(item.unitPrice)}</Text></View>
              <View style={styles.tableCol5}><Text>{formatCurrency(item.totalPrice)}</Text></View>
            </View>
          ))}
        </View>
        
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>VAT ({(invoice.taxRate * 100).toFixed(0)}%):</Text>
            <Text>{formatCurrency(invoice.taxAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text>Total:</Text>
            <Text>{formatCurrency(invoice.totalAmount)}</Text>
          </View>
        </View>

        {/* ... rest of the component ... */}
      </Page>
    </Document>
  );
};

// InvoicePDF component with download link
export default function InvoicePDF({ invoice, customer }: { invoice: Invoice, customer: Customer }) {
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
export const generateInvoicePDF = (invoice: Invoice, customer: Customer, fileName = 'invoice.pdf') => {
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
      '123 Print Avenue',
      'Dublin, D02 A123',
      'info@printnpack.ie',
      '+353 1 234 5678'
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
      customer?.email || '',
      customer?.phone || '',
      customer?.address || ''
    ].filter(line => line.trim() !== '');
    
    doc.text(customerInfo, 14, 65);
    
    // Format date safely
    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };
    
    // Add invoice details
    doc.text([
      `Invoice #: ${invoice.invoiceNumber || 'N/A'}`,
      `Issue Date: ${formatDate(invoice.issueDate)}`,
      `Due Date: ${formatDate(invoice.dueDate)}`,
      `Status: ${invoice.status || 'N/A'}`
    ], 195, 60, { align: 'right' });
    
    // Ensure we have items to map over (handle different data structures)
    const items = invoice.invoiceItems || invoice.items || [];
    console.log('Invoice items for PDF:', items);
    
    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    };
    
    // Prepare table data
    const tableData = items.map((item: InvoiceItem) => [
      item.description || 'N/A',
      item.quantity.toString() || '0',
      item.length && item.width 
        ? `${Number(item.length).toFixed(2)}m × ${Number(item.width).toFixed(2)}m${item.area ? ` = ${Number(item.area).toFixed(2)}m²` : ''}`
        : '-',
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalPrice)
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
    
    // Ensure we handle both 'subtotal' and 'subtotalAmount'
    const subtotal = invoice.subtotal || invoice.subtotalAmount || 0;
    
    doc.text('Subtotal:', 150, finalY);
    doc.text(formatCurrency(subtotal), 195, finalY, { align: 'right' });
    
    doc.text(`VAT (${(invoice.taxRate * 100).toFixed(0)}%):`, 150, finalY + 5);
    doc.text(formatCurrency(invoice.taxAmount), 195, finalY + 5, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 150, finalY + 10);
    doc.text(formatCurrency(invoice.totalAmount), 195, finalY + 10, { align: 'right' });
    
    // Save and download the PDF
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}; 