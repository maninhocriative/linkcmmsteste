import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, Package, Settings, BarChart3, Menu, Info, ClipboardList, LogOut, User, Shield, Cpu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';
import { Badge } from '@/components/ui/badge';
import hondaLogo from '@/assets/honda-logo.png';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MANUTENCAO: 'Técnico',
  OPERACAO: 'Operação',
};

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={hondaLogo} alt="Honda" className="h-10 w-auto" />
          <div>
            <h1 className="text-lg font-semibold leading-tight text-foreground">
              Sistema de Manutenção
            </h1>
            <p className="text-xs text-muted-foreground">Honda Brasil</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {user && (
            <>
              <Link
                to="/scan"
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/scan'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Chamado</span>
              </Link>

              <Link
                to="/relatorios"
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/relatorios'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </Link>

              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm">{user.email}</span>
                      {userRole && (
                        <Badge variant="outline" className="mt-1 w-fit text-xs">
                          <Shield className="mr-1 h-3 w-3" />
                          {ROLE_LABELS[userRole] || userRole}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Planejamento</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/planejamento" className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Planos de Manutenção
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Cadastros</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/pecas" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Peças
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/servicos" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Serviços
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/equipamentos" className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      Equipamentos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/sobre" className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Sobre o Sistema
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!user && !loading && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link to="/registro">Cadastrar</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
