import { Customer } from '../models/Customer.js';
import { Company } from '../models/Company.js';

export const getCompanyCustomers = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { search } = req.query;

    const query = {
      companyIds: companyId,
      active: true
    };

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { mobile: { $regex: s, $options: 'i' } },
        { gstin: { $regex: s, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query).sort({ name: 1 });

    res.json({
      success: true,
      customers
    });
  } catch (error) {
    next(error);
  }
};

export const createCompanyCustomer = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { name, address, gstin, mobile, defaultDiscountPercent, notes } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if customer with same name already exists for this company
    const existing = await Customer.findOne({
      companyIds: companyId,
      active: true,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Customer "${name}" already exists for this company`,
        customer: existing
      });
    }

    const customer = await Customer.create({
      companyIds: [companyId],
      name: name.trim(),
      address: (address || '').trim(),
      gstin: (gstin || '').trim().toUpperCase(),
      mobile: (mobile || '').trim(),
      defaultDiscountPercent: defaultDiscountPercent || 0,
      notes: (notes || '').trim()
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      customer
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const updates = { ...req.body };
    if (updates.name) updates.name = updates.name.trim();
    if (updates.gstin) updates.gstin = updates.gstin.trim().toUpperCase();
    if (updates.mobile) updates.mobile = updates.mobile.trim();

    Object.assign(customer, updates);
    await customer.save();

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    next(error);
  }
};

export const archiveCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.active = false;
    await customer.save();

    res.json({
      success: true,
      message: 'Customer archived successfully'
    });
  } catch (error) {
    next(error);
  }
};
