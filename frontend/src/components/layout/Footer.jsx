// src/components/layout/Footer.jsx
import React from "react";
import { Facebook, Twitter, Instagram, Linkedin, Heart, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-[#1B1B28] border-t border-[#2A2A3D]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0082FB] to-[#0064EO] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IL</span>
              </div>
              <span className="text-xl font-bold text-white">IntelliLearn</span>
            </div>
            <p className="text-[#A0A0B8] text-sm leading-relaxed">
              AI-powered learning platform to enhance your skills and accelerate your growth journey.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-4 text-lg">Quick Links</h3>
            <div className="space-y-3">
              {['Dashboard', 'AI Pack', 'AI Mentor', 'Weakness Detector'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="block text-[#A0A0B8] hover:text-[#0082FB] transition-colors duration-200 text-sm"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-4 text-lg">Support</h3>
            <div className="space-y-3">
              {['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="block text-[#A0A0B8] hover:text-[#0082FB] transition-colors duration-200 text-sm"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-4 text-lg">Connect With Us</h3>
            <p className="text-[#A0A0B8] text-sm mb-4">
              Follow us on social media for updates and tips.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center space-x-3 mb-4">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Linkedin, label: 'LinkedIn' }
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  className="w-10 h-10 bg-[#0D0D14] border border-[#2A2A3D] rounded-lg flex items-center justify-center text-[#A0A0B8] hover:text-[#0082FB] hover:border-[#0082FB] transition-all duration-200 group"
                  title={social.label}
                >
                  <social.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>

            {/* Email */}
            <div className="flex items-center space-x-2 text-[#A0A0B8] text-sm">
              <Mail className="h-4 w-4" />
              <span>support@intellilearn.com</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#2A2A3D]">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-[#A0A0B8] text-sm">
              <span>© {new Date().getFullYear()} IntelliLearn. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Made with</span>
              <Heart className="h-3 w-3 text-[#FF4D6D] fill-current hidden sm:block" />
              <span className="hidden sm:inline">for learners</span>
            </div>

            {/* Bottom Links */}
            <div className="flex items-center space-x-4 text-[#A0A0B8] text-sm">
              <a href="#" className="hover:text-[#0082FB] transition-colors duration-200">
                Privacy Policy
              </a>
              <div className="w-1 h-1 bg-[#2A2A3D] rounded-full"></div>
              <a href="#" className="hover:text-[#0082FB] transition-colors duration-200">
                Terms of Service
              </a>
              <div className="w-1 h-1 bg-[#2A2A3D] rounded-full"></div>
              <a href="#" className="hover:text-[#0082FB] transition-colors duration-200">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;