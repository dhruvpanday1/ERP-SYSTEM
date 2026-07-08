import { useState, useEffect } from 'react';
import {
  Package,
  Building2,
  UserCheck,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  Plus,
  Tag,
  Database,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  dashboardStats as mockStats,
  orderTrendsData as orderTrendsDataMock,
  revenueByCategoryData as revenueByCategoryDataMock,
  recentOrders as recentOrdersMock,
  activityFeed as activityFeedMock,
} from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const statusMap = {
  'In Production': { badge: 'badge-violet', dot: '#8b5cf6' },
  'Shipped': { badge: 'badge-sky', dot: '#0ea5e9' },
  'Pending': { badge: 'badge-amber', dot: '#f59e0b' },
  'Delivered': { badge: 'badge-mint', dot: '#10b981' },
  'Quality Check': { badge: 'badge-coral', dot: '#f43f5e' },
};

const activityIcons = {
  order: ShoppingCart,
  quality: CheckCircle2,
  shipping: Truck,
  product: Plus,
  supplier: Building2,
  price: Tag,
};

const activityColors = {
  order: '#8b5cf6',
  quality: '#10b981',
  shipping: '#0ea5e9',
  product: '#f43f5e',
  supplier: '#f59e0b',
  price: '#ec4899',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-2xl px-4 py-3 shadow-float border border-surface-100">
        <p className="text-xs font-semibold text-surface-500 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name === 'revenue' ? `${String.fromCodePoint(8377)}${(entry.value / 100000).toFixed(1)}L` : `${entry.value} orders`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(mockStats);
  const [revenueByCategoryData, setRevenueByCategoryData] = useState(revenueByCategoryDataMock);
  const [orderTrends, setOrderTrends] = useState(orderTrendsDataMock);
  const [recentOrdersList, setRecentOrdersList] = useState(recentOrdersMock);
  const [activities, setActivities] = useState(activityFeedMock);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => { 
        setStats(data);
        if (data.revenueByCategoryData) setRevenueByCategoryData(data.revenueByCategoryData);
        if (data.orderTrendsData) setOrderTrends(data.orderTrendsData);
        if (data.recentOrders) setRecentOrdersList(data.recentOrders);
        if (data.activityFeed) setActivities(data.activityFeed);
        setIsLive(true); 
      })
      .catch(() => {
        setStats(mockStats);
        setRevenueByCategoryData(revenueByCategoryDataMock);
        setOrderTrends(orderTrendsDataMock);
        setRecentOrdersList(recentOrdersMock);
        setActivities(activityFeedMock);
      });
  }, []);

  const statCards = [
    { label: 'Finished Goods', value: stats.totalFinishedGoods?.toLocaleString(), icon: Package,      trend: '+12.5%', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', blobColor: '#8b5cf6' },
    { label: 'Suppliers',      value: stats.totalSuppliers?.toLocaleString(),      icon: Building2,    trend: '+3 new',  gradient: 'linear-gradient(135deg, #f43f5e, #fb7185)', blobColor: '#f43f5e' },
    { label: 'Buyers',         value: stats.totalBuyers?.toLocaleString(),         icon: UserCheck,    trend: '+2 new',  gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', blobColor: '#0ea5e9' },
    { label: 'Total Orders',   value: stats.totalOrders?.toLocaleString(),         icon: ShoppingCart, trend: '+8.3%',  gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', blobColor: '#f59e0b' },
    { label: 'Revenue',        value: `${String.fromCodePoint(8377)}${((stats.totalRevenue||0)/100000).toFixed(1)}L`, icon: IndianRupee, trend: '+15.2%', gradient: 'linear-gradient(135deg, #10b981, #34d399)', blobColor: '#10b981' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Live indicator */}
      <div className="flex justify-end">
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${isLive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
          <Database className="w-3 h-3" />
          {isLive ? 'Live — Supabase' : 'Demo data'}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-stagger">
        {statCards.map((card) => (
          <div key={card.label} className="stat-gem p-5" id={`stat-${card.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="gem-blob w-24 h-24 -top-4 -right-4" style={{ background: card.blobColor }}></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: card.gradient }}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <TrendingUp className="w-3 h-3" />
                  {card.trend}
                </div>
              </div>
              <p className="text-3xl font-extrabold text-surface-900 tracking-tight" style={{ letterSpacing: '-0.04em' }}>{card.value}</p>
              <p className="text-xs font-medium text-surface-400 mt-1">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-4 premium-card p-6" id="order-trends-chart">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold text-surface-900 tracking-tight">Order Trends</h3>
              <p className="text-xs text-surface-400 mt-0.5">Monthly order volume — 2025</p>
            </div>
            <div className="flex gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#8b5cf6' }}></span><span className="text-surface-400 font-medium">Orders</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#f43f5e' }}></span><span className="text-surface-400 font-medium">Revenue</span></span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={orderTrends}>
              <defs>
                <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#8892a6', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8892a6', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="orders" stroke="#8b5cf6" fill="url(#orderGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-3 premium-card p-6" id="revenue-category-chart">
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-surface-900 tracking-tight">Revenue by Category</h3>
            <p className="text-xs text-surface-400 mt-0.5">Product type distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByCategoryData} layout="vertical" barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#8892a6', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${String.fromCodePoint(8377)}${(v/100000).toFixed(1)}L`} />
              <YAxis type="category" dataKey="category" tick={{ fill: '#3d4659', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={78} />
              <Tooltip content={({ active, payload }) => { if (active && payload?.length) { return (<div className="bg-white rounded-2xl px-4 py-3 shadow-float border border-surface-100"><p className="text-sm font-bold text-surface-900">{String.fromCodePoint(8377)}{(payload[0].value / 100000).toFixed(1)}L</p></div>); } return null; }} />
              <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={18}>
                {revenueByCategoryData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 premium-card p-6" id="recent-orders-table">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-bold text-surface-900 tracking-tight">Recent Orders</h3>
              <p className="text-xs text-surface-400 mt-0.5">Latest activity</p>
            </div>
            <button className="btn-secondary text-xs flex items-center gap-1.5">View All <ArrowUpRight className="w-3 h-3" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left text-[10px] font-bold text-surface-400 uppercase tracking-wider pb-3 pr-4">Order</th>
                  <th className="text-left text-[10px] font-bold text-surface-400 uppercase tracking-wider pb-3 pr-4">Buyer</th>
                  <th className="text-left text-[10px] font-bold text-surface-400 uppercase tracking-wider pb-3 pr-4">Items</th>
                  <th className="text-left text-[10px] font-bold text-surface-400 uppercase tracking-wider pb-3 pr-4">Total</th>
                  <th className="text-left text-[10px] font-bold text-surface-400 uppercase tracking-wider pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrdersList.map((order) => {
                  const s = statusMap[order.status] || statusMap['Pending'];
                  return (
                    <tr key={order.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                      <td className="py-3.5 pr-4"><span className="text-sm font-semibold text-primary-600">{order.id}</span></td>
                      <td className="py-3.5 pr-4 text-sm text-surface-700 font-medium">{order.buyer}</td>
                      <td className="py-3.5 pr-4 text-sm text-surface-500">{order.items}</td>
                      <td className="py-3.5 pr-4 text-sm font-bold text-surface-800">{String.fromCodePoint(8377)}{order.total.toLocaleString('en-IN')}</td>
                      <td className="py-3.5">
                        <span className={`badge ${s.badge}`}>
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: s.dot }}></span>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2 premium-card p-6" id="activity-feed">
          <div className="mb-5">
            <h3 className="text-[15px] font-bold text-surface-900 tracking-tight">Activity Feed</h3>
            <p className="text-xs text-surface-400 mt-0.5">Real-time updates</p>
          </div>
          <div className="space-y-3.5">
            {activities.map((item) => {
              const Icon = activityIcons[item.type] || Clock;
              const color = activityColors[item.type] || '#8892a6';
              return (
                <div key={item.id} className="flex items-start gap-3 group p-2.5 -mx-2.5 rounded-xl hover:bg-surface-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}10` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-800">{item.action}</p>
                    <p className="text-xs text-surface-400 truncate">{item.detail}</p>
                  </div>
                  <span className="text-[10px] text-surface-300 whitespace-nowrap shrink-0 mt-1 font-medium">{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
