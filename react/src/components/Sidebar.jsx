import React, { useState } from 'react';
import { 
  Gem, 
  PieChart, 
  Users, 
  Coins, 
  ArrowUpDown, 
  Wallet, 
  Percent, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const [activeItem, setActiveItem] = useState('Dashboard');

  const navigationSections = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', icon: PieChart, href: '#' }
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'Customers', icon: Users, href: '#' },
        { name: 'Gold Loans', icon: Coins, href: '#' },
        { name: 'Transactions', icon: ArrowUpDown, href: '#' }
      ]
    },
    {
      title: 'Finance',
      items: [
        { name: 'Cash Management', icon: Wallet, href: '#' },
        { name: 'Interest', icon: Percent, href: '#' },
        { name: 'Reports', icon: BarChart3, href: '#' }
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Settings', icon: Settings, href: '#' }
      ]
    }
  ];

  const sidebarClasses = `
    fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg z-40 transition-transform duration-300 ease-in-out overflow-y-auto
    ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
  `;

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={sidebarClasses}>
        <div className="bg-gray-600 text-white p-6 text-center border-b border-gray-200">
          <div className="flex items-center justify-center gap-2">
            <Gem className="text-gray-300" size={24} />
            <h1 className="text-xl font-bold">JewelManager</h1>
          </div>
        </div>
        
        <nav className="py-4">
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <div className="px-5 mb-2">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isActive = activeItem === item.name;
                return (
                  <div key={itemIndex} className="mx-3 mb-1">
                    <button
                      onClick={() => setActiveItem(item.name)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.name}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;