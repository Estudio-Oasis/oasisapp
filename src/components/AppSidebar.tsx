import { useState, useEffect, useRef } from "react";
import { Timer, Users, CheckSquare, DollarSign, Settings, Sun, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { TimerWidget } from "@/components/TimerWidget";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileSheet } from "@/components/ProfileSheet";
import { WelcomeModal } from "@/components/WelcomeModal";
import { OnboardingTour } from "@/components/OnboardingTour";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { StartTimerModal } from "@/components/StartTimerModal";
import { NewTaskModal } from "@/components/NewTaskModal";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";

const allNavItems = [
  { title: "Timer", url: "/timer", icon: Timer },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Tasks", url: "/tasks", icon: CheckSquare, tourId: "tasks" },
  { title: "Finances", url: "/finances", icon: DollarSign, adminOnly: true },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface Profile {
  name: string | null;
  avatar_url: string | null;
  role: string;
  onboarded: boolean;
}

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourTimerOpen, setTourTimerOpen] = useState(false);
  const [tourTaskOpen, setTourTaskOpen] = useState(false);
  const welcomeShownRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, avatar_url, role, onboarded")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const p = data as Profile;
          setProfile(p);
          if (!p.onboarded) {
            setShowWelcome(true);
          }
        }
      });
  }, [user]);

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const role = profile?.role || "member";

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

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
              <span className="text-micro text-background leading-none tracking-widest">OS</span>
            </div>
            <span className="text-sm font-semibold text-foreground">OasisOS</span>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-background-tertiary transition-colors text-foreground-secondary"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <SidebarContent className="px-3 mt-2">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
              return (
                <Link
                  key={item.title}
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
                  <span>{item.title}</span>
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
        {profile && !profile.onboarded && (
          <OnboardingChecklist
            onboarded={profile.onboarded}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenTimer={() => setTourTimerOpen(true)}
          />
        )}

        {/* User section */}
        <SidebarFooter className="px-3 pb-4">
          <button
            onClick={() => setProfileOpen(true)}
            data-tour="profile-btn"
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-md hover:bg-background-tertiary transition-colors text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background-tertiary text-xs font-semibold text-foreground-secondary">
              {displayName.charAt(0).toUpperCase()}
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
        profile={{ name: displayName, role }}
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
    </>
  );
}
