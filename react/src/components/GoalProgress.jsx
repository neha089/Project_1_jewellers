import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Package, CreditCard, Target,
  Calendar, Download, Filter, RefreshCw, DollarSign, Award,
  ShoppingCart, AlertCircle, Eye, FileText, Coins, UserCheck,
  BarChart3, PieChart as PieChartIcon, Activity, Wallet
} from 'lucide-react';
const GoalProgress = ({ goals }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
      <Target className="w-5 h-5 mr-2 text-gray-600" />
      Goal Progress
    </h3>
    <div className="space-y-6">
      {goals.map((goal, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{goal.name}</span>
            <span className="text-sm text-gray-500">
              {typeof goal.achieved === 'number' && goal.achieved < 100 
                ? `₹${(goal.achieved/1000).toFixed(0)}K / ₹${(goal.target/1000).toFixed(0)}K`
                : `${goal.achieved}${goal.name.includes('Rate') || goal.name.includes('Margin') ? '%' : ''} / ${goal.target}${goal.name.includes('Rate') || goal.name.includes('Margin') ? '%' : ''}`
              }
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                goal.percentage >= 95 ? 'bg-green-500' : 
                goal.percentage >= 80 ? 'bg-blue-500' : 
                goal.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(goal.percentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">{goal.percentage}% completed</div>
        </div>
      ))}
    </div>
  </div>
);
export default GoalProgress;