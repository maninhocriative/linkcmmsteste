import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  QrCode,
  BarChart3,
  ClipboardList,
  ShoppingCart,
  Package,
  Settings,
  Cpu,
  Info,
  LogOut,
  User,
  LayoutDashboard,
  X,
  ChevronRight,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MANUTENCAO: 'Técnico',
  OPERACAO: 'Operação',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MANUTENCAO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  OPERACAO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  currentPath: string;
  onClose: () => void;
  badge?: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, currentPath, onClose, badge }) => {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      onClick={onClose}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
        isActive
          ? 'bg-white/10 text-white'
          : 'text-white/60 hover:bg-white/8 hover:text-white/90'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-400" />
      )}
      <Icon className={`h-[17px] w-[17px] shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-white/40 group-hover:text-white/70'}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/20 px-1.5 text-[10px] font-bold text-red-400">
          {badge}
        </span>
      )}
      {isActive && <ChevronRight className="h-3 w-3 text-white/30" />}
    </Link>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mb-1 mt-5 px-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
    {children}
  </p>
);

const AppSidebar: React.FC<AppSidebarProps> = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut, isAdmin } = useAuth();
  const currentPath = location.pathname;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-white/8 bg-[#0f1117] transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/30">
              <span className="text-[11px] font-black text-white tracking-tight">CM</span>
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-white leading-none">CMMS</h1>
              <p className="text-[10px] text-white/40 mt-0.5">Sistema de Manutenção</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Card */}
        {user && (
          <div className="mx-3 mt-3 rounded-lg bg-white/5 p-2.5 border border-white/8">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/30">
                <User className="h-3 w-3 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-white">
                  {user.email?.split('@')[0]}
                </p>
                {userRole && (
                  <Badge className={`mt-0.5 text-[9px] font-bold border px-1.5 py-0 h-4 ${ROLE_COLORS[userRole] || ''}`}>
                    {ROLE_LABELS[userRole] || userRole}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 mt-1">
          <SectionLabel>Geral</SectionLabel>
          <div className="space-y-0.5">
            <NavItem to="/" icon={Home} label="Painel Inicial" currentPath={currentPath} onClose={onClose} />
            <NavItem to="/scan" icon={QrCode} label="Novo Chamado" currentPath={currentPath} onClose={onClose} />
            <NavItem to="/relatorios" icon={BarChart3} label="Relatórios" currentPath={currentPath} onClose={onClose} />
          </div>

          {(isAdmin || userRole === 'MANUTENCAO') && (
            <>
              <SectionLabel>Planejamento</SectionLabel>
              <div className="space-y-0.5">
                <NavItem to="/central-planejamento" icon={LayoutDashboard} label="Central de Planejamento" currentPath={currentPath} onClose={onClose} />
                <NavItem to="/planejamento" icon={ClipboardList} label="Planos de Manutenção" currentPath={currentPath} onClose={onClose} />
                <NavItem to="/compras" icon={ShoppingCart} label="Planej. de Compras" currentPath={currentPath} onClose={onClose} />
              </div>
            </>
          )}

          <SectionLabel>Cadastros</SectionLabel>
          <div className="space-y-0.5">
            <NavItem to="/equipamentos" icon={Cpu} label="Equipamentos" currentPath={currentPath} onClose={onClose} />
            <NavItem to="/pecas" icon={Package} label="Peças e Estoque" currentPath={currentPath} onClose={onClose} />
            <NavItem to="/servicos" icon={Wrench} label="Serviços" currentPath={currentPath} onClose={onClose} />
          </div>

          <SectionLabel>Sistema</SectionLabel>
          <div className="space-y-0.5">
            <NavItem to="/sobre" icon={Info} label="Sobre" currentPath={currentPath} onClose={onClose} />
          </div>
        </ScrollArea>

        {/* Sign Out */}
        {user && (
          <div className="p-3 border-t border-white/8">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-white/40 transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair do sistema
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default AppSidebar;
