import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import ClientsPage from "./pages/ClientsPage";
import CalendarPage from "./pages/CalendarPage";
import AddClientPage from "./pages/AddClientPage";
import SessionPage from "./pages/SessionPage";
import NotesPage from "./pages/NotesPage";
import VideoSessionPage from "./pages/VideoSessionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <SidebarProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/clients" element={<ClientsPage />} />
            <Route path="/dashboard/calendar" element={<CalendarPage />} />
            <Route path="/dashboard/add-client" element={<AddClientPage />} />
            <Route path="/dashboard/sessions" element={<SessionPage />} />
            <Route path="/dashboard/sessions/:sessionId/video" element={<VideoSessionPage />} />
            <Route path="/dashboard/notes" element={<NotesPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SidebarProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
