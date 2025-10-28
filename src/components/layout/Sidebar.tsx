import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UsersIcon, SettingsIcon, PhoneIcon, LogOutIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
export const Sidebar: React.FC = () => {
  const {
    logout
  } = useAuth();
  const navItems = [{
    name: 'Dashboard',
    path: '/dashboard',
    icon: <HomeIcon size={20} />
  }, {
    name: 'Contacts',
    path: '/contacts',
    icon: <UsersIcon size={20} />
  }, {
    name: 'Call Logs',
    path: '/calls',
    icon: <PhoneIcon size={20} />
  }, {
    name: 'Settings',
    path: '/settings',
    icon: <SettingsIcon size={20} />
  }];
  return <div className="h-full flex flex-col">
      <div className="p-6">
        <div className="flex items-center justify-center mb-8">
          <img src="https://placehold.co/200x60?text=AI_Secretary" alt="AI_Secretary" className="h-10" />
        </div>
        <nav>
          <ul className="space-y-2">
            {navItems.map(item => <li key={item.path}>
                <NavLink to={item.path} className={({
              isActive
            }) => `flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-primary text-white' : 'text-text hover:bg-gray-100'}`} end>
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </NavLink>
              </li>)}
          </ul>
        </nav>
      </div>
      <div className="mt-auto p-6 border-t">
        <button onClick={logout} className="flex items-center w-full p-3 text-text hover:bg-gray-100 rounded-lg transition-colors">
          <LogOutIcon size={20} className="mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>;
};