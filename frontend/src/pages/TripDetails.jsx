import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api, { resolveImage } from "../service/api";
import { useToast } from "../context/ToastContext";
import { generateTripPDF } from "../service/pdfService";

const TripDetails = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editing States
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [editData, setEditData] = useState({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUpdatingOverview, setIsUpdatingOverview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" }
  ];

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    let date;
    if (typeof dateValue === 'object' && dateValue.$date) {
      date = new Date(dateValue.$date.$numberLong ? parseInt(dateValue.$date.$numberLong) : dateValue.$date);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const calculateDuration = () => {
    if (!trip || !trip.startDate || !trip.endDate) return "N/A";
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const getCurrencySymbol = (code) => {
    const currency = currencies.find(c => c.code === code);
    return currency ? currency.symbol : (code || "$");
  };

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`singleTrip.php?id=${id}`);
        if (res.data && res.data.status) {
          setTrip(res.data.data);
        } else {
          setError("Trip not found");
        }
      } catch (err) {
        console.error("Failed to load trip details", err);
        setError("Failed to load trip details");
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id]);

  const handleEditOverview = () => {
    setEditData({
      budget: trip.budget || "",
      currency: trip.currency || "USD",
      startDate: trip.startDate || "",
      endDate: trip.endDate || "",
      status: trip.status || "Planned"
    });
    setIsEditingOverview(true);
  };

  const handleSaveOverview = async () => {
    try {
      setIsUpdatingOverview(true);
      const formData = new FormData();
      formData.append("id", id);
      formData.append("budget", editData.budget);
      formData.append("currency", editData.currency);
      formData.append("startDate", editData.startDate);
      formData.append("endDate", editData.endDate);
      formData.append("status", editData.status);

      const res = await api.post("updateTrip.php", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data && res.data.status) {
        showToast("Overview updated successfully", "success");
        // Wait a small bit for sync before re-fetching
        setTimeout(async () => {
          const refreshRes = await api.get(`singleTrip.php?id=${id}&t=${Date.now()}`);
          if (refreshRes.data && refreshRes.data.status) {
            setTrip(refreshRes.data.data);
            setIsEditingOverview(false);
          }
        }, 500);
      } else {
        showToast(res.data?.message || "Failed to update overview", "error");
      }
    } catch (err) {
      console.error("Failed to update overview", err);
    } finally {
      setIsUpdatingOverview(false);
    }
  };

  const handleAddPhotos = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setIsUploadingImages(true);
      const formData = new FormData();
      formData.append("id", id);
      formData.append("action", "add_images");
      files.forEach(file => {
        formData.append("images[]", file);
      });

      const res = await api.post("updateTrip.php", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data && res.data.status) {
        showToast("Photos uploaded successfully", "success");
        // Wait a small amount of time and re-fetch multiple times if necessary to handle slow disk sync
        let attempts = 0;
        const maxAttempts = 5;
        const currentCount = trip.images?.length || 0;

        const refresh = async () => {
          const refreshRes = await api.get(`singleTrip.php?id=${id}&t=${Date.now()}`);
          if (refreshRes.data && refreshRes.data.status) {
            const newData = refreshRes.data.data;
            const newCount = newData.images?.length || 0;

            // If the image count hasn't changed or it's still same as before, try again
            if (newCount <= currentCount && attempts < maxAttempts) {
              attempts++;
              setTimeout(refresh, 1000);
            } else {
              setTrip(newData);
            }
          }
        };
        setTimeout(refresh, 500);
      } else {
        showToast(res.data?.message || "Failed to upload photos", "error");
      }
    } catch (err) {
      console.error("Failed to upload photos", err);
      showToast("Failed to upload photos", "error");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeletePhoto = async (imagePath) => {
    // Optional: add a confirmation
    // if (!window.confirm("Are you sure you want to delete this photo?")) return;

    try {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("action", "remove_image");
      formData.append("imagePath", imagePath);

      const res = await api.post("updateTrip.php", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data && res.data.status) {
        showToast("Photo deleted", "success");
        // Update local state immediately for better UX
        setTrip(prev => ({
          ...prev,
          images: prev.images.filter(img => img !== imagePath)
        }));
      } else {
        showToast(res.data?.message || "Failed to delete photo", "error");
      }
    } catch (err) {
      console.error("Failed to delete photo", err);
      showToast("Failed to delete photo", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏜️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error || "No data available"}</h2>
          <p className="text-gray-600 mb-6">We couldn't find the trip you're looking for. It might have been deleted or moved.</p>
          <Link to="/" className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero Header */}
      <div className="relative h-[250px] md:h-[350px]">
        <img
          src={resolveImage(trip.coverImage || trip.images?.[0]) || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format"}
          alt={trip.location}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-white">
          <div className="max-w-7xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-teal-300 hover:text-teal-200 mb-4 transition-colors">
              <i className="fas fa-arrow-left"></i> Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4">{trip.location}</h1>
            <div className="flex flex-wrap gap-4 text-sm md:text-base">
              <span className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                <i className="far fa-calendar-alt text-teal-300"></i> {formatDate(trip.startDate)}
              </span>
              <span className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                <i className="fas fa-map-marker-alt text-rose-300"></i> {trip.category || 'Travel'}
              </span>
            </div>
            {(() => {
              const tags = (Array.isArray(trip.tags) ? trip.tags : (typeof trip.tags === 'string' ? trip.tags.split(',') : [])).filter(t => t && t.trim() !== '');
              if (tags.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-2 mt-5">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="text-[11px] font-bold bg-teal-500 text-white px-3 py-1 rounded-full shadow-lg border border-teal-400/50">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <i className="fas fa-info-circle text-teal-600"></i>
                  About this Trip
                </h2>
                <button
                  type="button"
                  disabled={isGeneratingPDF}
                  onClick={async (e) => {
                    console.log("PDF button clicked in About Trip section");
                    e.preventDefault();
                    try {
                      setIsGeneratingPDF(true);
                      await generateTripPDF(trip);
                    } finally {
                      setIsGeneratingPDF(false);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors cursor-pointer text-sm font-semibold shadow-sm ${isGeneratingPDF ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  title="Download Trip PDF"
                >
                  {isGeneratingPDF ? (
                    <i className="fas fa-circle-notch animate-spin"></i>
                  ) : (
                    <i className="fas fa-file-pdf"></i>
                  )}
                  {isGeneratingPDF ? "Generating..." : "PDF Download"}
                </button>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
                {trip.description || "No description provided for this trip."}
              </p>
            </div>

            {/* Trip Experience Consolidated Card */}
            {((trip.highlights && trip.highlights.filter(h => h.trim()).length > 0) || trip.accommodation || trip.transportation || trip.foodText || trip.foodImage) && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4 text-white">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <i className="fas fa-star"></i>
                    Trip Experience
                  </h2>
                </div>

                <div className="p-6 space-y-8">
                  {/* Highlights */}
                  {trip.highlights && trip.highlights.filter(h => h.trim()).length > 0 && (
                    <div className="border-b border-gray-50 pb-6">
                      <h3 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <i className="fas fa-magic text-amber-500 text-[9px]"></i>
                        Highlights & Moments
                      </h3>
                      <ul className="space-y-2.5 ml-1">
                        {trip.highlights.filter(h => h.trim()).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                            <span className="text-[13px] font-medium text-gray-600 italic leading-relaxed">
                              {item.trim()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Logistics */}
                  {(trip.accommodation || trip.transportation) && (
                    <div className="border-b border-gray-50 pb-6">
                      <h3 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <i className="fas fa-map-signs text-blue-500 text-[9px]"></i>
                        Travel Logistics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trip.accommodation && (
                          <div className="flex items-center gap-3 p-4 bg-blue-50/40 rounded-2xl border border-blue-100/20">
                            <i className="fas fa-hotel text-blue-600 text-xs shrink-0"></i>
                            <div>
                              <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1.5">Stay</div>
                              <div className="text-sm font-bold text-gray-800 capitalize leading-none">{trip.accommodation}</div>
                              {trip.accommodationName && (
                                <div className="text-[10px] text-blue-600/70 font-bold italic truncate max-w-[150px] mt-1.5">{trip.accommodationName}</div>
                              )}
                            </div>
                          </div>
                        )}
                        {trip.transportation && (
                          <div className="flex items-center gap-3 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/20">
                            <i className="fas fa-plane rotate-45 text-emerald-600 text-xs shrink-0"></i>
                            <div>
                              <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1.5">Travel Mode</div>
                              <div className="text-sm font-bold text-gray-800 capitalize leading-none">{trip.transportation}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Culinary */}
                  {(trip.foodText || trip.foodImage) && (
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <i className="fas fa-utensils text-rose-500 text-[9px]"></i>
                        Culinary Memories
                      </h3>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-rose-50/30 p-4 rounded-2xl border border-rose-100/30">
                        {trip.foodImage && (
                          <div className="w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden shadow-md border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500">
                            <img
                              src={resolveImage(trip.foodImage)}
                              alt="Delicious food"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-gray-600 leading-relaxed text-sm font-medium italic relative pl-4 border-l-2 border-rose-300">
                            {trip.foodText || "Tried some amazing local dishes!"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <i className="fas fa-camera text-purple-600"></i>
                  Capture Memories
                </h2>
                <label className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer text-sm font-semibold">
                  {isUploadingImages ? (
                    <i className="fas fa-circle-notch animate-spin"></i>
                  ) : (
                    <i className="fas fa-plus"></i>
                  )}
                  Add Photos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleAddPhotos}
                    disabled={isUploadingImages}
                    className="hidden"
                  />
                </label>
              </div>
              {trip.images && trip.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {trip.images.map((img, idx) => (
                    <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100">
                      <img
                        src={resolveImage(img)}
                        alt={`${trip.location} memory ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <button
                        onClick={() => handleDeletePhoto(img)}
                        className="absolute top-2 right-2 w-9 h-9 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xl transform transition-all opacity-0 group-hover:opacity-100 hover:bg-rose-700 active:scale-95 z-50"
                        title="Delete Photo"
                      >
                        <i className="fa-solid fa-xmark text-sm"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-3 sticky top-6 group border border-teal-100/50">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-800">Trip Overview</h3>
                {!isEditingOverview && (
                  <button
                    onClick={handleEditOverview}
                    className="flex items-center gap-1 px-2 py-1 text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-all shadow-md font-bold text-[9px] active:scale-95 opacity-0 group-hover:opacity-100"
                    title="Edit Overview"
                  >
                    <i className="fas fa-pen"></i>
                    EDIT
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <i className="fas fa-camera text-[10px]"></i>
                  </div>
                  <div>
                    <div className="text-[0.55rem] text-gray-400 uppercase font-bold tracking-wider leading-none">Memories</div>
                    <div className="text-[12px] font-bold text-gray-700">{trip.images?.length || 0} memories</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <i className="fas fa-wallet text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.6rem] text-gray-400 uppercase font-bold tracking-wider">Budget</div>
                    {isEditingOverview ? (
                      <div className="flex gap-1 mt-0.5">
                        <select
                          value={editData.currency}
                          onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                          className="bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-[10px] outline-none"
                        >
                          {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                        <input
                          type="number"
                          value={editData.budget}
                          onChange={(e) => setEditData({ ...editData, budget: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-[10px] outline-none font-bold"
                        />
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-gray-700">{getCurrencySymbol(trip.currency)}{trip.budget || '0'}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <i className="fas fa-clock text-xs"></i>
                  </div>
                  <div>
                    <div className="text-[0.6rem] text-gray-400 uppercase font-bold tracking-wider">Duration</div>
                    <div className="text-sm font-bold text-gray-700">{calculateDuration()} days</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                    <i className="fas fa-calendar-alt text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.6rem] text-gray-400 uppercase font-bold tracking-wider">Start Date</div>
                    {isEditingOverview ? (
                      <input
                        type="date"
                        value={editData.startDate ? editData.startDate.split('T')[0] : ''}
                        onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                        className="w-full mt-0.5 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-[10px] outline-none font-bold"
                      />
                    ) : (
                      <div className="text-sm font-bold text-gray-700">{formatDate(trip.startDate)}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
                    <i className="fas fa-calendar-check text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.6rem] text-gray-400 uppercase font-bold tracking-wider">End Date</div>
                    {isEditingOverview ? (
                      <input
                        type="date"
                        value={editData.endDate ? editData.endDate.split('T')[0] : ''}
                        onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                        className="w-full mt-0.5 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-[10px] outline-none font-bold"
                      />
                    ) : (
                      <div className="text-sm font-bold text-gray-700">{formatDate(trip.endDate)}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <i className="fas fa-suitcase text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.6rem] text-gray-400 uppercase font-bold tracking-wider">Status</div>
                    <div className="text-sm font-bold text-gray-700 capitalize">{trip.status || 'Completed'}</div>
                  </div>
                </div>
              </div>

              {isEditingOverview && (
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={handleSaveOverview}
                    disabled={isUpdatingOverview}
                    className="w-full py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isUpdatingOverview ? (
                      <>
                        <i className="fas fa-circle-notch animate-spin"></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check"></i>
                        Update Overview
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditingOverview(false)}
                    className="w-full py-2 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="text-[9px] text-gray-300 text-center font-medium">
                  Created on {formatDate(trip.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetails;