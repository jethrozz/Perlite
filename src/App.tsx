import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
// 该错误提示表明找不到 "@tanstack/react-query" 模块，可能需要安装该模块
// 可尝试在终端运行 `npm install @tanstack/react-query` 或 `yarn add @tanstack/react-query` 进行安装
// 安装完成后再使用该导入语句
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import SeriesDetails from "@/pages/series/[id]";
import BrowseSeries from "@/pages/series/browse";
import UserLibrary from "@/pages/user/library";
import CreatorDashboard from "@/pages/creator/dashboard";
import CreatorSeries from "@/pages/creator/series";
import CreatorContent from "@/pages/creator/content";
import ContentEditor from "@/pages/creator/editor";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

function Router() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/register" component={Register} />
          <Route path="/series/:id" component={SeriesDetails} />
          <Route path="/series/browse" component={BrowseSeries} />
          <Route path="/user/library" component={UserLibrary} />
          <Route path="/creator/dashboard" component={CreatorDashboard} />
          <Route path="/creator/series" component={CreatorSeries} />
          <Route path="/creator/content" component={CreatorContent} />
          <Route path="/creator/editor" component={ContentEditor} />
          <Route path="/creator/editor/:id" component={ContentEditor} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
