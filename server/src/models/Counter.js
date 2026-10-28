import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true
    },
    prefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    lastSequence: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

export const Counter = mongoose.model('Counter', counterSchema);
