import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import LandingPage from "./pages/Landing";
import AboutStudio from "./pages/AboutStudio";
import AboutRoger from "./pages/AboutRoger";
import Portfolio from "./pages/Portfolio";
import ServiciosPage from "./pages/Servicios";
import ContactoPage from "./pages/Contacto";
import AvisoPrivacidadPage from "./pages/AvisoPrivacidad";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<Navigate to="/" replace />} />
                <Route path="/about" element={<AboutStudio />} />
                <Route path="/roger" element={<AboutRoger />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/servicios" element={<ServiciosPage />} />
                <Route path="/contacto" element={<ContactoPage />} />
                <Route path="/aviso-de-privacidad" element={<AvisoPrivacidadPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
