import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { features } from '../App';
import {
  FileSearch, PieChart, Users, DollarSign, FileText, MessageCircle,
  Gavel, BarChart3, Heart, Home, Scale, Handshake, Calculator, Calendar,
  BookOpen, Sparkles, ArrowRight
} from 'lucide-react';

const iconMap = {
  FileSearch, PieChart, Users, DollarSign, FileText, MessageCircle,
  Gavel, BarChart3, Heart, Home, Scale, Handshake, Calculator, Calendar, BookOpen
};

const colorMap = {
  FileSearch: 'from-blue-500 to-blue-600',
  PieChart: 'from-emerald-500 to-emerald-600',
  Users: 'from-purple-500 to-purple-600',
  DollarSign: 'from-amber-500 to-amber-600',
  FileText: 'from-indigo-500 to-indigo-600',
  MessageCircle: 'from-teal-500 to-teal-600',
  Gavel: 'from-red-500 to-red-600',
  BarChart3: 'from-cyan-500 to-cyan-600',
  Heart: 'from-pink-500 to-pink-600',
  Home: 'from-orange-500 to-orange-600',
  Scale: 'from-violet-500 to-violet-600',
  Handshake: 'from-lime-600 to-lime-700',
  Calculator: 'from-sky-500 to-sky-600',
  Calendar: 'from-rose-500 to-rose-600',
  BookOpen: 'from-fuchsia-500 to-fuchsia-600',
};

const descriptions = {
  documents: 'Upload and analyze legal documents with AI-powered insights',
  assets: 'Calculate fair division of marital assets and property',
  custody: 'Get AI guidance on child custody arrangements',
  alimony: 'Estimate spousal support based on your situation',
  'document-gen': 'Generate professional legal document templates',
  mediation: 'Prepare for mediation with AI-powered coaching',
  filing: 'Step-by-step court filing procedures and guidance',
  financial: 'Organize and analyze financial disclosures',
  parenting: 'Create comprehensive parenting plans',
  property: 'Assess and divide marital property fairly',
  rights: 'Understand your legal rights in divorce',
  settlement: 'Build and evaluate settlement agreements',
  'child-support': 'Calculate child support obligations',
  timeline: 'Plan your divorce process timeline',
  glossary: 'AI-explained legal terminology dictionary',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-blue-100 text-lg mb-4">Your AI-powered legal navigator is ready to assist you.</p>
        <button
          onClick={() => navigate('/ai-center')}
          className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold transition border border-white/20"
        >
          <Sparkles size={20} />
          Open AI Center
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => {
          const Icon = iconMap[f.icon] || FileText;
          const gradient = colorMap[f.icon] || 'from-gray-500 to-gray-600';
          return (
            <button
              key={f.path}
              onClick={() => navigate(`/${f.path}`)}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 text-left group border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} mb-4 shadow-lg`}>
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {descriptions[f.path] || 'AI-powered legal assistance'}
              </p>
              <div className="flex items-center gap-1 mt-3 text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                Open <ArrowRight size={14} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
