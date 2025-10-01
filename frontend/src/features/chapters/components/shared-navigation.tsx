import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Settings, Users } from 'lucide-react';
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

  const tabs = [
    { id: 'dashboard', label: 'Chapter Dashboard', icon: Building2, path: '/' },
    { id: 'upload', label: 'Data Upload', icon: Settings, path: '/admin/upload' },
    { id: 'bulk', label: 'Bulk Operations', icon: Settings, path: '/admin/bulk' },
    { id: 'chapters', label: 'Chapter Management', icon: Building2, path: '/admin/chapters' },
    { id: 'members', label: 'Member Management', icon: Users, path: '/admin/members' },
    { id: 'system', label: 'System Status', icon: Settings, path: '/admin/system' }
  ];

  const getCurrentTab = () => {
    if (location.pathname === '/') return 'dashboard';
    if (location.pathname.startsWith('/admin/upload')) return 'upload';
    if (location.pathname.startsWith('/admin/bulk')) return 'bulk';
    if (location.pathname.startsWith('/admin/chapters')) return 'chapters';
    if (location.pathname.startsWith('/admin/members')) return 'members';
    if (location.pathname.startsWith('/admin/system')) return 'system';
    return 'dashboard';
  };

  const currentTab = getCurrentTab();

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => navigate(tab.path)}
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
