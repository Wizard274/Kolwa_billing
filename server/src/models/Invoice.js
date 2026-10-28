import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    challanNumber: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate cannot be negative']
    },
    lineTotal: {
      type: Number,
      required: true,
      min: [0, 'Line total cannot be negative']
    }
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required']
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required']
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true
    },
    invoiceSequence: {
      type: Number,
      required: true,
      min: 0
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'void'],
      default: 'issued'
    },
    challanNumbers: {
      type: [String],
      default: []
    },
    companySnapshot: {
      name: { type: String, required: true },
      address: { type: String, default: '' },
      mobile: { type: String, default: '' },
      gstin: { type: String, default: '' },
      invoicePrefix: { type: String, default: '' }
    },
    customerSnapshot: {
      name: { type: String, required: true },
      address: { type: String, default: '' },
      gstin: { type: String, default: '' },
      mobile: { type: String, default: '' }
    },
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Invoice must contain at least one item'
      }
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'manual'],
      default: 'percentage'
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxMode: {
      type: String,
      enum: ['intrastate', 'interstate'],
      default: 'intrastate'
    },
    sgstRate: {
      type: Number,
      default: 2.5,
      min: 0
    },
    sgstAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    cgstRate: {
      type: Number,
      default: 2.5,
      min: 0
    },
    cgstAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    igstRate: {
      type: Number,
      default: 0,
      min: 0
    },
    igstAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    version: {
      type: Number,
      default: 1
    },
    issuedAt: {
      type: Date
    },
    voidedAt: {
      type: Date
    },
    voidReason: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
invoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ companyId: 1, invoiceDate: -1 });
invoiceSchema.index({ companyId: 1, customerId: 1 });
invoiceSchema.index({ companyId: 1, status: 1, invoiceDate: -1 });
invoiceSchema.index({ challanNumbers: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
