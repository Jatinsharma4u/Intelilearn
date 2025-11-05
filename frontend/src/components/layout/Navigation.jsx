// src/components/layout/Navigation.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/mentor", label: "Courses" },
    { path: "/profile", label: "Profile" },
  ];

  return (
    <nav className="flex items-center space-x-1">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`
              relative px-4 py-2 font-medium transition-all duration-200 rounded-lg
              ${isActive 
                ? "text-white bg-[#0082FB] shadow-lg shadow-[#0082FB]/25" 
                : "text-[#A0A0B8] hover:text-white hover:bg-[#2A2A3D]"
              }
            `}
          >
            {item.label}
            {isActive && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#00FFA3] rounded-full animate-pulse"></div>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation;