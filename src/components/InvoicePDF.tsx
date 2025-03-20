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

// This function is called from invoice detail page and needs to be more efficient
export const generateInvoicePDF = (invoice: Invoice, customer: Customer, fileName = 'invoice.pdf') => {
  try {
    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Company header
    doc.setFontSize(12);
    doc.text('PrintNPack Ltd', 20, 20);
    doc.setFontSize(10);
    doc.text('123 Print Avenue', 20, 25);
    doc.text('Dublin, D02 A123', 20, 30);
    doc.text('info@printnpack.ie', 20, 35);
    doc.text('+353 1 234 5678', 20, 40);
    
    // Invoice title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 140, 25, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    // Invoice details section
    doc.setFontSize(12);
    doc.text('Invoice #:', 140, 40, { align: 'right' });
    doc.text(invoice.invoiceNumber, 170, 40, { align: 'right' });
    
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };
    
    doc.text('Issue Date:', 140, 45, { align: 'right' });
    doc.text(formatDate(invoice.issueDate), 170, 45, { align: 'right' });
    
    doc.text('Due Date:', 140, 50, { align: 'right' });
    doc.text(formatDate(invoice.dueDate), 170, 50, { align: 'right' });
    
    doc.text('Status:', 140, 55, { align: 'right' });
    doc.text(invoice.status, 170, 55, { align: 'right' });
    
    // Customer info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(customer.name, 20, 60);
    doc.text(customer.email, 20, 65);
    if (customer.phone) doc.text(customer.phone, 20, 70);
    if (customer.address) doc.text(customer.address, 20, customer.phone ? 75 : 70);
    
    // Draw a line
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, 85, 190, 85);
    
    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    };
    
    // Ensure we have items to display
    const items = invoice.invoiceItems || invoice.items || [];
    
    // Create the table for invoice items
    const tableColumn = ["Description", "Qty", "Dimensions", "Unit Price", "Total"];
    const tableRows: string[][] = [];
    
    // Add row data
    items.forEach(item => {
      const dimensions = item.length && item.width 
        ? `${item.length}m × ${item.width}m` 
        : item.area 
          ? `${item.area}m²` 
          : '-';
          
      const rowData = [
        item.description || (item.product ? item.product.name : ''),
        item.quantity.toString(),
        dimensions,
        formatCurrency(item.unitPrice),
        formatCurrency(item.totalPrice)
      ];
      tableRows.push(rowData);
    });
    
    // Generate table with row highlighting
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 90,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 5,
        overflow: 'linebreak',
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
    });
    
    // Get Y position after table
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Ensure we handle both 'subtotal' and 'subtotalAmount'
    const subtotal = invoice.subtotal || invoice.subtotalAmount || 0;
    
    // Summary
    doc.text('Subtotal:', 140, finalY, { align: 'right' });
    doc.text(formatCurrency(subtotal), 190, finalY, { align: 'right' });
    
    doc.text('Tax Rate:', 140, finalY + 5, { align: 'right' });
    doc.text(`${invoice.taxRate}%`, 190, finalY + 5, { align: 'right' });
    
    doc.text('Tax Amount:', 140, finalY + 10, { align: 'right' });
    doc.text(formatCurrency(invoice.taxAmount), 190, finalY + 10, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 140, finalY + 17, { align: 'right' });
    doc.text(formatCurrency(invoice.totalAmount), 190, finalY + 17, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    // Notes
    if (invoice.notes) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(20, finalY + 25, 190, finalY + 25);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, finalY + 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(invoice.notes, 20, finalY + 35);
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount} | PrintNPack Ltd | VAT: IE123456789`,
        105, 
        287, 
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
    return false;
  }
}; 