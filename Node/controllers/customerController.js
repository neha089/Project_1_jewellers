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

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;

    const customers = await Customer.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
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
        City: customer.city,
        State: customer.state,
        Pincode: customer.pincode,
        "Adhaar Number": customer.adhaarNumber,
        Status: customer.status,
        "Total Amount Taken From Jewellers":
          customer.totalAmountTakenFromJewellers / 100,
        "Total Amount Taken By Us": customer.totalAmountTakenByUs / 100,
        "Created At": customer.createdAt,
      }))
    );

    xlsx.utils.book_append_sheet(workbook, worksheet, "Customers");

    const filename = `customers_${new Date()
      .toISOString()
      .split("T")[0]}.xlsx`;
    const filepath = path.join(__dirname, "../exports", filename);

    xlsx.writeFile(workbook, filepath);

    res.download(filepath, filename);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
