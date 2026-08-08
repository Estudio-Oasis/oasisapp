import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip";

import { ErrorBoundary } from "@/components/ErrorBoundary";

import LandingPage from "./pages/Landing";
import AboutRoger from "./pages/AboutRoger";
import ServiciosPage from "./pages/Servicios";
import ContactoPage from "./pages/Contacto";
import AvisoPrivacidadPage from "./pages/AvisoPrivacidad";
import NotFound from "./pages/NotFound";


const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="/about" element={<Navigate to="/roger" replace />} />
            <Route path="/roger" element={<AboutRoger />} />
            <Route path="/portfolio" element={<Navigate to="/servicios" replace />} />
            <Route path="/servicios" element={<ServiciosPage />} />
            <Route path="/contacto" element={<ContactoPage />} />
            <Route path="/aviso-de-privacidad" element={<AvisoPrivacidadPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
