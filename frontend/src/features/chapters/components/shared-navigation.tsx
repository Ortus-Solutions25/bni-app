import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Settings, Users, ChevronDown, CloudUpload, UserPlus, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';

interface SharedNavigationProps {
  totalMembers?: number;
  biggestChapter?: { chapterName: string; memberCount: number };
}

export const SharedNavigation: React.FC<SharedNavigationProps> = ({
  totalMembers,
  biggestChapter,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Chapter Dashboard', icon: Building2, path: '/' },
    { id: 'admin', label: 'Admin Operations', icon: Settings, path: null }
  ];

  const adminSubTabs = [
    { id: 'upload', label: 'Data Upload', icon: CloudUpload, path: '/admin/upload' },
    { id: 'bulk', label: 'Bulk Operations', icon: UserPlus, path: '/admin/bulk' },
    { id: 'chapters', label: 'Chapter Management', icon: Building2, path: '/admin/chapters' },
    { id: 'members', label: 'Member Management', icon: Users, path: '/admin/members' },
    { id: 'system', label: 'System Status', icon: Database, path: '/admin/system' }
  ];

  const isAdminPage = location.pathname.startsWith('/admin');
  const currentTab = isAdminPage ? 'admin' : 'dashboard';

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Main Tabs */}
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.id === 'admin') {
            return (
              <div key={tab.id} className="relative">
                <motion.button
                  onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                  className={`relative px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${showAdminDropdown ? 'rotate-180' : ''}`} />
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="navigationActiveTab"
                      className="absolute inset-0 bg-secondary/20 rounded-lg -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showAdminDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 bg-background border rounded-lg shadow-lg py-2 min-w-[200px] z-50"
                    >
                      {adminSubTabs.map((subTab) => {
                        const SubIcon = subTab.icon;
                        const isSubActive = location.pathname === subTab.path;
                        return (
                          <button
                            key={subTab.id}
                            onClick={() => {
                              navigate(subTab.path);
                              setShowAdminDropdown(false);
                            }}
                            className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                              isSubActive
                                ? 'bg-secondary/20 text-foreground'
                                : 'text-muted-foreground hover:bg-secondary/10 hover:text-foreground'
                            }`}
                          >
                            <SubIcon className="h-4 w-4" />
                            <span className="text-sm">{subTab.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <motion.button
              key={tab.id}
              onClick={() => tab.path && navigate(tab.path)}
              className={`relative px-4 py-2 rounded-lg font-semibold transition-colors ${
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="navigationActiveTab"
                  className="absolute inset-0 bg-secondary/20 rounded-lg -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {totalMembers !== undefined && currentTab === 'dashboard' && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="font-semibold">{formatNumber(totalMembers)}</span>
            <span className="text-xs opacity-80 hidden sm:inline">Total Members</span>
          </Badge>
          {biggestChapter && biggestChapter.chapterName && (
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span className="font-semibold truncate max-w-[120px]">{biggestChapter.chapterName}</span>
              <span className="text-xs opacity-80 hidden sm:inline">({biggestChapter.memberCount})</span>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
