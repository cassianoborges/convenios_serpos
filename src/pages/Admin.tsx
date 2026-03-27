import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Handshake, Building2, LogOut, ChevronRight, ExternalLink, BarChart2, Users, Tag
} from 'lucide-react';

import logoSerpos from '@/assets/logo_serpos.jpeg';
import { useAuth } from '@/context/AuthContext';
import { ConvenioTable } from '@/components/admin/ConvenioTable';
import { UnidadeManager } from '@/components/admin/UnidadeManager';
import { Analytics } from '@/components/admin/Analytics';
import { UserManager } from '@/components/admin/UserManager';
import { CategoriaManager } from '@/components/admin/CategoriaManager';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

type Tab = 'convenios' | 'unidades' | 'analytics' | 'usuarios' | 'categorias';

const Admin = () => {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('convenios');

    const { data: conveniosStats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => api.get('/convenios?limit=1').then(r => r.data),
    });
    const { data: unidadesData } = useQuery({
        queryKey: ['unidades'],
        queryFn: () => api.get('/unidades').then(r => r.data),
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'convenios', label: 'Convênios', icon: <Handshake className="w-4 h-4" /> },
        { id: 'unidades', label: 'Unidades', icon: <Building2 className="w-4 h-4" /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
        { id: 'usuarios', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
        { id: 'categorias', label: 'Categorias', icon: <Tag className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen bg-[#0d1220]">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-40 hidden lg:flex flex-col">
                {/* Logo */}
                <div className="p-5 border-b border-slate-800 flex justify-center">
                    <img src={logoSerpos} alt="Grupo Serpos" className="h-10 object-contain" />
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                        </button>
                    ))}
                </nav>

                {/* User / Actions */}
                <div className="p-4 border-t border-slate-800 space-y-2">
                    <a
                        href="/"
                        target="_blank"
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Ver Site Público
                    </a>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-400/10 transition-all text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:ml-64">
                {/* Top bar */}
                <header className="sticky top-0 bg-[#0d1220]/90 backdrop-blur-md border-b border-slate-800 z-30 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-white font-bold text-lg capitalize">
                            {activeTab === 'convenios' ? 'Convênios' : activeTab === 'unidades' ? 'Unidades' : activeTab === 'analytics' ? 'Analytics' : activeTab === 'usuarios' ? 'Usuários' : 'Categorias'}
                        </h1>
                        <p className="text-slate-500 text-xs">Grupo Serpos</p>
                    </div>
                    {/* Mobile tabs */}
                    <div className="flex items-center gap-2 lg:hidden">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                    {/* Admin info */}
                    <div className="hidden lg:flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-white text-sm font-medium">{admin?.nome}</p>
                            <p className="text-slate-500 text-xs">{admin?.email}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                            {admin?.nome?.[0]?.toUpperCase() ?? 'A'}
                        </div>
                    </div>
                </header>

                {/* Stats bar */}
                <div className="px-6 py-4 border-b border-slate-800/50 flex gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{conveniosStats?.total ?? '—'}</p>
                        <p className="text-xs text-slate-500">Convênios Ativos</p>
                    </div>
                    <div className="w-px bg-slate-800" />
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{Array.isArray(unidadesData) ? unidadesData.length : '—'}</p>
                        <p className="text-xs text-slate-500">Unidades</p>
                    </div>
                </div>

                {/* Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                >
                    {activeTab === 'convenios' && <ConvenioTable />}
                    {activeTab === 'unidades' && <UnidadeManager />}
                    {activeTab === 'analytics' && <Analytics />}
                    {activeTab === 'usuarios' && <UserManager />}
                    {activeTab === 'categorias' && <CategoriaManager />}
                </motion.div>
            </div>
        </div>
    );
};

export default Admin;
