import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { BarChart3 } from "lucide-react";

// Import components
import ChapterRoutes from "./components/ChapterRoutes";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppContent />
      </div>
    </Router>
  );
}

function AppContent() {
  return (
    <div className="flex h-screen">
      {/* Main Content Area - Full Width */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Fixed Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-primary" />
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  📊 BNI PALMS Analysis
                </h1>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Professional Business Analytics
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
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
