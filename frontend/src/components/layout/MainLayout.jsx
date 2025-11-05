// src/components/layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    document.body.style.overflow = !sidebarOpen ? 'hidden' : 'unset';
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    document.body.style.overflow = 'unset';
  };

  // Sidebar collapse state ko handle karna
  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:hidden`}>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} onCollapse={handleSidebarCollapse} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex">
        <Sidebar isOpen={true} onClose={closeSidebar} onCollapse={handleSidebarCollapse} />
      </div>

      {/* Main Content Area - Dynamic padding based on sidebar state */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-78'
      }`}>
        {/* Header */}
        <header className="sticky top-0 z-20 glass-effect">
          <Header onMenuToggle={toggleSidebar} />
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-transparent">
          {children}
        </main>

        {/* Footer */}
        <footer className="glass-effect">
          <Footer />
        </footer>
      </div>

      {/* Mobile Menu Button */}
      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        <button
          onClick={toggleSidebar}
          className="p-3 bg-[#0082FB] hover:bg-[#0064E0] rounded-full shadow-lg transition-colors glass-effect border border-white/10"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Layout;