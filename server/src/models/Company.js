import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true,
      trim: true
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    mobile: {
      type: String,
      default: '',
      trim: true
    },
    gstin: {
      type: String,
      default: '',
      trim: true,
      uppercase: true
    },
    defaultDiscountPercent: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    invoicePrefix: {
      type: String,
      required: [true, 'Invoice prefix is required'],
      trim: true,
      uppercase: true
    },
    nextInvoiceSequence: {
      type: Number,
      default: 1,
      min: 1
    },
    taxSettings: {
      defaultTaxMode: {
        type: String,
        enum: ['intrastate', 'interstate'],
        default: 'intrastate'
      },
      defaultSgstRate: {
        type: Number,
        default: 2.5,
        min: 0
      },
      defaultCgstRate: {
        type: Number,
        default: 2.5,
        min: 0
      },
      defaultIgstRate: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

companySchema.index({ active: 1, name: 1 });

export const Company = mongoose.model('Company', companySchema);
