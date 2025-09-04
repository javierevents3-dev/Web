import { useState, useEffect } from 'react';
import { db } from '../utils/firebaseClient';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Activity
} from 'lucide-react';

const DashboardPage = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const processMonthlyData = (transactions: any[]) => {
    const acc: any = {};
    transactions.forEach(t => {
      const date = new Date(t.date || Date.now());
      const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!acc[key]) acc[key] = { month: key, income: 0, expense: 0 };
      const type = (t.type || '').toLowerCase();
      const amount = Number(t.amount || 0);
      if (type === 'income') acc[key].income += amount;
      else if (type === 'expense') acc[key].expense += amount;
    });
    return Object.values(acc);
  };

  const processCategoryData = (transactions: any[]) => {
    const acc: any = {};
    transactions.forEach(t => {
      const name = t.category_name || t.category_id || 'Outros';
      if (!acc[name]) acc[name] = { name, value: 0 };
      acc[name].value += Number(t.amount || 0);
    });
    return Object.values(acc);
  };

  const processTeamData = (contracts: any[]) => {
    const acc: any = {};
    contracts.forEach(c => {
      const name = c.team_member_name || 'Equipe';
      acc[name] = (acc[name] || 0) + Number(c.total_amount || 0);
    });
    return Object.keys(acc).map(k => ({ name: k, value: acc[k] }));
  };

  const calculateBalance = (transactions: any[]) => {
    return transactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount || 0) : -Number(t.amount || 0)), 0);
  };

  const fetchDashboardData = async () => {
    try {
      // transactions
      const txCol = collection(db, 'transactions');
      let txQ: any = txCol;
      try { txQ = query(txCol, orderBy('date', 'asc')); } catch (_) { txQ = txCol; }
      const txSnap = await getDocs(txQ);
      const monthlyTransactions: any[] = txSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

      // categories (same as transactions)
      const categoryTransactions = monthlyTransactions;

      // team performance
      const cCol = collection(db, 'contracts');
      let perfQ: any = cCol;
      try { perfQ = query(cCol, where('event_completed', '==', true)); } catch (_) { perfQ = cCol; }
      const perfSnap = await getDocs(perfQ);
      const teamPerformance: any[] = perfSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

      // upcoming events
      let evQ: any = cCol;
      try { evQ = query(cCol, where('event_date', '>', new Date().toISOString()), orderBy('event_date', 'asc')); } catch (_) { evQ = cCol; }
      const evSnap = await getDocs(evQ);
      const events: any[] = evSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

      // Process and set data
      setMonthlyData(processMonthlyData(monthlyTransactions) as any);
      setCategoryData(processCategoryData(categoryTransactions) as any);
      setTeamData(processTeamData(teamPerformance) as any);
      setUpcomingEvents(events as any);
      setBalance(calculateBalance(monthlyTransactions));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Balance</p>
                <p className="text-2xl font-bold">${balance.toLocaleString()}</p>
              </div>
              <DollarSign className="text-green-500" size={24} />
            </div>
          </div>
          
          {/* Add more stat cards */}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Income/Expense Chart */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Monthly Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#10B981" />
                <Bar dataKey="expense" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Expense Categories</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Performance & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Team Performance</h2>
            <div className="space-y-4">
              {teamData.map((member) => (
                <div key={member.name} className="flex items-center justify-between">
                  <span>{member.name}</span>
                  <span className="text-green-500">${member.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{event.client_name}</p>
                    <p className="text-sm text-gray-400">{event.event_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${event.total_amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(event.event_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
