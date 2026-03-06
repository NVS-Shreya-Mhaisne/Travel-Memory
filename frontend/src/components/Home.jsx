import React, { useState, useEffect } from "react";
import api, { resolveImage } from "../service/api";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
  const [recentTrips, setRecentTrips] = useState([]);
  const [memories, setMemories] = useState([]);
  const [stats, setStats] = useState({
    countriesVisited: "0",
    totalTrips: "0",
    photosTaken: "0",
    memoriesShared: "0"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Canonical destination categories to always display (counts default to 0)
  const canonicalCategories = [
    { key: 'beaches', name: 'Beaches', icon: 'fa-umbrella-beach', color: 'from-blue-400 to-cyan-500' },
    { key: 'mountains', name: 'Mountains', icon: 'fa-mountain', color: 'from-emerald-400 to-teal-500' },
    { key: 'cities', name: 'Cities', icon: 'fa-city', color: 'from-purple-400 to-indigo-500' },
    { key: 'forests', name: 'Forests', icon: 'fa-tree', color: 'from-green-400 to-emerald-500' },
    { key: 'deserts', name: 'Deserts', icon: 'fa-sun', color: 'from-amber-400 to-orange-500' },
    { key: 'historical', name: 'Historical', icon: 'fa-landmark', color: 'from-rose-400 to-pink-500' }
  ];

  // Destinations state (will be populated from API counts, but always show canonical list)
  const [destinations, setDestinations] = useState(canonicalCategories.map(c => ({ name: c.name, count: 0, icon: c.icon, color: c.color })));

  // Fetch data on component mount and when trips are updated
  useEffect(() => {
    fetchAllData();
    window.addEventListener('trips:updated', fetchAllData);
    const interval = setInterval(fetchAllData, 30000); // poll every 30s
    return () => {
      window.removeEventListener('trips:updated', fetchAllData);
      clearInterval(interval);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch all trips from backend API
      const resp = await api.get('getTrips.php');
      const tripsResult = resp.data;

      if (tripsResult.status && tripsResult.data.length > 0) {
        // Process recent trips (last 4)
        const processedTrips = tripsResult.data.slice(0, 4).map(trip => ({
          id: trip.id,
          location: trip.location || "No data",
          image: resolveImage(trip.coverImage || trip.images?.[0]) || "",
          date: trip.startDate && !isNaN(new Date(trip.startDate)) ? formatDate(trip.startDate) : "No data",
          description: trip.description || "No data", // Stop manual truncation
          fullDescription: trip.description || "No data", // Store full description
          likes: trip.likes || 0,
          memories: trip.images?.length || 0
        }));
        setRecentTrips(processedTrips);

        // Process memories feed (latest 3 with user info)
        const processedMemories = tripsResult.data.slice(0, 3).map((trip, index) => ({
          id: trip.id,
          user: trip.traveler?.name || "No data",
          avatar: trip.traveler?.avatar || "",
          location: trip.location || "No data",
          image: resolveImage(trip.images?.[0] || trip.coverImage) || "",
          imagePath: trip.images?.[0] || trip.coverImage || "",
          caption: trip.description || "No data",
          time: trip.createdAt || trip.startDate ? getTimeAgo(trip.createdAt || trip.startDate) : "Recent",
          comments: trip.comments || 0,
          highlight: trip.highlights?.join(", ") || "No highlights"
        }));
        setMemories(processedMemories);

        // Build categories from trips data (normalize variations to canonical keys)
        const canonicalMapLookup = {
          beach: 'beaches', beaches: 'beaches',
          mountain: 'mountains', mountains: 'mountains',
          city: 'cities', cities: 'cities',
          forest: 'forests', forests: 'forests',
          desert: 'deserts', deserts: 'deserts',
          historical: 'historical'
        };

        function mapToCanonical(rawStr) {
          if (!rawStr) return 'other';
          const s = rawStr.toString().trim().toLowerCase();
          if (!s) return 'other';
          // direct mapping
          if (canonicalMapLookup[s]) return canonicalMapLookup[s];
          // substring matching (e.g., 'mountain range')
          if (s.includes('beach')) return 'beaches';
          if (s.includes('mountain')) return 'mountains';
          if (s.includes('city')) return 'cities';
          if (s.includes('forest') || s.includes('wood')) return 'forests';
          if (s.includes('desert')) return 'deserts';
          if (s.includes('histor')) return 'historical';
          return 'other';
        }

        const categoryMap = {};
        tripsResult.data.forEach(trip => {
          const raw = trip.category || '';
          const key = mapToCanonical(raw);
          categoryMap[key] = (categoryMap[key] || 0) + 1;
        });

        const iconColorMap = {
          beach: { icon: 'fa-umbrella-beach', color: 'from-blue-400 to-cyan-500' },
          beaches: { icon: 'fa-umbrella-beach', color: 'from-blue-400 to-cyan-500' },
          mountain: { icon: 'fa-mountain', color: 'from-emerald-400 to-teal-500' },
          mountains: { icon: 'fa-mountain', color: 'from-emerald-400 to-teal-500' },
          city: { icon: 'fa-city', color: 'from-purple-400 to-indigo-500' },
          cities: { icon: 'fa-city', color: 'from-purple-400 to-indigo-500' },
          forest: { icon: 'fa-tree', color: 'from-green-400 to-emerald-500' },
          forests: { icon: 'fa-tree', color: 'from-green-400 to-emerald-500' },
          desert: { icon: 'fa-sun', color: 'from-amber-400 to-orange-500' },
          deserts: { icon: 'fa-sun', color: 'from-amber-400 to-orange-500' },
          historical: { icon: 'fa-landmark', color: 'from-rose-400 to-pink-500' },
          other: { icon: 'fa-map', color: 'from-gray-300 to-gray-400' }
        };

        // Always show canonical categories; fill counts from categoryMap (default 0)
        const merged = canonicalCategories.map(c => ({
          name: c.name,
          count: categoryMap[c.key] || 0,
          icon: c.icon,
          color: c.color
        }));

        setDestinations(merged);

        // Calculate stats
        const uniqueCountries = [...new Set(tripsResult.data.map(trip => trip.country || trip.location?.split(',')[1]?.trim() || 'Unknown'))];
        const uniqueCities = [...new Set(tripsResult.data.map(trip => trip.location?.split(',')[0]?.trim() || 'Unknown'))];
        const totalPhotos = tripsResult.data.reduce((acc, trip) => acc + (trip.images?.length || 0), 0);

        setStats({
          countriesVisited: uniqueCountries.filter(c => c !== 'Unknown').length.toString(),
          totalTrips: tripsResult.data.length.toString(),
          photosTaken: totalPhotos > 1000 ? (totalPhotos / 1000).toFixed(1) + "K" : totalPhotos.toString(),
          citiesExplored: uniqueCities.filter(c => c !== 'Unknown').length.toString()
        });
      } else {
        setRecentTrips([]);
        setMemories([]);
        setStats({
          countriesVisited: "0",
          totalTrips: "0",
          photosTaken: "0",
          citiesExplored: "0"
        });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load travel data");

      // Set empty data in case of error
      setFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "0 days ago";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "0 days ago"; // Handle invalid dates

    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Use floor for cleaner day count

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) return "Just now";
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }

    // Logic: if < 30 days show days, else show months
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    }
  };

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

  const handleDownloadTrip = (tripId, locationName) => {
    if (!tripId) {
      showToast("Trip ID not found", "error");
      return;
    }
    const downloadUrl = `${api.defaults.baseURL}downloadTripBundle.php?id=${tripId}`;
    window.location.href = downloadUrl;
  };

  const setFallbackData = () => {
    setRecentTrips([]);
    setMemories([]);
    setStats({
      countriesVisited: "0",
      totalTrips: "0",
      photosTaken: "0",
      citiesExplored: "0"
    });
  };

  // Count trips by category using `destinations` derived from API
  const getCategoryCount = (categoryName) => {
    if (!destinations || destinations.length === 0) return 0;
    const found = destinations.find(d => d.name.toLowerCase() === categoryName.toLowerCase());
    return found ? found.count : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your travel memories...</p>
        </div>
      </div>
    );
  }

  const statItems = [
    { label: "Countries Visited", value: stats.countriesVisited, icon: "fa-globe", color: "text-blue-600" },
    { label: "Total Trips", value: stats.totalTrips, icon: "fa-suitcase", color: "text-emerald-600" },
    { label: "Photos Taken", value: stats.photosTaken, icon: "fa-camera", color: "text-purple-600" },
    { label: "Cities Explored", value: stats.citiesExplored, icon: "fa-map-marked-alt", color: "text-rose-600" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO SECTION - WELCOME BANNER */}
      <div className="relative bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Your Journey, <br />Your Memories.
            </h1>
            <p className="text-lg md:text-xl text-teal-50 mb-8">
              Capture, organize, and relive your travel experiences all in one place.
              Start your travel diary today.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/add-trip"
                className="px-6 py-3 bg-white text-teal-700 rounded-lg font-semibold hover:bg-teal-50 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <i className="fas fa-plus-circle"></i>
                Add New Memory
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/50 flex items-center gap-2"
              >
                <i className="fas fa-th-large"></i>
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg className="relative block w-full h-8 md:h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A6000,6000,0,0,0,321.39,56.44Z" className="fill-gray-50"></path>
          </svg>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-12 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className={`text-2xl md:text-3xl mb-2 ${stat.color}`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT TRIPS SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Recent Trips</h2>
            <p className="text-gray-500 mt-1">Your latest travel adventures</p>
          </div>
          <Link to="/dashboard?tab=trips" className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
            View all
            <i className="fas fa-arrow-right text-sm"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentTrips.length > 0 ? (
            recentTrips.map((trip) => (
              <Link
                key={trip.id}
                to={`/trip/${trip.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="relative h-48">
                  <img
                    src={trip.image}
                    alt={trip.location}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1537996192471-41c6b5e541d3?w=400&auto=format";
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                    {trip.date}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1">{trip.location}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">{trip.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <Link to={`/trip/${trip.id}`} className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 group/btn">
                      View Details
                      <i className="fas fa-arrow-right text-[10px] group-hover/btn:translate-x-1 transition-transform"></i>
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-camera text-teal-500"></i> {trip.memories} memories
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-4 text-center py-12 text-gray-500">
              No trips yet. Start by adding your first memory!
            </div>
          )}
        </div>
      </div>

      {/* EXPLORE DESTINATIONS */}
      <div className="bg-teal-50/50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Explore by Destination</h2>
            <p className="text-gray-600 mt-2">Find your memories from your favorite trips</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {destinations.map((dest, index) => (
              <button
                key={index}
                className="group"
                onClick={() => navigate(`/dashboard?category=${dest.name.toLowerCase()}`)}
              >
                <div className={`bg-gradient-to-br ${dest.color} rounded-xl p-4 text-white shadow-md group-hover:shadow-xl transition-all group-hover:-translate-y-1`}>
                  <div className="text-2xl md:text-3xl mb-2">
                    <i className={`fas ${dest.icon}`}></i>
                  </div>
                  <div className="font-semibold text-sm md:text-base">{dest.name}</div>
                  <div className="text-xs opacity-90">{getCategoryCount(dest.name)} trips</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TRAVEL MEMORIES FEED */}
      {memories.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Travel Feed</h2>
              <p className="text-gray-500 mt-1">Latest memories Of you</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <div key={memory.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all">
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                  <h4 className="font-semibold text-gray-800 truncate">{memory.location}</h4>
                  <span className="text-xs text-gray-400 font-medium">{memory.time}</span>
                </div>

                <div className="relative h-44">
                  <img
                    src={memory.image}
                    alt={memory.location}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&auto=format";
                    }}
                  />
                </div>

                <div className="p-4">
                  <p className="text-gray-700 mb-3 line-clamp-2 min-h-[2.5rem]">{memory.caption}</p>
                  <div className="flex items-center gap-4 text-sm">
                    {memory.comments > 0 && (
                      <button className="flex items-center gap-1 text-gray-600 hover:text-teal-600 transition-colors">
                        <i className="fas fa-comment"></i> {memory.comments}
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadTrip(memory.id, memory.location)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-teal-600 hover:text-white rounded-lg transition-all ml-auto text-xs font-semibold"
                      title="Download Memory Bundle (ZIP)"
                    >
                      <i className="fas fa-download"></i>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA SECTION */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to share your story?
          </h2>
          <p className="text-lg text-teal-50 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who are documenting their journeys and inspiring others.
          </p>
          <Link
            to="/add-trip"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-700 rounded-full font-bold hover:bg-teal-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            <i className="fas fa-pen-fancy"></i>
            Start Your First Memory
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;