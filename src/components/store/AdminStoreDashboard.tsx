import { useEffect, useMemo, useState } from 'react';
import { db } from '../../utils/firebaseClient';
import { collection, getCountFromServer, getDocs, limit, orderBy, query, addDoc, updateDoc, doc } from 'firebase/firestore';
import { DollarSign, Package, Users, ClipboardList, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Legend } from 'recharts';

interface OrderLineItem {
  productId?: string;
  product_id?: string;
  name?: string;
  price?: number;
  qty?: number;
  quantity?: number;
  total?: number;
}

interface OrderItem {
  id: string;
  customer_name?: string;
  total?: number;
  created_at?: string;
  status?: 'pendiente' | 'procesando' | 'completado' | string;
  items?: OrderLineItem[];
}

interface ProductLite { id: string; name: string }

interface AdminProps { onNavigate?: (view: 'dashboard' | 'products' | 'orders' | 'contracts') => void }
const AdminStoreDashboard: React.FC<AdminProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({ products: 0, orders: 0, income: 0, customers: 0 });
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [allOrders, setAllOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<'all' | string>('all');
  const [selectedProductIdB, setSelectedProductIdB] = useState<'none' | string>('none');

  useEffect(() => {
    (async () => {
      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setStats({ products: 0, orders: 0, income: 0, customers: 0 });
          setRecentOrders([]);
          setAllOrders([]);
          setProducts([]);
          return;
        }
        // counts
        const productsSnap = await getCountFromServer(collection(db, 'products'));
        const ordersSnap = await getCountFromServer(collection(db, 'orders'));
        const customersSnap = await getCountFromServer(collection(db, 'customers'));
        setStats(s => ({
          ...s,
          products: productsSnap.data().count || 0,
          orders: ordersSnap.data().count || 0,
          customers: customersSnap.data().count || 0,
        }));
      } catch (_) {}

      // seed demo orders if empty
      try {
        const emptyCheck = await getDocs(collection(db, 'orders'));
        if (emptyCheck.empty && !localStorage.getItem('seeded_orders')) {
          const base = Date.now();
          const demo = [
            { customer_name: 'gabriel', total: 44, status: 'completado', created_at: new Date(base - 4*24*60*60*1000).toISOString() },
            { customer_name: 'Upgradix', total: 68, status: 'procesando', created_at: new Date(base - 3*24*60*60*1000).toISOString() },
            { customer_name: 'Pepe', total: 80, status: 'pendiente', created_at: new Date(base - 2*24*60*60*1000).toISOString() },
            { customer_name: 'Osvaldo', total: 340, status: 'completado', created_at: new Date(base - 1*24*60*60*1000).toISOString() },
            { customer_name: 'Laura', total: 100, status: 'pendiente', created_at: new Date(base).toISOString() },
          ];
          await Promise.all(demo.map(d => addDoc(collection(db, 'orders'), d)));
          localStorage.setItem('seeded_orders', '1');
        }
      } catch (_) {}

      // recent orders + income
      try {
        let q: any = query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(5));
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as OrderItem[];
        setRecentOrders(items);
      } catch {
        try {
          const snap = await getDocs(collection(db, 'orders'));
          const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as OrderItem[];
          const items = all.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 5);
          setRecentOrders(items);
        } catch {
          setRecentOrders([]);
        }
      }

      // all orders for performance + income
      let all: OrderItem[] = [];
      try {
        const snap = await getDocs(collection(db, 'orders'));
        all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as OrderItem[];
        setAllOrders(all);
        setStats(s => ({ ...s, income: all.reduce((sum, o) => sum + Number(o.total || 0), 0) }));
      } catch {
        all = [];
        setAllOrders([]);
      }

      // load products for filter
      let psList: ProductLite[] = [];
      try {
        const ps = await getDocs(collection(db, 'products'));
        psList = ps.docs.map(d => ({ id: d.id, name: (d.data() as any).name || 'Producto' }));
        setProducts(psList);
      } catch {
        psList = [];
        setProducts([]);
      }

      // assign random product to orders missing items
      try {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          const targets = all.filter(o => !Array.isArray(o.items) || (o.items as any[]).length === 0);
          if (psList.length && targets.length) {
            await Promise.all(targets.map(o => {
              const pick = psList[Math.floor(Math.random() * psList.length)];
              const amount = Number(o.total || 0) || 0;
              const item = { product_id: pick.id, name: pick.name, price: amount, qty: 1, total: amount } as any;
              return updateDoc(doc(db, 'orders', o.id), { items: [item] });
            }));
            const snap2 = await getDocs(collection(db, 'orders'));
            const all2 = snap2.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as OrderItem[];
            setAllOrders(all2);
          }
        }
      } catch {
        // ignore assignment failures
      }
    })();
  }, []);

  const statCards = useMemo(() => ([
    { label: 'Total Productos', value: stats.products, icon: <Package className="text-primary" size={18} /> },
    { label: 'Órdenes Totales', value: stats.orders, icon: <ClipboardList className="text-green-600" size={18} /> },
    { label: 'Ingresos Totales', value: `$${stats.income}`, icon: <DollarSign className="text-amber-500" size={18} /> },
    { label: 'Nuevos Clientes', value: stats.customers, icon: <Users className="text-fuchsia-500" size={18} /> },
  ]), [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona tu tienda de productos personalizados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-gray-500 text-sm">{s.label}</p>
              <p className="text-2xl font-semibold">{s.value}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <button onClick={() => onNavigate?.('orders')} className="w-full border-2 border-black text-black px-4 py-3 rounded-none hover:bg-black hover:text-white flex items-center justify-center gap-2">
              Ver Órdenes
              <ArrowUpRight size={18} />
            </button>
            <button onClick={() => onNavigate?.('contracts')} className="w-full border-2 border-black text-black px-4 py-3 rounded-none hover:bg-black hover:text-white flex items-center justify-center gap-2">
              Ver Contratos
              <ArrowUpRight size={18} />
            </button>
            <button onClick={() => onNavigate?.('products')} className="w-full border-2 border-black text-black px-4 py-3 rounded-none hover:bg-black hover:text-white">
              Administrar Productos
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium mb-4">Órdenes Recientes</h3>
          <div className="divide-y">
            {recentOrders.length === 0 && (
              <div className="text-gray-500 text-sm p-4 flex items-center justify-between">
                <span>No hay órdenes recientes</span>
              </div>
            )}
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium lowercase first-letter:uppercase">{o.customer_name || 'cliente'}</p>
                  <p className="text-xs text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">${Number(o.total || 0).toFixed(0)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${o.status === 'completado' ? 'bg-green-100 text-green-700' : o.status === 'procesando' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {o.status || 'pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3">
            <button onClick={() => onNavigate?.('orders')} className="w-full border-2 border-black text-black rounded-none py-2 hover:bg-black hover:text-white">Ver Todas las Órdenes</button>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Rendimiento: Ventas Mensuales</h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Producto A</label>
            <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="px-3 py-2 border rounded-none">
              <option value="all">Todos</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <label className="text-sm text-gray-600">Producto B</label>
            <select value={selectedProductIdB} onChange={e => setSelectedProductIdB(e.target.value as any)} className="px-3 py-2 border rounded-none">
              <option value="none">Ninguno</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={computeMonthlyCompare(allOrders, selectedProductId, selectedProductIdB)} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: any) => `$${Number(v).toFixed(0)}`} />
              <Legend />
              <Line type="monotone" dataKey="a" name={resolveName(products, selectedProductId)} stroke="#111827" strokeWidth={2} dot={false} />
              {selectedProductIdB !== 'none' && (
                <Line type="monotone" dataKey="b" name={resolveName(products, selectedProductIdB)} stroke="#0ea5e9" strokeWidth={2} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

function resolveName(products: ProductLite[], id: 'all' | 'none' | string) {
  if (id === 'all') return 'Todos';
  if (id === 'none') return '—';
  return products.find(p => p.id === id)?.name || 'Producto';
}

function computeMonthlyCompare(orders: OrderItem[], aId: 'all' | string, bId: 'none' | string) {
  const now = new Date();
  const months = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(now.getFullYear(), i, 1);
    const label = d.toLocaleString('es', { month: 'short' });
    return { key: i, month: label.charAt(0).toUpperCase() + label.slice(1), a: 0, b: 0 };
  });

  const getItemAmount = (it: OrderLineItem) => {
    const qty = Number(it.qty ?? it.quantity ?? 1);
    const total = it.total != null ? Number(it.total) : (it.price != null ? Number(it.price) * qty : 0);
    return isFinite(total) ? total : 0;
  };

  for (const o of orders) {
    if (!o.created_at) continue;
    const d = new Date(o.created_at);
    if (isNaN(d.getTime())) continue;
    const m = d.getMonth();

    // A: total or product
    if (aId === 'all') {
      months[m].a += Number(o.total || 0) || 0;
    } else if (Array.isArray(o.items)) {
      months[m].a += o.items
        .filter(it => (it.productId === aId) || (it.product_id === aId))
        .reduce((sum, it) => sum + getItemAmount(it), 0);
    }

    // B: skip if none
    if (bId !== 'none') {
      if (Array.isArray(o.items)) {
        months[m].b += o.items
          .filter(it => (it.productId === bId) || (it.product_id === bId))
          .reduce((sum, it) => sum + getItemAmount(it), 0);
      }
    }
  }

  return months;
}

export default AdminStoreDashboard;
