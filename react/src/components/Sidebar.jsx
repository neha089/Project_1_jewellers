import React, { useState, useEffect } from 'react';
import { 
  Gem, 
  PieChart, 
  Users, 
  Coins, 
  ArrowUpDown, 
  Wallet, 
  Percent, 
  BarChart3, 
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Target,
  FileText,
  Calculator,
  Activity
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  // Function to get active item from current path
  const getActiveItemFromPath = (path) => {
    switch (path) {
      case '/':
      case '/dashboard':
        return 'dashboard';
      case '/customers':
        return 'customers';
      case '/gold-loans':
        return 'gold-loans';
      case '/transactions':
        return 'transactions';
      case '/analytics':
        return 'analytics';
      case '/income-analysis':
        return 'income-analysis';
      case '/expense-analysis':
        return 'expense-analysis';
      case '/loan-analytics':
        return 'loan-analytics';
      case '/customer-insights':
        return 'customer-insights';
      case '/gold-market':
        return 'gold-market';
      case '/profit-loss':
        return 'profit-loss';
      case '/reports':
        return 'reports';
      case '/settings':
        return 'settings';
      default:
        return 'dashboard';
    }
  };

  const [activeItem, setActiveItem] = useState(
    getActiveItemFromPath(window.location.pathname)
  );

  // Listen for navigation changes (including from QuickActions)
  useEffect(() => {
    const handlePopState = () => {
      const newActiveItem = getActiveItemFromPath(window.location.pathname);
      setActiveItem(newActiveItem);
    };

    // Listen for both popstate and custom navigation events
    window.addEventListener('popstate', handlePopState);
    
    // Also listen for direct path changes
    const handleLocationChange = () => {
      const newActiveItem = getActiveItemFromPath(window.location.pathname);
      setActiveItem(newActiveItem);
    };

    // Create a custom event listener for manual navigation updates
    window.addEventListener('navigationUpdate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('navigationUpdate', handleLocationChange);
    };
  }, []);

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
      title: 'Analytics & Reports',
      items: [
        { name: 'analytics', label: 'Overview Analytics', icon: BarChart3, href: '/analytics' },
        { name: 'income-analysis', label: 'Income Analysis', icon: TrendingUp, href: '/income-analysis' },
        { name: 'expense-analysis', label: 'Expense Analysis', icon: TrendingDown, href: '/expense-analysis' },
        { name: 'loan-analytics', label: 'Loan Analytics', icon: CreditCard, href: '/loan-analytics' },
        { name: 'customer-insights', label: 'Customer Insights', icon: Target, href: '/customer-insights' },
        { name: 'gold-market', label: 'Gold Market Trends', icon: Activity, href: '/gold-market' },
        { name: 'profit-loss', label: 'Profit & Loss', icon: Calculator, href: '/profit-loss' },
        { name: 'reports', label: 'Financial Reports', icon: FileText, href: '/reports' }
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
    fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 shadow-lg z-40 transition-transform duration-300 ease-in-out overflow-y-auto
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
        <div className="bg-slate-700 text-white p-6 text-center border-b border-slate-200">
          <div className="flex items-center justify-center gap-2">
            <Gem className="text-amber-400" size={24} />
            <h1 className="text-xl font-bold">JewelManager</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">Professional Edition</p>
        </div>
        
        <nav className="py-4">
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <div className="px-5 mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      title={item.label}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                      {/* Add notification badges for certain sections */}
                      {item.name === 'analytics' && (
                        <span className="ml-auto bg-emerald-100 text-emerald-600 text-xs px-1.5 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                      {item.name === 'reports' && (
                        <span className="ml-auto bg-amber-100 text-amber-600 text-xs px-1.5 py-0.5 rounded-full">
                          5
                        </span>
                      )}
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
