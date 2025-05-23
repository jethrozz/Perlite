import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Columns from "@/pages/columns";
import ColumnDetail from "@/pages/column-detail";
import CreatorDashboard from "@/pages/creator-dashboard";
import MyKnowledgeBase from "@/pages/my-knowledge-base";
import KnowledgeBase from "@/pages/knowledge-base";
import MySubscriptions from "@/pages/my-subscriptions";
import { useState, useEffect } from "react";
import { networkConfig } from "@/networkConfig.ts";
import { useCurrentAccount } from "@mysten/dapp-kit";
function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const currentAccount = useCurrentAccount();
  useEffect(() => {
    if (currentAccount) {
      setIsAuthenticated(true);
    }
  }, [currentAccount, setIsAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyber-purple"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/columns" component={Columns} />
      <Route path="/columns/:id">
        {(params) => <ColumnDetail id={parseInt(params.id)} />}
      </Route>
      <Route path="/my-subscriptions" component={MySubscriptions} />
      <Route path="/my-knowledge-base" component={MyKnowledgeBase} />
      <Route path="/creator/konwledge/base" component={KnowledgeBase} />
      <Route path="/creator/dashboard" component={CreatorDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-16">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
