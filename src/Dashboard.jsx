import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DecryptedText from "./DecryptedText";

const API_BASE_URL = 'https://snapquote-backend.eastus2.cloudapp.azure.com';

export default function Dashboard() {
  const navigate = useNavigate();
  // Settings state removed
  const [openPopupId, setOpenPopupId] = useState(null); // Track which row's popup is open
  
  // State for API data
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_quotations: 0,
    fetched_quotations: 0,
    processed_quotations: 0
  });

  // Fetch emails and stats on component mount
  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    setLoading(true); // Ensure loading state is set to true when retrying
    setError(null); // Clear any previous errors

    try {
      // Check authentication status
      const authResponse = await fetch(`${API_BASE_URL}/api/auth/status`, {
        credentials: 'include'
      });
      const authData = await authResponse.json();

      if (!authData.authenticated) {
        // Not authenticated, redirect to login
        navigate('/');
        return;
      }

      // Fetch emails and stats
      await Promise.all([fetchEmails(), fetchStats()]);
    } catch (error) {
      console.error('Error checking auth or fetching data:', error);
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false); // Ensure loading state is reset
    }
  };

  const fetchEmails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emails`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Transform API data to match component structure
        const transformedEmails = data.data.map(email => ({
          id: email.id,
          gmail_id: email.gmail_id,
          email: email.extraction_result?.email || 'N/A',
          name: email.extraction_result?.to || 'N/A',
          subject: email.subject || 'No Subject',
          requirements: Array.isArray(email.extraction_result?.Requirements) 
            ? email.extraction_result.Requirements 
            : [],
          status: 'Fetched', // All emails are fetched, not processed
          received_at: email.received_at,
          sender: email.sender
        }));
        
        setEmails(transformedEmails);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Failed to fetch emails');
      setLoading(false);
    }
  };

  // New fetchStats: count from emails endpoint
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emails`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch emails');
      const data = await response.json();
      if (data.success && data.data) {
        const total = data.data.length;
        setStats({
          total_quotations: total,
          fetched_quotations: total,
          processed_quotations: 0 // Phase 2
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDownload = async (gmailId, subject) => {
    try {
      // Open download URL in new window
      const downloadUrl = `${API_BASE_URL}/api/quotation/generate/${gmailId}`;
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading quotation:', error);
      alert('Failed to download quotation. Please try again.');
    }
  };

  // Close popup when clicking outside
  const tableRef = useRef();

  const handleClickOutside = (e) => {
    if (tableRef.current && !tableRef.current.contains(e.target)) {
      setOpenPopupId(null);
    }
  };

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1117] text-gray-100">
      {/* Header Section */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#161B22] border-b border-gray-700/50 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            {/* Logo and Title */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#238636] to-[#2ea043] rounded-xl"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </motion.div>
              <div>
                <DecryptedText
                  text="Dashboard"
                  speed={100}
                  maxIterations={50}
                  className="text-2xl font-bold text-white"
                />
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-sm text-gray-400 mt-1"
                >
                  Email Management System
                </motion.p>
              </div>
            </motion.div>

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                try {
                  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    credentials: 'include'
                  });

                  if (response.ok) {
                    navigate('/'); // Redirect to login page after logout
                  } else {
                    console.error('Logout failed');
                  }
                } catch (error) {
                  console.error('Error during logout:', error);
                }
                navigate('/');
              }}
              className="ml-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">


        {/* Settings Panel removed */}

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {[
            {
              title: "Total Quotations",
              value: stats.total_quotations,
              icon: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", // envelope
              color: "blue",
              delay: 0.1
            },
            {
              title: "Fetched Quotations",
              value: stats.fetched_quotations,
              icon: "M12 16v-8m0 0l-4 4m4-4l4 4", // download arrow
              color: "blue",
              delay: 0.2
            },
            {
              title: "Processed Quotations",
              value: stats.processed_quotations,
              icon: "M5 13l4 4L19 7", // checkmark
              color: "green",
              delay: 0.3
            }
          ].map((stat, index) => (
            <motion.div 
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: stat.delay }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-[#161B22] p-6 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                  <motion.p 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: stat.delay + 0.2 }}
                    className="text-2xl font-bold text-white mt-1"
                  >
                    {stat.value}
                  </motion.p>
                </div>
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-12 h-12 bg-${stat.color}-500/10 rounded-xl flex items-center justify-center`}
                >
                  <svg className={`w-6 h-6 text-${stat.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Emails Table */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-[#161B22] rounded-2xl border border-gray-700/50 overflow-hidden"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="px-6 py-4 border-b border-gray-700/50"
          >
            <h3 className="text-lg font-semibold text-white">Email Management</h3>
            <p className="text-sm text-gray-400 mt-1">Manage and track your email communications</p>
          </motion.div>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-[#238636] border-t-transparent rounded-full"
              />
              <span className="ml-4 text-gray-400">Loading emails...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-lg font-medium">{error}</p>
              <button 
                onClick={checkAuthAndFetchData}
                className="mt-4 px-6 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-xl transition-colors"
              >
                Retry
              </button>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-400 text-lg">No emails found</p>
              <p className="text-gray-500 text-sm mt-2">New emails will appear here automatically</p>
            </div>
          ) : (
            <div ref={tableRef} className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-[#0D1117]/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Requirements</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {emails.map((email, index) => (
                  <motion.tr 
                    key={email.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    className="group hover:bg-[#0D1117]/30 transition-colors relative"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{email.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">{email.name}</div>
                    </td>

                    {/* Requirements with floating popup */}
                    <td className="px-6 py-4 relative">
                      <button
                        className="inline-flex items-center gap-2 bg-[#0D1117] hover:bg-[#1f2228] border border-gray-600 hover:border-gray-500 py-2 px-4 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all duration-200"
                        onClick={() =>
                          setOpenPopupId(openPopupId === email.id ? null : email.id)
                        }
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View ({email.requirements.length})
                      </button>
                    </td>

                    {/* Status Badge: Always Fetched (blue) */}
                    <td className="px-6 py-4">
                      <span
                        className={
                          "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }
                      >
                        <span className="w-2 h-2 rounded-full mr-2 bg-blue-400"></span>
                        Fetched
                      </span>
                    </td>

                    {/* Download Button */}
                    <td className="px-6 py-4">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDownload(email.gmail_id, email.subject)}
                        disabled={false}
                        className={"inline-flex items-center gap-2 bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#238636] text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-lg"}
                      >
                        <motion.svg 
                          whileHover={{ y: 2 }}
                          className="w-4 h-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </motion.svg>
                        Download
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </motion.div>

        {/* Full-screen Requirements Modal */}
        <AnimatePresence>
          {openPopupId !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setOpenPopupId(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-[#161B22] rounded-2xl border border-gray-700/50 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-[#0D1117]">
                  <div>
                    <h3 className="text-xl font-bold text-white">Requirements Details</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {emails.find(e => e.id === openPopupId)?.subject || 'Quotation Requirements'}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setOpenPopupId(null)}
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#161B22] rounded-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Modal Content - Requirements Table */}
                <div className="overflow-auto max-h-[calc(90vh-80px)]">
                  <table className="min-w-full">
                    <thead className="bg-[#0D1117] sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {emails.find(e => e.id === openPopupId)?.requirements.map((req, index) => {
                        // Handle both object and string formats
                        const isObject = typeof req === 'object' && req !== null;
                        const description = isObject ? req.Description : req;
                        const quantity = isObject ? req.Quantity : '';
                        const unit = isObject ? req.Unit : '';
                        const unitPrice = isObject ? req['Unit price'] : '';

                        return (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-[#0D1117]/50 transition-colors"
                          >
                            <td className="px-4 py-4 text-sm text-gray-400 font-medium">
                              {index + 1}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-200 max-w-md">
                              <div className="line-clamp-3" title={description}>
                                {description || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-white font-semibold">
                              {quantity || '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-400">
                              {unit || '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-green-400 font-medium">
                              {unitPrice || '-'}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <button
                                className="text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded transition-colors border border-red-500/30 hover:border-red-700/50"
                                onClick={async () => {
                                  const email = emails.find(e => e.id === openPopupId);
                                  if (!email) return;
                                  const res = await fetch(`${API_BASE_URL}/api/requirement/delete`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ gmail_id: email.gmail_id, index }),
                                  });
                                  const result = await res.json();
                                  if (result.success) {
                                    setEmails(emails =>
                                      emails.map(e =>
                                        e.id === openPopupId
                                          ? { ...e, requirements: e.requirements.filter((_, i) => i !== index) }
                                          : e
                                      )
                                    );
                                  } else {
                                    alert(result.error || 'Failed to delete requirement');
                                  }
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                </svg>
                                <span className="sr-only">Delete requirement</span>
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Empty State */}
                  {(!emails.find(e => e.id === openPopupId)?.requirements || 
                    emails.find(e => e.id === openPopupId)?.requirements.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-400 text-lg">No requirements found</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700/50 bg-[#0D1117]">
                  <div className="text-sm text-gray-400">
                    Total Items: <span className="text-white font-semibold">
                      {emails.find(e => e.id === openPopupId)?.requirements.length || 0}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setOpenPopupId(null)}
                    className="px-6 py-2 bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#238636] text-white font-medium rounded-xl transition-all duration-200"
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
