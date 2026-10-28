import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    companyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
      }
    ],
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    gstin: {
      type: String,
      required: [true, 'GSTIN is required'],
      trim: true,
      uppercase: true
    },
    mobile: {
      type: String,
      default: '',
      trim: true
    },
    defaultDiscountPercent: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    notes: {
      type: String,
      default: '',
      trim: true
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

customerSchema.index({ companyIds: 1, active: 1, name: 1 });
customerSchema.index({ name: 'text', mobile: 'text', gstin: 'text' });

export const Customer = mongoose.model('Customer', customerSchema);
