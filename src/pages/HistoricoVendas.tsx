import { useState, useEffect } from 'react';
import { Clock, Search, Filter, Download, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HistoricoVenda {
  id: string;
  codigo_produto: string;
  produto_id: string | null;
  quantidade_ajustada: number;
  tipo: string;
  observacao: string | null;
  usuario_id: string;
  created_at: string;
  // Joined data from profiles
  user_name?: string;
  user_email?: string;
}

export default function HistoricoVendas() {
  const [sales, setSales] = useState<HistoricoVenda[]>([]);
  const [filteredSales, setFilteredSales] = useState<HistoricoVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, typeFilter]);

  const fetchSales = async () => {
    try {
      // First get sales data
      const { data: salesData, error: salesError } = await supabase
        .from('historico_vendas')
        .select('*')
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Get user profiles for names
      const userIds = [...new Set(salesData?.map(sale => sale.usuario_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nome_completo, email')
        .in('id', userIds);

      // Merge sales with user data
      const salesWithUsers = salesData?.map(sale => {
        const userProfile = profilesData?.find(profile => profile.id === sale.usuario_id);
        return {
          ...sale,
          user_name: userProfile?.nome_completo || 'Usuário não encontrado',
          user_email: userProfile?.email || ''
        };
      }) || [];

      setSales(salesWithUsers);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar histórico de vendas',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = [...sales];

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.codigo_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.observacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(sale => sale.tipo === typeFilter);
    }

    setFilteredSales(filtered);
  };

  const getSaleTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'venda': return 'Venda';
      case 'ajuste': return 'Ajuste';
      default: return type;
    }
  };

  const getSaleTypeBadge = (type: string) => {
    switch (type) {
      case 'entrada': return 'success';
      case 'venda': return 'error';
      case 'ajuste': return 'warning';
      default: return 'default';
    }
  };

  const getSaleTypeIcon = (type: string) => {
    switch (type) {
      case 'entrada': return TrendingUp;
      case 'venda': return TrendingDown;
      case 'ajuste': return RotateCcw;
      default: return Clock;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const exportData = () => {
    const csvContent = [
      ['Data/Hora', 'Código', 'Tipo', 'Quantidade', 'Observação', 'Usuário', 'Email'].join(','),
      ...filteredSales.map(sale => [
        new Date(sale.created_at).toLocaleString('pt-BR'),
        sale.codigo_produto,
        getSaleTypeLabel(sale.tipo),
        sale.quantidade_ajustada,
        `"${sale.observacao || ''}"`,
        `"${sale.user_name || ''}"`,
        sale.user_email || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico_vendas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const calculateStats = () => {
    const entradas = filteredSales.filter(s => s.tipo === 'entrada');
    const vendas = filteredSales.filter(s => s.tipo === 'venda');
    const ajustes = filteredSales.filter(s => s.tipo === 'ajuste');

    return {
      totalEntradas: entradas.reduce((sum, s) => sum + s.quantidade_ajustada, 0),
      totalVendas: vendas.reduce((sum, s) => sum + s.quantidade_ajustada, 0),
      totalAjustes: ajustes.length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <Layout user={profile} title="Histórico de Vendas" showBackButton>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando histórico...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={profile} title="Histórico de Vendas" showBackButton>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Registros</p>
                  <p className="text-2xl font-bold">{filteredSales.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Entradas</p>
                  <p className="text-2xl font-bold">{stats.totalEntradas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Vendas</p>
                  <p className="text-2xl font-bold">{stats.totalVendas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <RotateCcw className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ajustes</p>
                  <p className="text-2xl font-bold">{stats.totalAjustes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-gradient">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros</span>
              </CardTitle>
              <Button
                variant="outline"
                onClick={exportData}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar CSV</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, observação ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de operação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>Histórico de Vendas e Ajustes ({filteredSales.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSales.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum registro encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || typeFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Os registros aparecerão aqui conforme você usar o sistema'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="text-center">Tipo</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => {
                      const datetime = formatDateTime(sale.created_at);
                      const Icon = getSaleTypeIcon(sale.tipo);
                      return (
                        <TableRow key={sale.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{datetime.date}</div>
                              <div className="text-muted-foreground">{datetime.time}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {sale.codigo_produto}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getSaleTypeBadge(sale.tipo) as any} className="flex items-center space-x-1 justify-center">
                              <Icon className="h-3 w-3" />
                              <span>{getSaleTypeLabel(sale.tipo)}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            <span className={
                              sale.tipo === 'venda' ? 'text-destructive' : 
                              sale.tipo === 'entrada' ? 'text-success' : 'text-warning'
                            }>
                              {sale.quantidade_ajustada}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-sm text-muted-foreground">
                              {sale.observacao || '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{sale.user_name}</div>
                              <div className="text-muted-foreground">{sale.user_email}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}