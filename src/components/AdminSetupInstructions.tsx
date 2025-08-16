import React from 'react';
import { AlertCircle, User, Key, Database } from 'lucide-react';

export function AdminSetupInstructions() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Quick Start Guide - Multiple Setup Options!
          </h3>
          <div className="space-y-4 text-sm text-blue-800">
            <div className="bg-green-100 border border-green-300 rounded-lg p-3">
              <h4 className="font-semibold text-green-900 mb-2">✅ Setup Complete - Choose Your Method:</h4>
              <div className="space-y-2">
                <p><strong>Method 1 (Recommended):</strong> Use the registration buttons on the homepage</p>
                <p><strong>Method 2:</strong> Create users directly in Supabase Dashboard</p>
                <p><strong>Method 3:</strong> Use the "Add User" button in this admin dashboard</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <User className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Option 1 - Homepage Registration (Easiest):</p>
                <p className="bg-blue-100 p-2 rounded mt-1">
                  • Go to homepage and click "Create Admin Account"<br/>
                  • Fill in your details (name, email, password)<br/>
                  • System automatically assigns admin role<br/>
                  • Login with your new credentials
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Database className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Option 2 - Supabase Dashboard:</p>
                <p className="bg-blue-100 p-2 rounded mt-1">
                  • Go to Supabase Dashboard → Authentication → Users<br/>
                  • Click "Add User" and enter email/password<br/>
                  • In "User Metadata" add: <code>&lbrace;"full_name": "Name", "role": "admin"&rbrace;</code><br/>
                  • Profile will be created automatically
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Key className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Option 3 - Admin Dashboard:</p>
                <p className="bg-blue-100 p-2 rounded mt-1">
                  • Use "Add User" button below<br/>
                  • Enter user details and select role<br/>
                  • Account created instantly with credentials shown
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
              <h4 className="font-semibold text-yellow-900 mb-1">Sample Accounts Available:</h4>
              <div className="text-xs space-y-1">
                <p><strong>Admin:</strong> admin@eduai.com / admin123</p>
                <p><strong>Lecturer:</strong> lecturer@eduai.com / lecturer123</p>
                <p className="text-yellow-700">You can use these for testing or create your own accounts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}