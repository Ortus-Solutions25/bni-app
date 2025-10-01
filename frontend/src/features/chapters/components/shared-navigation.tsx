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
        {/* Chapter Dashboard - minimizes when admin is active */}
        <motion.button
          onClick={() => navigate('/')}
          className={`relative px-4 py-2 rounded-lg font-semibold transition-colors ${
            currentTab === 'dashboard'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={{
            opacity: isAdminPage ? 0.5 : 1,
            scale: isAdminPage ? 0.9 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Chapter Dashboard</span>
          </div>
          {currentTab === 'dashboard' && (
            <motion.div
              layoutId="navigationActiveTab"
              className="absolute inset-0 bg-secondary/20 rounded-lg -z-10"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
        </motion.button>

        {/* Admin Operations Label */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{
            opacity: isAdminPage ? 1 : 0,
            width: isAdminPage ? 'auto' : 0
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <span className="text-muted-foreground text-sm px-2">|</span>
        </motion.div>

        {/* Admin Sub-Tabs - expand when admin is active */}
        <AnimatePresence>
          {isAdminPage && adminSubTabs.map((subTab, index) => {
            const SubIcon = subTab.icon;
            const isSubActive = location.pathname === subTab.path;
            return (
              <motion.button
                key={subTab.id}
                onClick={() => navigate(subTab.path)}
                className={`relative px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isSubActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.8 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <SubIcon className="h-4 w-4" />
                  <span className="hidden lg:inline text-sm">{subTab.label}</span>
                </div>
                {isSubActive && (
                  <motion.div
                    layoutId="navigationActiveTab"
                    className="absolute inset-0 bg-secondary/20 rounded-lg -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
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
