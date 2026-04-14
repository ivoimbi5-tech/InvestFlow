import { useState, useMemo, ReactNode, useEffect } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  Settings, 
  Plus, 
  ChevronRight,
  Wallet,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  X,
  Trash2,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Investment, BusinessVenture, FinancialProjection } from './types';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc
} from 'firebase/firestore';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const formatCurrency = (value: number) => {
  return `Kz ${value.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`;
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'investments' | 'business'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals state
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [isBizModalOpen, setIsBizModalOpen] = useState(false);

  // Data state
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [businesses, setBusinesses] = useState<BusinessVenture[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user) {
      setInvestments([]);
      setBusinesses([]);
      return;
    }

    const invQuery = query(collection(db, 'investments'), where('userId', '==', user.uid));
    const bizQuery = query(collection(db, 'businesses'), where('userId', '==', user.uid));

    const unsubInv = onSnapshot(invQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Investment));
      setInvestments(data);
    });

    const unsubBiz = onSnapshot(bizQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BusinessVenture));
      setBusinesses(data);
    });

    return () => {
      unsubInv();
      unsubBiz();
    };
  }, [user]);

  const totalInvested = useMemo(() => investments.reduce((acc, inv) => acc + inv.amount, 0), [investments]);
  const totalBusinessRevenue = useMemo(() => businesses.reduce((acc, b) => acc + b.monthlyRevenue, 0), [businesses]);
  const totalBusinessExpenses = useMemo(() => businesses.reduce((acc, b) => acc + b.monthlyExpenses, 0), [businesses]);
  const monthlyProfit = totalBusinessRevenue - totalBusinessExpenses;
  const totalEquity = totalInvested + businesses.reduce((acc, b) => acc + b.initialCapital, 0);

  const projections: FinancialProjection[] = useMemo(() => {
    const data: FinancialProjection[] = [];
    let currentBalance = totalEquity;
    
    if (totalEquity === 0 && monthlyProfit === 0) return [];

    for (let i = 0; i < 12; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      const monthName = month.toLocaleString('pt-BR', { month: 'short' });
      
      const growth = currentBalance * 0.01;
      currentBalance += growth + monthlyProfit;
      
      data.push({
        month: monthName,
        balance: Math.round(currentBalance),
        investmentGrowth: Math.round(growth),
        businessProfit: monthlyProfit
      });
    }
    return data;
  }, [totalEquity, monthlyProfit]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const addInvestment = async (inv: Omit<Investment, 'id' | 'date'>) => {
    if (!user || !inv.name || inv.amount <= 0) return;
    try {
      await addDoc(collection(db, 'investments'), {
        ...inv,
        userId: user.uid,
        date: new Date().toISOString()
      });
      setIsInvModalOpen(false);
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  const addBusiness = async (biz: Omit<BusinessVenture, 'id' | 'status'>) => {
    if (!user || !biz.name || biz.initialCapital < 0) return;
    try {
      await addDoc(collection(db, 'businesses'), {
        ...biz,
        userId: user.uid,
        status: 'active'
      });
      setIsBizModalOpen(false);
    } catch (error) {
      console.error('Error adding business:', error);
    }
  };

  const deleteInvestment = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este investimento?')) {
      try {
        await deleteDoc(doc(db, 'investments', id));
      } catch (error) {
        console.error('Error deleting investment:', error);
      }
    }
  };

  const deleteBusiness = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este empreendimento?')) {
      try {
        await deleteDoc(doc(db, 'businesses', id));
      } catch (error) {
        console.error('Error deleting business:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6 border border-gray-100"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <TrendingUp size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">InvestFlow</h1>
            <p className="text-gray-500">Gerencie seus investimentos e negócios em um só lugar.</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 py-3 rounded-2xl font-semibold hover:bg-gray-50 transition-all active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            Entrar com Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
          <TrendingUp size={24} />
          <span>InvestFlow</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 hidden md:block">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <TrendingUp size={20} />
            </div>
            <span>InvestFlow</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); closeMobileMenu(); }} 
          />
          <NavItem 
            icon={<Wallet size={20} />} 
            label="Investimentos" 
            active={activeTab === 'investments'} 
            onClick={() => { setActiveTab('investments'); closeMobileMenu(); }} 
          />
          <NavItem 
            icon={<Briefcase size={20} />} 
            label="Empreendimentos" 
            active={activeTab === 'business'} 
            onClick={() => { setActiveTab('business'); closeMobileMenu(); }} 
          />
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-gray-200" />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.displayName}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 px-8 items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold capitalize">
            {activeTab === 'dashboard' ? 'Visão Geral' : activeTab}
          </h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => activeTab === 'investments' ? setIsInvModalOpen(true) : activeTab === 'business' ? setIsBizModalOpen(true) : setIsInvModalOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Plus size={20} />
            </button>
            <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
              <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 md:space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <StatCard 
                    title="Patrimônio Total" 
                    value={totalEquity} 
                    trend="+12.5%" 
                    trendUp={true}
                    icon={<BarChart3 className="text-blue-600" />}
                  />
                  <StatCard 
                    title="Investimentos" 
                    value={totalInvested} 
                    trend="+2.3%" 
                    trendUp={true}
                    icon={<Wallet className="text-emerald-600" />}
                  />
                  <StatCard 
                    title="Lucro Mensal (Negócios)" 
                    value={monthlyProfit} 
                    trend="+8.1%" 
                    trendUp={true}
                    icon={<Briefcase className="text-amber-600" />}
                  />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-6 uppercase tracking-wider">Projeção de Crescimento (12 meses)</h3>
                    <div className="h-64 md:h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projections}>
                          <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} tickFormatter={(value) => `Kz ${value/1000}k`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                            formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                          />
                          <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-6 uppercase tracking-wider">Distribuição de Ativos</h3>
                    <div className="h-64 md:h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Renda Fixa', value: investments.filter(i => i.type === 'fixed').reduce((a, b) => a + b.amount, 0) },
                              { name: 'Renda Variável', value: investments.filter(i => i.type === 'variable').reduce((a, b) => a + b.amount, 0) },
                              { name: 'Cripto', value: investments.filter(i => i.type === 'crypto').reduce((a, b) => a + b.amount, 0) },
                              { name: 'Negócios', value: businesses.reduce((a, b) => a + b.initialCapital, 0) },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-sm md:text-base">Atividades Recentes</h3>
                    <button className="text-xs md:text-sm text-blue-600 font-medium hover:underline">Ver tudo</button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {investments.length === 0 && (
                      <div className="p-8 text-center text-gray-400 text-sm">Nenhuma atividade recente</div>
                    )}
                    {investments.slice(-5).reverse().map(inv => (
                      <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <ArrowUpRight size={16} className="md:size-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm md:text-base">{inv.name}</p>
                            <p className="text-[10px] md:text-xs text-gray-500">{inv.type === 'fixed' ? 'Renda Fixa' : 'Renda Variável'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-600 text-sm md:text-base">+ {formatCurrency(inv.amount)}</p>
                          <p className="text-[10px] md:text-xs text-gray-500">{new Date(inv.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'investments' && (
              <motion.div
                key="investments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl md:text-2xl font-bold">Meus Investimentos</h2>
                  <button 
                    onClick={() => setIsInvModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus size={18} /> Novo Investimento
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {investments.length === 0 && (
                    <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400">
                      Nenhum investimento cadastrado.
                    </div>
                  )}
                  {investments.map(inv => (
                    <div key={inv.id} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4 group">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                          <Wallet size={20} className="md:size-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base md:text-lg">{inv.name}</h4>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] md:text-[10px] rounded uppercase font-bold tracking-wider">
                            {inv.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 sm:text-right">
                        <div>
                          <p className="text-xl md:text-2xl font-bold">{formatCurrency(inv.amount)}</p>
                          <p className="text-[10px] md:text-sm text-gray-500">Adicionado em {new Date(inv.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <button 
                          onClick={() => deleteInvestment(inv.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'business' && (
              <motion.div
                key="business"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl md:text-2xl font-bold">Meus Empreendimentos</h2>
                  <button 
                    onClick={() => setIsBizModalOpen(true)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-amber-700 transition-colors text-sm"
                  >
                    <Plus size={18} /> Novo Negócio
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {businesses.length === 0 && (
                    <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400">
                      Nenhum empreendimento cadastrado.
                    </div>
                  )}
                  {businesses.map(b => (
                    <div key={b.id} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 group relative">
                      <button 
                        onClick={() => deleteBusiness(b.id)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg md:text-xl">{b.name}</h4>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] md:text-xs rounded-full font-medium">
                          {b.status === 'active' ? 'Ativo' : 'Planejamento'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Receita Mensal</p>
                          <p className="text-sm md:text-lg font-bold text-emerald-600 truncate">{formatCurrency(b.monthlyRevenue)}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Despesa Mensal</p>
                          <p className="text-sm md:text-lg font-bold text-rose-600 truncate">{formatCurrency(b.monthlyExpenses)}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-500">Lucro Líquido</p>
                          <p className="font-bold text-gray-900 text-sm md:text-base">{formatCurrency(b.monthlyRevenue - b.monthlyExpenses)}</p>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                          <ChevronRight size={18} className="md:size-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <InvestmentModal isOpen={isInvModalOpen} onClose={() => setIsInvModalOpen(false)} onSave={addInvestment} />
      <BusinessModal isOpen={isBizModalOpen} onClose={() => setIsBizModalOpen(false)} onSave={addBusiness} />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-blue-50 text-blue-600 font-semibold' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="activeNav"
          className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"
        />
      )}
    </button>
  );
}

function StatCard({ title, value, trend, trendUp, icon }: { title: string, value: number, trend: string, trendUp: boolean, icon: ReactNode }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] md:text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trendUp ? <ArrowUpRight size={12} className="md:size-3.5" /> : <ArrowDownRight size={12} className="md:size-3.5" />}
          {trend}
        </div>
      </div>
      <p className="text-xs md:text-sm text-gray-500 font-medium mb-1">{title}</p>
      <h2 className="text-xl md:text-2xl font-bold truncate">{formatCurrency(value)}</h2>
    </div>
  );
}

function InvestmentModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (inv: any) => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'fixed' | 'variable' | 'crypto' | 'other'>('fixed');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Novo Investimento</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Ativo</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tesouro Direto, Bitcoin..."
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (Kz)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="fixed">Renda Fixa</option>
              <option value="variable">Renda Variável</option>
              <option value="crypto">Criptomoeda</option>
              <option value="other">Outros</option>
            </select>
          </div>
          <button 
            onClick={() => onSave({ name, amount: Number(amount), type })}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors mt-4"
          >
            Salvar Investimento
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BusinessModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (biz: any) => void }) {
  const [name, setName] = useState('');
  const [capital, setCapital] = useState('');
  const [revenue, setRevenue] = useState('');
  const [expenses, setExpenses] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-amber-600">Novo Empreendimento</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Negócio</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Loja Online, Consultoria..."
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capital Inicial (Kz)</label>
            <input 
              type="number" 
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receita Mensal</label>
              <input 
                type="number" 
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Despesa Mensal</label>
              <input 
                type="number" 
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
          <button 
            onClick={() => onSave({ name, initialCapital: Number(capital), monthlyRevenue: Number(revenue), monthlyExpenses: Number(expenses) })}
            className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors mt-4"
          >
            Salvar Negócio
          </button>
        </div>
      </motion.div>
    </div>
  );
}
