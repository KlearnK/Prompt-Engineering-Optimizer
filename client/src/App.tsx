import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModelConfigProvider } from "@/contexts/ModelConfigContext";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PromptOptimizer from "./pages/PromptOptimizer";
import TechniquesLibrary from "./pages/TechniquesLibrary";
import LearningModule from "./pages/LearningModule";
import HistoryPage from "./pages/HistoryPage";
import LearningDashboard from "./pages/LearningDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/optimizer" component={PromptOptimizer} />
      <Route path="/techniques" component={TechniquesLibrary} />
      <Route path="/learn" component={LearningModule} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/learning" component={LearningDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ModelConfigProvider>
        <ThemeProvider defaultTheme="light" switchable>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </ModelConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
