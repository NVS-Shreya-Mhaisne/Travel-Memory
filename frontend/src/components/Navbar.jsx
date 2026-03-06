import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const [isHovered, setIsHovered] = useState(null);

  const handleLogout = () => {
    console.log("Logout clicked");
    logout();
    try { showToast('Logged out', 'info'); } catch (e) {}
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="w-full px-6 py-4 md:px-10 lg:px-16 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-50 font-sans">
      {/* LEFT: BRAND WITH BOTTOM ANIMATED LINE ON HOVER */}
      <Link
        to="/"
        className="flex items-center gap-2 group relative"
        onMouseEnter={() => setIsHovered('brand')}
        onMouseLeave={() => setIsHovered(null)}
      >
        <div className="relative">
          <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-105`}>
            <i className="fas fa-map-location-dot text-xl md:text-2xl text-white"></i>
          </div>
        </div>
        <div className="flex flex-col leading-tight relative">
          <span className="text-lg md:text-xl font-bold text-gray-800">
            Travel Memarie
          </span>
          <span className={`text-[0.65rem] md:text-[0.7rem] font-medium flex items-center gap-1 transition-colors duration-300 group-hover:text-teal-600 text-gray-500`}>
            <i className="fas fa-compass text-[0.6rem]"></i> explore   · save
          </span>
          {/* Animated bottom line on hover */}
          <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300 group-hover:w-full"></div>
        </div>
      </Link>

      {/* RIGHT: NAVIGATION LINKS - CLOSE TOGETHER */}
      <div className="flex items-center gap-1 md:gap-2">

        {/* DASHBOARD */}
        {isAuthenticated && (
          <Link
            to="/dashboard"
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-1.5 text-sm md:text-base font-medium transition-all duration-200 ${isActive('/dashboard')
                ? 'bg-teal-50 text-teal-700'
                : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
              }`}
            onMouseEnter={() => setIsHovered('dashboard')}
            onMouseLeave={() => setIsHovered(null)}
          >
            <i className={`fas fa-th-large text-sm ${isHovered === 'dashboard' || isActive('/dashboard') ? 'text-teal-600' : 'text-gray-400'
              }`}></i>
            <span className="hidden sm:inline">Dashboard</span>
            <span className="inline sm:hidden">Dash</span>
          </Link>
        )}

        {/* ADD TRIP */}
        {isAuthenticated && (
          <Link
            to="/add-trip"
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-1.5 text-sm md:text-base font-medium transition-all duration-200 ${isActive('/add-trip')
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            onMouseEnter={() => setIsHovered('addTrip')}
            onMouseLeave={() => setIsHovered(null)}
          >
            <i className={`fas fa-plus-circle text-sm ${isHovered === 'addTrip' || isActive('/add-trip') ? 'text-emerald-600' : 'text-gray-400'
              }`}></i>
            <span className="hidden sm:inline">Add Trip</span>
            <span className="inline sm:hidden">Add</span>
          </Link>
        )}

        {/* LOGOUT / LOGIN */}
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-1.5 text-sm md:text-base font-medium transition-all duration-200 ${isHovered === 'logout'
                ? 'bg-rose-50 text-rose-600'
                : 'text-gray-600 hover:bg-rose-50 hover:text-rose-600'
              }`}
            onMouseEnter={() => setIsHovered('logout')}
            onMouseLeave={() => setIsHovered(null)}
          >
            <i className={`fas fa-sign-out-alt text-sm ${isHovered === 'logout' ? 'text-rose-600' : 'text-gray-400'
              }`}></i>
            <span className="hidden sm:inline">Logout</span>
            <span className="inline sm:hidden">Exit</span>
          </button>
        ) : (
          <Link
            to="/login"
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-1.5 text-sm md:text-base font-medium transition-all duration-200 ${isActive('/login')
                ? 'bg-teal-50 text-teal-700'
                : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
              }`}
            onMouseEnter={() => setIsHovered('login')}
            onMouseLeave={() => setIsHovered(null)}
          >
            <i className={`fas fa-sign-in-alt text-sm ${isHovered === 'login' || isActive('/login') ? 'text-teal-600' : 'text-gray-400'
              }`}></i>
            <span className="hidden sm:inline">Login</span>
            <span className="inline sm:hidden">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
