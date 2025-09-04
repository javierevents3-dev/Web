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

export function buildDescricao(f: CalendarFields, valorPacote: number, totalComDeslocamento: number): string {
  const inicio = new Date(f.inicioISO);
  const linhas = [
    `📆 Formulário enviado: ${new Date().toLocaleString()}`,
    f.email && `📩 Email: ${f.email}`,
    f.nome && `👤 Nome completo: ${f.nome}`,
    f.telefone && `📞 Telefone: ${f.telefone}`,
    `🗓️ Início: ${inicio.toLocaleString()}`,
    f.endereco && `📍 Localização: ${f.endereco}`,
    (f.deslocamento ?? 0) ? `🚗 Deslocamento: R$${Number(f.deslocamento).toFixed(2)}` : '',
    f.tipoEvento && `📸 Tipo de evento: ${f.tipoEvento}`,
    f.pacote && `📦 Pacote contratado: ${f.pacote}`,
    f.figurino && `🤰 Figurino: ${f.figurino}`,
    f.pacoteFoto && `🖼️ Foto: ${f.pacoteFoto}`,
    f.pacoteVideo && `🎥 Vídeo: ${f.pacoteVideo}`,
    f.pacoteFotoVideo && `📸+🎥 Foto + Vídeo: ${f.pacoteFotoVideo}`,
    f.formaPagamento && `💳 Forma de pagamento: ${f.formaPagamento}`,
    f.instagram && `📱 Instagram: ${f.instagram}`,
    (typeof f.respostaConsentimento !== 'undefined') && `${String(f.respostaConsentimento).toLowerCase().includes('sim') || f.respostaConsentimento === true ? '✅' : '❌'} Consentimento: ${f.respostaConsentimento}`,
    valorPacote > 0 ? `💵 Valor do pacote: R$${valorPacote.toFixed(2)}` : '',
    `💰 Total com deslocamento: R$${totalComDeslocamento.toFixed(2)}`
  ].filter(Boolean).join('\n');
  return linhas;
}

function calcularValorPacote(f: CalendarFields): number {
  // Tabelas do Apps Script
  const tabelaValoresFotoVideo: Record<number, number> = {1: 200, 2: 400, 3: 580, 4: 750, 5: 900, 6: 1050, 7: 1200};
  const tabelaValoresFotoVideoJuntos: Record<number, number> = {1: 400, 2: 800, 3: 1140, 4: 1460, 5: 1680, 6: 1850, 7: 2000};

  let valorPacote = 0;
  if (f.pacoteFotoVideo && !f.pacoteFotoVideo.toLowerCase().includes('não desejo')) {
    const horas = parseHoursFromText(f.pacoteFotoVideo);
    valorPacote = tabelaValoresFotoVideoJuntos[horas] || 0;
  } else {
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
  return valorPacote;
}

export function buildCalendarEvent(f: CalendarFields) {
  const tz = f.timeZone || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo');
  const start = new Date(f.inicioISO);
  const durH = computeDurationHours(f);
  const end = new Date(start.getTime() + durH * 60 * 60 * 1000);

  const valorPacote = calcularValorPacote(f);
  const totalComDeslocamento = valorPacote + Number(f.deslocamento || 0);
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
