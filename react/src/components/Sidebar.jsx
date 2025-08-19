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
  const [activeItem, setActiveItem] = useState(window.location.pathname.substring(1) || 'dashboard');

  const navigationSections = [
    {
      title: 'Main',
      items: [
        { name: 'dashboard', label: 'Dashboard', icon: PieChart, href: '/dashboard' }
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'customers', label: 'Customers', icon: Users, href: '/customers' },
        { name: 'gold-loans', label: 'Gold Loans', icon: Coins, href: '/gold-loans' },
        { name: 'transactions', label: 'Transactions', icon: ArrowUpDown, href: '/transactions' }
      ]
    },
    {
      title: 'Finance',
      items: [
        { name: 'cash-management', label: 'Cash Management', icon: Wallet, href: '/cash-management' },
        { name: 'interest', label: 'Interest', icon: Percent, href: '/interest' },
        { name: 'reports', label: 'Reports', icon: BarChart3, href: '/reports' }
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'settings', label: 'Settings', icon: Settings, href: '/settings' }
      ]
    }
  ];

  const handleNavClick = (item) => {
    setActiveItem(item.name);
    if (isMobile) {
      toggleSidebar();
    }
  };

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
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        window.history.pushState(null, '', item.href);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        handleNavClick(item);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </a>
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