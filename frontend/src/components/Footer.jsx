import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                <i className="fas fa-map-location-dot text-white text-sm"></i>
              </div>
              <span className="text-white font-bold text-lg">Travel Memarie</span>
            </div>
            <p className="text-sm text-gray-400">
              Capture your adventures, relive your memories, inspire the world.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className="hover:text-teal-400 transition-colors duration-200">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/add-trip" className="hover:text-teal-400 transition-colors duration-200">
                  Add Trip
                </Link>
              </li>
              <li>
                <Link to="/memories" className="hover:text-teal-400 transition-colors duration-200">
                  My Memories
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/help" className="hover:text-teal-400 transition-colors duration-200">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-teal-400 transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-teal-400 transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Follow Us */}
          <div>
            <h3 className="text-white font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-teal-600 transition-colors duration-200"
                aria-label="Follow us on Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-teal-600 transition-colors duration-200"
                aria-label="Follow us on Twitter"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-teal-600 transition-colors duration-200"
                aria-label="Follow us on Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-800 mt-5 pt-5 text-sm -mb-4 text-center text-gray-400">
          <p>&copy; {currentYear} Travel Memarie. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;