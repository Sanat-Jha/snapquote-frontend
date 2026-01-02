import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Dashboard from "./Dashboard.jsx";
import ShinyText from "./ShinyText.jsx"; // import the animation

const API_BASE_URL = 'http://127.0.0.1:5000';

export default function App() {
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.authenticated) {
        // User is already authenticated, redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const handleLogin = async () => {
    try {
      // Call the login endpoint to get the authorization URL
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.authorization_url) {
        // Redirect to Google OAuth page
        window.location.href = data.authorization_url;
      } else {
        console.error('Failed to get authorization URL:', data.message);
        // Still try to navigate to dashboard in case of error
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      // On error, navigate to dashboard
      navigate('/dashboard');
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex items-center justify-center min-h-screen bg-[#0D1117] text-gray-100 px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full max-w-md"
            >
              {/* Header Section */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center mb-8"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#238636] to-[#2ea043] rounded-2xl mb-6 shadow-lg"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="text-4xl font-bold mb-3 text-white tracking-tight"
                >
                  Welcome Back
                </motion.h1>
                {/* Shiny animation */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <ShinyText
                    text="Sign in to continue to your dashboard"
                    speed={3}
                    className="text-gray-400 text-lg font-medium"
                  />
                </motion.div>
              </motion.div>

              {/* Login Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-[#161B22] p-8 rounded-3xl shadow-2xl border border-gray-700/50 backdrop-blur-sm"
              >
                {/* No error or loading UI, just the button */}
                <motion.button
                  onClick={handleLogin}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center justify-center gap-3 bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#238636] text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 w-full shadow-lg hover:shadow-xl"
                >
                  <motion.img
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.3 }}
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-6 h-6"
                  />
                  Continue with Google
                </motion.button>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                  className="mt-6 text-center"
                >
                  <p className="text-sm text-gray-500">
                    Secure authentication powered by Google
                  </p>
                </motion.div>
              </motion.div>

              {/* Footer */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.0 }}
                className="text-center mt-8"
              >
                <p className="text-sm text-gray-500">
                  © 2024 Dashboard. All rights reserved.
                </p>
              </motion.div>
            </motion.div>
          </div>
        }
      />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
