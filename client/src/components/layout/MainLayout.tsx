import React, { useState } from "react";
import { cn } from "@/lib/theme";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { ProfileDropdown } from "./ProfileDropdown";
import { Menu, Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NotificationProvider, useNotification, NOTIFICATION_DURATION } from "@/contexts/NotificationContext";
import { NotificationSidePanel } from "@/components/ui/NotificationSidePanel";

// Fix: use global JSX.Element for props
export function MainLayout({
  children,
  rightPanel,
  showRightPanel,
  setShowRightPanel,
  setActiveTool,
}: {
  children: JSX.Element;
  rightPanel?: JSX.Element;
  showRightPanel?: boolean;
  setShowRightPanel?: (open: boolean) => void;
  setActiveTool?: (tool: string) => void;
}) {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const { unreadCount } = useNotification();
  const [lastActiveTool, setLastActiveTool] = useState<string | null>(null);
  // Animation: keep panel mounted for close animation
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelAnimatingOut, setPanelAnimatingOut] = useState(false);

  // Watch showRightPanel and notifPanelOpen to control mount/unmount for animation
  React.useEffect(() => {
    if (showRightPanel || notifPanelOpen) {
      setPanelVisible(true);
      setPanelAnimatingOut(false);
    } else if (panelVisible) {
      setPanelAnimatingOut(true);
      // Unmount after animation duration (match .35s in CSS)
      const timeout = setTimeout(() => {
        setPanelVisible(false);
        setPanelAnimatingOut(false);
      }, 350);
      return () => clearTimeout(timeout);
    }
  }, [showRightPanel, notifPanelOpen]);

  // Toggle tool panel: if already open with same tool, close it; else open new tool
  const openTool = (tool: string) => {
    if (!setActiveTool || !setShowRightPanel) return;
    if (lastActiveTool === tool && showRightPanel) {
      setShowRightPanel(false);
      setActiveTool("");
      setLastActiveTool(null);
    } else {
      setActiveTool(tool);
      setShowRightPanel(!!tool && tool !== "dashboard");
      setLastActiveTool(tool);
    }
  };

  const showNotificationPanel = notifPanelOpen;
  const showToolPanel = showRightPanel && !notifPanelOpen;

  // When notification panel closes, also close any tool panel (unify behavior)
  const handleNotifPanelClose = () => {
    setNotifPanelOpen(false);
    if (setShowRightPanel) setShowRightPanel(false);
    if (setActiveTool) setActiveTool("");
    setLastActiveTool(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar Toggle for Mobile */}
      {isMobile && !sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-white/80 shadow-sm rounded-md"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5 text-primary" />
        </Button>
      )}
      <Sidebar
        isMobile={isMobile}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        openTool={openTool}
      />
      <div
        className={cn(
          "flex-1 flex flex-col transition-[margin] duration-[300ms] ease-in-out bg-white",
          isMobile ? "ml-0" : sidebarOpen ? "ml-64" : "ml-0",
          "w-full",
        )}
      >
        <header
          className={cn(
            "bg-white shadow-sm border-b border-gray-200 h-16 flex items-center px-4 sticky top-0 z-30 w-full left-0",
          )}
        >
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-3 text-primary"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-heading font-semibold text-primary hidden md:block">
            Arina
          </h1>
          <div className="ml-auto flex items-center space-x-3">
            <Button variant="outline" size="icon" className="rounded-full">
              <HelpCircle className="h-5 w-5 text-gray-600" />
            </Button>
            <div className="relative">
              <Button variant="outline" size="icon" className="rounded-full" onClick={() => setNotifPanelOpen((v) => !v)}>
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center font-bold border border-white">{unreadCount}</span>
                )}
              </Button>
            </div>
            <Separator orientation="vertical" className="h-8 mx-1" />
            {user && <ProfileDropdown openTool={openTool} />}
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col h-full bg-white/90">
            {children}
          </div>
          {/* Right Panel (Notification or Tool) - always render container for animation, only render content when open */}
          {panelVisible && !isMobile && (
            <div
              className={cn(
                "absolute top-0 right-0 h-full transition-transform duration-500 ease-in-out flex flex-col min-w-[340px] max-w-[420px] w-full sm:w-[380px] md:w-[400px] lg:w-[420px] z-40",
                (showNotificationPanel || showToolPanel) && !panelAnimatingOut
                  ? "translate-x-0 animate-featurepanel-in"
                  : "translate-x-full animate-featurepanel-out"
              )}
              style={{
                height: "100%",
                maxHeight: "100vh",
                background: "none",
                border: "none",
                boxShadow: "none",
              }}
            >
              {/* Only render content if open, but keep container for close animation */}
              {((showNotificationPanel && !panelAnimatingOut) || (panelAnimatingOut && notifPanelOpen)) && (
                <NotificationSidePanel open={notifPanelOpen} onClose={handleNotifPanelClose} />
              )}
              {((showToolPanel && !panelAnimatingOut) || (panelAnimatingOut && showRightPanel && rightPanel)) && showToolPanel && rightPanel && React.cloneElement(rightPanel as any, {
                onClose: () => {
                  if (setShowRightPanel) setShowRightPanel(false);
                  if (setActiveTool) setActiveTool("");
                  setLastActiveTool(null);
                },
              })}
            </div>
          )}
          {/* Mobile overlays */}
          {showNotificationPanel && isMobile && (
            <NotificationSidePanel open={notifPanelOpen} onClose={handleNotifPanelClose} />
          )}
          {showToolPanel && isMobile && rightPanel && React.cloneElement(rightPanel as any, {
            onClose: () => {
              if (setShowRightPanel) setShowRightPanel(false);
              if (setActiveTool) setActiveTool("");
              setLastActiveTool(null);
            },
          })}
        </div>
      </div>
    </div>
  );
}

export function MainLayoutWrapper(props: any) {
  return (
    <NotificationProvider>
      <MainLayout {...props} />
    </NotificationProvider>
  );
}
