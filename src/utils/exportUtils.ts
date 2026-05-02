import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Period, TimetableEntry, Subject, Teacher } from '@/data/mockData';

export const exportToImage = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.classList.add('exporting-view');
  
  try {
    // Wait a tiny bit for the class to apply
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Capture full dimensions
    const width = element.scrollWidth;
    const height = element.scrollHeight;

    const dataUrl = await toPng(element, {
      width: width,
      height: height,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
        width: `${width}px`,
        height: `${height}px`,
      },
      quality: 0.95,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
    
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting image:', error);
  } finally {
    element.classList.remove('exporting-view');
  }
};

export const exportToPDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.classList.add('exporting-view');
  
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const width = element.scrollWidth;
    const height = element.scrollHeight;

    const dataUrl = await toPng(element, {
      width: width,
      height: height,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
        width: `${width}px`,
        height: `${height}px`,
      },
      quality: 0.95,
      backgroundColor: '#ffffff',
    });
    
    // Create an image object to get dimensions
    const img = new Image();
    img.src = dataUrl;
    await new Promise(resolve => img.onload = resolve);

    const pdf = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [img.width, img.height]
    });
    
    pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
  } finally {
    element.classList.remove('exporting-view');
  }
};

export const exportToExcel = (
  days: string[],
  periods: Period[],
  entries: TimetableEntry[],
  subjects: Subject[],
  teachers: Teacher[],
  className: string
) => {
  const header = ['Period', ...days];
  const rows = periods.map(period => {
    const row: any[] = [`${period.name} (${period.startTime}-${period.endTime})`];
    days.forEach(day => {
      const entry = entries.find(e => e.day === day && e.periodId === period.id);
      if (period.type !== 'Class') {
        row.push(period.name);
      } else if (entry) {
        const subject = subjects.find(s => s.id === entry.subjectId);
        const teacher = teachers.find(t => t.id === entry.teacherId);
        row.push(`${subject?.name || 'Unknown'}\n(${teacher?.name || 'N/A'})`);
      } else {
        row.push('-');
      }
    });
    return row;
  });

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable');
  
  // Set column widths
  worksheet['!cols'] = [{ wch: 20 }, ...days.map(() => ({ wch: 15 }))];

  XLSX.writeFile(workbook, `${className}_Timetable.xlsx`);
};
