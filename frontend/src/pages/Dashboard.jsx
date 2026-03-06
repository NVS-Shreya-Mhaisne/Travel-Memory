import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { resolveImage, API_ROOT } from "../service/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { generateTripPDF } from "../service/pdfService";

const Dashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [animatedStats, setAnimatedStats] = useState(false);

  useEffect(() => {
    setAnimatedStats(true);
  }, []);

  // Handle tab from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ["overview", "trips", "memories", "bucketlist"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  const [allTrips, setAllTrips] = useState([]);
  const [generatingPDF, setGeneratingPDF] = useState(null); // ID of trip being generated
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [tripFilter, setTripFilter] = useState("all");
  const [userStats, setUserStats] = useState({
    totalTrips: 0,
    totalCountries: 0,
    totalCities: 0,
    totalPhotos: 0,
    totalMemories: 0,
    totalLikes: 0,
    totalFollowers: 0,
    following: 0,
    streak: 0
  });

  // Fetch real stats from API
  const fetchStats = async () => {
    try {
      const res = await api.get('getTrips.php');
      if (res.data && res.data.status) {
        const trips = res.data.data;
        const uniqueCountries = [...new Set(trips.map(t => t.country || t.location?.split(',')[1]?.trim()))].filter(Boolean);
        const uniqueCities = [...new Set(trips.map(t => t.location?.split(',')[0]?.trim()))].filter(Boolean);
        const totalPhotos = trips.reduce((acc, t) => acc + (t.images?.length || 0), 0);
        setUserStats({
          totalTrips: trips.length,
          totalCountries: uniqueCountries.length,
          totalCities: uniqueCities.length,
          totalPhotos: totalPhotos,
          totalMemories: trips.reduce((acc, t) => acc + (t.memories || 0), 0),
          totalLikes: trips.reduce((acc, t) => acc + (t.likes || 0), 0),
          totalFollowers: 0,
          following: 0,
          streak: 0
        });
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Recent trips (loaded from API)
  const [recentTrips, setRecentTrips] = useState([]);

  const { showToast } = useToast();

  const fetchRecent = async () => {
    try {
      const res = await api.get('getTrips.php');
      const result = res.data;
      if (result.status && Array.isArray(result.data)) {
        setAllTrips(result.data);
        const processed = result.data.slice(0, 4).map(trip => ({
          id: trip.id,
          location: trip.location || "Unknown Location",
          image: resolveImage(trip.coverImage || trip.images?.[0]) || "https://images.unsplash.com/photo-1537996192471-41c6b5e541d3?w=600&auto=format",
          date: trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Date not set',
          memories: trip.images?.length || 0,
          likes: trip.likes || 0,
          status: trip.status || 'completed'
        }));
        setRecentTrips(processed);
      }
    } catch (err) {
      console.error('Failed to load recent trips', err);
    }
  };
  useEffect(() => {
    fetchRecent();
    window.addEventListener('trips:updated', fetchRecent);
    const interval = setInterval(fetchRecent, 30000); // poll every 30s
    return () => {
      window.removeEventListener('trips:updated', fetchRecent);
      clearInterval(interval);
    };
  }, []);

  const handleDownload = (filePath, fileName) => {
    if (!filePath) return;

    // If filePath is a full URL, extract the relative path (e.g., 'uploads/image.jpg')
    let relativePath = filePath;
    if (filePath.startsWith(api.defaults.baseURL)) {
      relativePath = filePath.replace(api.defaults.baseURL, '');
    }

    const downloadUrl = `${api.defaults.baseURL}download.php?file=${encodeURIComponent(relativePath)}&name=${encodeURIComponent(fileName)}`;

    window.location.href = downloadUrl;
  };

  // Delete a trip by id
  const handleDelete = async (id) => {
    if (!confirm('Del                                                                                                                                                      this trip? This action cannot be undone.')) return;
    try {
      const res = await api.post('deleteTrip.php', { id });
      if (res.data && res.data.status) {
        window.dispatchEvent(new CustomEvent('trips:updated'));
        try { showToast('Trip deleted', 'success'); } catch (e) { }
      } else {
        try { showToast('Failed to delete trip', 'error'); } catch (e) { }
      }
    } catch (err) {
      console.error('Delete failed', err);
      try { showToast('Failed to delete trip', 'error'); } catch (e) { }
    }
  };

  // Upcoming trips
  const [upcomingTrips, setUpcomingTrips] = useState([]);

  // Memories by category (derived from real data)
  const categoryConfig = {
    beaches: { color: "from-blue-400 to-cyan-500", icon: "fa-umbrella-beach" },
    mountains: { color: "from-emerald-400 to-teal-500", icon: "fa-mountain" },
    cities: { color: "from-purple-400 to-indigo-500", icon: "fa-city" },
    forests: { color: "from-green-400 to-emerald-500", icon: "fa-tree" },
    deserts: { color: "from-amber-400 to-orange-500", icon: "fa-sun" },
    historical: { color: "from-rose-400 to-pink-500", icon: "fa-landmark" },
    default: { color: "from-teal-400 to-emerald-500", icon: "fa-map-marker-alt" }
  };

  const categories = allTrips.reduce((acc, trip) => {
    const rawCat = (trip.category || "General").toLowerCase();
    const catName = trip.category || "General";
    const config = categoryConfig[rawCat] || categoryConfig.default;
    const photoCount = trip.images?.length || 0;

    const existing = acc.find(c => c.name.toLowerCase() === rawCat);
    if (existing) {
      existing.count += photoCount;
    } else {
      acc.push({
        name: catName,
        count: photoCount,
        color: config.color,
        icon: config.icon
      });
    }
    return acc;
  }, []);

  // Monthly stats for chart (derived)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyStats = months.map(month => {
    const tripsInMonth = allTrips.filter(t => t.startDate && months[new Date(t.startDate).getMonth()] === month);
    return {
      month,
      trips: tripsInMonth.length,
      memories: tripsInMonth.reduce((acc, t) => acc + (t.images?.length || 0), 0)
    };
  });

  // Recent activity (derived)
  const recentActivity = allTrips
    .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate))
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      action: "added a memory to",
      item: t.location,
      location: t.location,
      image: resolveImage(t.coverImage || t.images?.[0]) || null,
      time: t.startDate ? new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Recently",
      icon: "fa-camera",
      color: "text-teal-600"
    }));

  useEffect(() => {
    if (allTrips.length > 0) {
      const now = new Date();
      const upcoming = allTrips
        .filter(t => t.startDate && new Date(t.startDate) > now)
        .map(trip => {
          const tripDate = new Date(trip.startDate);
          const daysLeft = Math.ceil((tripDate - now) / (1000 * 60 * 60 * 24));
          return {
            id: trip.id,
            location: trip.location || "Unknown Location",
            image: resolveImage(trip.coverImage || trip.images?.[0]) || "https://images.unsplash.com/photo-1537996192471-41c6b5e541d3?w=600&auto=format",
            date: trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Date not set',
            memories: trip.images?.length || 0,
            likes: trip.likes || 0,
            daysLeft,
            status: 'upcoming'
          };
        });
      setUpcomingTrips(upcoming);
    }
  }, [allTrips]);

  // Bucket list state
  const { user } = useAuth();
  const [bucketList, setBucketList] = useState([]);
  const [newDestination, setNewDestination] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const fetchBucketList = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`getBucketList.php?userId=${user.id}`);
      if (res.data.status) {
        setBucketList(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch bucket list", err);
    }
  };

  useEffect(() => {
    if (activeTab === "bucketlist") {
      fetchBucketList();
    }
  }, [activeTab, user?.id]);

  // Toggle bucket list item completion
  const toggleBucketListItem = async (id, currentStatus) => {
    try {
      const res = await api.post("updateBucketItem.php", {
        id: id,
        completed: !currentStatus
      });
      if (res.data.status) {
        setBucketList(bucketList.map(item =>
          item.id === id ? { ...item, completed: !currentStatus } : item
        ));
      }
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  // Add new destination to bucket list
  const addDestination = async () => {
    if (newDestination.trim() && user?.id) {
      try {
        const res = await api.post("addBucketItem.php", {
          userId: user.id,
          place: newDestination.trim()
        });
        if (res.data.status) {
          showToast("Destination added!", "success");
          fetchBucketList();
          setNewDestination("");
          setShowAddForm(false);
        }
      } catch (err) {
        showToast("Failed to add destination", "error");
      }
    }
  };

  const deleteBucketListItem = async (id) => {
    try {
      const res = await api.get(`deleteBucketItem.php?id=${id}`);
      if (res.data.status) {
        showToast("Item removed", "success");
        setBucketList(bucketList.filter(item => item.id !== id));
      }
    } catch (err) {
      showToast("Failed to delete item", "error");
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditValue(item.place);
  };

  const saveEdit = async (id) => {
    if (!editValue.trim()) return;
    try {
      const res = await api.post("updateBucketItem.php", {
        id: id,
        place: editValue.trim()
      });
      if (res.data.status) {
        setBucketList(bucketList.map(item =>
          item.id === id ? { ...item, place: editValue.trim() } : item
        ));
        setEditingId(null);
        showToast("Updated successfully", "success");
      }
    } catch (err) {
      showToast("Failed to update", "error");
    }
  };

  // Add popular suggestion
  const addPopularSuggestion = async () => {
    const suggestion = "Northern Lights, Iceland";
    if (!bucketList.some(item => item.place === suggestion)) {
      try {
        const res = await api.post("addBucketItem.php", {
          userId: user.id,
          place: suggestion
        });
        if (res.data.status) {
          showToast("Added suggestion!", "success");
          fetchBucketList();
        }
      } catch (err) {
        showToast("Failed to add suggestion", "error");
      }
    }
  };

  // Calculate bucket list progress
  const completedCount = bucketList.filter(item => item.completed).length;
  const totalCount = bucketList.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* DASHBOARD CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-semibold text-xs md:text-sm transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${activeTab === "overview"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-600 hover:text-teal-600"
              }`}
          >
            <i className="fas fa-chart-pie text-xs"></i>
            Overview
          </button>
          <button
            onClick={() => setActiveTab("trips")}
            className={`px-4 py-2 font-semibold text-xs md:text-sm transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${activeTab === "trips"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-600 hover:text-teal-600"
              }`}
          >
            <i className="fas fa-suitcase text-xs"></i>
            My Trips
          </button>
          <button
            onClick={() => setActiveTab("memories")}
            className={`px-4 py-2 font-semibold text-xs md:text-sm transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${activeTab === "memories"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-600 hover:text-teal-600"
              }`}
          >
            <i className="fas fa-camera text-xs"></i>
            Memories
          </button>
          <button
            onClick={() => setActiveTab("bucketlist")}
            className={`px-4 py-2 font-semibold text-xs md:text-sm transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${activeTab === "bucketlist"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-600 hover:text-teal-600"
              }`}
          >
            <i className="fas fa-list-check text-xs"></i>
            Bucket List
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`bg-white rounded-xl shadow-md p-3 flex flex-col items-start hover:shadow-lg transition-all duration-500 hover:-translate-y-1 ${animatedStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '0ms' }}>
                <div className="w-full flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center">
                    <i className="fas fa-suitcase text-teal-600 text-sm"></i>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Trips</span>
                </div>
                <div className="text-2xl md:text-3xl font-black text-gray-800">{userStats.totalTrips}</div>
              </div>

              <div className={`bg-white rounded-xl shadow-md p-3 flex flex-col items-start hover:shadow-lg transition-all duration-500 hover:-translate-y-1 ${animatedStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '100ms' }}>
                <div className="w-full flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center">
                    <i className="fas fa-globe text-blue-600 text-sm"></i>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Countries</span>
                </div>
                <div className="text-2xl md:text-3xl font-black text-gray-800">{userStats.totalCountries}</div>
              </div>

              <div className={`bg-white rounded-xl shadow-md p-3 flex flex-col items-start hover:shadow-lg transition-all duration-500 hover:-translate-y-1 ${animatedStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '200ms' }}>
                <div className="w-full flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center">
                    <i className="fas fa-camera text-purple-600 text-sm"></i>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Photos</span>
                </div>
                <div className="text-2xl md:text-3xl font-black text-gray-800">{userStats.totalPhotos}</div>
              </div>

              <div className={`bg-white rounded-xl shadow-md p-3 flex flex-col items-start hover:shadow-lg transition-all duration-500 hover:-translate-y-1 ${animatedStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '300ms' }}>
                <div className="w-full flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center">
                    <i className="fas fa-city text-amber-600 text-sm"></i>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Cities</span>
                </div>
                <div className="text-2xl md:text-3xl font-black text-gray-800">{userStats.totalCities}</div>
              </div>
            </div>

            {/* CHARTS AND ACTIVITY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Monthly Activity Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1">
                    Monthly Activity
                  </h3>
                  <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50">
                    <option>2026</option>
                    <option>2025</option>
                    <option>2024</option>
                  </select>
                </div>

                <div className="h-56 flex items-end justify-between gap-2">
                  {monthlyStats.map((stat, index) => (
                    <div key={index} className="flex flex-col items-center w-full group">
                      <div className="relative w-full flex justify-center gap-1">
                        <div
                          className="w-4 md:w-5 bg-teal-500 rounded-t-lg group-hover:bg-teal-600 transition-all cursor-pointer"
                          style={{ height: `${(stat.trips / 8) * 100}px` }}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {stat.trips} trips
                          </span>
                        </div>
                        <div
                          className="w-4 md:w-5 bg-emerald-400 rounded-t-lg group-hover:bg-emerald-500 transition-all cursor-pointer"
                          style={{ height: `${(stat.memories / 35) * 100}px` }}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {stat.memories} memories
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-2">{stat.month}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-teal-500 rounded"></div>
                    <span className="text-xs text-gray-600">Trips</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-emerald-400 rounded"></div>
                    <span className="text-xs text-gray-600">Memories</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all">
                <h3 className="font-bold text-gray-800 text-sm mb-4">
                  Recent Activity
                </h3>

                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-2 group hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {activity.image ? (
                          <img
                            src={activity.image}
                            alt={activity.location}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${activity.color.replace('text', 'bg')}/10`}>
                            <i className={`fas ${activity.icon} ${activity.color} text-xs`}></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800">
                          <span className="font-semibold">You</span> {activity.action}{' '}
                          <span className="font-medium text-gray-900">{activity.item}</span>
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-0.5">
                          <i className="fas fa-map-marker-alt text-teal-500 text-[8px]"></i>
                          {activity.location}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center justify-center gap-1 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  View All Activity
                  <i className="fas fa-arrow-right text-[10px]"></i>
                </button>
              </div>
            </div>

            {/* RECENT TRIPS & UPCOMING */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Recent Trips */}
              <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-sm">
                    Recent Trips
                  </h3>
                  <Link to="/dashboard?tab=trips" className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-0.5">
                    View all
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentTrips.slice(0, 3).map((trip) => (
                    <div key={trip.id} className="flex items-center gap-3 group hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={trip.image} alt={trip.location} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-xs truncate">{trip.location}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                            <i className="far fa-calendar-alt text-teal-500 text-[8px]"></i>
                            {trip.date}
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                            <i className="fas fa-camera text-teal-500 text-[8px]"></i>
                            {trip.memories} memories
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-2">
                        <Link
                          to={`/trip/${trip.id}`}
                          className="text-xs text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(trip.id); }}
                          className="text-xs text-rose-500 hover:text-rose-700 font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Trips */}
              <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-sm">
                    Upcoming Trips
                  </h3>
                  <Link to="/add-trip" className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-0.5">
                    Plan new
                    <i className="fas fa-plus-circle text-[10px]"></i>
                  </Link>
                </div>

                {upcomingTrips.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingTrips.map((trip) => (
                      <div key={trip.id} className="flex items-center gap-3 group hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={trip.image} alt={trip.location} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/20"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-xs truncate">{trip.location}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-0.5">
                            <i className="far fa-calendar-alt text-amber-500 text-[8px]"></i>
                            {trip.date}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                            {trip.daysLeft} days left
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="mt-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-200 flex items-center justify-center">
                          <i className="fas fa-map-pin text-teal-700 text-xs"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-800">Ready for your next adventure?</p>
                          <p className="text-[10px] text-gray-600">Start planning a new trip</p>
                        </div>
                        <Link to="/add-trip" className="px-3 py-1 bg-teal-600 text-white rounded-lg text-[10px] font-semibold hover:bg-teal-700 transition-colors">
                          Plan Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-map-marked-alt text-2xl text-gray-400"></i>
                    </div>
                    <p className="text-gray-600 font-medium text-sm">No upcoming trips</p>
                    <p className="text-xs text-gray-500 mt-1">Start planning your next adventure!</p>
                    <Link to="/add-trip" className="inline-block mt-3 px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors">
                      Plan a Trip
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Memories by Category */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
              <h3 className="font-bold text-gray-800 text-sm mb-5">
                Memories by Category
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                <div
                  onClick={() => { setSelectedCategory("All"); setActiveTab("memories"); }}
                  className={`group relative overflow-hidden rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-1 min-h-[120px] flex items-center justify-center cursor-pointer ${selectedCategory === "All" ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="relative text-center">
                    <div className="text-2xl mb-2">
                      <i className="fas fa-th-large"></i>
                    </div>
                    <div className="font-semibold text-sm">All</div>
                    <div className="text-xs opacity-90 mt-1">{userStats.totalPhotos} memories</div>
                  </div>
                </div>
                {categories.map((category, index) => (
                  <div
                    key={index}
                    onClick={() => { setSelectedCategory(category.name); setActiveTab("memories"); }}
                    className={`group relative overflow-hidden rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-1 min-h-[120px] flex items-center justify-center cursor-pointer ${selectedCategory === category.name ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                    <div className="relative text-center">
                      <div className="text-2xl mb-2">
                        <i className={`fas ${category.icon}`}></i>
                      </div>
                      <div className="font-semibold text-sm">{category.name}</div>
                      <div className="text-xs opacity-90 mt-1">{category.count} memories</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TRIPS TAB */}
        {activeTab === "trips" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-1">
                <i className="fas fa-suitcase text-teal-600 text-sm"></i>
                My Trips
              </h2>
              <Link
                to="/add-trip"
                className="px-4 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-1 text-xs"
              >
                <i className="fas fa-plus-circle text-xs"></i>
                Add New Trip
              </Link>
            </div>

            {/* Trip Filters */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex flex-wrap gap-2">
                {[{ label: "All Trips", key: "all" }, { label: "Completed", key: "completed" }, { label: "Upcoming", key: "upcoming" }].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setTripFilter(f.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${tripFilter === f.key
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trips Grid */}
            {(() => {
              const now = new Date();
              const filtered = allTrips.filter(trip => {
                const isUpcoming = trip.startDate && new Date(trip.startDate) > now;
                if (tripFilter === "completed") return !isUpcoming;
                if (tripFilter === "upcoming") return isUpcoming;
                return true;
              });
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                      <i className="fas fa-suitcase text-4xl text-gray-300 mb-3 block"></i>
                      <p className="font-medium">No {tripFilter === "all" ? "" : tripFilter} trips found.</p>
                    </div>
                  )}
                  {filtered.map((trip) => {
                    const isUpcoming = trip.startDate && new Date(trip.startDate) > now;
                    const coverImg = resolveImage(trip.coverImage || trip.images?.[0]) || "https://images.unsplash.com/photo-1537996192471-41c6b5e541d3?w=600&auto=format";
                    const dateLabel = trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Date not set';
                    const memoriesCount = trip.images?.length || 0;
                    return (
                      <div key={trip.id} className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                        <div className="relative h-36 overflow-hidden">
                          <img
                            src={coverImg}
                            alt={trip.location}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1537996192471-41c6b5e541d3?w=600&auto=format"; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-800 shadow-lg">
                            {dateLabel}
                          </div>

                          <div className="absolute bottom-2 left-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${isUpcoming ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {isUpcoming ? 'Upcoming' : 'Completed'}
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-gray-800 mb-1 text-sm flex items-center gap-1">
                            <i className="fas fa-map-pin text-teal-600 text-xs"></i>
                            {trip.location}
                          </h3>

                          <div className="flex items-center gap-2 text-[10px] text-gray-600 mb-2">
                            <span className="flex items-center gap-0.5">
                              <i className="fas fa-camera text-teal-500 text-[8px]"></i>
                              {memoriesCount} photos
                            </span>
                            {trip.category && (
                              <span className="flex items-center gap-0.5">
                                <i className="fas fa-tag text-purple-400 text-[8px]"></i>
                                {trip.category}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <Link
                              to={`/trip/${trip.id}`}
                              className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-0.5 group/btn"
                            >
                              View Details
                              <i className="fas fa-arrow-right text-[8px] group-hover/btn:translate-x-1 transition-transform"></i>
                            </Link>

                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={async (e) => {
                                  console.log("PDF button clicked in My Trips grid");
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    setGeneratingPDF(trip.id);
                                    await generateTripPDF(trip);
                                  } catch (err) {
                                    console.error("PDF generation failed", err);
                                  } finally {
                                    setGeneratingPDF(null);
                                  }
                                }}
                                disabled={generatingPDF === trip.id}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${generatingPDF === trip.id
                                    ? 'bg-blue-100 text-blue-400'
                                    : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                                  } shadow-sm cursor-pointer z-10`}
                                title="Download PDF"
                              >
                                {generatingPDF === trip.id ? (
                                  <i className="fas fa-circle-notch animate-spin text-[10px]"></i>
                                ) : (
                                  <i className="fas fa-file-pdf text-[10px] pointer-events-none"></i>
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(trip.id)}
                                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                              >
                                <i className="fas fa-trash-alt text-[10px]"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* MEMORIES TAB */}
        {activeTab === "memories" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-1">
                <i className="fas fa-camera text-teal-600 text-sm"></i>
                My Memories
              </h2>
              <button className="px-4 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-1 text-xs">
                <i className="fas fa-upload text-xs"></i>
                Upload Memory
              </button>
            </div>

            {/* Memory Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-camera text-purple-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-lg font-black text-gray-800">{userStats.totalPhotos}</div>
                    <div className="text-xs text-gray-500">Total Photos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-suitcase text-blue-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-lg font-black text-gray-800">{userStats.totalTrips}</div>
                    <div className="text-xs text-gray-500">Trips</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-city text-amber-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-lg font-black text-gray-800">{userStats.totalCities}</div>
                    <div className="text-xs text-gray-500">Cities Explored</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-globe text-teal-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-lg font-black text-gray-800">{userStats.totalCountries}</div>
                    <div className="text-xs text-gray-500">Countries</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Memory Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {allTrips.flatMap(trip => (trip.images || []).map((img, i) => ({ trip, img, i })))
                .filter(({ trip }) => selectedCategory === "All" || trip.category === selectedCategory)
                .map(({ trip, img, i }, index) => (
                  <div key={`${trip.id}-${index}`} className="group relative aspect-square rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <img
                      src={resolveImage(img)}
                      alt="Memory"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&auto=format";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="absolute bottom-0 left-0 right-0 p-1.5 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-[10px] font-bold truncate leading-tight">{trip.location}</p>
                      <p className="text-[8px] opacity-80 leading-tight">{trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}</p>
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <button
                        onClick={() => handleDownload(img, `memory-${trip.location}-${i}.jpg`)}
                        className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:text-teal-600 transition-all active:scale-90"
                        title="Download Memory"
                      >
                        <i className="fas fa-download text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              {(allTrips.flatMap(trip => (trip.images || [])).length === 0) && (
                <div className="col-span-full py-12 text-center text-gray-500">
                  No memories found for {selectedCategory === "All" ? "any category" : selectedCategory}.
                </div>
              )}
            </div>

            {/* Load More */}
            <div className="text-center">
              <button className="px-4 py-2 bg-white border-2 border-teal-600 text-teal-600 rounded-lg font-semibold hover:bg-teal-600 hover:text-white transition-all duration-300 inline-flex items-center gap-1 text-xs">
                <i className="fas fa-sync-alt text-xs"></i>
                Load More Memories
              </button>
            </div>
          </div>
        )}

        {/* BUCKET LIST TAB */}
        {activeTab === "bucketlist" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-1">
                <i className="fas fa-list-check text-teal-600 text-sm"></i>
                Bucket List
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-1 text-xs"
              >
                <i className="fas fa-plus-circle text-xs"></i>
                Add Destination
              </button>
            </div>

            {/* Add Destination Form */}
            {showAddForm && (
              <div className="bg-white rounded-xl shadow-md p-4 border-2 border-teal-600">
                <h3 className="font-bold text-gray-800 text-sm mb-3">Add New Destination</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    placeholder="Enter destination name..."
                    className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                    onKeyPress={(e) => e.key === "Enter" && addDestination()}
                  />
                  <button
                    onClick={addDestination}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bucket List Items */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-5">
                <h3 className="font-bold text-gray-800 text-sm mb-4">
                  My Dream Destinations
                </h3>

                <div className="space-y-2">
                  {bucketList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-teal-200 hover:shadow-md transition-all cursor-pointer group relative mb-3"
                      onClick={() => toggleBucketListItem(item.id, item.completed)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-sm ${item.completed
                            ? 'bg-gradient-to-br from-teal-500 to-emerald-600 border-transparent scale-110 shadow-teal-200'
                            : 'border-gray-300 group-hover:border-teal-500 bg-white'
                            }`}
                        >
                          {item.completed && <i className="fas fa-check text-white text-[10px] animate-bounce"></i>}
                        </div>
                        <div className="flex-1">
                          {editingId === item.id ? (
                            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-teal-500 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 bg-transparent px-2 py-1 text-sm font-semibold text-gray-800 outline-none"
                                autoFocus
                                onKeyPress={(e) => e.key === "Enter" && saveEdit(item.id)}
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => saveEdit(item.id)}
                                  className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition-colors shadow-sm"
                                  title="Save"
                                >
                                  <i className="fas fa-check text-xs"></i>
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors shadow-sm"
                                  title="Cancel"
                                >
                                  <i className="fas fa-times text-xs"></i>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className={`font-bold text-sm transition-all duration-500 ${item.completed ? 'text-gray-400 line-through italic' : 'text-gray-800'}`}>
                              {item.place}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        {editingId !== item.id && (
                          <button
                            className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(item);
                            }}
                            title="Edit Destination"
                          >
                            <i className="fas fa-pen text-[10px]"></i>
                          </button>
                        )}
                        <button
                          className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBucketListItem(item.id);
                          }}
                          title="Remove from List"
                        >
                          <i className="fas fa-trash text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats & Inspiration */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-md p-5">
                  <h3 className="font-bold text-gray-800 text-sm mb-3">
                    Your Progress
                  </h3>

                  <div className="text-center mb-4">
                    <div className="text-3xl font-black text-teal-600 mb-1">{completedCount}/{totalCount}</div>
                    <p className="text-xs text-gray-600">Destinations visited</p>
                  </div>

                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-semibold text-gray-800">{completedCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">In Progress</span>
                      <span className="font-semibold text-gray-800">{totalCount - completedCount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-md p-5 text-white">
                  <i className="fas fa-quote-right text-2xl opacity-30 mb-2"></i>
                  <p className="text-sm font-semibold mb-3">"The world is a book and those who do not travel read only one page."</p>
                  <p className="text-xs opacity-90">- Saint Augustine</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default Dashboard;