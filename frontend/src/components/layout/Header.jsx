// src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Bell, User, Sparkles, X, LogOut, Settings } from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ onMenuToggle }) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { profile } = useProfile();
  const { user, logout } = useAuth();
  
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserName = () => {
    return profile?.fullName || user?.displayName || 'User';
  };

  const getUserLevel = () => {
    return profile?.progress?.level || 1;
  };

  const getAvatarUrl = () => {
    if (profile?.avatar && profile.avatar.startsWith('/')) {
      return profile.avatar;
    }
    return user?.photoURL || null;
  };

  const notifications = [
    { id: 1, text: 'New course available: Advanced React', time: '5 min ago', unread: true },
    { id: 2, text: 'Your streak is 7 days! Keep going!', time: '1 hour ago', unread: true },
    { id: 3, text: 'Friend request from Alex', time: '2 hours ago', unread: false },
    { id: 4, text: 'Weekly progress report ready', time: '1 day ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-[#1B1B28] border-b border-[#2A2A3D] px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="p-2.5 rounded-xl text-[#A0A0B8] hover:text-white hover:bg-[#0082FB]/20 transition-all duration-200 lg:hidden group"
          >
            <Menu className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Logo - Mobile Only */}
          <Link to="/dashboard" className="flex items-center space-x-2 group lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-[#0082FB] to-[#0064EO] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">IntelliLearn</span>
          </Link>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-2xl mx-6 hidden md:block">
          <div className="relative group">
            <Search className="h-4 w-4 text-[#A0A0B8] absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-[#0082FB] transition-colors" />
            <input
              type="text"
              placeholder="Search courses, topics, friends..."
              className="w-full pl-11 pr-4 py-3 border border-[#2A2A3D] rounded-xl bg-[#0D0D14] text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          
          {/* Mobile Search Toggle */}
          <button 
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="p-2.5 rounded-xl text-[#A0A0B8] hover:text-white hover:bg-[#2A2A3D] transition-all duration-200 md:hidden group"
          >
            {showMobileSearch ? 
              <X className="h-5 w-5 group-hover:scale-110 transition-transform" /> : 
              <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
            }
          </button>

          {/* Notifications with Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl text-[#A0A0B8] hover:text-white hover:bg-[#2A2A3D] transition-all duration-200 relative group"
            >
              <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF4D6D] rounded-full border-2 border-[#1B1B28] flex items-center justify-center animate-pulse">
                  <span className="text-[10px] text-white font-bold">{unreadCount}</span>
                </div>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-[#1B1B28] border border-[#2A2A3D] rounded-xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95">
                <div className="p-4 border-b border-[#2A2A3D]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Notifications</h3>
                    <span className="text-xs text-[#0082FB] bg-[#0082FB]/10 px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-[#2A2A3D] last:border-b-0 hover:bg-[#0D0D14] transition-colors cursor-pointer ${
                        notification.unread ? 'bg-[#0D0D14]/50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.unread ? 'bg-[#0082FB] animate-pulse' : 'bg-[#2A2A3D]'
                        }`} />
                        <div className="flex-1">
                          <p className="text-white text-sm">{notification.text}</p>
                          <p className="text-[#A0A0B8] text-xs mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 border-t border-[#2A2A3D]">
                  <button className="w-full text-center text-[#0082FB] text-sm hover:text-[#0064EO] transition-colors">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu with Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-[#2A2A3D] transition-all duration-200 group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white text-left">{getUserName()}</p>
                <p className="text-xs text-[#A0A0B8]">Level {getUserLevel()}</p>
              </div>
              
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-[#0082FB] to-[#0064EO] rounded-xl flex items-center justify-center overflow-hidden border-2 border-[#2A2A3D] group-hover:border-[#0082FB] transition-colors duration-200 shadow-lg">
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00FFA3] rounded-full border-2 border-[#1B1B28]"></div>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[#1B1B28] border border-[#2A2A3D] rounded-xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95">
                {/* Profile Header */}
                <div className="p-4 border-b border-[#2A2A3D]">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#0082FB] to-[#0064EO] rounded-xl flex items-center justify-center overflow-hidden border-2 border-[#2A2A3D]">
                      {getAvatarUrl() ? (
                        <img
                          src={getAvatarUrl()}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{getUserName()}</p>
                      <p className="text-[#A0A0B8] text-sm">Level {getUserLevel()} • Student</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 p-3 rounded-lg text-[#A0A0B8] hover:text-white hover:bg-[#0D0D14] transition-all duration-200 group"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="h-4 w-4 group-hover:text-[#0082FB]" />
                    <span>My Profile</span>
                  </Link>
                  
                  <Link
                    to="/settings"
                    className="flex items-center space-x-3 p-3 rounded-lg text-[#A0A0B8] hover:text-white hover:bg-[#0D0D14] transition-all duration-200 group"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings className="h-4 w-4 group-hover:text-[#0082FB]" />
                    <span>Settings</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg text-[#FF4D6D] hover:text-white hover:bg-[#FF4D6D]/10 transition-all duration-200 group mt-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Panel */}
      <div className={`mt-3 transition-all duration-300 overflow-hidden ${
        showMobileSearch ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
      } md:hidden`}>
        <div className="relative">
          <Search className="h-4 w-4 text-[#A0A0B8] absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses, topics, friends..."
            className="w-full pl-10 pr-4 py-3 border border-[#2A2A3D] rounded-xl bg-[#0D0D14] text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/20 transition-all duration-200"
            autoFocus
          />
        </div>
      </div>
    </header>
  );
};

export default Header;