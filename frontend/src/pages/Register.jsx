import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../service/api";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      try {
        setIsLoading(true);
        const response = await api.post("registerUser.php", {
          name: formData.fullName,
          email: formData.email,
          password: formData.password
        });

        if (response.data.status) {
          // Use auth context login to set state and localStorage correctly
          login({
            id: response.data.id,
            name: formData.fullName,
            email: formData.email
          });
          navigate("/dashboard");
        } else {
          setErrors({ ...errors, email: response.data.message });
        }
      } catch (err) {
        console.error("Registration error:", err);
        setErrors({ ...errors, email: "Registration failed. Please try again." });
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  // Password strength indicators
  const getPasswordStrength = () => {
    if (!formData.password) return 0;
    let strength = 0;
    if (formData.password.length >= 6) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/[0-9]/.test(formData.password)) strength += 25;
    if (/[!@#$%^&*]/.test(formData.password)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const getStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-rose-600";
    if (passwordStrength <= 50) return "bg-orange-500";
    if (passwordStrength <= 75) return "bg-yellow-500";
    return "bg-emerald-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600 flex items-start justify-center py-4 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-300/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Floating Travel Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <i className="fas fa-plane absolute top-20 left-20 text-white/10 text-6xl transform rotate-45 animate-float"></i>
        <i className="fas fa-compass absolute bottom-20 right-20 text-white/10 text-6xl animate-float animation-delay-1000"></i>
        <i className="fas fa-map-marked-alt absolute top-40 right-40 text-white/10 text-5xl animate-float animation-delay-2000"></i>
        <i className="fas fa-camera absolute bottom-40 left-40 text-white/10 text-5xl animate-float animation-delay-3000"></i>
      </div>

      {/* Main Card - Shifted Up */}
      <div className="relative w-full max-w-md mt-2 md:mt-1">
        {/* Decorative Elements - Reduced size */}
        <div className="absolute -top-3 -left-3 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl -rotate-12 opacity-70 blur-lg"></div>
        <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl rotate-12 opacity-70 blur-lg"></div>

        {/* Logo/Brand - Reduced top margin and padding */}
        <div className="text-center mb-2 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-xl hover:bg-white/20 transition-all duration-300">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <i className="fas fa-map-location-dot text-white text-sm"></i>
            </div>
            <span className="text-white font-bold text-lg">Travel Memarie</span>
          </Link>
        </div>

        {/* Register Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-3xl border border-white/50">

          {/* Header - Reduced height */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-1">Register here! 👋</h2>
            <p className="text-teal-100 text-sm">Create an account and save your memory</p>
          </div>

          {/* Form - Reduced padding */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name - Reduced input height */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <i className={`fas fa-user text-xs ${errors.fullName ? 'text-rose-600' : 'text-teal-600'}`}></i>
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-8 py-2.5 text-sm border-2 rounded-xl focus:ring-2 focus:ring-teal-200 transition-all outline-none ${errors.fullName
                      ? 'border-rose-600 bg-rose-50'
                      : 'border-gray-200 focus:border-teal-600'
                      }`}
                    placeholder="John Doe"
                  />
                  {formData.fullName && !errors.fullName && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <i className="fas fa-check-circle text-emerald-600 text-xs"></i>
                    </div>
                  )}
                </div>
                {errors.fullName && (
                  <p className="text-rose-600 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email - Reduced input height */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <i className={`fas fa-envelope text-xs ${errors.email ? 'text-rose-600' : 'text-teal-600'}`}></i>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-8 py-2.5 text-sm border-2 rounded-xl focus:ring-2 focus:ring-teal-200 transition-all outline-none ${errors.email
                      ? 'border-rose-600 bg-rose-50'
                      : 'border-gray-200 focus:border-teal-600'
                      }`}
                    placeholder="your@email.com"
                  />
                  {formData.email && !errors.email && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <i className="fas fa-check-circle text-emerald-600 text-xs"></i>
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-rose-600 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password - Reduced input height */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <i className={`fas fa-lock text-xs ${errors.password ? 'text-rose-600' : 'text-teal-600'}`}></i>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-9 py-2.5 text-sm border-2 rounded-xl focus:ring-2 focus:ring-teal-200 transition-all outline-none ${errors.password
                      ? 'border-rose-600 bg-rose-50'
                      : 'border-gray-200 focus:border-teal-600'
                      }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-teal-600"
                  >
                    <i className={`fas text-xs ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {errors.password && (
                  <p className="text-rose-600 text-xs mt-1">{errors.password}</p>
                )}

                {/* Password Strength Indicator - Compact */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Password strength:</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {passwordStrength}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStrengthColor()} transition-all duration-300`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <i className="fas fa-info-circle mr-1"></i>
                      6+ chars, uppercase, number & symbol
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password - Reduced input height */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <i className={`fas fa-lock text-xs ${errors.confirmPassword ? 'text-rose-600' : 'text-teal-600'}`}></i>
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-9 py-2.5 text-sm border-2 rounded-xl focus:ring-2 focus:ring-teal-200 transition-all outline-none ${errors.confirmPassword
                      ? 'border-rose-600 bg-rose-50'
                      : 'border-gray-200 focus:border-teal-600'
                      }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-teal-600"
                  >
                    <i className={`fas text-xs ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-rose-600 text-xs mt-1">{errors.confirmPassword}</p>
                )}

                {/* Match indicator */}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
                    <i className="fas fa-check-circle text-xs"></i>
                    Passwords match
                  </p>
                )}
              </div>

              {/* Terms Agreement - Compact */}
              <div className="space-y-1">
                <label className="flex items-start gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 text-teal-600 border-2 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-xs text-gray-700 group-hover:text-teal-600 transition-colors">
                    I agree to the{' '}
                    <Link to="" className="text-teal-600 hover:text-teal-700 font-semibold">
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link to="" className="text-teal-600 hover:text-teal-700 font-semibold">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="text-rose-600 text-xs mt-1">{errors.agreeToTerms}</p>
                )}
              </div>

              {/* Register Button - Reduced height */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold text-base hover:from-teal-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-sm"></i>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <i className="fas fa-user-plus text-sm group-hover:scale-110 transition-transform"></i>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-3 border-t border-gray-200/80 text-center">
            <p className="text-xs text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-teal-600 hover:text-teal-700 font-semibold transition-colors hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animation-delay-1000 {
            animation-delay: 1s;
          }
          
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-3000 {
            animation-delay: 3s;
          }
        `}
      </style>
    </div>
  );
};

export default Register;