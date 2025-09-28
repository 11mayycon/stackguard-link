import { useState, useEffect, useRef } from 'react';
import { Search, Barcode, Camera, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Product {
  id: string;
  code: string;
  description: string;
  quantity: number;
  ean: string | null;
}

export default function CadastrarYarn() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [yarnCode, setYarnCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchProducts();
    } else {
      setProducts([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedProduct) {
      setYarnCode(selectedProduct.ean || '');
    }
  }, [selectedProduct]);

  const searchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('description', `%${searchTerm}%`)
        .limit(10);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao buscar produtos",
          variant: "destructive",
        });
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false);
      
      scannerRef.current.render(
        (decodedText) => {
          setYarnCode(decodedText);
          stopScanning();
          toast({
            title: "Código escaneado!",
            description: `Código: ${decodedText}`,
          });
        },
        (error) => {
          console.log('Scanner error:', error);
        }
      );
    }, 100);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const validateYarnCode = async (code: string) => {
    if (!code.trim()) {
      return { valid: false, message: "Código Yarn é obrigatório" };
    }

    if (!/^\d+$/.test(code)) {
      return { valid: false, message: "Código Yarn deve conter apenas números" };
    }

    // Verificar se já existe em outro produto
    const { data, error } = await supabase
      .from('products')
      .select('id, code, description')
      .eq('ean', code)
      .neq('id', selectedProduct?.id || '');

    if (error) {
      return { valid: false, message: "Erro ao validar código" };
    }

    if (data && data.length > 0) {
      return { 
        valid: false, 
        message: `Código já existe no produto: ${data[0].code} - ${data[0].description}` 
      };
    }

    return { valid: true, message: "" };
  };

  const saveYarnCode = async () => {
    if (!selectedProduct) {
      toast({
        title: "Erro",
        description: "Selecione um produto primeiro",
        variant: "destructive",
      });
      return;
    }

    const validation = await validateYarnCode(yarnCode);
    if (!validation.valid) {
      toast({
        title: "Erro de validação",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Usar edge function para atualizar com segurança
      const { data, error } = await supabase.functions.invoke('stock-operations', {
        body: {
          operation: 'update_yarn',
          productId: selectedProduct.id,
          yarnCode: yarnCode.trim(),
          userEmail: profile?.email || 'unknown'
        }
      });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao salvar código Yarn",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso!",
        description: "Código Yarn atualizado com sucesso",
      });

      // Atualizar produto selecionado
      setSelectedProduct({
        ...selectedProduct,
        ean: yarnCode.trim()
      });

    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={profile} title="Cadastrar Yarn">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-info/10">
              <Barcode className="h-12 w-12 text-info" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Cadastrar Yarn</h1>
          <p className="text-lg text-muted-foreground">
            Busque um produto e cadastre o código Yarn manualmente ou via scanner
          </p>
        </div>

        {/* Busca de Produto */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Produto
            </CardTitle>
            <CardDescription>
              Digite o nome ou descrição do produto para localizar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {products.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedProduct?.id === product.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{product.code}</p>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        <p className="text-xs text-muted-foreground">Estoque: {product.quantity}</p>
                      </div>
                      {product.ean && (
                        <Badge variant="outline" className="text-xs">
                          EAN: {product.ean}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Produto Selecionado */}
        {selectedProduct && (
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Produto Selecionado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-medium">Código:</span> {selectedProduct.code}</p>
                <p><span className="font-medium">Descrição:</span> {selectedProduct.description}</p>
                <p><span className="font-medium">Quantidade:</span> {selectedProduct.quantity}</p>
                {selectedProduct.ean && (
                  <p><span className="font-medium">EAN Atual:</span> {selectedProduct.ean}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cadastro de Yarn */}
        {selectedProduct && (
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-5 w-5" />
                Cadastrar Código Yarn
              </CardTitle>
              <CardDescription>
                Digite manualmente ou escaneie com a câmera
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isScanning ? (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o código Yarn..."
                      value={yarnCode}
                      onChange={(e) => setYarnCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={startScanning}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Scanner
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={saveYarnCode}
                      disabled={loading || !yarnCode.trim()}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Salvando...' : 'Salvar Yarn'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Scanner ativo</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopScanning}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                  <div id="qr-reader" className="w-full"></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}