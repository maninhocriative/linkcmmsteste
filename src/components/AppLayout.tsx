import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from '@/components/AppSidebar';
import NotificationBell from '@/components/notifications/NotificationBell';
import hondaLogo from '@/assets/honda-logo.png';
import { Link } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {user && (
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar mobile / compact desktop */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 backdrop-blur-md px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <img src={hondaLogo} alt="Honda" className="h-8 w-auto" />
              <span className="text-sm font-semibold text-foreground">Manutenção</span>
            </Link>
            <span className="hidden lg:block text-sm font-medium text-muted-foreground">
              Sistema de Manutenção Honda
            </span>
          </div>
          <div className="flex items-center gap-2">
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
