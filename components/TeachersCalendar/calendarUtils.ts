import type { Class as CalendarClass } from './types';

// Paleta de colores para tipos de clase
export const classTypeColors: Record<string, string> = {
  'ticket class': 'bg-[#eafaf1] text-[#27ae60] border-[#27ae60]',
  'driving lesson': 'bg-[#e3f6fc] text-[#0056b3] border-[#0056b3]',
  'driving test': 'bg-[#fff7e6] text-[#f39c12] border-[#f39c12]',
  // Mantener compatibilidad con nombres antiguos temporalmente
  'D.A.T.E.': 'bg-[#eafaf1] text-[#27ae60] border-[#27ae60]',
  'A.D.I.': 'bg-[#e3f6fc] text-[#0056b3] border-[#0056b3]',
  'B.D.I.': 'bg-[#ede7f6] text-[#7c3aed] border-[#7c3aed]',
};

// Badge de color para cada tipo de clase
export const classTypeBadgeColors: Record<string, string> = {
  'ticket class': 'bg-[#27ae60]',
  'driving lesson': 'bg-[#0056b3]',
  'driving test': 'bg-[#f39c12]',
  // Mantener compatibilidad con nombres antiguos temporalmente
  'D.A.T.E.': 'bg-[#27ae60]',
  'A.D.I.': 'bg-[#0056b3]',
  'B.D.I.': 'bg-[#7c3aed]',
};

// Colores de status para el punto
export const statusDotColors: Record<string, string> = {
  'scheduled': 'bg-[#0056b3]',
  'available': 'bg-gray-400',
  'cancelled': 'bg-[#f44336]',
  'pending': 'bg-[#ff9800]',
  'booked': 'bg-[#0056b3]',
};

// Colores de fondo para las cards según el estado
export const statusCardColors: Record<string, string> = {
  'scheduled': 'bg-blue-50 border-blue-200',
  'available': 'bg-gray-50 border-gray-200',
  'cancelled': 'bg-red-50 border-red-200',
  'pending': 'bg-orange-50 border-orange-200',
  'booked': 'bg-blue-50 border-blue-200',
};

// Colores de borde lateral para las cards según el estado
export const statusBorderColors: Record<string, string> = {
  'scheduled': 'border-l-blue-500',
  'available': 'border-l-gray-400',
  'cancelled': 'border-l-red-500',
  'pending': 'border-l-orange-500',
  'booked': 'border-l-blue-500',
};

// Colores de fondo y borde para el bloque según classType
export const classTypeBlockColors: Record<string, string> = {
  'ticket class': 'bg-[#eafaf1] border-[#27ae60]',
  'driving lesson': 'bg-[#e3f6fc] border-[#0056b3]',
  'driving test': 'bg-[#fff7e6] border-[#f39c12]',
  // Mantener compatibilidad con nombres antiguos temporalmente
  'D.A.T.E.': 'bg-[#eafaf1] border-[#27ae60]',
  'A.D.I.': 'bg-[#e3f6fc] border-[#0056b3]',
  'B.D.I.': 'bg-[#ede7f6] border-[#7c3aed]',
};

// Colores hex para fondo y borde por classType
export const blockBgColors: Record<string, string> = {
  'ticket class': '#eafaf1',
  'driving lesson': '#e3f6fc',
  'driving test': '#fff7e6',
  // Mantener compatibilidad con nombres antiguos temporalmente
  'D.A.T.E.': '#eafaf1',
  'A.D.I.': '#e3f6fc',
  'B.D.I.': '#ede7f6',
};

export const blockBorderColors: Record<string, string> = {
  'ticket class': '#27ae60',
  'driving lesson': '#0056b3',
  'driving test': '#f39c12',
  // Mantener compatibilidad con nombres antiguos temporalmente
  'D.A.T.E.': '#27ae60',
  'A.D.I.': '#0056b3',
  'B.D.I.': '#7c3aed',
};

export function normalizeType(type: string) {
  if (!type) return '';
  const t = type.toLowerCase().replace(/\s+/g, ' ').trim();

  // Nuevos tipos de clases
  if (t === 'driving lesson') return 'driving lesson';
  if (t === 'driving test') return 'driving test';
  if (t === 'ticket class') return 'ticket class';

  // Compatibilidad con nombres antiguos
  const upperT = type.toUpperCase().replace(/\s+/g, '').replace(/\./g, '');
  if (upperT.includes('DATE')) return 'D.A.T.E.';
  if (upperT.includes('ADI')) return 'A.D.I.';
  if (upperT.includes('BDI')) return 'B.D.I.';
  if (upperT.includes('DRIVINGTEST')) return 'driving test';

  return type;
}

export function getVisibleDates(view: 'week' | 'month' | 'day', selectedDate: Date) {
  if (view === 'week') {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - ((startOfWeek.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      d.setHours(0,0,0,0);
      return d;
    });
  } else {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => {
      const d = new Date(year, month, i + 1);
      d.setHours(0,0,0,0);
      return d;
    });
  }
}

export function weekRangeLabel(date: Date) {
  const start = new Date(date);
  start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function generateTimeSlots(startHour: number = 6, endHour: number = 20): string[] {
  const timeSlots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
  }
  return timeSlots;
}

// Nueva función para generar slots con intervalos de 30 min (para compatibilidad con clases existentes)
export function generateDetailedTimeSlots(startHour: number = 6, endHour: number = 20): string[] {
  const timeSlots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return timeSlots;
}

// Función para generar enlaces a Maps y Waze
export function generateMapsLink(address: string) {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

export function generateWazeLink(address: string) {
  const encodedAddress = encodeURIComponent(address);
  return `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
}

// Función para abrir enlace de navegación
export function openNavigationLink(address: string, app: 'maps' | 'waze' = 'maps') {
  const link = app === 'waze' ? generateWazeLink(address) : generateMapsLink(address);
  window.open(link, '_blank');
}

export function groupClassesByStatus(classes: CalendarClass[], view: 'week' | 'month' | 'day', selectedDate: Date, getVisibleDates: () => Date[]) {
  let summaryClasses = classes;
  if (view === 'month') {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    summaryClasses = classes.filter(c => {
      const d = c.date instanceof Date ? c.date : new Date(c.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  } else if (view === 'week') {
    const weekDates = getVisibleDates().map((d: Date) => d.setHours(0,0,0,0));
    summaryClasses = classes.filter(c => {
      const d = c.date instanceof Date ? c.date : new Date(c.date);
      return weekDates.includes(new Date(d).setHours(0,0,0,0));
    });
  }

  const summaryByStatus = { scheduled: [], cancelled: [], available: [] } as Record<'scheduled'|'cancelled'|'available', { day: string, time: string }[]>;
  summaryClasses.forEach(c => {
    const dateObj = new Date(c.date);
    const dayStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    const timeStr = `${c.start || (c.hour?.toString().padStart(2, '0') + ':00')} - ${c.end || ((c.hour + 1)?.toString().padStart(2, '0') + ':00')}`;
    if (c.status === 'scheduled') summaryByStatus.scheduled.push({ day: dayStr, time: timeStr });
    if (c.status === 'cancelled') summaryByStatus.cancelled.push({ day: dayStr, time: timeStr });
    if (c.status === 'available') summaryByStatus.available.push({ day: dayStr, time: timeStr });
  });

  return { summaryClasses, summaryByStatus };
}