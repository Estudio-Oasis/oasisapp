import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TimerProvider } from "@/contexts/TimerContext";
import { ProtectedRoute, ProRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { BitacoraLayout } from "@/components/BitacoraLayout";
import { PlanRouter } from "@/components/PlanRouter";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BitacoraPage from "./pages/Bitacora";
import BitacoraDemo from "./pages/BitacoraDemo";
import TimerPage from "./pages/Timer";
import SetupPage from "./pages/Setup";
import ClientsPage from "./pages/Clients";
import ClientProfilePage from "./pages/ClientProfile";
import TasksPage from "./pages/Tasks";
import FinancesPage from "./pages/Finances";
import SettingsPage from "./pages/Settings";
import HubPage from "./pages/Hub";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import QuotesPage from "./pages/Quotes";
import VaultPage from "./pages/Vault";
import LandingPage from "./pages/Landing";
import AboutStudio from "./pages/AboutStudio";
import AboutRoger from "./pages/AboutRoger";
import Portfolio from "./pages/Portfolio";
import PlaygroundActivityEngine from "./pages/PlaygroundActivityEngine";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TimerProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<Navigate to="/" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/bitacora-demo" element={<BitacoraDemo />} />
                <Route path="/about" element={<AboutStudio />} />
                <Route path="/about/roger-teran" element={<AboutRoger />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/playground/activity-engine" element={<PlaygroundActivityEngine />} />

                {/* Plan-aware layout: shows BitacoraLayout for free, AppLayout for pro */}
                <Route
                  element={
                    <ProtectedRoute>
                      <PlanRouter />
                    </ProtectedRoute>
                  }
                >
                  {/* Available to all plans */}
                  <Route path="/bitacora" element={<BitacoraPage />} />
                  <Route path="/timer" element={<Navigate to="/bitacora" replace />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* Pro-only routes */}
                  <Route path="/hub" element={<ProRoute><HubPage /></ProRoute>} />
                  <Route path="/clients" element={<ProRoute><ClientsPage /></ProRoute>} />
                  <Route path="/clients/:id" element={<ProRoute><ClientProfilePage /></ProRoute>} />
                  <Route path="/tasks" element={<ProRoute><TasksPage /></ProRoute>} />
                  <Route path="/quotes" element={<ProRoute><QuotesPage /></ProRoute>} />
                  <Route path="/vault" element={<ProRoute><VaultPage /></ProRoute>} />
                  <Route path="/finances" element={<ProRoute><FinancesPage /></ProRoute>} />
                  <Route path="/admin" element={<ProRoute><AdminDashboard /></ProRoute>} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </TimerProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
