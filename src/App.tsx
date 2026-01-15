import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WorkOrderProvider } from "@/context/WorkOrderContext";
import Index from "./pages/Index";
import ScanPage from "./pages/ScanPage";
import WorkOrderDetailPage from "./pages/WorkOrderDetailPage";
import PartsCatalogPage from "./pages/PartsCatalogPage";
import ServicesCatalogPage from "./pages/ServicesCatalogPage";
import ReportsPage from "./pages/ReportsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WorkOrderProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/os/:id" element={<WorkOrderDetailPage />} />
            <Route path="/pecas" element={<PartsCatalogPage />} />
            <Route path="/servicos" element={<ServicesCatalogPage />} />
            <Route path="/relatorios" element={<ReportsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </WorkOrderProvider>
  </QueryClientProvider>
);

export default App;
