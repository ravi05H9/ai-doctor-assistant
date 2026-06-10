import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { ClerkProvider, SignIn, SignUp } from "@clerk/clerk-react";

import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import AiChat from "@/pages/ai-chat";
import Doctors from "@/pages/doctors";
import Appointments from "@/pages/appointments";
import Medications from "@/pages/medications";
import Recovery from "@/pages/recovery";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/sign-in" component={() => (
            <div className="min-h-screen flex items-center justify-center">
              <SignIn routing="path" path="/sign-in" />
            </div>
          )} />
          <Route path="/sign-in/sso-callback" component={() => (
            <div className="min-h-screen flex items-center justify-center">
              <SignIn routing="path" path="/sign-in" />
            </div>
          )} />
          <Route path="/sign-up" component={() => (
            <div className="min-h-screen flex items-center justify-center">
              <SignUp routing="path" path="/sign-up" />
            </div>
          )} />
          <Route path="/sign-up/sso-callback" component={() => (
            <div className="min-h-screen flex items-center justify-center">
              <SignUp routing="path" path="/sign-up" />
            </div>
          )} />
          <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/ai-chat" component={() => <ProtectedRoute component={AiChat} />} />
          <Route path="/doctors" component={() => <ProtectedRoute component={Doctors} />} />
          <Route path="/appointments" component={() => <ProtectedRoute component={Appointments} />} />
          <Route path="/medications" component={() => <ProtectedRoute component={Medications} />} />
          <Route path="/recovery" component={() => <ProtectedRoute component={Recovery} />} />
          <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <WouterRouter base={basePath}>
        <AppRoutes />
      </WouterRouter>
    </ClerkProvider>
  );
}

export default App;