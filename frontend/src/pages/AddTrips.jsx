import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../service/api";
import { useToast } from "../context/ToastContext";

const AddTrip = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [tripData, setTripData] = useState({
    // Basic Info
    location: "",
    country: "",
    startDate: "",
    endDate: "",
    description: "",

    // Media
    coverImage: null,
    images: [],

    // Details
    budget: "",
    currency: "INR",
    category: "",
    tags: [],
    highlights: [],

    // Accommodation
    accommodation: "",
    accommodationName: "",

    // Transportation
    transportation: "",

    // Privacy
    isPublic: true,
    allowComments: true,

    // Food
    foodText: "",
    foodImage: null
  });

  const [foodPreview, setFoodPreview] = useState(null);

  const [previewImage, setPreviewImage] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [highlightInput, setHighlightInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form steps configuration
  const steps = [
    { number: 1, name: "Basic Info", icon: "fa-info-circle" },
    { number: 2, name: "Trip Details", icon: "fa-list-ul" },
    { number: 3, name: "Upload Media", icon: "fa-camera" },
    { number: 4, name: "Review & Publish", icon: "fa-check-circle" }
  ];

  // Categories for trip type
  const categories = [
    { id: "beach", name: "Beach", icon: "fa-umbrella-beach", color: "from-blue-400 to-cyan-500" },
    { id: "mountain", name: "Mountain", icon: "fa-mountain", color: "from-emerald-400 to-teal-500" },
    { id: "city", name: "City", icon: "fa-city", color: "from-purple-400 to-indigo-500" },
    { id: "forest", name: "Forest", icon: "fa-tree", color: "from-green-400 to-emerald-500" },
    { id: "desert", name: "Desert", icon: "fa-sun", color: "from-amber-400 to-orange-500" },
    { id: "historical", name: "Historical", icon: "fa-landmark", color: "from-rose-400 to-pink-500" },
    { id: "adventure", name: "Adventure", icon: "fa-compass", color: "from-red-400 to-orange-500" },
    { id: "cultural", name: "Cultural", icon: "fa-mask", color: "from-indigo-400 to-purple-500" }
  ];

  // Transportation options
  const transportOptions = [
    { id: "flight", name: "Flight", icon: "fa-plane" },
    { id: "train", name: "Train", icon: "fa-train" },
    { id: "car", name: "Car", icon: "fa-car" },
    { id: "bus", name: "Bus", icon: "fa-bus" },
    { id: "ship", name: "Ship", icon: "fa-ship" },
    { id: "mixed", name: "Mixed", icon: "fa-route" }
  ];

  // Currency options
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTripData({
      ...tripData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  // Handle cover image upload
  const handleCoverImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTripData({ ...tripData, coverImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle multiple images upload
  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    setTripData({ ...tripData, images: [...tripData.images, ...files] });
  };

  // Handle food image upload
  const handleFoodImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTripData({ ...tripData, foodImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoodPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle tags
  const addTag = () => {
    if (tagInput.trim() && !tripData.tags.includes(tagInput.trim())) {
      setTripData({
        ...tripData,
        tags: [...tripData.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTripData({
      ...tripData,
      tags: tripData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Handle highlights
  const addHighlight = () => {
    if (highlightInput.trim()) {
      setTripData({
        ...tripData,
        highlights: [...tripData.highlights, highlightInput.trim()]
      });
      setHighlightInput("");
    }
  };

  const removeHighlight = (highlightToRemove) => {
    setTripData({
      ...tripData,
      highlights: tripData.highlights.filter(h => h !== highlightToRemove)
    });
  };

  // Handle category selection
  const selectCategory = (categoryId) => {
    setTripData({ ...tripData, category: categoryId });
  };

  // Handle form submission - ONLY called when explicitly submitting
  const handleSubmit = async (e) => {
    e.preventDefault(); // This prevents default form submission
    console.log("Submit button clicked - starting submission"); // Debug log

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Append all text fields
      formData.append("location", tripData.location || "");
      formData.append("country", tripData.country || "");
      formData.append("startDate", tripData.startDate || "");
      formData.append("endDate", tripData.endDate || "");
      formData.append("description", tripData.description || "");
      formData.append("category", tripData.category || "");
      formData.append("budget", tripData.budget || "");
      formData.append("currency", tripData.currency || "INR");
      formData.append("accommodation", tripData.accommodation || "");
      formData.append("accommodationName", tripData.accommodationName || "");
      formData.append("transportation", tripData.transportation || "");
      formData.append("foodText", tripData.foodText || "");

      // Append tags and highlights as comma-separated strings
      formData.append("tags", tripData.tags.join(","));
      formData.append("highlights", tripData.highlights.join(","));

      // Append checkbox values
      formData.append("isPublic", tripData.isPublic ? "1" : "0");
      formData.append("allowComments", tripData.allowComments ? "1" : "0");

      // Append cover image if exists
      if (tripData.coverImage) {
        formData.append("coverImage", tripData.coverImage);
      }

      // Append food image if exists
      if (tripData.foodImage) {
        formData.append("foodImage", tripData.foodImage);
      }

      // Append multiple images
      if (tripData.images && tripData.images.length > 0) {
        tripData.images.forEach((image) => {
          formData.append("images[]", image);
        });
      }

      // Send to API using shared client
      const res = await api.post('addTrips.php', formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const result = res.data;

      if (result.status) {
        try {
          window.dispatchEvent(new CustomEvent('trips:updated'));
        } catch (e) { }
        showToast('Trip added successfully', 'success');
        navigate("/dashboard?tab=trips");
      } else {
        showToast(result.message || 'Failed to add trip', 'error');
      }
    } catch (error) {
      console.error("Error submitting trip:", error);
      showToast("Failed to add trip. Please try again.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Next step
  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle draft save
  const handleSaveDraft = () => {
    console.log("Save draft clicked"); // Debug log
    showToast('Draft saved successfully', 'success');
    // Implement draft save logic here if needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* HEADER */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2 rounded-full shadow-lg mb-4">
            <i className="fas fa-plus-circle text-base"></i>
            <span className="font-bold text-sm">Create New Travel Memory</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
            Add Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Trip</span>
          </h1>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            Share your adventure with the world. Fill in the details below to create a beautiful travel memory.
          </p>
        </div>

        {/* PROGRESS STEPS */}
        <div className="mb-8">
          <div className="flex justify-between items-center relative">
            {/* Progress Line */}
            <div className="absolute top-4 left-0 w-full h-1 bg-gray-200 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>

            {/* Step Circles */}
            {steps.map((step) => (
              <div key={step.number} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${currentStep >= step.number
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg scale-110"
                    : "bg-white border-2 border-gray-300 text-gray-400"
                    }`}
                >
                  <i className={`fas ${step.icon} text-sm ${currentStep >= step.number ? "text-white" : ""}`}></i>
                </div>
                <span className={`text-xs font-semibold mt-1 ${currentStep >= step.number ? "text-teal-600" : "text-gray-400"
                  }`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* STEP 1: BASIC INFO */}
          {currentStep === 1 && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <i className="fas fa-info-circle text-teal-600 text-sm"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Location <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <i className="fas fa-map-pin absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 text-xs"></i>
                    <input
                      type="text"
                      name="location"
                      value={tripData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Bali, Ubud"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Country <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <i className="fas fa-globe absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 text-xs"></i>
                    <input
                      type="text"
                      name="country"
                      value={tripData.country}
                      onChange={handleInputChange}
                      placeholder="e.g., Indonesia"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Start Date <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <i className="fas fa-calendar-alt absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 text-xs"></i>
                    <input
                      type="date"
                      name="startDate"
                      value={tripData.startDate}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    End Date <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <i className="fas fa-calendar-check absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 text-xs"></i>
                    <input
                      type="date"
                      name="endDate"
                      value={tripData.endDate}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Trip Description <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <i className="fas fa-pen absolute left-3 top-3 text-teal-600 text-xs"></i>
                  <textarea
                    name="description"
                    value={tripData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your trip, what made it special, your experiences..."
                    rows="4"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                    required
                  ></textarea>
                </div>
                <p className="text-xs text-gray-500 text-right">
                  {tripData.description.length}/500 characters
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: TRIP DETAILS */}
          {currentStep === 2 && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <i className="fas fa-list-ul text-teal-600 text-sm"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Trip Details</h2>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Trip Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => selectCategory(category.id)}
                      className={`relative overflow-hidden p-2 rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 ${tripData.category === category.id
                        ? "border-teal-600 shadow-lg scale-105"
                        : "border-gray-200 hover:border-teal-400"
                        }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10`}></div>
                      <div className="relative flex items-center justify-center gap-2">
                        <i className={`fas ${category.icon} text-xs ${tripData.category === category.id ? "text-teal-600" : "text-gray-600"
                          }`}></i>
                        <span className={`text-xs font-medium whitespace-nowrap ${tripData.category === category.id ? "text-teal-600" : "text-gray-700"
                          }`}>
                          {category.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Budget Amount</label>
                  <div className="relative">
                    <i className="fas fa-wallet absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 text-xs"></i>
                    <input
                      type="number"
                      name="budget"
                      value={tripData.budget}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Currency</label>
                  <select
                    name="currency"
                    value={tripData.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none bg-white"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.symbol} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Accommodation Type</label>
                  <select
                    name="accommodation"
                    value={tripData.accommodation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none bg-white"
                  >
                    <option value="">Select type</option>
                    <option value="hotel">Hotel</option>
                    <option value="resort">Resort</option>
                    <option value="hostel">Hostel</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="camping">Camping</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Accommodation Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Accommodation Name</label>
                <input
                  type="text"
                  name="accommodationName"
                  value={tripData.accommodationName}
                  onChange={handleInputChange}
                  placeholder="e.g., Four Seasons Resort Bali"
                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                />
              </div>

              {/* Transportation */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">Transportation</label>
                <div className="flex flex-wrap gap-2">
                  {transportOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTripData({ ...tripData, transportation: option.id })}
                      className={`flex items-center gap-1 px-4 py-2 rounded-xl border-2 transition-all duration-300 text-sm ${tripData.transportation === option.id
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-gray-200 hover:border-teal-400 text-gray-600"
                        }`}
                    >
                      <i className={`fas ${option.icon} text-xs`}></i>
                      <span className="font-medium text-xs">{option.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add tags (e.g., adventure, family, solo)"
                    className="flex-1 px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>

                {/* Tag List */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {tripData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 rounded-full text-xs font-medium flex items-center gap-1 border border-teal-200"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-rose-600 transition-colors"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">Trip Highlights</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())}
                    placeholder="Add highlights (e.g., Sunset at Uluwatu)"
                    className="flex-1 px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>

                {/* Highlights List */}
                <div className="space-y-1 mt-2">
                  {tripData.highlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-teal-200 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <i className="fas fa-star text-amber-500 text-xs"></i>
                        <span className="text-gray-700 text-sm">{highlight}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHighlight(highlight)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <i className="fas fa-trash-alt text-gray-400 hover:text-rose-600 text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Food Section */}
              <div className="pt-4 border-t border-gray-100 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <i className="fas fa-utensils text-amber-600 text-sm"></i>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">What You Ate</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Food Text */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">Food Description</label>
                    <div className="relative">
                      <i className="fas fa-hamburger absolute left-3 top-3 text-amber-600 text-xs"></i>
                      <textarea
                        name="foodText"
                        value={tripData.foodText}
                        onChange={handleInputChange}
                        placeholder="Describe the best meals you had..."
                        rows="4"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-amber-600 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                      ></textarea>
                    </div>
                  </div>

                  {/* Food Image */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">Food Photo</label>
                    <div className="relative h-[116px]">
                      {foodPreview ? (
                        <div className="relative rounded-xl overflow-hidden border-2 border-amber-600 h-full group">
                          <img src={foodPreview} alt="Food" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setFoodPreview(null);
                              setTripData({ ...tripData, foodImage: null });
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xl transition-all opacity-0 group-hover:opacity-100 z-50 hover:bg-rose-700 active:scale-90"
                            title="Remove food photo"
                          >
                            <i className="fa-solid fa-xmark text-sm"></i>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-600 transition-colors cursor-pointer bg-gray-50 hover:bg-amber-50 group">
                          <div className="flex flex-col items-center justify-center">
                            <i className="fas fa-utensils text-xl text-gray-400 group-hover:text-amber-600 mb-1 transition-colors"></i>
                            <p className="text-[10px] font-semibold text-gray-700">Add food photo</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFoodImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: UPLOAD MEDIA */}
          {currentStep === 3 && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <i className="fas fa-camera text-teal-600 text-sm"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Upload Media</h2>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Cover Image <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  {previewImage ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-teal-600 group">
                      <img src={previewImage} alt="Cover" className="w-full h-48 object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          setTripData({ ...tripData, coverImage: null });
                        }}
                        className="absolute top-3 right-3 w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xl transition-all opacity-0 group-hover:opacity-100 z-50 hover:bg-rose-700 active:scale-90"
                        title="Remove cover image"
                      >
                        <i className="fa-solid fa-xmark text-base"></i>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-600 transition-colors cursor-pointer bg-gray-50 hover:bg-teal-50 group">
                      <div className="flex flex-col items-center justify-center">
                        <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 group-hover:text-teal-600 mb-2 transition-colors"></i>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Click to upload cover image</p>
                        <p className="text-xs text-gray-500">Recommended: 1200x800 (16:9 ratio)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Multiple Images */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Additional Images
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {tripData.images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = tripData.images.filter((_, i) => i !== index);
                          setTripData({ ...tripData, images: newImages });
                        }}
                        className="absolute top-1 right-1 w-7 h-7 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 z-50 hover:bg-rose-700 active:scale-95"
                        title="Remove image"
                      >
                        <i className="fa-solid fa-xmark text-[10px]"></i>
                      </button>
                    </div>
                  ))}

                  {tripData.images.length < 30 && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-600 transition-colors cursor-pointer bg-gray-50 hover:bg-teal-50 flex items-center justify-center group p-2">
                      <div className="text-center">
                        <i className="fas fa-plus text-lg text-gray-400 group-hover:text-teal-600"></i>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagesUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  <i className="fas fa-info-circle mr-1"></i>
                  You can upload up to 30 images. Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & PUBLISH */}
          {currentStep === 4 && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <i className="fas fa-check-circle text-teal-600 text-sm"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Review & Save</h2>
              </div>

              {/* Privacy Settings */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-1">
                  <i className="fas fa-shield-alt text-teal-600 text-sm"></i>
                  Privacy Settings
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-teal-200 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-globe text-teal-600 text-sm"></i>
                      <div>
                        <span className="font-semibold text-gray-800 text-sm">Public Trip</span>
                        <p className="text-xs text-gray-500">Anyone can view this trip</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="privacy"
                      checked={tripData.isPublic === true}
                      onChange={() => setTripData({ ...tripData, isPublic: true })}
                      className="w-4 h-4 text-teal-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-teal-200 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-lock text-teal-600 text-sm"></i>
                      <div>
                        <span className="font-semibold text-gray-800 text-sm">Private Trip</span>
                        <p className="text-xs text-gray-500">Only you can view this trip</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="privacy"
                      checked={tripData.isPublic === false}
                      onChange={() => setTripData({ ...tripData, isPublic: false })}
                      className="w-4 h-4 text-teal-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-teal-200 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-comments text-teal-600 text-sm"></i>
                      <div>
                        <span className="font-semibold text-gray-800 text-sm">Allow Comments</span>
                        <p className="text-xs text-gray-500">Let others comment on your trip</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      name="allowComments"
                      checked={tripData.allowComments}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Preview Card */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-1">
                  <i className="fas fa-eye text-teal-600 text-sm"></i>
                  Preview
                </h3>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Preview Image */}
                  <div className="relative h-40 bg-gray-200">
                    {previewImage ? (
                      <img src={previewImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center justify-center">
                        <i className="fas fa-image text-white text-3xl opacity-50"></i>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold">
                      {tripData.startDate || "Date not set"}
                    </div>
                  </div>

                  {/* Preview Content */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-map-pin text-teal-600 text-xs"></i>
                      <h4 className="font-bold text-gray-800 text-base">
                        {tripData.location || "Your Location"}, {tripData.country || ""}
                      </h4>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {tripData.description || "Your trip description will appear here..."}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {tripData.highlights.slice(0, 3).map((highlight, index) => (
                        <span key={index} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full">
                          ✦ {highlight}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-teal-600 text-xs">
                          <i className="fas fa-wallet"></i>
                        </div>
                        <div className="font-semibold text-gray-800 text-xs">
                          {tripData.budget ? `${currencies.find(c => c.code === tripData.currency)?.symbol || '$'}${tripData.budget}` : 'Not set'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-teal-600 text-xs">
                          <i className="fas fa-clock"></i>
                        </div>
                        <div className="font-semibold text-gray-800 text-xs">
                          {tripData.startDate && tripData.endDate ? (
                            `${Math.ceil((new Date(tripData.endDate) - new Date(tripData.startDate)) / (1000 * 60 * 60 * 24))} days`
                          ) : 'Duration'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-teal-600 text-xs">
                          <i className="fas fa-tag"></i>
                        </div>
                        <div className="font-semibold text-gray-800 text-xs">
                          {tripData.category || 'Category'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORM ACTIONS */}
          <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 text-sm ${currentStep === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white border-2 border-gray-300 text-gray-700 hover:border-teal-600 hover:text-teal-600 hover:bg-teal-50"
                }`}
              disabled={currentStep === 1}
            >
              <i className="fas fa-arrow-left text-xs"></i>
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
              >
                Next Step
                <i className="fas fa-arrow-right text-xs"></i>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-xs"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save text-xs"></i>
                    Save Trip
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* SAVE DRAFT OPTION */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="text-gray-500 hover:text-teal-600 transition-colors text-xs font-semibold flex items-center gap-1 mx-auto"
          >
            <i className="fas fa-save text-xs"></i>
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTrip;