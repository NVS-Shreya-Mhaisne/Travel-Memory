import React, { useState } from "react";
import { Link } from "react-router-dom";
import { resolveImage } from "../service/api";

const TripCard = ({ trip, variant = "default" }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // If no trip data provided, don't render
  if (!trip) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Date not set";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        const diffMonths = Math.floor(diffDays / 30);
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
      }
    } catch (e) {
      return "Invalid date";
    }
  };

  // Calculate duration from dates
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days`;
    } catch (e) {
      return "N/A";
    }
  };

  // Format budget
  const formatBudget = (budget, currency = 'USD') => {
    if (!budget) return "N/A";
    const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
    const symbol = symbols[currency] || '$';
    return `${symbol}${budget}`;
  };

  // Get display values from trip data
  const rawImage = trip.coverImage || (trip.images && trip.images[0]) || "";
  const displayImage = resolveImage(rawImage) || "https://images.unsplash.com/photo-1537996192471-41c6b5e541d3?w=600&auto=format";
  const displayDate = trip.startDate ? formatDate(trip.startDate) : "Date not available";
  const displayDuration = calculateDuration(trip.startDate, trip.endDate);
  const displayBudget = formatBudget(trip.budget, trip.currency);
  const displayLocation = trip.location || "Unknown Location";
  const displayDescription = trip.description || "No description available";
  const displayMemories = trip.memories || (trip.images?.length || 0);
  const displayLikes = trip.likes || 0;
  const displayRating = trip.rating || 4.5;
  const displayStatus = trip.status || "completed";
  const displayWeather = trip.weather || "Weather info not available";
  const displayHighlights = trip.highlights || ["No highlights added yet"];
  const displayCountry = trip.country || (trip.location?.split(',').length > 1 ? trip.location.split(',')[1].trim() : "");

  // Different card variants
  const cardVariants = {
    default: "w-full max-w-sm",
    featured: "w-full max-w-md lg:max-w-lg",
    compact: "w-full max-w-xs",
    horizontal: "w-full max-w-2xl flex"
  };

  return (
    <div
      className={`group relative ${cardVariants[variant]} bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 overflow-hidden cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* PREMIUM IMAGE SECTION WITH OVERLAYS */}
      <div className={`relative overflow-hidden ${variant === 'horizontal' ? 'w-2/5' : 'h-56 md:h-64'}`}>
        {/* Main Image */}
        <img
          src={displayImage}
          alt={displayLocation}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1537996192471-41c6b5e541d3?w=600&auto=format";
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>

        {/* Animated Shine Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-1000">
          <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 group-hover:left-full transition-all duration-1000"></div>
        </div>

        {/* STATUS BADGE */}
        <div className="absolute top-4 left-4 z-10">
          <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md shadow-lg border ${displayStatus === 'completed'
            ? 'bg-emerald-500/90 text-white border-emerald-300/50'
            : 'bg-amber-500/90 text-white border-amber-300/50'
            }`}>
            <span className={`w-2 h-2 rounded-full ${displayStatus === 'completed' ? 'bg-white animate-pulse' : 'bg-white'}`}></span>
            {displayStatus === 'completed' ? 'Completed' : 'Upcoming'}
          </span>
        </div>

        {/* DATE BADGE */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-gray-800 shadow-lg border border-white/50">
            <i className="far fa-calendar-alt mr-1.5 text-teal-600"></i>
            {displayDate}
          </div>
        </div>

        {/* RATING BADGE (shows on hover) */}
        <div className={`absolute bottom-4 left-4 z-10 transition-all duration-500 transform ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm border border-white/20">
            <i className="fas fa-star text-amber-400 text-xs"></i>
            <span className="font-bold">{displayRating}</span>
            <span className="text-gray-300 text-xs">/5.0</span>
          </div>
        </div>

        {/* QUICK ACTION BUTTONS */}
        <div className={`absolute bottom-4 right-4 z-10 flex gap-2 transition-all duration-500 transform ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsSaved(!isSaved);
            }}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
          >
            <i className={`${isSaved ? 'fas text-teal-600' : 'far text-gray-700'} fa-bookmark transition-colors`}></i>
          </button>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className={`p-5 ${variant === 'horizontal' ? 'w-3/5' : ''}`}>
        {/* LOCATION & VERIFIED BADGE */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
              <i className="fas fa-map-pin text-teal-600 text-xs"></i>
            </div>
            <h3 className="font-bold text-gray-800 text-lg tracking-tight">
              {displayLocation}
            </h3>
            {displayCountry && (
              <span className="bg-blue-500/10 text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <i className="fas fa-check-circle text-xs"></i>
                Verified
              </span>
            )}
          </div>
        </div>

        {/* DESCRIPTION */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {displayDescription}
        </p>

        {/* TRIP HIGHLIGHTS PILLS */}
        {displayHighlights && displayHighlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {displayHighlights.slice(0, 3).map((highlight, index) => (
              <span key={index} className="px-3 py-1 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 text-xs rounded-full border border-teal-200/50">
                ✦ {highlight}
              </span>
            ))}
          </div>
        )}

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center group/stat hover:bg-teal-50 transition-colors">
            <div className="text-teal-600 text-sm mb-1">
              <i className="fas fa-camera"></i>
            </div>
            <div className="font-bold text-gray-800 text-sm">{displayMemories}</div>
            <div className="text-xs text-gray-500">Memories</div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-center group/stat hover:bg-amber-50 transition-colors">
            <div className="text-amber-600 text-sm mb-1">
              <i className="fas fa-clock"></i>
            </div>
            <div className="font-bold text-gray-800 text-sm">{displayDuration}</div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
        </div>

        {/* WEATHER & BUDGET INFO */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <i className="fas fa-sun text-amber-600 text-sm"></i>
            </div>
            <div>
              <div className="text-xs text-gray-500">Weather</div>
              <div className="font-semibold text-gray-800 text-sm">{displayWeather}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <i className="fas fa-wallet text-emerald-600 text-sm"></i>
            </div>
            <div>
              <div className="text-xs text-gray-500">Budget</div>
              <div className="font-semibold text-gray-800 text-sm">{displayBudget}</div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            to={`/trip/${trip.id}`}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:from-teal-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 group/btn"
          >
            <span>View Trip</span>
            <i className="fas fa-arrow-right text-xs group-hover/btn:translate-x-1 transition-transform"></i>
          </Link>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Share functionality
              if (navigator.share) {
                navigator.share({
                  title: trip.location,
                  text: trip.description,
                  url: window.location.origin + `/trip/${trip.id}`
                });
              }
            }}
            className="w-12 h-12 rounded-xl border-2 border-gray-200 text-gray-600 hover:border-teal-600 hover:text-teal-600 hover:bg-teal-50 transition-all duration-300 flex items-center justify-center group/share"
          >
            <i className="fas fa-share-alt group-hover/share:scale-110 transition-transform"></i>
          </button>
        </div>
      </div>

      {/* DECORATIVE ELEMENTS */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-teal-400/10 to-emerald-400/10 rounded-bl-full -z-10"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-amber-400/10 to-orange-400/10 rounded-tr-full -z-10"></div>
    </div>
  );
};

export default TripCard;