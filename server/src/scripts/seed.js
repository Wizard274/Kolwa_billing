import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Counter } from '../models/Counter.js';

export const runSeed = async () => {
  console.log('--- Starting Idempotent Database Seed ---');

  // 1. Seed Initial Admin Account
  const adminUsername = config.initialAdminUsername || 'Kolwa';
  const existingAdmin = await User.findOne({ username: { $regex: new RegExp(`^${adminUsername}$`, 'i') } });

  if (!existingAdmin) {
    const passwordHash = await User.hashPassword(config.initialAdminPassword || '1234');
    await User.create({
      username: adminUsername,
      passwordHash,
      role: 'admin',
      active: true
    });
    console.log(`[+] Initial administrator created: Username: "${adminUsername}" (Password set from env: ${config.initialAdminPassword})`);
  } else {
    console.log(`[i] Administrator "${adminUsername}" already exists. Skipping user creation.`);
  }

  // 2. Seed Default Companies Idempotently
  const defaultCompanies = [
    {
      name: 'Kolwa Impex',
      invoicePrefix: 'KOLWA-',
      nextInvoiceSequence: 1,
      address: '',
      mobile: '',
      gstin: '',
      defaultDiscountPercent: 0,
      taxSettings: {
        defaultTaxMode: 'intrastate',
        defaultSgstRate: 2.5,
        defaultCgstRate: 2.5,
        defaultIgstRate: 0
      }
    },
    {
      name: 'Kolwa Creation',
      invoicePrefix: 'KC-',
      nextInvoiceSequence: 1,
      address: '',
      mobile: '',
      gstin: '',
      defaultDiscountPercent: 0,
      taxSettings: {
        defaultTaxMode: 'intrastate',
        defaultSgstRate: 2.5,
        defaultCgstRate: 2.5,
        defaultIgstRate: 0
      }
    },
    {
      name: 'Shree Impex',
      invoicePrefix: 'SHREE-',
      nextInvoiceSequence: 1,
      address: '',
      mobile: '',
      gstin: '',
      defaultDiscountPercent: 0,
      taxSettings: {
        defaultTaxMode: 'intrastate',
        defaultSgstRate: 2.5,
        defaultCgstRate: 2.5,
        defaultIgstRate: 0
      }
    }
  ];

  for (const compData of defaultCompanies) {
    let company = await Company.findOne({ name: compData.name });
    if (!company) {
      company = await Company.create(compData);
      console.log(`[+] Company created: "${compData.name}" with prefix "${compData.invoicePrefix}"`);

      // Initialize counter for company
      await Counter.findOneAndUpdate(
        { companyId: company._id },
        {
          companyId: company._id,
          prefix: compData.invoicePrefix,
          lastSequence: 0
        },
        { upsert: true, new: true }
      );
      console.log(`[+] Sequence counter initialized for: "${compData.name}"`);
    } else {
      console.log(`[i] Company "${compData.name}" already exists. Ensuring sequence counter is ready.`);
      await Counter.findOneAndUpdate(
        { companyId: company._id },
        {
          $setOnInsert: {
            companyId: company._id,
            prefix: company.invoicePrefix,
            lastSequence: 0
          }
        },
        { upsert: true, new: true }
      );
    }
  }

  console.log('--- Database Seed Completed Successfully ---');
};

// If run directly from command line: node src/scripts/seed.js
const isDirectExecution = process.argv[1]?.replace(/\\/g, '/').endsWith('src/scripts/seed.js');

if (isDirectExecution) {
  (async () => {
    try {
      await connectDB();
      await runSeed();
      await disconnectDB();
      process.exit(0);
    } catch (error) {
      console.error('Seed process failed:', error);
      process.exit(1);
    }
  })();
}
