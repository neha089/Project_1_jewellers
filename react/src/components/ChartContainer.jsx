import { BarChart3 } from "lucide-react";
const ChartContainer = ({ title, children, actions, className = "" }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 ${className}`}>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-gray-600" />
        {title}
      </h3>
      {actions && <div className="flex space-x-2">{actions}</div>}
    </div>
    <div className="h-80">
      {children}
    </div>
  </div>
);
export default ChartContainer;