import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from '@/components/AppSidebar';
import NotificationBell from '@/components/notifications/NotificationBell';
import { Link, useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Painel Inicial',
  '/scan': 'Novo Chamado',
  '/relatorios': 'Relatórios',
  '/central-planejamento': 'Central de Planejamento',
  '/planejamento': 'Planos de Manutenção',
  '/compras': 'Planej. de Compras',
  '/equipamentos': 'Equipamentos',
  '/pecas': 'Peças e Estoque',
  '/servicos': 'Serviços',
  '/sobre': 'Sobre o Sistema',
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || '';

  return (
    <div className="flex min-h-screen w-full bg-background">
      {user && (
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-xl px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            {/* Mobile logo */}
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-[10px] font-black text-white">CM</span>
              </div>
            </Link>
            {pageTitle && (
              <h2 className="hidden lg:block text-sm font-semibold text-foreground/80">
                {pageTitle}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-1">
            {user && <NotificationBell />}
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
