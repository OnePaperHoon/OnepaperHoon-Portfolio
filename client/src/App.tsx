import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/lib/i18n";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const WorkDetail = lazy(() => import("./pages/WorkDetail"));

function RouteLoading() {
  return <main className="route-loading" aria-live="polite"><span></span><p>LOADING STUDIO</p></main>;
}

export default function App() {
  return <LanguageProvider>
    <Toaster richColors position="bottom-right" />
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/work/:slug" component={WorkDetail} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  </LanguageProvider>;
}
