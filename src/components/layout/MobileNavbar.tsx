// src/components/layout/MobileNavbar.tsx (FIXED)
import React from 'react';
// --- MODIFIED: เอา BellIcon, UserIcon ออก / เพิ่ม LogOutIcon ---
import { MenuIcon, LogOutIcon } from 'lucide-react';

interface MobileNavbarProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  userName: string; // (เก็บไว้เผื่ออนาคต)
  // --- ADDED: logout prop ---
  logout: () => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  isMenuOpen,
  toggleMenu,
  userName, // (ไม่ได้ใช้ใน UI แล้ว)
  logout
}) => {
  return <header className="bg-white shadow-sm p-4 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={toggleMenu} className="p-2 mr-3 rounded-full hover:bg-gray-100">
          <MenuIcon size={24} />
        </button>
        
      </div>
      
      {/* --- MODIFIED: เหลือแค่ปุ่ม Logout --- */}
      <div className="flex items-center">
        <button 
          onClick={logout} 
          className="p-2 ml-1 rounded-full hover:bg-gray-100 text-gray-600 hover:text-destructive"
          title="Log Out"
        >
          <LogOutIcon size={24} />
        </button>
      </div>
      {/* --- END MODIFICATION --- */}

    </header>;
    
};