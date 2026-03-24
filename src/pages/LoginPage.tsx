import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Mail, Lock, LogIn, AlertCircle, Wrench } from 'lucide-react';
import { toast } from 'sonner';


const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError('Email ou senha inválidos. Tente novamente.');
      setLoading(false);
    } else {
      toast.success('Login realizado com sucesso!');
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-primary p-10 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Wrench className="h-6 w-6" />
          <span className="text-lg font-bold">CMMS</span>
        </div>
        <div className="space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur">
            <Wrench className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold leading-tight">
            Sistema de<br />Manutenção<br />Industrial
          </h2>
          <p className="text-primary-foreground/70 max-w-sm text-sm leading-relaxed">
            Gerencie ordens de serviço, controle estoque de peças e planeje manutenções preventivas em uma única plataforma.
          </p>
        </div>
        <p className="text-[11px] text-primary-foreground/40">
          © {new Date().getFullYear()} Honda Brasil · Sistema interno
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex flex-col items-center lg:hidden mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-1">
              <Wrench className="h-7 w-7" />
            </div>
            <h1 className="text-lg font-bold text-foreground">CMMS</h1>
            <p className="text-xs text-muted-foreground">Sistema de Manutenção</p>
          </div>

          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Faça login para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg bg-destructive/8 border border-destructive/20 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 gap-2 shadow-premium-md font-semibold" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link to="/registro" className="font-semibold text-foreground hover:underline">
                Cadastre-se
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
