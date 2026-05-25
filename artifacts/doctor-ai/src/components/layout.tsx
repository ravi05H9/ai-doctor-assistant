import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Calendar, HeartPulse, LayoutDashboard, MessageCircle, Pill, Stethoscope, Menu, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ai-chat", label: "AI Chat", icon: MessageCircle },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/medications", label: "Medications", icon: Pill },
  { href: "/recovery", label: "Recovery Log", icon: Activity },
  { href: "/reports", label: "Report Analyzer", icon: FileText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64 p-4">
      <div className="flex items-center gap-2 px-2 mb-8 text-sidebar-primary">
        <HeartPulse className="h-6 w-6" />
        <span className="font-semibold text-lg">AI Doctor</span>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="hidden md:block fixed inset-y-0 z-50">
        <NavContent />
      </div>
      <div className="md:hidden flex items-center p-4 border-b bg-background sticky top-0 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <NavContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 text-primary">
          <HeartPulse className="h-5 w-5" />
          <span className="font-semibold">AI Doctor</span>
        </div>
      </div>
      <main className="flex-1 md:pl-64 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
