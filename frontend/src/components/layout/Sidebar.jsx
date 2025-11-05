// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Upload, GraduationCap, Brain, Users, 
  MessageCircle, Bell, User, Settings, ChevronLeft, 
  ChevronRight, BookOpen, TrendingUp, Award, Sparkles,
  Zap, Target, Users2, MessageSquare
} from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';

const Sidebar = ({ isOpen, onClose, onCollapse }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { profile } = useProfile();

  const quickStats = [
    { 
      icon: BookOpen, 
      label: 'Courses', 
      value: profile?.progress?.courses_completed ?? 0, 
      color: 'text-[#0082FB]',
      bg: 'bg-[#0082FB]/10'
    },
    { 
      icon: TrendingUp, 
      label: 'Streak', 
      value: profile?.settings?.streak ?? 0, 
      color: 'text-[#00FFA3]',
      bg: 'bg-[#00FFA3]/10'
    },
    { 
      icon: Award, 
      label: 'Level', 
      value: profile?.progress?.level ?? 1, 
      color: 'text-[#FF9F5B]',
      bg: 'bg-[#FF9F5B]/10'
    },
  ];

  const navigationItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', badge: null },
    { path: '/ai-pack', icon: Upload, label: 'AI Pack', badge: 'New' },
    { path: '/mentor', icon: GraduationCap, label: 'AI Mentor', badge: null },
    { path: '/weakness', icon: Brain, label: 'Weakness Detector', badge: 'AI' },
    { path: '/friends', icon: Users2, label: 'Friends', badge: null },
    { path: '/chat', icon: MessageSquare, label: 'Chat', badge: null },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: '3' },
    { path: '/profile', icon: User, label: 'Profile', badge: null },
    { path: '/settings', icon: Settings, label: 'Settings', badge: null },
  ];

  const handleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    if (onCollapse) {
      onCollapse(newCollapsed);
    }
  };

  const getUserName = () => {
    return profile?.fullName || 'User';
  };

  const getUserXP = () => {
    return profile?.progress?.xp ?? 0;
  };

  const getUserLevel = () => {
    return profile?.progress?.level ?? 1;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        flex flex-col h-full
        bg-[#1B1B28] border-r border-[#2A2A3D]
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-80'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-[#2A2A3D]">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className={`flex items-center space-x-3 transition-all ${collapsed ? 'justify-center w-full' : ''}`}>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0082FB] to-[#0064EO] rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00FFA3] rounded-full border-2 border-[#1B1B28] flex items-center justify-center">
                  <Zap className="h-2 w-2 text-[#1B1B28]" />
                </div>
              </div>
              
              {!collapsed && (
                <div>
                  <h1 className="text-xl font-bold text-white">IntelliLearn</h1>
                  <p className="text-sm text-[#A0A0B8]">AI Powered Learning</p>
                </div>
              )}
            </div>

            {/* Collapse Button - Desktop Only */}
            <button
              onClick={handleCollapse}
              className="hidden lg:flex p-2 rounded-xl bg-[#2A2A3D] hover:bg-[#0082FB] transition-all duration-200 group"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 text-[#A0A0B8] group-hover:text-white transition-colors" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-[#A0A0B8] group-hover:text-white transition-colors" />
              )}
            </button>
          </div>

          {/* Quick Stats */}
          {!collapsed && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className={`text-center p-3 rounded-xl border border-[#2A2A3D] ${stat.bg} backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-[#0082FB]/30`}
                  >
                    <Icon className={`h-4 w-4 mx-auto mb-2 ${stat.color}`} />
                    <div className="text-white font-bold text-sm">{stat.value}</div>
                    <div className="text-xs text-[#A0A0B8]">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative
                      ${isActive
                        ? 'bg-gradient-to-r from-[#0082FB] to-[#0064EO] text-white shadow-lg shadow-[#0082FB]/25'
                        : 'text-[#A0A0B8] hover:bg-[#2A2A3D] hover:text-white hover:border hover:border-[#0082FB]/20'
                      }
                      ${collapsed ? 'justify-center px-3' : ''}
                    `}
                    onClick={onClose}
                  >
                    <div className="relative">
                      <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#A0A0B8] group-hover:text-white'}`} />
                      {item.badge && (
                        <span className={`absolute -top-2 -right-2 text-[10px] px-1 rounded-full border border-[#1B1B28] ${
                          item.badge === 'New' ? 'bg-[#00FFA3] text-[#1B1B28]' : 
                          item.badge === 'AI' ? 'bg-[#0082FB] text-white' : 
                          'bg-[#FF4D6D] text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    
                    {!collapsed && (
                      <>
                        <span className="ml-3 font-medium flex-1">{item.label}</span>
                        {isActive && (
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                      </>
                    )}

                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-[#0D0D14] text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 border border-[#2A2A3D] shadow-2xl">
                        {item.label}
                        {item.badge && (
                          <span className={`ml-2 text-[10px] px-1 rounded ${
                            item.badge === 'New' ? 'bg-[#00FFA3] text-[#1B1B28]' : 
                            item.badge === 'AI' ? 'bg-[#0082FB] text-white' : 
                            'bg-[#FF4D6D] text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile Section */}
        <div className="flex-shrink-0 p-4 border-t border-[#2A2A3D]">
          <Link
            to="/profile"
            className={`
              flex items-center p-3 rounded-xl bg-[#0D0D14]/50 backdrop-blur-sm border border-[#2A2A3D] 
              hover:border-[#0082FB]/30 transition-all duration-200 group
              ${collapsed ? 'justify-center' : ''}
            `}
            onClick={onClose}
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-[#0082FB] to-[#0064EO] rounded-xl flex items-center justify-center overflow-hidden border-2 border-[#2A2A3D] group-hover:border-[#0082FB] transition-colors">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00FFA3] rounded-full border-2 border-[#1B1B28] flex items-center justify-center">
                <Target className="h-2 w-2 text-[#1B1B28]" />
              </div>
            </div>
            
            {!collapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{getUserName()}</p>
                <p className="text-xs text-[#A0A0B8]">
                  {getUserXP()} XP • Level {getUserLevel()}
                </p>
              </div>
            )}

            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-[#0D0D14] text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 border border-[#2A2A3D] shadow-2xl">
                <div className="font-semibold">{getUserName()}</div>
                <div className="text-[#00FFA3] text-xs">{getUserXP()} XP</div>
                <div className="text-[#A0A0B8] text-xs">Level {getUserLevel()}</div>
              </div>
            )}
          </Link>
        </div>
      </div>
    </>
  );
};

export default Sidebar;