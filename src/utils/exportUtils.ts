import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as htmlToImage from 'html-to-image';
import * as XLSX from 'xlsx';
import { TimetableEntry, Subject, Teacher, Period } from '@/data/mockData';

// ── Filler map for empty teaching slots ──
const DAY_FILLER: Record<string, string> = {
  Monday: 'Hobby',
  Tuesday: 'Games',
  Wednesday: 'Hobby',
  Thursday: 'Games',
  Friday: 'Hobby',
  Saturday: 'Games',
};

function getCellText(
  day: string,
  period: Period,
  entries: TimetableEntry[],
  subjects: Subject[],
  teachers: Teacher[]
): string {
  if (period.type !== 'Class') return period.name.toUpperCase();

  const entry = entries.find(e => e.day === day && e.periodId === period.id);
  if (entry) {
    const subject = subjects.find(s => s.id === entry.subjectId);
    const teacher = teachers.find(t => t.id === entry.teacherId);
    return `${subject?.name || '?'}\n${teacher?.name || ''}`;
  }
  // Empty slot → fill with activity
  const filler = DAY_FILLER[day] || 'Hobby';
  return filler === 'Hobby' ? 'Hobby Period' : 'Games / Sports';
}

// ── IMAGE EXPORT ──
export const exportToImage = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const dataUrl = await htmlToImage.toPng(element, {
      backgroundColor: '#ffffff',
      quality: 1,
      pixelRatio: 2,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error generating image:', error);
  }
};

// ── PDF EXPORT (proper table, not screenshot) ──
export const exportToPDF = async (
  elementId: string,
  filename: string,
  tableData?: {
    days: string[];
    periods: Period[];
    entries: TimetableEntry[];
    subjects: Subject[];
    teachers: Teacher[];
    className: string;
  }
) => {
  // If no table data provided, fall back to image-based export
  if (!tableData) {
    const element = document.getElementById(elementId);
    if (!element) return;
    try {
      const dataUrl = await htmlToImage.toPng(element, { backgroundColor: '#ffffff', quality: 1, pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [element.offsetWidth * 1.5, element.offsetHeight * 1.5] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, element.offsetWidth * 1.5, element.offsetHeight * 1.5);
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
    return;
  }

  const { days, periods, entries, subjects, teachers, className } = tableData;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();

  // ── School Header ──
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WEEKLY TIMETABLE', pageWidth / 2, 16, { align: 'center' });

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${className}`, pageWidth / 2, 24, { align: 'center' });

  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Academic Year 2026-27  |  Junior Schedule (9:30 AM – 4:30 PM)', pageWidth / 2, 30, { align: 'center' });
  pdf.setTextColor(0, 0, 0);

  // ── Build table data ──
  const head = [['Period / Time', ...days]];
  const body: any[][] = [];

  for (const period of periods) {
    const timeLabel = `${period.name}\n${period.startTime} – ${period.endTime}`;
    const row: any[] = [timeLabel];

    for (const day of days) {
      row.push(getCellText(day, period, entries, subjects, teachers));
    }
    body.push(row);
  }

  // ── Render table with autoTable ──
  autoTable(pdf, {
    startY: 34,
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12], // orange-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      cellPadding: 3,
    },
    styles: {
      fontSize: 7,
      cellPadding: 2.5,
      valign: 'middle',
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { 
        cellWidth: 28, 
        fontStyle: 'bold', 
        fontSize: 7, 
        halign: 'left',
        fillColor: [248, 250, 252], // slate-50
      },
    },
    bodyStyles: {
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    didParseCell: (data: any) => {
      if (data.section !== 'body') return;

      const periodIndex = data.row.index;
      const period = periods[periodIndex];
      if (!period) return;

      // Style break/lunch rows
      if (period.type === 'Break' || period.type === 'Lunch' || period.type === 'FruitBreak') {
        data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        data.cell.styles.textColor = [148, 163, 184]; // slate-400
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 6;
        return;
      }

      // Style filler (Hobby/Games) cells for empty slots
      if (data.column.index > 0 && period.type === 'Class') {
        const cellText = String(data.cell.raw || '');
        if (cellText.includes('Hobby')) {
          data.cell.styles.fillColor = [245, 243, 255]; // violet-50
          data.cell.styles.textColor = [109, 40, 217]; // violet-700
          data.cell.styles.fontStyle = 'italic';
        } else if (cellText.includes('Games')) {
          data.cell.styles.fillColor = [236, 253, 245]; // emerald-50
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
          data.cell.styles.fontStyle = 'italic';
        }
      }
    },
    margin: { left: 10, right: 10 },
  });

  // ── Footer ──
  const finalY = (pdf as any).lastAutoTable?.finalY || 180;
  pdf.setFontSize(7);
  pdf.setTextColor(160, 160, 160);
  pdf.text('Generated by Chronos — Smart Timetable System', 10, finalY + 8);
  
  // Legend
  const legendY = finalY + 8;
  pdf.setFontSize(6);
  pdf.setTextColor(109, 40, 217);
  pdf.setFillColor(245, 243, 255);
  pdf.rect(pageWidth - 95, legendY - 3, 4, 4, 'F');
  pdf.text('Hobby Period', pageWidth - 89, legendY);
  
  pdf.setTextColor(5, 150, 105);
  pdf.setFillColor(236, 253, 245);
  pdf.rect(pageWidth - 60, legendY - 3, 4, 4, 'F');
  pdf.text('Games / Sports', pageWidth - 54, legendY);

  pdf.save(`${filename}.pdf`);
};

// ── EXCEL EXPORT ──
export const exportToExcel = (
  days: string[],
  periods: Period[],
  entries: TimetableEntry[],
  subjects: Subject[],
  teachers: Teacher[],
  filename: string
) => {
  // Build the full data grid with header row
  const headerRow = ['Period / Time', ...days];
  const dataRows: string[][] = [];

  for (const period of periods) {
    const row: string[] = [`${period.name} (${period.startTime}–${period.endTime})`];
    for (const day of days) {
      row.push(getCellText(day, period, entries, subjects, teachers).replace('\n', ' — '));
    }
    dataRows.push(row);
  }

  // Create worksheet from array of arrays (gives us control over layout)
  const titleRows: string[][] = [
    [filename.toUpperCase()],
    ['Academic Year 2026-27 | Junior Schedule (9:30 AM – 4:30 PM)'],
    [], // blank separator
    headerRow,
    ...dataRows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(titleRows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 22 },
    ...days.map(() => ({ wch: 24 })),
  ];

  // Merge title cell across all columns
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: days.length } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: days.length } },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
