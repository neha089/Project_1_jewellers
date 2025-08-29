// CustomerSearch.js
import React, { useState, useEffect } from 'react';
import { Search, User } from 'lucide-react';
import ApiService from '../services/api';

const CustomerSearch = ({ onCustomerSelect, onCreateCustomer, searchTerm, setSearchTerm }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchCustomers = async () => {
      if (searchTerm.length > 0) {
        setLoading(true);
        setError('');
        try {
          const response = await ApiService.searchCustomers(searchTerm);
          setSearchResults(response.data?.customers || []);
        } catch (err) {
          console.error('Search failed:', err);
          setError('Failed to search customers');
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const selectCustomer = (customer) => {
    onCustomerSelect(customer);
    setSearchResults([]);
  };

  const handleCreateNewCustomer = () => {
    onCreateCustomer();
    setSearchResults([]);
  };

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search customer by name or phone number..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-2 p-4 text-center text-gray-500">
          Searching customers...
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm">
          {searchResults.map(customer => (
            <div
              key={customer._id}
              onClick={() => selectCustomer(customer)}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{customer.name}</h4>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                  {customer.address?.city && (
                    <p className="text-xs text-gray-400">{customer.address.city}</p>
                  )}
                </div>
                <User size={20} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {searchTerm.length > 0 && searchResults.length === 0 && !loading && (
        <div className="mt-2 text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customer found</h3>
          <p className="text-gray-500 mb-4">No customer found with "{searchTerm}"</p>
          <button
            onClick={handleCreateNewCustomer}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Customer
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;