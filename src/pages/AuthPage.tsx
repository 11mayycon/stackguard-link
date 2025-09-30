import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Package, CreditCard, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';

const authSchema = z.object({
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(11, 'CPF deve ter 11 dígitos'),
  nomeCompleto: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [cpf, setCpf] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signInWithCpf, signUpWithCpf, profile } = useAuth();
  const { toast } = useToast();

  if (profile) {
    return <Navigate to="/" replace />;
  }

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 11);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanCpf = cpf.replace(/\D/g, '');
      
      const data = {
        cpf: cleanCpf,
        ...(isLogin ? {} : { nomeCompleto: nomeCompleto.trim() })
      };

      const validation = authSchema.safeParse(data);
      if (!validation.success) {
        const errors = validation.error.format();
        toast({
          title: "Erro de validação",
          description: Object.values(errors).flat().filter(err => typeof err === 'string').join(', '),
          variant: "destructive"
        });
        return;
      }

      let result;
      if (isLogin) {
        result = await signInWithCpf(cleanCpf);
      } else {
        result = await signUpWithCpf(cleanCpf, nomeCompleto);
      }

      if (result.error) {
        let errorMessage = 'Erro inesperado. Tente novamente.';
        
        if (result.error.message.includes('CPF não encontrado')) {
          errorMessage = 'CPF não encontrado no sistema.';
        } else if (result.error.message.includes('CPF já cadastrado')) {
          errorMessage = 'Este CPF já está cadastrado. Tente fazer login.';
        }

        toast({
          title: isLogin ? "Erro no login" : "Erro no cadastro",
          description: errorMessage,
          variant: "destructive"
        });
      } else if (!isLogin) {
        toast({
          title: "Cadastro realizado!",
          description: "Usuário cadastrado com sucesso.",
          variant: "default"
        });
        setIsLogin(true);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl btn-primary-gradient">
              <Package className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              StackGuard
            </span>
          </h1>
          <p className="text-muted-foreground">
            Sistema de Controle de Estoque
          </p>
        </div>

        {/* Auth Card */}
        <Card className="card-gradient">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-semibold">
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Digite seu CPF para acessar o sistema'
                : 'Digite seu CPF e nome para criar sua conta'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="nomeCompleto" className="text-sm font-medium">
                    Nome Completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nomeCompleto"
                      type="text"
                      placeholder="Seu nome completo"
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      className="pl-10"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm font-medium">
                  CPF
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    className="pl-10"
                    maxLength={11}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Processando...</span>
                  </div>
                ) : (
                  isLogin ? 'Entrar' : 'Criar Conta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80"
              >
                {isLogin
                  ? 'Não tem conta? Criar uma nova'
                  : 'Já tem conta? Fazer login'
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Acesso seguro com validação via CPF</p>
        </div>
      </div>
    </div>
  );
}