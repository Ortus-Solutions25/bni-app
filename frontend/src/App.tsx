import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { BarChart3, Settings, Home } from "lucide-react";
import { Button } from "./components/ui/button";

// Import components
import ChapterRoutes from "./components/ChapterRoutes";

function App() {
  return (
    <Router>
      <div className="dark min-h-screen bg-background text-foreground">
        <AppContent />
      </div>
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex h-screen">
      {/* Main Content Area - Full Width */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Fixed Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-primary" />
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-foreground">
                  📊 BNI PALMS Analysis
                </h1>
                <span className="text-sm text-muted-foreground">
                  Professional Business Analytics
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isHomePage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              )}
              <Button
                variant={isAdminPage ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(isAdminPage ? '/' : '/admin')}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isAdminPage ? 'Exit Admin' : 'Admin'}
                </span>
              </Button>
              <span className="text-sm text-muted-foreground font-medium">
                Version 2.0
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            <Routes>
              <Route path="/*" element={<ChapterRoutes />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
