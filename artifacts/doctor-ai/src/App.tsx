import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import AiChat from "@/pages/ai-chat";
import Doctors from "@/pages/doctors";
import Appointments from "@/pages/appointments";
import Medications from "@/pages/medications";
import Recovery from "@/pages/recovery";
import Reports from "@/pages/reports";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/ai-chat" component={AiChat} />
        <Route path="/doctors" component={Doctors} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/medications" component={Medications} />
        <Route path="/recovery" component={Recovery} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
