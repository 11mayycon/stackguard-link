import { Package, Search, Settings, BarChart3, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const navigationCards = [
    {
      title: 'Consultar Estoque',
      description: 'Visualizar produtos, quantidades e status do estoque',
      icon: Search,
      path: '/consultar',
      color: 'primary',
      features: ['Lista de produtos', 'Status de estoque', 'Filtros avançados']
    },
    {
      title: 'Controlar Estoque',
      description: 'Cadastrar produtos e ajustar quantidades',
      icon: Settings,
      path: '/controlar',
      color: 'success',
      features: ['Cadastrar produtos', 'Ajustar estoque', 'Registrar movimentações']
    },
    {
      title: 'Histórico de Movimentações',
      description: 'Acompanhar todas as movimentações de estoque',
      icon: BarChart3,
      path: '/historico',
      color: 'secondary',
      features: ['Movimentações completas', 'Filtros por período', 'Relatórios detalhados']
    },
    {
      title: 'Histórico de Vendas',
      description: 'Relatório de vendas e ajustes realizados',
      icon: Clock,
      path: '/vendas',
      color: 'warning',
      features: ['Histórico de vendas', 'Ajustes de estoque', 'Auditoria completa']
    }
  ];

  const getCardVariant = (color: string) => {
    switch (color) {
      case 'primary': return 'default';
      case 'success': return 'success';
      case 'secondary': return 'secondary';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Layout user={profile} title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Package className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Bem-vindo ao{' '}
            <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              StackGuard
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema completo de controle de estoque para gerenciar seus produtos com eficiência e segurança
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-gradient">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Package className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sistema</p>
                  <p className="text-2xl font-bold text-foreground">Ativo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Perfil</p>
                  <p className="text-2xl font-bold text-foreground">{profile?.role || 'Funcionário'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-2xl font-bold text-foreground">Online</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.path} className="card-gradient group cursor-pointer" onClick={() => navigate(card.path)}>
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-${card.color}/10 group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className={`h-8 w-8 text-${card.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                          {card.title}
                        </CardTitle>
                        <Badge variant={getCardVariant(card.color)} className="mt-1">
                          {card.color === 'primary' && 'Consulta'}
                          {card.color === 'success' && 'Controle'}
                          {card.color === 'secondary' && 'Histórico'}
                          {card.color === 'warning' && 'Relatório'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-muted-foreground text-base leading-relaxed">
                    {card.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {card.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="card" 
                    className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground"
                  >
                    Acessar →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-2 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Sistema integrado com Supabase • Segurança garantida com RLS
          </p>
          <p className="text-xs text-muted-foreground">
            Desenvolvido com React, TypeScript e Tailwind CSS
          </p>
        </div>
      </div>
    </Layout>
  );
}