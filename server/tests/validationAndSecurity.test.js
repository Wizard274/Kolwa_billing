import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loginSchema, changePasswordSchema } from '../src/validators/authValidator.js';
import { createCompanySchema } from '../src/validators/companyValidator.js';
import { createCustomerSchema } from '../src/validators/customerValidator.js';
import { createInvoiceSchema, voidInvoiceSchema } from '../src/validators/invoiceValidator.js';
import { User } from '../src/models/User.js';

describe('Validation & Security Logic Tests', () => {
  test('Bcrypt password hashing and comparison works correctly', async () => {
    const password = '1234';
    const hash = await User.hashPassword(password);
    assert.ok(hash);
    assert.notEqual(hash, password);

    // Verify instance comparison logic
    const dummyUser = new User({ username: 'Kolwa', passwordHash: hash });
    const isMatch = await dummyUser.comparePassword('1234');
    assert.equal(isMatch, true);

    const isWrong = await dummyUser.comparePassword('wrong-password');
    assert.equal(isWrong, false);
  });

  test('Login validation rejects empty username or password', () => {
    assert.throws(() => loginSchema.parse({ username: '', password: '123' }));
    assert.throws(() => loginSchema.parse({ username: 'Kolwa', password: '' }));
    const valid = loginSchema.parse({ username: 'Kolwa', password: '1234' });
    assert.equal(valid.username, 'Kolwa');
  });

  test('Password change validation enforces min 4 characters', () => {
    assert.throws(() => changePasswordSchema.parse({ currentPassword: '1234', newPassword: '12' }));
    const valid = changePasswordSchema.parse({ currentPassword: '1234', newPassword: 'super_secret' });
    assert.equal(valid.newPassword, 'super_secret');
  });

  test('Company validation requires name and invoicePrefix', () => {
    assert.throws(() => createCompanySchema.parse({ name: '' }));
    const valid = createCompanySchema.parse({
      name: 'Kolwa Impex',
      invoicePrefix: 'KOLWA-'
    });
    assert.equal(valid.name, 'Kolwa Impex');
    assert.equal(valid.invoicePrefix, 'KOLWA-');
    assert.equal(valid.defaultDiscountPercent, 0);
  });

  test('Customer validation validates name, gstin requirement and discount range', () => {
    assert.throws(() => createCustomerSchema.parse({ name: '', gstin: '24AAAAA0000A1Z5' }));
    assert.throws(() => createCustomerSchema.parse({ name: 'Shree Fabrics', gstin: '' })); // GSTIN required
    assert.throws(() => createCustomerSchema.parse({ name: 'Shree Fabrics', gstin: '24AAAAA0000A1Z5', defaultDiscountPercent: 150 }));
    const valid = createCustomerSchema.parse({
      name: 'Shree Fabrics',
      gstin: '24AAAAA0000A1Z5',
      defaultDiscountPercent: 5
    });
    assert.equal(valid.name, 'Shree Fabrics');
    assert.equal(valid.gstin, '24AAAAA0000A1Z5');
    assert.equal(valid.defaultDiscountPercent, 5);
  });

  test('Invoice validation requires at least 1 item and positive quantities', () => {
    assert.throws(() => createInvoiceSchema.parse({
      customerId: '507f1f77bcf86cd799439011',
      items: []
    }));

    assert.throws(() => createInvoiceSchema.parse({
      customerId: '507f1f77bcf86cd799439011',
      items: [{ description: 'Test', quantity: 0, rate: 10 }]
    }));

    const valid = createInvoiceSchema.parse({
      customerId: '507f1f77bcf86cd799439011',
      items: [{ challanNumber: 'CH-1', description: 'Embroidery Zari', quantity: 10, rate: 100 }],
      taxMode: 'intrastate',
      sgstRate: 2.5,
      cgstRate: 2.5
    });

    assert.equal(valid.items.length, 1);
    assert.equal(valid.taxMode, 'intrastate');
  });

  test('Void invoice requires reason', () => {
    assert.throws(() => voidInvoiceSchema.parse({ reason: '' }));
    const valid = voidInvoiceSchema.parse({ reason: 'Client requested cancellation due to wrong order specs' });
    assert.ok(valid.reason);
  });
});
