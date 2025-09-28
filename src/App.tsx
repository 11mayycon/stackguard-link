import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "./pages/Auth";
import AuthPage from "./pages/AuthPage";
import ConsultarEstoque from "./pages/ConsultarEstoque";
import ControlarEstoque from "./pages/ControlarEstoque";
import HistoricoMovimentacoes from "./pages/HistoricoMovimentacoes";
import HistoricoVendas from "./pages/HistoricoVendas";
import CadastrarYarn from "./pages/CadastrarYarn";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/consultar" element={
              <ProtectedRoute>
                <ConsultarEstoque />
              </ProtectedRoute>
            } />
            <Route path="/controlar" element={
              <ProtectedRoute>
                <ControlarEstoque />
              </ProtectedRoute>
            } />
            <Route path="/historico" element={
              <ProtectedRoute>
                <HistoricoMovimentacoes />
              </ProtectedRoute>
            } />
            <Route path="/vendas" element={
              <ProtectedRoute>
                <HistoricoVendas />
              </ProtectedRoute>
            } />
            <Route path="/cadastrar-yarn" element={
              <ProtectedRoute>
                <CadastrarYarn />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
