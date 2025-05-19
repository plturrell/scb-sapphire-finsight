import React from 'react';
import Layout from '@/components/Layout';

export default function Settings() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white p-4 border border-[hsl(var(--border))] rounded shadow-sm">
          <h1 className="text-xl font-normal text-[hsl(var(--foreground))]">Settings</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Configure your SCB Sapphire FinSight experience</p>
        </div>

        {/* Settings Panel */}
        <div className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
            <h3 className="text-base font-normal">Account Settings</h3>
          </div>
          <div className="p-4">
            <div className="space-y-6">
              {/* Profile Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Profile Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue="Administrator" 
                      className="input-sapui5 w-full" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="admin@scbsapphire.com" 
                      className="input-sapui5 w-full" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">Role</label>
                    <select className="input-sapui5 w-full">
                      <option>Administrator</option>
                      <option>Analyst</option>
                      <option>Manager</option>
                      <option>Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">Department</label>
                    <select className="input-sapui5 w-full">
                      <option>Finance</option>
                      <option>Sales</option>
                      <option>Operations</option>
                      <option>IT</option>
                    </select>
                  </div>
                </div>
              </div>

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
        </div>

        {/* Security Settings */}
        <div className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden">
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
        </div>
      </div>
    </Layout>
  );
}
