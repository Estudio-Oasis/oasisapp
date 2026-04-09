import { useState, useEffect, useRef } from "react";
import { Timer, Users, CheckSquare, DollarSign, Settings, Sun, Moon, Radio, LayoutDashboard, Globe, Shield, FileText, Rocket } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useUnreadChats } from "@/hooks/useUnreadChats";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlan } from "@/hooks/usePlan";
import { TimerWidget } from "@/components/TimerWidget";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileSheet } from "@/components/ProfileSheet";
import { WelcomeModal } from "@/components/WelcomeModal";
import { OnboardingTour } from "@/components/OnboardingTour";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { StartTimerModal } from "@/components/StartTimerModal";
import { NewTaskModal } from "@/components/NewTaskModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import type { TranslationKey } from "@/lib/translations";

const allNavItems = [
  { titleKey: "nav.bitacora" as TranslationKey, url: "/bitacora", icon: Timer },
  { titleKey: "nav.hub" as TranslationKey, url: "/hub", icon: Radio },
  { titleKey: "nav.clients" as TranslationKey, url: "/clients", icon: Users },
  { titleKey: "nav.tasks" as TranslationKey, url: "/tasks", icon: CheckSquare, tourId: "tasks" },
  { titleKey: "nav.quotes" as TranslationKey, url: "/quotes", icon: FileText },
  { titleKey: "nav.vault" as TranslationKey, url: "/vault", icon: Shield },
  { titleKey: "nav.finances" as TranslationKey, url: "/finances", icon: DollarSign, adminOnly: true },
  { titleKey: "nav.admin" as TranslationKey, url: "/admin", icon: LayoutDashboard, adminOnly: true },
  { titleKey: "nav.settings" as TranslationKey, url: "/settings", icon: Settings },
];

interface Profile {
  name: string | null;
  avatar_url: string | null;
  role: string;
  onboarded: boolean;
  onboarding_skipped: boolean;
  job_title: string | null;
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useUnreadChats();
  const { language, setLanguage, t } = useLanguage();
  const { isFree } = usePlan();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourTimerOpen, setTourTimerOpen] = useState(false);
  const [tourTaskOpen, setTourTaskOpen] = useState(false);
  const welcomeShownRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, avatar_url, role, onboarded, job_title, onboarding_skipped, agency_id")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const p = data as Profile & { agency_id: string | null };
          setProfile(p);
          if (!p.onboarded && !p.onboarding_skipped && !welcomeShownRef.current) {
            welcomeShownRef.current = true;
            // If no agency yet, show the wizard; otherwise show the old welcome
            if (!p.agency_id) {
              setShowWizard(true);
            } else {
              setShowWelcome(true);
            }
          }
        }
      });
  }, [user?.id]);

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const role = profile?.role || "member";

  const navItems = allNavItems.filter((item) => !item.adminOnly || (!roleLoading && isAdmin));

  const toggleLanguage = () => setLanguage(language === "es" ? "en" : "es");

  const handleStartTour = () => {
    setShowWelcome(false);
    setShowTour(true);
  };

  const handleSkipOnboarding = async () => {
    setShowWelcome(false);
    if (user) {
      await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
      setProfile((prev) => prev ? { ...prev, onboarded: true } : prev);
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
    setProfile((prev) => prev ? { ...prev, onboarded: true } : prev);
  };

  const openProfileFromTour = () => {
    setProfileOpen(true);
  };

  const openNewTaskFromTour = () => {
    setTourTaskOpen(true);
  };

  const openTimerFromTour = () => {
    setTourTimerOpen(true);
  };

  return (
    <>
      <Sidebar className="border-r border-sidebar-border bg-sidebar w-[220px]">
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <span className="text-micro text-background leading-none tracking-widest">B</span>
            </div>
            <span className="text-sm font-semibold text-foreground">Bitácora</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleLanguage}
              className="flex h-7 min-w-[28px] items-center justify-center rounded-md hover:bg-background-tertiary transition-colors text-foreground-secondary text-[10px] font-bold uppercase tracking-wider"
              aria-label="Toggle language"
            >
              {language === "es" ? "EN" : "ES"}
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-background-tertiary transition-colors text-foreground-secondary"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <SidebarContent className="px-3 mt-2">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
              return (
                <Link
                  key={item.titleKey}
                  to={item.url}
                  data-tour={item.tourId}
                  className={`relative flex h-9 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent-light text-foreground font-semibold"
                      : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-accent" />
                  )}
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{t(item.titleKey)}</span>
                  {item.url === "/hub" && unreadCount > 0 && (
                    <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </SidebarContent>

        {/* Notification bell */}
        <div className="mt-2">
          <NotificationBell />
        </div>

        {/* Timer widget */}
        <div data-tour="start-timer-btn">
          <TimerWidget />
        </div>

        {/* Onboarding checklist */}
        {profile && !profile.onboarded && !showWizard && (
          <OnboardingChecklist
            onboarded={profile.onboarded}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenTimer={() => setTourTimerOpen(true)}
          />
        )}

        {/* Upgrade banner for free users */}
        {isFree && (
          <div className="mx-3 mb-2">
            <button
              onClick={() => navigate("/pricing")}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors text-left"
            >
              <Rocket className="h-4 w-4 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">Upgrade</p>
                <p className="text-[10px] text-foreground-muted truncate">Desbloquea el equipo completo</p>
              </div>
            </button>
          </div>
        )}

        {/* User section */}
        <SidebarFooter className="px-3 pb-4">
          <button
            onClick={() => setProfileOpen(true)}
            data-tour="profile-btn"
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-md hover:bg-background-tertiary transition-colors text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background-tertiary text-xs font-semibold text-foreground-secondary overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${role === "admin" ? "text-accent" : "text-foreground-muted"}`}>
                {role}
              </span>
            </div>
          </button>
        </SidebarFooter>
      </Sidebar>

      <ProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={{ name: displayName, role, avatar_url: profile?.avatar_url, job_title: profile?.job_title }}
        onProfileUpdated={(updated) => setProfile((prev) => prev ? { ...prev, ...updated } : prev)}
        onSignOut={signOut}
      />

      {/* Onboarding */}
      <WelcomeModal
        open={showWelcome}
        name={displayName}
        onStartTour={handleStartTour}
        onSkip={handleSkipOnboarding}
      />
      <OnboardingTour
        active={showTour}
        onComplete={handleTourComplete}
        onOpenProfile={openProfileFromTour}
        onOpenNewTask={openNewTaskFromTour}
        onOpenTimer={openTimerFromTour}
      />

      {/* Tour-triggered modals */}
      <StartTimerModal open={tourTimerOpen} onOpenChange={setTourTimerOpen} mode="start" />
      <NewTaskModal open={tourTaskOpen} onOpenChange={setTourTaskOpen} />

      {/* Onboarding Wizard (new users without agency) */}
      <OnboardingWizard
        open={showWizard}
        userName={displayName}
        onComplete={() => {
          setShowWizard(false);
          setProfile((prev) => prev ? { ...prev, onboarded: true } : prev);
          navigate("/bitacora");
        }}
        onSkip={() => {
          setShowWizard(false);
          setProfile((prev) => prev ? { ...prev, onboarding_skipped: true } : prev);
        }}
      />
    </>
  );
}
