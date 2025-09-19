import Customer from "../models/Customer.js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createCustomer = async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const query = {};

    // Enhanced search logic to include address fields
    if (search && search.trim()) {
      const searchTerm = search.trim();
      console.log("Searching for:", searchTerm);

      query.$or = [
        // Search in basic fields
        { name: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },

        // Search in nested address fields
        { "address.street": { $regex: searchTerm, $options: "i" } },
        { "address.city": { $regex: searchTerm, $options: "i" } },
        { "address.state": { $regex: searchTerm, $options: "i" } },
        { "address.pincode": { $regex: searchTerm, $options: "i" } },

        // Search in top-level address fields (if they exist)
        { city: { $regex: searchTerm, $options: "i" } },
        { state: { $regex: searchTerm, $options: "i" } },
        { pincode: { $regex: searchTerm, $options: "i" } },

        // Search in adhaar number (both string and number)
        { adhaarNumber: { $regex: searchTerm, $options: "i" } },
      ];

      // Also search by exact phone number match (in case of special characters)
      if (/^\d+$/.test(searchTerm)) {
        query.$or.push({ phone: searchTerm }, { adhaarNumber: searchTerm });
      }
    }

    if (status) query.status = status;

    console.log("Final MongoDB query:", JSON.stringify(query, null, 2));

    const customers = await Customer.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(query);

    console.log(`Found ${customers.length} customers out of ${total} total`);

    // Return in the expected format for your frontend
    res.json({
      success: true,
      data: {
        customers: customers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Customer search error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({}).lean();

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(
      customers.map((customer) => ({
        Name: customer.name,
        Phone: customer.phone,
        Email: customer.email || "",
        Street: customer.address?.street || customer.street || "",
        City: customer.address?.city || customer.city || "",
        State: customer.address?.state || customer.state || "",
        Pincode: customer.address?.pincode || customer.pincode || "",
        "Adhaar Number": customer.adhaarNumber,
        Status: customer.status,
        "Total Amount Taken From Jewellers":
          customer.totalAmountTakenFromJewellers,
        "Total Amount Taken By Us": customer.totalAmountTakenByUs,
        "Created At": customer.createdAt,
      }))
    );

    xlsx.utils.book_append_sheet(workbook, worksheet, "Customers");

    const filename = `customers_${new Date().toISOString().split("T")[0]}.xlsx`;
    const filepath = path.join(__dirname, "../exports", filename);

    xlsx.writeFile(workbook, filepath);

    res.download(filepath, filename);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Additional helper function to test search functionality
export const testSearch = async (req, res) => {
  try {
    const { searchTerm } = req.params;

    console.log("Testing search with term:", searchTerm);

    // Get all customers first
    const allCustomers = await Customer.find({}).lean();
    console.log("Total customers in database:", allCustomers.length);

    // Test search query
    const searchQuery = {
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { "address.street": { $regex: searchTerm, $options: "i" } },
        { "address.city": { $regex: searchTerm, $options: "i" } },
        { "address.state": { $regex: searchTerm, $options: "i" } },
        { "address.pincode": { $regex: searchTerm, $options: "i" } },
        { city: { $regex: searchTerm, $options: "i" } },
        { state: { $regex: searchTerm, $options: "i" } },
        { adhaarNumber: { $regex: searchTerm, $options: "i" } },
      ],
    };

    const foundCustomers = await Customer.find(searchQuery).lean();

    res.json({
      success: true,
      searchTerm,
      totalCustomers: allCustomers.length,
      foundCustomers: foundCustomers.length,
      customers: foundCustomers,
      sampleCustomer: allCustomers[0], // Show structure of first customer
    });
  } catch (error) {
    console.error("Test search failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
