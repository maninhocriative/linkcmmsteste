import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wrench, QrCode, Package, Settings, BarChart3, Menu, Info, ClipboardList } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-foreground">
              Sistema de Manutenção
            </h1>
            <p className="text-xs text-muted-foreground">Honda Brasil</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/sobre" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Sobre o Sistema
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
};

export default Header;
