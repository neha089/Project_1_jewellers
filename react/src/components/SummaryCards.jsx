import { 
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Users
} from 'lucide-react';
const SummaryCards = () => {
  const summaryData = [
    {
      title: "Today's Income",
      amount: 45320,
      icon: ArrowDown,
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-500',
      iconColor: 'text-white'
    },
    {
      title: "Today's Expenses", 
      amount: 12450,
      icon: ArrowUp,
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-500',
      iconColor: 'text-white'
    },
    {
      title: "Net Balance",
      amount: 32870,
      icon: TrendingUp,
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      iconColor: 'text-white'
    },
    {
      title: "Total Transactions",
      amount: 28,
      icon: Users,
      bgColor: 'bg-gray-50',
      iconBg: 'bg-gray-500',
      iconColor: 'text-white',
      isCount: true
    }
  ];

  return (
    <div className="grid grid-cols sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryData.map((item, index) => (
        <div key={index} className={`${item.bgColor} rounded-lg p-6 border border-gray-100`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">{item.title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {item.isCount ? item.amount : `₹${item.amount.toLocaleString()}`}
              </p>
            </div>
            <div className={`${item.iconBg} p-3 rounded-lg`}>
              <item.icon size={20} className={item.iconColor} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default SummaryCards;
