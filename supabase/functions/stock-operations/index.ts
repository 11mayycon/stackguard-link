import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          code: string
          description: string
          quantity: number
          threshold: number
          last_activity: string
          ean: string | null
        }
        Insert: {
          code: string
          description: string
          quantity: number
          threshold: number
          last_activity: string
          ean?: string | null
        }
        Update: {
          code?: string
          description?: string
          quantity?: number
          threshold?: number
          last_activity?: string
          ean?: string | null
        }
      }
      stock_movements: {
        Insert: {
          product_id: string
          product_code: string
          product_description: string
          type: 'initial' | 'add' | 'remove'
          quantity_change: number
          new_quantity: number
          timestamp: string
          user_email: string
        }
      }
      historico_vendas: {
        Insert: {
          codigo_produto: string
          produto_id?: string | null
          quantidade_ajustada: number
          tipo: string
          observacao?: string | null
          usuario_id: string
          created_at?: string | null
        }
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header and extract user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Verify the JWT token using the service role client
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { operation, data } = await req.json();

    console.log(`Stock operation: ${operation}`, data);

    switch (operation) {
      case 'create_product':
        return await createProduct(supabaseClient, data, user);
      case 'adjust_stock':
        return await adjustStock(supabaseClient, data, user);
      default:
        throw new Error('Invalid operation');
    }

  } catch (error) {
    console.error('Stock operation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function createProduct(supabaseClient: any, data: any, user: any) {
  const { code, description, quantity, threshold, ean } = data;

  // Check if product with this code already exists
  const { data: existingProduct } = await supabaseClient
    .from('products')
    .select('id')
    .eq('code', code)
    .single();

  if (existingProduct) {
    throw new Error('Produto com este código já existe');
  }

  // Create product
  const { data: product, error: productError } = await supabaseClient
    .from('products')
    .insert({
      code,
      description,
      quantity,
      threshold,
      ean,
      last_activity: new Date().toISOString()
    })
    .select()
    .single();

  if (productError) throw productError;

  // Record initial stock movement
  const { error: movementError } = await supabaseClient
    .from('stock_movements')
    .insert({
      product_id: product.id,
      product_code: code,
      product_description: description,
      type: 'initial',
      quantity_change: quantity,
      new_quantity: quantity,
      timestamp: new Date().toISOString(),
      user_email: user.email
    });

  if (movementError) throw movementError;

  // Record in sales history
  const { error: historyError } = await supabaseClient
    .from('historico_vendas')
    .insert({
      codigo_produto: code,
      produto_id: product.id,
      quantidade_ajustada: quantity,
      tipo: 'entrada',
      observacao: 'Cadastro inicial do produto',
      usuario_id: user.id,
      created_at: new Date().toISOString()
    });

  if (historyError) throw historyError;

  console.log(`Product created: ${code} with initial quantity: ${quantity}`);

  return new Response(
    JSON.stringify({ success: true, product }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function adjustStock(supabaseClient: any, data: any, user: any) {
  const { productCode, type, quantity, observation } = data;

  // Get product
  const { data: product, error: productError } = await supabaseClient
    .from('products')
    .select('*')
    .eq('code', productCode)
    .single();

  if (productError || !product) {
    throw new Error('Produto não encontrado');
  }

  // Calculate new quantity
  let newQuantity = product.quantity;
  let quantityChange = quantity;
  let movementType = 'add';

  switch (type) {
    case 'entrada':
      newQuantity += quantity;
      movementType = 'add';
      break;
    case 'venda':
      newQuantity -= quantity;
      quantityChange = -quantity;
      movementType = 'remove';
      if (newQuantity < 0) {
        throw new Error('Estoque insuficiente para a venda');
      }
      break;
    case 'ajuste':
      if (quantity > product.quantity) {
        quantityChange = quantity - product.quantity;
        movementType = 'add';
      } else {
        quantityChange = product.quantity - quantity;
        movementType = 'remove';
      }
      newQuantity = quantity;
      break;
    default:
      throw new Error('Tipo de movimentação inválido');
  }

  // Update product
  const { error: updateError } = await supabaseClient
    .from('products')
    .update({
      quantity: newQuantity,
      last_activity: new Date().toISOString()
    })
    .eq('id', product.id);

  if (updateError) throw updateError;

  // Record stock movement
  const { error: movementError } = await supabaseClient
    .from('stock_movements')
    .insert({
      product_id: product.id,
      product_code: productCode,
      product_description: product.description,
      type: movementType,
      quantity_change: Math.abs(quantityChange),
      new_quantity: newQuantity,
      timestamp: new Date().toISOString(),
      user_email: user.email
    });

  if (movementError) throw movementError;

  // Record in sales history
  const { error: historyError } = await supabaseClient
    .from('historico_vendas')
    .insert({
      codigo_produto: productCode,
      produto_id: product.id,
      quantidade_ajustada: Math.abs(quantityChange),
      tipo: type,
      observacao: observation || null,
      usuario_id: user.id,
      created_at: new Date().toISOString()
    });

  if (historyError) throw historyError;

  console.log(`Stock adjusted for ${productCode}: ${product.quantity} -> ${newQuantity} (${type})`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      product: { ...product, quantity: newQuantity },
      movement: { type, quantityChange, newQuantity }
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}