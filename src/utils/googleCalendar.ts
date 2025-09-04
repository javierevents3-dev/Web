export interface CalendarFields {
  email?: string;
  nome?: string;
  telefone?: string;
  endereco?: string;
  deslocamento?: number;
  tipoEvento?: string;
  pacote?: string;
  figurino?: string;
  pacoteFoto?: string;
  pacoteVideo?: string;
  pacoteFotoVideo?: string;
  formaPagamento?: string;
  instagram?: string;
  respostaConsentimento?: string | boolean;
  inicioISO: string; // ISO date-time string (e.g., 2025-09-30T05:41)
  timeZone?: string; // optional IANA timezone
  services?: any[];
  storeItems?: any[];
  totalAmount?: number;
  eventCompleted?: boolean;
}

function parseHoursFromText(txt?: string): number {
  if (!txt) return 0;
  const m = String(txt).match(/\d+/);
  return m ? Number(m[0]) || 0 : 0;
}

function computeDurationHours(f: CalendarFields): number {
  let dur = 0;
  if (f.pacoteFotoVideo && !f.pacoteFotoVideo.toLowerCase().includes('não desejo')) {
    const h = parseHoursFromText(f.pacoteFotoVideo);
    dur = h;
  } else {
    const hf = (f.pacoteFoto && !f.pacoteFoto.toLowerCase().includes('não desejo')) ? parseHoursFromText(f.pacoteFoto) : 0;
    const hv = (f.pacoteVideo && !f.pacoteVideo.toLowerCase().includes('não desejo')) ? parseHoursFromText(f.pacoteVideo) : 0;
    dur = hf || hv;
  }
  if (f.tipoEvento && f.tipoEvento.toLowerCase().includes('gestante')) {
    if (f.pacote && f.pacote.includes('#1')) dur = 0.5; else dur = 1;
  }
  return dur > 0 ? dur : 1; // mínimo 1h
}

function formatBRL(n: number) { return `R$ ${n.toFixed(2)}`; }
function timeHHmm(d: Date) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

export function buildDescricao(f: CalendarFields, valorPacote: number, totalComDeslocamento: number): string {
  const inicio = new Date(f.inicioISO);
  // Totales por líneas
  const servicesRows = (f.services || []).map((it: any) => {
    const qty = Number(it.quantity ?? 1);
    const price = parseMoney(it.price);
    const total = price * qty;
    const name = it.name || it.id || '—';
    return { name, qty, price, total };
  });
  const storeRows = (f.storeItems || []).map((it: any) => {
    const qty = Number(it.quantity ?? 1);
    const price = parseMoney(it.price);
    const total = price * qty;
    const name = it.name || '—';
    return { name, qty, price, total };
  });
  const travel = Number(f.deslocamento || 0);
  const servicesTotal = servicesRows.reduce((s, r) => s + r.total, 0);
  const storeTotal = storeRows.reduce((s, r) => s + r.total, 0);
  const total = servicesTotal + storeTotal + travel;

  // Remaining (A pagar) con misma lógica de contratos
  const servicesEffective = servicesTotal + travel;
  const deposit = Math.ceil(servicesEffective * 0.2 + storeTotal * 0.5);
  const remaining = Math.max(0, total - deposit);

  const headerLines = [
    `👤 Nombre: ${f.nome || '—'}`,
    `📅 Fecha: ${inicio.toISOString().slice(0,10)}`,
    `⏰ Hora: ${timeHHmm(inicio)}`,
    `💵 Total: ${formatBRL(total)}`,
    `🧾 A pagar: ${formatBRL(remaining)}`,
    `${f.eventCompleted ? '✅ Estado: Completado' : '⏳ Estado: Pendiente'}`
  ];

  const infoLines = [
    f.telefone ? `📞 Teléfono: ${f.telefone}` : 'Teléfono: —',
    f.endereco ? `📍 Dirección: ${f.endereco}` : 'Dirección: —',
    f.tipoEvento ? `📸 Tipo: ${f.tipoEvento}` : 'Tipo: —'
  ];

  const tableHeader = '🧾 Servicios\nItem\tCant.\tPrecio\tTotal';
  const serviceLines = servicesRows.map(r => `${r.name}\t${r.qty}\t${formatBRL(r.price)}\t${formatBRL(r.total)}`).join('\n');
  const storeLines = storeRows.length ? storeRows.map(r => `${r.name}\t${r.qty}\t${formatBRL(r.price)}\t${formatBRL(r.total)}`).join('\n') : '';
  const travelLine = travel > 0 ? `🚗 Deslocamento\t1\t${formatBRL(travel)}\t${formatBRL(travel)}` : '';
  const totalLine = `💰 Total: ${formatBRL(total)}`;

  const linhas = [
    headerLines.join('\n'),
    infoLines.join('\n'),
    tableHeader,
    serviceLines,
    storeLines,
    travelLine,
    totalLine
  ].filter(Boolean).join('\n');
  return linhas;
}

