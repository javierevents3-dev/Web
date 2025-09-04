import { useEffect, useMemo, useState } from 'react';
import { db } from '../../utils/firebaseClient';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { ChevronDown, ChevronUp, CheckCircle, Clock, FileText, Loader, Mail, MapPin, Phone, Settings, Trash2, User, DollarSign, Link as LinkIcon, Calendar } from 'lucide-react';

interface ContractItem {
  id: string;
  clientName: string;
  clientEmail: string;
  eventType?: string;
  eventDate?: string;
  contractDate?: string;
  totalAmount?: number;
  travelFee?: number;
  paymentMethod?: string;
  depositPaid?: boolean;
  finalPaymentPaid?: boolean;
  eventCompleted?: boolean;
  services?: any[];
  storeItems?: any[];
  message?: string;
  createdAt?: string;
  pdfUrl?: string;
}

const ContractsManagement = () => {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const fetchContracts = async () => {
    setLoading(true);
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setContracts([]);
        return;
      }
      let items: ContractItem[] = [];
      try {
        const snap = await getDocs(query(collection(db, 'contracts'), orderBy('createdAt', 'desc')));
        items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      } catch (_) {
        try {
          const snap = await getDocs(collection(db, 'contracts'));
          items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          items.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        } catch (e) {
          console.warn('No se pudieron cargar los contratos', e);
          items = [];
        }
      }
      setContracts(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContracts(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return contracts;
    const s = search.toLowerCase();
    return contracts.filter(c =>
      (c.clientName || '').toLowerCase().includes(s) ||
      (c.clientEmail || '').toLowerCase().includes(s) ||
      (c.eventType || '').toLowerCase().includes(s)
    );
  }, [contracts, search]);

  const toggleFlag = async (id: string, field: keyof ContractItem) => {
    const current = contracts.find(c => c.id === id);
    if (!current) return;
    const next = !Boolean(current[field]);
    await updateDoc(doc(db, 'contracts', id), { [field]: next } as any);
    await fetchContracts();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este contrato?')) return;
    await deleteDoc(doc(db, 'contracts', id));
    await fetchContracts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Gestión de Contratos</h2>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente/email" className="px-3 py-2 border rounded-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-12 p-3 text-xs font-medium border-b">
          <div className="col-span-1" />
          <div className="col-span-3"><User size={14} title="Nombre" /></div>
          <div className="col-span-3"><Calendar size={14} title="Fecha de evento" /></div>
          <div className="col-span-1"><Clock size={14} title="Hora" /></div>
          <div className="col-span-2"><DollarSign size={14} title="Valor total" /></div>
          <div className="col-span-1"><DollarSign size={14} title="A pagar" /></div>
          <div className="col-span-1 text-right"><Settings size={14} title="Acciones" /></div>
        </div>
        {loading && <div className="p-4 text-sm text-gray-500">Cargando...</div>}
        {!loading && filtered.length === 0 && <div className="p-4 text-sm text-gray-500">Sin resultados</div>}
        <div className="divide-y">
          {filtered.map(c => (
            <div key={c.id} className={`grid grid-cols-12 p-3 items-center ${!c.eventCompleted ? 'text-red-600' : ''}`}>
              <div className="col-span-1">
                <button onClick={() => setExpanded(e => ({ ...e, [c.id]: !e[c.id] }))} className="border-2 border-black text-black px-2 py-1 rounded-none hover:bg-black hover:text-white inline-flex items-center">
                  {expanded[c.id] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
              </div>
              <div className="col-span-3 lowercase first-letter:uppercase">{c.clientName || 'cliente'}</div>
              <div className="col-span-3 text-sm">{c.eventDate || '-'}</div>
              <div className="col-span-1 text-sm">{(c as any).eventTime || '-'}</div>
              <div className="col-span-2 font-semibold">R$ {Number(c.totalAmount || 0).toFixed(2)}</div>
              <div className="col-span-1 font-semibold">R$ {(() => {
                const servicesSum = Array.isArray(c.services) ? c.services.reduce((sum, it: any) => {
                  const p = Number(String(it.price || '').replace(/[^0-9]/g, '')) / 100;
                  const q = Number(it.quantity || 1);
                  return sum + p * q;
                }, 0) : 0;
                const storeSum = Array.isArray(c.storeItems) ? c.storeItems.reduce((sum, it: any) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0) : 0;
                const travel = Number(c.travelFee || 0);
                const total = Number(c.totalAmount || 0);
                const deposit = servicesSum > 0 ? Math.ceil((servicesSum + travel) * 0.2 + storeSum * 0.5) : Math.ceil(total * 0.5);
                return Math.max(0, total - deposit).toFixed(2);
              })()}</div>
              <div className="col-span-1 text-right">
                <div className="inline-flex items-center gap-2">
                  {c.pdfUrl && (
                    <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer" title="Ver PDF" className="border-2 border-black text-black px-2 py-1 rounded-none hover:bg-black hover:text-white inline-flex items-center">
                      <LinkIcon size={14} />
                    </a>
                  )}
                  <button onClick={() => toggleFlag(c.id, 'eventCompleted')} className={`px-2 py-1 text-xs border-2 rounded-none ${c.eventCompleted ? 'bg-black text-white border-black' : 'border-black text-black hover:bg-black hover:text-white'}`}>Completado</button>
                  <button onClick={() => remove(c.id)} title="Eliminar" className="border-2 border-black text-black px-2 py-1 rounded-none hover:bg-black hover:text-white inline-flex items-center"><Trash2 size={14}/></button>
                </div>
              </div>
              {expanded[c.id] && (
                <div className="col-span-12 mt-3">
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2"><Phone size={14} className="text-gray-600"/><span>{c.formSnapshot?.phone || '-'}</span></div>
                      <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-600"/><span>{c.formSnapshot?.address || '-'}</span></div>
                      <div className="flex items-center gap-2"><FileText size={14} className="text-gray-600"/><span>{c.eventType || '-'}</span></div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-medium mb-2 flex items-center gap-2"><FileText size={14}/> Serviços</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600">
                              <th className="py-1">Item</th>
                              <th className="py-1">Cant.</th>
                              <th className="py-1">Precio</th>
                              <th className="py-1">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(c.services || []).map((it: any, idx: number) => {
                              const qty = Number(it.quantity ?? 1);
                              const price = Number(String(it.price || '').replace(/[^0-9]/g, ''));
                              const total = price * qty;
                              return (
                                <tr key={idx} className="border-t">
                                  <td className="py-1">{it.name || it.id || '—'}</td>
                                  <td className="py-1">{qty}</td>
                                  <td className="py-1">R$ {(price/100).toFixed(2)}</td>
                                  <td className="py-1">R$ {(total/100).toFixed(2)}</td>
                                </tr>
                              );
                            })}
                            {Array.isArray(c.storeItems) && c.storeItems.map((it: any, idx: number) => (
                              <tr key={`store-${idx}`} className="border-t">
                                <td className="py-1">{it.name}</td>
                                <td className="py-1">{Number(it.quantity)}</td>
                                <td className="py-1">R$ {Number(it.price).toFixed(2)}</td>
                                <td className="py-1">R$ {(Number(it.price) * Number(it.quantity)).toFixed(2)}</td>
                              </tr>
                            ))}
                            {!((c.services && c.services.length) || (c.storeItems && c.storeItems.length)) && (
                              <tr className="border-t"><td className="py-2 text-gray-500" colSpan={4}>Sin items</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {c.message && (
                      <div className="mt-3 text-sm text-gray-700">
                        <div className="text-xs font-medium mb-1">Notas</div>
                        <div className="whitespace-pre-line">{c.message}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContractsManagement;
