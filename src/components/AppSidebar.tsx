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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import hondaLogo from '@/assets/honda-logo.png';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MANUTENCAO: 'Técnico',
  OPERACAO: 'Operação',
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
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, currentPath, onClose }) => {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      onClick={onClose}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
};

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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-card border-r border-border shadow-xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <Link to="/" onClick={onClose} className="flex items-center gap-3">
            <img src={hondaLogo} alt="Honda" className="h-9 w-auto" />
            <div>
              <h1 className="text-sm font-semibold leading-tight text-foreground">
                Manutenção
              </h1>
              <p className="text-[10px] text-muted-foreground">Honda Brasil</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.email}
                </p>
                {userRole && (
                  <Badge variant="outline" className="mt-0.5 text-[10px]">
                    <Shield className="mr-1 h-2.5 w-2.5" />
                    {ROLE_LABELS[userRole] || userRole}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            <NavItem to="/" icon={Home} label="Painel Inicial" currentPath={currentPath} onClose={onClose} />
            <NavItem to="/scan" icon={QrCode} label="Novo Chamado" currentPath={currentPath} onClose={onClose} />
            <NavItem to="/relatorios" icon={BarChart3} label="Relatórios" currentPath={currentPath} onClose={onClose} />
          </div>

          {(isAdmin || userRole === 'MANUTENCAO') && (
            <>
              <Separator className="my-4" />
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Planejamento
              </p>
              <div className="space-y-1">
                <NavItem to="/central-planejamento" icon={LayoutDashboard} label="Central de Planejamento" currentPath={currentPath} onClose={onClose} />
                <NavItem to="/planejamento" icon={ClipboardList} label="Planos de Manutenção" currentPath={currentPath} onClose={onClose} />
                <NavItem to="/compras" icon={ShoppingCart} label="Planej. de Compras" currentPath={currentPath} onClose={onClose} />
              </div>
            </>
          )}

          <Separator className="my-4" />
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cadastros
          </p>
          <div className="space-y-1">
            <NavItem to="/equipamentos" icon={Cpu} label="Equipamentos" currentPath={currentPath} onClose={onClose} />
            <NavItem to="/pecas" icon={Package} label="Peças" currentPath={currentPath} onClose={onClose} />
            <NavItem to="/servicos" icon={Settings} label="Serviços" currentPath={currentPath} onClose={onClose} />
          </div>

          <Separator className="my-4" />
          <div className="space-y-1">
            <NavItem to="/sobre" icon={Info} label="Sobre o Sistema" currentPath={currentPath} onClose={onClose} />
          </div>
        </ScrollArea>

        {/* Sign Out */}
        {user && (
          <div className="border-t border-border p-3">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default AppSidebar;
