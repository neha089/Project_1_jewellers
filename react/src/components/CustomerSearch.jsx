// CustomerSearch.js - Fixed Version
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, User, Phone, MapPin } from "lucide-react";
import ApiService from "../services/api";

const CustomerSearch = ({
  onCustomerSelect,
  onCreateCustomer,
  searchTerm,
  setSearchTerm,
}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Improved search function with better error handling and logging
  const searchCustomers = useCallback(async (term) => {
    // Trim whitespace and check minimum length
    const trimmedTerm = term?.trim();
    if (!trimmedTerm || trimmedTerm.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      console.log("Searching for customers with term:", trimmedTerm);

      // Call API with proper parameters
      const response = await ApiService.searchCustomers(
        trimmedTerm, // search term
        1, // page
        50, // limit (increased for better results)
        "active" // status
      );

      console.log("API Response:", response);

      if (response.success) {
        const customers = response.data?.customers || [];
        console.log("Found customers:", customers);
        setSearchResults(customers);
      } else {
        throw new Error(response.message || "Search failed");
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError("Failed to search customers. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search calls with shorter delay for better UX
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCustomers(searchTerm);
    }, 200); // Reduced from 300ms to 200ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchCustomers]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const selectCustomer = (customer) => {
    onCustomerSelect(customer);
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleCreateNewCustomer = () => {
    onCreateCustomer();
    setSearchResults([]);
    setHasSearched(false);
  };

  // Improved highlight function with case-insensitive matching
  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) return text;

    try {
      const regex = new RegExp(
        `(${trimmedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi"
      );
      const parts = text.split(regex);

      return parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="bg-yellow-200 font-medium">
            {part}
          </span>
        ) : (
          part
        )
      );
    } catch (e) {
      // Fallback if regex fails
      return text;
    }
  };

  // Enhanced customer display formatting with null safety
  const formatCustomerDisplay = (customer) => {
    const address = customer.address || {};
    const fullAddress = [
      address.street,
      address.city,
      address.state,
      address.pincode ? `PIN: ${address.pincode}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      name: customer.name || "Unknown Customer",
      phone: customer.phone || "",
      email: customer.email || "",
      fullAddress: fullAddress || "",
      city: address.city || "",
      adhaar: customer.adhaarNumber || "",
    };
  };

  // Helper function to check if text matches search term
  const textMatchesSearch = (text, searchTerm) => {
    if (!text || !searchTerm) return false;
    return text.toLowerCase().includes(searchTerm.toLowerCase().trim());
  };

  const showNoResults =
    hasSearched &&
    !loading &&
    searchResults.length === 0 &&
    searchTerm.trim().length >= 2;
  const showResults = searchResults.length > 0 && !loading;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search customer by name, phone number, or address..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
        />
      </div>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === "development" && searchTerm && (
        <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
          Debug: Searching for "{searchTerm}" | Results: {searchResults.length}{" "}
          | Loading: {loading.toString()}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-4 text-center text-gray-500 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Searching customers...</span>
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600 font-medium">
              Found {searchResults.length} customer
              {searchResults.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {searchResults.map((customer) => {
              const displayData = formatCustomerDisplay(customer);

              return (
                <div
                  key={customer._id}
                  onClick={() => selectCustomer(customer)}
                  className="p-4 border-b last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Customer Name */}
                      <div className="flex items-center space-x-2 mb-1">
                        <User
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <h4 className="font-medium text-gray-900 truncate">
                          {highlightMatch(displayData.name, searchTerm)}
                        </h4>
                      </div>

                      {/* Phone Number */}
                      {displayData.phone && (
                        <div className="flex items-center space-x-2 mb-1">
                          <Phone
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <p className="text-sm text-gray-600">
                            {highlightMatch(displayData.phone, searchTerm)}
                          </p>
                        </div>
                      )}

                      {/* Email */}
                      {displayData.email && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-gray-400 text-xs">@</span>
                          <p className="text-xs text-gray-500 truncate">
                            {highlightMatch(displayData.email, searchTerm)}
                          </p>
                        </div>
                      )}

                      {/* Address */}
                      {displayData.fullAddress && (
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <p className="text-xs text-gray-500 truncate">
                            {highlightMatch(
                              displayData.fullAddress,
                              searchTerm
                            )}
                          </p>
                        </div>
                      )}

                      {/* Adhaar Number (if available) */}
                      {displayData.adhaar && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 text-xs">ID:</span>
                          <p className="text-xs text-gray-500">
                            {highlightMatch(displayData.adhaar, searchTerm)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results Found */}
      {showNoResults && (
        <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-200">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No customers found
          </h3>
          <p className="text-gray-500 mb-4">
            No customer found matching "{searchTerm.trim()}"
          </p>
          <div className="space-y-2">
            <button
              onClick={handleCreateNewCustomer}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create New Customer
            </button>
            <p className="text-xs text-gray-400">
              Or try searching with different terms
            </p>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && searchTerm.length < 2 && (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <Search size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Search for a Customer
          </h3>
          <p className="text-gray-500 mb-2">
            Type at least 2 characters to search by:
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
