import { Company } from '../models/Company.js';
import { Invoice } from '../models/Invoice.js';
import { Counter } from '../models/Counter.js';

export const getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find({ active: true }).sort({ createdAt: 1 });

    // Calculate actual bill counts and current-month totals for each company
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const companyStats = await Promise.all(
      companies.map(async (company) => {
        const totalBills = await Invoice.countDocuments({
          companyId: company._id,
          status: { $ne: 'void' }
        });

        const monthBills = await Invoice.countDocuments({
          companyId: company._id,
          status: { $ne: 'void' },
          invoiceDate: { $gte: startOfMonth }
        });

        const todayBills = await Invoice.countDocuments({
          companyId: company._id,
          status: { $ne: 'void' },
          invoiceDate: { $gte: startOfToday }
        });

        const monthAgg = await Invoice.aggregate([
          {
            $match: {
              companyId: company._id,
              status: { $ne: 'void' },
              invoiceDate: { $gte: startOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$grandTotal' }
            }
          }
        ]);

        const currentMonthTotal = monthAgg[0]?.totalAmount || 0;

        return {
          ...company.toObject(),
          stats: {
            totalBills,
            monthBills,
            todayBills,
            currentMonthTotal
          }
        };
      })
    );

    res.json({
      success: true,
      companies: companyStats
    });
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (req, res, next) => {
  try {
    const {
      name,
      address,
      mobile,
      gstin,
      defaultDiscountPercent,
      invoicePrefix,
      nextInvoiceSequence,
      taxSettings
    } = req.body;

    // Check if name already exists
    const existing = await Company.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Company with name "${name}" already exists`
      });
    }

    const company = await Company.create({
      name: name.trim(),
      address: (address || '').trim(),
      mobile: (mobile || '').trim(),
      gstin: (gstin || '').trim().toUpperCase(),
      defaultDiscountPercent: defaultDiscountPercent || 0,
      invoicePrefix: (invoicePrefix || name.substring(0, 5)).trim().toUpperCase(),
      nextInvoiceSequence: nextInvoiceSequence || 1,
      taxSettings: taxSettings || {
        defaultTaxMode: 'intrastate',
        defaultSgstRate: 2.5,
        defaultCgstRate: 2.5,
        defaultIgstRate: 0
      }
    });

    // Initialize atomic counter
    await Counter.create({
      companyId: company._id,
      prefix: company.invoicePrefix,
      lastSequence: Math.max(0, (nextInvoiceSequence || 1) - 1)
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      company
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const updates = { ...req.body };
    if (updates.name) updates.name = updates.name.trim();
    if (updates.gstin) updates.gstin = updates.gstin.trim().toUpperCase();
    if (updates.invoicePrefix) updates.invoicePrefix = updates.invoicePrefix.trim().toUpperCase();

    // If invoice prefix changed, update counter prefix as well
    if (updates.invoicePrefix && updates.invoicePrefix !== company.invoicePrefix) {
      await Counter.updateOne(
        { companyId: company._id },
        { $set: { prefix: updates.invoicePrefix } }
      );
    }

    Object.assign(company, updates);
    await company.save();

    res.json({
      success: true,
      message: 'Company details updated successfully',
      company
    });
  } catch (error) {
    next(error);
  }
};

export const archiveCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Safety rule: check if company has existing bills
    const billCount = await Invoice.countDocuments({ companyId: id });
    if (billCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete company with ${billCount} existing bills. Use archival instead to preserve financial records.`
      });
    }

    company.active = false;
    await company.save();

    res.json({
      success: true,
      message: 'Company safely archived'
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyInvoiceSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalBills = await Invoice.countDocuments({
      companyId: id,
      status: { $ne: 'void' }
    });

    const monthBills = await Invoice.countDocuments({
      companyId: id,
      status: { $ne: 'void' },
      invoiceDate: { $gte: startOfMonth }
    });

    const todayBills = await Invoice.countDocuments({
      companyId: id,
      status: { $ne: 'void' },
      invoiceDate: { $gte: startOfToday }
    });

    const monthAgg = await Invoice.aggregate([
      {
        $match: {
          companyId: new (await import('mongoose')).default.Types.ObjectId(id),
          status: { $ne: 'void' },
          invoiceDate: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$grandTotal' }
        }
      }
    ]);

    res.json({
      success: true,
      summary: {
        totalBills,
        monthBills,
        todayBills,
        monthTotal: monthAgg[0]?.totalAmount || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