function parseMoney(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/,/g, '.');
  const m = s.replace(/[^0-9.]/g, '');
  const n = Number(m);
  return isFinite(n) ? n : 0;
}

function sumServicesPrice(f: CalendarFields): number {
  if (!Array.isArray(f.services)) return 0;
  return f.services.reduce((sum, it: any) => {
    const price = parseMoney(it.price);
    const qty = Number(it.quantity ?? 1);
    return sum + price * qty;
  }, 0);
}

function sumStoreItemsPrice(f: CalendarFields): number {
  if (!Array.isArray(f.storeItems)) return 0;
  return f.storeItems.reduce((sum, it: any) => sum + (parseMoney(it.price) * Number(it.quantity ?? 1)), 0);
}

function calcularValorPacote(f: CalendarFields): number {
  // Tabelas do Apps Script
  const tabelaValoresFotoVideo: Record<number, number> = {1: 200, 2: 400, 3: 580, 4: 750, 5: 900, 6: 1050, 7: 1200};
  const tabelaValoresFotoVideoJuntos: Record<number, number> = {1: 400, 2: 800, 3: 1140, 4: 1460, 5: 1680, 6: 1850, 7: 2000};

  let valorPacote = 0;
  if (f.pacoteFotoVideo && !f.pacoteFotoVideo.toLowerCase().includes('não desejo')) {
    const horas = parseHoursFromText(f.pacoteFotoVideo);
    valorPacote = tabelaValoresFotoVideoJuntos[horas] || 0;
  } else if ((f.pacoteFoto && !f.pacoteFoto.toLowerCase().includes('não desejo')) || (f.pacoteVideo && !f.pacoteVideo.toLowerCase().includes('não desejo'))) {
    let valorFoto = 0, valorVideo = 0;
    if (f.pacoteFoto && !f.pacoteFoto.toLowerCase().includes('não desejo')) {
      const horasFoto = parseHoursFromText(f.pacoteFoto);
      valorFoto = tabelaValoresFotoVideo[horasFoto] || 0;
    }
    if (f.pacoteVideo && !f.pacoteVideo.toLowerCase().includes('não desejo')) {
      const horasVideo = parseHoursFromText(f.pacoteVideo);
      valorVideo = tabelaValoresFotoVideo[horasVideo] || 0;
    }
    valorPacote = valorFoto + valorVideo;
  }

  // Fallback: usar soma dos serviços quando o texto do pacote não define preço
  if (valorPacote <= 0) {
    valorPacote = sumServicesPrice(f);
  }
  return valorPacote;
}

export function buildCalendarEvent(f: CalendarFields) {
  const tz = f.timeZone || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo');
  const start = new Date(f.inicioISO);
  const durH = computeDurationHours(f);
  const end = new Date(start.getTime() + durH * 60 * 60 * 1000);

  const valorPacote = calcularValorPacote(f);
  const storeTotal = sumStoreItemsPrice(f);
  const totalComDeslocamento = valorPacote + storeTotal + Number(f.deslocamento || 0);
  const description = buildDescricao(f, valorPacote, totalComDeslocamento);

  return {
    summary: `${f.tipoEvento || 'Evento'} - ${f.nome || 'Cliente'}`,
    location: f.endereco || '',
    description,
    start: { dateTime: start.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz }
  };
}

export async function reserveOnCalendar(f: CalendarFields, opts?: { calendarId?: string; accessToken?: string }) {
  const calendarId = opts?.calendarId || 'primary';
  const accessToken = opts?.accessToken || (typeof window !== 'undefined' ? (window as any).__GCAL_TOKEN : undefined);
  const event = buildCalendarEvent(f);

  // Always log for debugging per request
  // eslint-disable-next-line no-console
  console.log('[GCAL] Event payload about to reserve:', { calendarId, event });

  if (!accessToken) {
    return { status: 'logged', calendarId, event } as const;
  }

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(event)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // eslint-disable-next-line no-console
    console.error('[GCAL] Create event failed', res.status, text);
    throw new Error(`Google Calendar error ${res.status}`);
  }

  const created = await res.json();
  // eslint-disable-next-line no-console
  console.log('[GCAL] Event created:', created);
  return { status: 'created', calendarId, event, created } as const;
}
