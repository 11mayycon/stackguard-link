import { useState, useEffect } from 'react';
import { BarChart3, Search, Filter, Download, Eye } from 'lucide-react';
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

interface StockMovement {
  id: string;
  product_code: string;
  product_description: string;
  type: 'initial' | 'add' | 'remove' | 'waste';
  quantity_change: number;
  new_quantity: number;
  timestamp: string;
  user_email: string;
}

export default function HistoricoMovimentacoes() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMovements();
  }, []);

  useEffect(() => {
    filterMovements();
  }, [movements, searchTerm, typeFilter]);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar movimentações',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMovements = () => {
    let filtered = [...movements];

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(movement =>
        movement.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.product_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(movement => movement.type === typeFilter);
    }

    setFilteredMovements(filtered);
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'initial': return 'Inicial';
      case 'add': return 'Entrada';
      case 'remove': return 'Saída';
      default: return type;
    }
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'initial': return 'secondary';
      case 'add': return 'success';
      case 'remove': return 'error';
      default: return 'default';
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
      ['Data/Hora', 'Código', 'Descrição', 'Tipo', 'Quantidade', 'Estoque Final', 'Usuário'].join(','),
      ...filteredMovements.map(movement => [
        new Date(movement.timestamp).toLocaleString('pt-BR'),
        movement.product_code,
        `"${movement.product_description}"`,
        getMovementTypeLabel(movement.type),
        movement.quantity_change,
        movement.new_quantity,
        movement.user_email
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico_movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Layout user={profile} title="Histórico de Movimentações" showBackButton>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando movimentações...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={profile} title="Histórico de Movimentações" showBackButton>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{movements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <BarChart3 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entradas</p>
                  <p className="text-2xl font-bold">
                    {movements.filter(m => m.type === 'add' || m.type === 'initial').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <BarChart3 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saídas</p>
                  <p className="text-2xl font-bold">
                    {movements.filter(m => m.type === 'remove').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Eye className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold">
                    {movements.filter(m => 
                      new Date(m.timestamp).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
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
                  placeholder="Buscar por código, produto ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de movimentação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="initial">Inicial</SelectItem>
                  <SelectItem value="add">Entrada</SelectItem>
                  <SelectItem value="remove">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Movements Table */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>Movimentações ({filteredMovements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMovements.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma movimentação encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm || typeFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'As movimentações aparecerão aqui conforme você usar o sistema'
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
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Tipo</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-center">Estoque Final</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.map((movement) => {
                      const datetime = formatDateTime(movement.timestamp);
                      return (
                        <TableRow key={movement.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{datetime.date}</div>
                              <div className="text-muted-foreground">{datetime.time}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {movement.product_code}
                          </TableCell>
                          <TableCell className="font-medium max-w-xs truncate">
                            {movement.product_description}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getMovementTypeBadge(movement.type) as any}>
                              {getMovementTypeLabel(movement.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            <span className={movement.type === 'remove' ? 'text-destructive' : 'text-success'}>
                              {movement.type === 'remove' ? '-' : '+'}
                              {movement.quantity_change}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {movement.new_quantity}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {movement.user_email}
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