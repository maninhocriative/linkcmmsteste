import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, LogIn, AlertCircle, Settings, Cpu, ClipboardList, BarChart3 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.session) {
      setError('Email ou senha inválidos. Tente novamente.');
      setLoading(false);
      return;
    }

    // Login bem sucedido — redireciona
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between bg-[#0f1117] p-10 border-r border-white/8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <span className="text-[12px] font-black text-white tracking-tight">CM</span>
          </div>
          <div>
            <span className="text-[14px] font-bold text-white">CMMS</span>
            <p className="text-[10px] text-white/40 leading-none mt-0.5">Honda Brasil</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Sistema de<br />Manutenção<br />Industrial
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Gerencie ordens de serviço, controle estoque de peças e planeje manutenções preventivas em uma única plataforma.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ClipboardList, label: 'Ordens de Serviço', desc: 'Abertura via QR Code' },
              { icon: Settings, label: 'Manutenção', desc: 'Preventiva e corretiva' },
              { icon: Cpu, label: 'Equipamentos', desc: 'Gestão de ativos' },
              { icon: BarChart3, label: 'Relatórios', desc: 'Indicadores em tempo real' },
            ].map((f, i) => (
              <div key={i} className="rounded-xl bg-white/5 border border-white/8 p-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 mb-2">
                  <f.icon className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <p className="text-[12px] font-semibold text-white">{f.label}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-white/25">© {new Date().getFullYear()} Honda Brasil · Sistema interno</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-7">
          <div className="flex flex-col items-center lg:hidden mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 mb-2">
              <span className="text-[14px] font-black text-white">CM</span>
            </div>
            <h1 className="text-base font-bold text-foreground">CMMS</h1>
            <p className="text-xs text-muted-foreground">Sistema de Manutenção Honda</p>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
            <p className="mt-1 text-sm text-muted-foreground">Faça login para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-500/8 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground/80">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 h-11 border-border/60" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground/80">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 h-11 border-border/60" required />
              </div>
            </div>
            <Button type="submit"
              className="w-full h-11 gap-2 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link to="/registro" className="font-semibold text-blue-600 hover:text-blue-500">Cadastre-se</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
