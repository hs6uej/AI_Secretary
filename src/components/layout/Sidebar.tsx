// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoais from './logog.png';
import {
  LayoutDashboardIcon,
  PhoneIcon as CallLogsIcon,
  UsersIcon as ContactsIcon,
  SettingsIcon,
  LogOutIcon
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboardIcon },
    { name: 'Call Logs', to: '/calls', icon: CallLogsIcon },
    { name: 'Contacts', to: '/contacts', icon: ContactsIcon },
    { name: 'Settings', to: '/settings', icon: SettingsIcon },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${isActive
      ? 'bg-sidebar-active text-sidebar-active-foreground'
      : 'hover:bg-sidebar-hover hover:text-sidebar-hover-foreground'
    }`;

  return (
    // MODIFIED (Case 13): Ensure h-full and flex properties are set correctly
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex flex-col items-center justify-center h-24 border-b border-sidebar-border flex-shrink-0 space-y-1">
        <img src={logoais} alt="logo" className="h-12 w-auto" />
        <span className="text-lg font-bold">AI Secretary</span>
      </div>

      {/* MODIFIED (Case 13): Added 'overflow-y-auto' to the nav element */}
      {/* This allows the navigation links to scroll if they exceed the height, */}
      {/* preventing the logout button from being pushed off-screen. */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            end={item.to === '/'} // 'end' prop ensures Dashboard is only active on '/'
            className={navLinkClass}
          >
            <item.icon size={18} className="mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button (remains at the bottom) */}
      <div className="border-t border-sidebar-border p-4 flex-shrink-0">
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium hover:bg-sidebar-hover hover:text-sidebar-hover-foreground transition-colors duration-150"
        >
          <LogOutIcon size={18} className="mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};