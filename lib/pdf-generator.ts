'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from './types';
import { formatCurrency, formatDate, transactionTypeLabels } from './utils';

interface StatementData {
    accountNumber: string;
    customerName: string;
    dateFrom: string;
    dateTo: string;
    transactions: Transaction[];
    openingBalance: number;
    closingBalance: number;
}

export function generateStatement(data: StatementData) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BUKU TABUNGAN', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Mutasi Rekening / Account Statement', pageWidth / 2, 28, {
        align: 'center',
    });

    // Divider
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.5);
    doc.line(14, 33, pageWidth - 14, 33);

    // Customer info
    doc.setFontSize(10);
    const infoY = 42;
    doc.setFont('helvetica', 'bold');
    doc.text('Nama Nasabah', 14, infoY);
    doc.text('No. Rekening', 14, infoY + 7);
    doc.text('Periode', 14, infoY + 14);

    doc.setFont('helvetica', 'normal');
    doc.text(`: ${data.customerName}`, 55, infoY);
    doc.text(`: ${data.accountNumber}`, 55, infoY + 7);
    doc.text(
        `: ${formatDate(data.dateFrom)} - ${formatDate(data.dateTo)}`,
        55,
        infoY + 14,
    );

    // Balance summary
    doc.setFont('helvetica', 'bold');
    doc.text('Saldo Awal', pageWidth - 80, infoY);
    doc.text('Saldo Akhir', pageWidth - 80, infoY + 7);

    doc.setFont('helvetica', 'normal');
    doc.text(`: ${formatCurrency(data.openingBalance)}`, pageWidth - 50, infoY);
    doc.text(
        `: ${formatCurrency(data.closingBalance)}`,
        pageWidth - 50,
        infoY + 7,
    );

    // Transaction table
    const tableData = data.transactions.map((t, i) => [
        (i + 1).toString(),
        formatDate(t.transaction_date),
        transactionTypeLabels[t.transaction_type] || t.transaction_type,
        t.description || '-',
        t.transaction_type === 'deposit' || t.transaction_type === 'transfer_in'
            ? formatCurrency(t.amount)
            : '-',
        t.transaction_type === 'withdrawal' || t.transaction_type === 'transfer_out'
            ? formatCurrency(t.amount)
            : '-',
        formatCurrency(t.balance_after),
    ]);

    autoTable(doc, {
        startY: infoY + 24,
        head: [['No', 'Tanggal', 'Jenis', 'Keterangan', 'Kredit', 'Debit', 'Saldo']],
        body: tableData,
        headStyles: {
            fillColor: [30, 58, 138],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 25 },
            2: { cellWidth: 28 },
            3: { cellWidth: 40 },
            4: { cellWidth: 28, halign: 'right' },
            5: { cellWidth: 28, halign: 'right' },
            6: { cellWidth: 28, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
    });

    // Footer
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 200;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
        `Dicetak pada: ${formatDate(new Date().toISOString(), 'dd MMM yyyy, HH:mm')}`,
        14,
        finalY + 15,
    );
    doc.text(
        'Dokumen ini digenerate secara otomatis oleh sistem Buku Tabungan.',
        14,
        finalY + 20,
    );

    return doc;
}

export function downloadStatement(data: StatementData) {
    const doc = generateStatement(data);
    doc.save(
        `mutasi_${data.accountNumber}_${data.dateFrom}_${data.dateTo}.pdf`,
    );
}

export function printStatement(data: StatementData) {
    const doc = generateStatement(data);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
}
