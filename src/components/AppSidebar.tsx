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
  Shield,
  LayoutDashboard,
  X,
  ChevronRight,
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
  ADMIN: 'bg-info/15 text-info border-info/20',
  MANUTENCAO: 'bg-warning/15 text-warning border-warning/20',
  OPERACAO: 'bg-success/15 text-success border-success/20',
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
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-info" />
      )}
      <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-info' : 'text-sidebar-muted group-hover:text-sidebar-foreground'}`} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/20 px-1.5 text-[10px] font-bold text-destructive">
          {badge}
        </span>
      )}
      {isActive && <ChevronRight className="h-3.5 w-3.5 text-sidebar-muted" />}
    </Link>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mb-1.5 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-sidebar-muted">
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
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent">
              <Settings className="h-4 w-4 text-sidebar-foreground" />
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-sidebar-accent-foreground leading-none">
                Honda CMMS
              </h1>
              <p className="text-[10px] text-sidebar-muted mt-0.5">Sistema de Manutenção</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden h-7 w-7 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Card */}
        {user && (
          <div className="mx-3 mb-2 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
                <User className="h-3.5 w-3.5 text-sidebar-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-sidebar-accent-foreground">
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
        <ScrollArea className="flex-1 px-2">
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
            <NavItem to="/servicos" icon={Settings} label="Serviços" currentPath={currentPath} onClose={onClose} />
          </div>

          <SectionLabel>Sistema</SectionLabel>
          <div className="space-y-0.5">
            <NavItem to="/sobre" icon={Info} label="Sobre" currentPath={currentPath} onClose={onClose} />
          </div>
        </ScrollArea>

        {/* Sign Out */}
        {user && (
          <div className="p-3">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-muted transition-all hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair do sistema
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default AppSidebar;
