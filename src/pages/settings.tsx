import React from 'react';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

export default function Settings() {
  // Apple-style staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24
      } 
    }
  };
  
  return (
    <Layout>
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Page Header - Apple Style */}
        <motion.div 
          className="glass-panel p-5 border thin-border rounded-lg shadow-sm"
          variants={itemVariants}
        >
          <h1 className="text-xl font-semibold text-[hsl(var(--foreground))] tracking-tight">Settings</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Configure your Finsight experience</p>
        </motion.div>

        {/* Settings Panel - Apple Style with Glass morphism */}
        <motion.div 
          className="glass-panel border thin-border rounded-lg shadow-sm overflow-hidden"
          variants={itemVariants}
        >
          <Box sx={{ 
            px: 4, 
            py: 3,
            borderBottom: '0.5px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mr-3 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <h3 className="text-base font-medium tracking-tight">Account Settings</h3>
          </Box>
          <div className="p-5">
            <div className="space-y-7">
              {/* Profile Settings - Apple Style */}
              <motion.div 
                className="space-y-4"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  '&::after': {
                    content: '""',
                    flexGrow: 1,
                    height: '0.5px',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    ml: 2
                  }
                }}>
                  <h4 className="text-sm font-medium tracking-tight">Profile Information</h4>
                </Box>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue="Administrator" 
                      className="input-sapui5 w-full border-0 shadow-sm focus:ring-2 focus:ring-blue-500 rounded-md py-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="admin@standardchartered.com" 
                      className="input-sapui5 w-full border-0 shadow-sm focus:ring-2 focus:ring-blue-500 rounded-md py-2.5" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Role</label>
                    <select className="input-sapui5 w-full border-0 shadow-sm focus:ring-2 focus:ring-blue-500 bg-white rounded-md h-10 appearance-none px-3">
                      <option>Administrator</option>
                      <option>Analyst</option>
                      <option>Manager</option>
                      <option>Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Department</label>
                    <select className="input-sapui5 w-full border-0 shadow-sm focus:ring-2 focus:ring-blue-500 bg-white rounded-md h-10 appearance-none px-3">
                      <option>Finance</option>
                      <option>Sales</option>
                      <option>Operations</option>
                      <option>IT</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Settings</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="email-notifications" className="mr-2" defaultChecked />
                    <label htmlFor="email-notifications" className="text-sm">Email Notifications</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="report-alerts" className="mr-2" defaultChecked />
                    <label htmlFor="report-alerts" className="text-sm">Report Alerts</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="market-updates" className="mr-2" defaultChecked />
                    <label htmlFor="market-updates" className="text-sm">Market Updates</label>
                  </div>
                </div>
              </div>

              {/* Display Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Display Settings</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">Theme</label>
                    <select className="input-sapui5 w-full md:w-1/3">
                      <option>SAP Quartz Light (Default)</option>
                      <option>SAP Quartz Dark</option>
                      <option>SAP Belize</option>
                      <option>High Contrast</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">Default Dashboard</label>
                    <select className="input-sapui5 w-full md:w-1/3">
                      <option>Overview</option>
                      <option>Financial Analytics</option>
                      <option>Portfolio</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-[hsl(var(--border))] flex justify-end">
            <button className="btn-sapui5 btn-sapui5-secondary mr-2">Cancel</button>
            <button className="btn-sapui5 btn-sapui5-primary">Save Changes</button>
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div 
          className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden"
          variants={itemVariants}
        >
          <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
            <h3 className="text-base font-normal">Security Settings</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">Password</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="password" 
                    value="••••••••••••" 
                    disabled
                    className="input-sapui5 w-full md:w-1/3" 
                  />
                  <button className="btn-sapui5 btn-sapui5-secondary">Change</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">Two-Factor Authentication</label>
                <div className="flex items-center space-x-2">
                  <select className="input-sapui5 w-full md:w-1/3">
                    <option>Enabled</option>
                    <option>Disabled</option>
                  </select>
                  <button className="btn-sapui5 btn-sapui5-secondary">Configure</button>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-[hsl(var(--border))] flex justify-end">
            <button className="btn-sapui5 btn-sapui5-primary">Update Security Settings</button>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
