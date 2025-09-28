import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const productSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório').max(50, 'Código muito longo'),
  description: z.string().min(1, 'Descrição é obrigatória').max(200, 'Descrição muito longa'),
  quantity: z.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
  threshold: z.number().min(0, 'Estoque mínimo deve ser maior ou igual a 0'),
  ean: z.string().optional(),
});

const adjustmentSchema = z.object({
  productCode: z.string().min(1, 'Código do produto é obrigatório'),
  type: z.enum(['entrada', 'venda', 'ajuste'], { required_error: 'Tipo é obrigatório' }),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  observation: z.string().optional(),
});

interface Product {
  id: string;
  code: string;
  description: string;
  quantity: number;
  threshold: number;
  ean?: string;
}

export default function ControlarEstoque() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Product form
  const [productForm, setProductForm] = useState({
    code: '',
    description: '',
    quantity: 0,
    threshold: 0,
    ean: ''
  });
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  // Adjustment form
  const [adjustmentForm, setAdjustmentForm] = useState({
    productCode: '',
    type: '',
    quantity: 0,
    observation: ''
  });
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('description');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar produtos',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = productSchema.safeParse({
        ...productForm,
        ean: productForm.ean || undefined
      });

      if (!validation.success) {
        const errors = validation.error.format();
        toast({
          title: 'Erro de validação',
          description: Object.values(errors).flat().filter(err => typeof err === 'string').join(', '),
          variant: 'destructive'
        });
        return;
      }

      const response = await supabase.functions.invoke('stock-operations', {
        body: {
          operation: 'create_product',
          data: {
            code: productForm.code.trim(),
            description: productForm.description.trim(),
            quantity: productForm.quantity,
            threshold: productForm.threshold,
            ean: productForm.ean.trim() || null
          }
        }
      });

      if (response.error) throw response.error;

      toast({
        title: 'Produto cadastrado',
        description: 'Produto cadastrado com sucesso!',
        variant: 'default'
      });

      setProductForm({ code: '', description: '', quantity: 0, threshold: 0, ean: '' });
      setProductDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Erro ao cadastrar produto',
        description: error.message || 'Erro inesperado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = adjustmentSchema.safeParse(adjustmentForm);
      if (!validation.success) {
        const errors = validation.error.format();
        toast({
          title: 'Erro de validação',
          description: Object.values(errors).flat().filter(err => typeof err === 'string').join(', '),
          variant: 'destructive'
        });
        return;
      }

      const response = await supabase.functions.invoke('stock-operations', {
        body: {
          operation: 'adjust_stock',
          data: {
            productCode: adjustmentForm.productCode.trim(),
            type: adjustmentForm.type,
            quantity: adjustmentForm.quantity,
            observation: adjustmentForm.observation.trim() || null
          }
        }
      });

      if (response.error) throw response.error;

      toast({
        title: 'Estoque ajustado',
        description: 'Movimentação registrada com sucesso!',
        variant: 'default'
      });

      setAdjustmentForm({ productCode: '', type: '', quantity: 0, observation: '' });
      setAdjustmentDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Erro ao ajustar estoque',
        description: error.message || 'Erro inesperado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openAdjustmentDialog = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentForm(prev => ({
      ...prev,
      productCode: product.code
    }));
    setAdjustmentDialogOpen(true);
  };

  return (
    <Layout user={profile} title="Controlar Estoque" showBackButton>
      <div className="space-y-6">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
            <DialogTrigger asChild>
              <Card className="card-gradient cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-success/10 group-hover:scale-110 transition-transform duration-200">
                      <Plus className="h-8 w-8 text-success" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        Cadastrar Produto
                      </h3>
                      <p className="text-muted-foreground">
                        Adicionar novo produto ao estoque
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Produto</DialogTitle>
                <DialogDescription>
                  Preencha as informações do produto para adicioná-lo ao estoque
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      value={productForm.code}
                      onChange={(e) => setProductForm(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Ex: PROD001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ean">EAN (opcional)</Label>
                    <Input
                      id="ean"
                      value={productForm.ean}
                      onChange={(e) => setProductForm(prev => ({ ...prev, ean: e.target.value }))}
                      placeholder="Ex: 7891234567890"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição detalhada do produto"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade Inicial</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={productForm.quantity}
                      onChange={(e) => setProductForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Estoque Mínimo</Label>
                    <Input
                      id="threshold"
                      type="number"
                      min="0"
                      value={productForm.threshold}
                      onChange={(e) => setProductForm(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="hero" disabled={loading}>
                    {loading ? 'Cadastrando...' : 'Cadastrar Produto'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
            <DialogTrigger asChild>
              <Card className="card-gradient cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform duration-200">
                      <Edit className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        Ajustar Estoque
                      </h3>
                      <p className="text-muted-foreground">
                        Registrar entrada, venda ou ajuste
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajustar Estoque</DialogTitle>
                <DialogDescription>
                  Registre movimentações de entrada, venda ou ajuste de estoque
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdjustStock} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productCode">Código do Produto</Label>
                  <Input
                    id="productCode"
                    value={adjustmentForm.productCode}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, productCode: e.target.value }))}
                    placeholder="Digite o código do produto"
                    required
                  />
                  {selectedProduct && (
                    <p className="text-sm text-muted-foreground">
                      {selectedProduct.description} (Estoque atual: {selectedProduct.quantity})
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={adjustmentForm.type} onValueChange={(value) => setAdjustmentForm(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="ajuste">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adjustQuantity">Quantidade</Label>
                    <Input
                      id="adjustQuantity"
                      type="number"
                      min="1"
                      value={adjustmentForm.quantity}
                      onChange={(e) => setAdjustmentForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observation">Observação (opcional)</Label>
                  <Textarea
                    id="observation"
                    value={adjustmentForm.observation}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, observation: e.target.value }))}
                    placeholder="Observações sobre a movimentação"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="hero" disabled={loading}>
                    {loading ? 'Processando...' : 'Registrar Movimentação'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <Card className="card-gradient">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Produtos Cadastrados</span>
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente ajustar o termo de busca' : 'Cadastre seu primeiro produto'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-center">Estoque Mín.</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-medium">
                          {product.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.description}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          <span className={product.quantity <= product.threshold ? 'text-destructive' : ''}>
                            {product.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {product.threshold}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAdjustmentDialog(product)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Ajustar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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