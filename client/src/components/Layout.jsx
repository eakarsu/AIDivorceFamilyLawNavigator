import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { features } from '../App';
import {
  Scale, LayoutDashboard, LogOut, Menu, X, Sparkles,
  FileSearch, PieChart, Users, DollarSign, FileText, MessageCircle,
  Gavel, BarChart3, Heart, Home, Handshake, Calculator, Calendar,
  BookOpen, ChevronRight, Bot
} from 'lucide-react';

const iconMap = {
  FileSearch, PieChart, Users, DollarSign, FileText, MessageCircle,
  Gavel, BarChart3, Heart, Home, Scale, Handshake, Calculator, Calendar, BookOpen
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItem = (path, label, Icon, extraClass = '') => (
    <button
      key={path}
      onClick={() => { navigate(path); setMobileOpen(false); }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive(path)
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
      } ${extraClass}`}
    >
      <Icon size={18} className="flex-shrink-0" />
      {sidebarOpen && <span className="truncate">{label}</span>}
    </button>
  );

  const sidebar = (
    <div className={`flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 ${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300`}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <Scale className="text-blue-400 flex-shrink-0" size={24} />
        {sidebarOpen && (
          <div>
            <h1 className="text-white font-bold text-sm">AI Family Law</h1>
            <p className="text-gray-400 text-xs">Navigator</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItem('/', 'Dashboard', LayoutDashboard)}

        {sidebarOpen && (
          <div className="pt-3 pb-1 px-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Features</p>
          </div>
        )}

        {features.map(f => {
          const Icon = iconMap[f.icon] || FileText;
          return navItem(`/${f.path}`, f.title, Icon);
        })}

        {sidebarOpen && (
          <div className="pt-3 pb-1 px-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Tools</p>
          </div>
        )}

        <button
          onClick={() => { navigate('/ai-center'); setMobileOpen(false); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive('/ai-center')
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 hover:from-purple-600/40 hover:to-blue-600/40 hover:text-white border border-purple-500/30'
          }`}
        >
          <Sparkles size={18} className="flex-shrink-0" />
          {sidebarOpen && (
            <>
              <span className="truncate">AI Center</span>
              <Bot size={14} className="ml-auto flex-shrink-0 animate-pulse" />
            </>
          )}
        </button>
      </div>

      <div className="border-t border-white/10 p-3">
        {sidebarOpen && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition text-sm"
        >
          <LogOut size={18} />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col relative">
        {sidebar}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-8 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 hover:bg-blue-600 hover:text-white transition z-10 border-2 border-gray-800"
        >
          <ChevronRight size={14} className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64">{sidebar}</div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <h1 className="font-semibold text-gray-800">AI Family Law Navigator</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
