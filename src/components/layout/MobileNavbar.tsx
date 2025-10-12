import React from 'react';
import { MenuIcon, BellIcon, UserIcon } from 'lucide-react';
interface MobileNavbarProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  userName: string;
}
export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  isMenuOpen,
  toggleMenu,
  userName
}) => {
  return <header className="bg-white shadow-sm p-4 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={toggleMenu} className="p-2 mr-3 rounded-full hover:bg-gray-100">
          <MenuIcon size={24} />
        </button>
        <img src="https://placehold.co/120x40?text=AIS" alt="AIS Logo" className="h-8" />
      </div>
      <div className="flex items-center">
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <BellIcon size={24} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        <div className="ml-2 flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <UserIcon size={16} className="text-gray-600" />
          </div>
          <span className="ml-2 text-sm font-medium hidden sm:block">
            {userName}
          </span>
        </div>
      </div>
    </header>;
};