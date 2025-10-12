import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNavbar } from './MobileNavbar';
import { useAuth } from '../../context/AuthContext';
export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    user
  } = useAuth();
  return <div className="flex flex-col md:flex-row min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white shadow-md">
        <Sidebar />
      </div>
      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileNavbar isMenuOpen={isMobileMenuOpen} toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} userName={user?.owner_name || 'User'} />
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute top-0 left-0 w-3/4 h-full bg-white shadow-lg" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium">AIS AI Secretary</h3>
              </div>
              <Sidebar />
            </div>
          </div>}
      </div>
      {/* Main Content */}
      <div className="flex-1 bg-background-light">
        <main className="container mx-auto px-4 py-6 max-w-[1280px]">
          <Outlet />
        </main>
      </div>
    </div>;
};