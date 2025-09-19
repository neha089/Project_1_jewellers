// components/BusinessExpense/utils.js
// Add this new utility file for formatting amounts
export const formatIndianAmount = (amount) => {
    if (!amount) return '0';
    
    // Convert to number if not already
    const num = Number(amount);
    
    if (num >= 10000000) { // Crore
        return `₹${(num / 10000000)} Cr`;
    } else if (num >= 100000) { // Lakh
        return `₹${(num / 100000)} L`;
    } else if (num >= 1000) { // Thousand
        return `₹${(num / 1000)} K`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
};
