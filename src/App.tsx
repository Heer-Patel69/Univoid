import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Materials from "./pages/Materials";
import News from "./pages/News";
import Blogs from "./pages/Blogs";
import Books from "./pages/Books";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import UploadMaterial from "./pages/UploadMaterial";
import WriteBlog from "./pages/WriteBlog";
import SubmitNews from "./pages/SubmitNews";
import ListBook from "./pages/ListBook";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/news" element={<News />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/books" element={<Books />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/upload-material" element={<UploadMaterial />} />
            <Route path="/dashboard/write-blog" element={<WriteBlog />} />
            <Route path="/dashboard/submit-news" element={<SubmitNews />} />
            <Route path="/dashboard/list-book" element={<ListBook />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
