// src/components/layout/Layout.tsx (FIXED based on user's new file)
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNavbar } from './MobileNavbar';
import { useAuth } from '../../context/AuthContext';

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- MODIFIED: ต้องดึง logout มาด้วย ---
  const {
    user,
    logout //
  } = useAuth();

  // (เพิ่มฟังก์ชัน toggle เพื่อส่งให้ Sidebar ปิดตัวเองเวลากดเมนู)
  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return <div className="flex flex-col md:flex-row min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white shadow-md">
        {/* --- MODIFIED: ส่ง props ที่จำเป็นให้ Sidebar --- */}
        <Sidebar 
          isMenuOpen={false} // (Desktop ไม่ต้องสนใจ)
          toggleMenu={() => {}} // (Desktop ไม่ต้องสนใจ)
          logout={logout} 
        />
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden">
        {/* --- MODIFIED: ส่ง logout ให้ MobileNavbar --- */}
        <MobileNavbar 
          isMenuOpen={isMobileMenuOpen} 
          toggleMenu={toggleMenu} 
          userName={user?.owner_name || 'User'}
          logout={logout}
        />
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleMenu}>
            <div className="absolute top-0 left-0 w-3/4 h-full bg-white shadow-lg" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium"> AI Secretary</h3>
              </div>
              {/* --- MODIFIED: ส่ง props ที่จำเป็นให้ Sidebar (ใน Mobile) --- */}
              <Sidebar 
                isMenuOpen={isMobileMenuOpen}
                toggleMenu={toggleMenu}
                logout={logout}
              />
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