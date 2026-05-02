import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import * as XLSX from 'xlsx';
import { TimetableEntry, Subject, Teacher, Period } from '@/data/mockData';

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

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const dataUrl = await htmlToImage.toPng(element, {
      backgroundColor: '#ffffff',
      quality: 1,
      pixelRatio: 2,
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [element.offsetWidth * 1.5, element.offsetHeight * 1.5],
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, element.offsetWidth * 1.5, element.offsetHeight * 1.5);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

export const exportToExcel = (
  days: string[],
  periods: Period[],
  entries: TimetableEntry[],
  subjects: Subject[],
  teachers: Teacher[],
  filename: string
) => {
  const data = periods.map(period => {
    const row: any = { 'Period': `${period.name} (${period.startTime}-${period.endTime})` };
    days.forEach(day => {
      const entry = entries.find(e => e.day === day && e.periodId === period.id);
      if (period.type !== 'Class') {
        row[day] = period.name;
      } else if (entry) {
        const subject = subjects.find(s => s.id === entry.subjectId);
        const teacher = teachers.find(t => t.id === entry.teacherId);
        row[day] = `${subject?.name || ''} (${teacher?.name || ''})`;
      } else {
        row[day] = '-';
      }
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
