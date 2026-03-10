import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Dashboard from "./pages/Dashboard";
import AddTrip from "./pages/AddTrips";
import TripDetails from "./pages/TripDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/add-trip" element={
              <ProtectedRoute>
                <AddTrip />
              </ProtectedRoute>
            } />
            <Route path="/trip/:id" element={
              <ProtectedRoute>
                <TripDetails />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;