jest.mock('../../../src/repositories/transactionRepository');

const transactionService = require('../../../src/services/transactionService');
const transactionRepository = require('../../../src/repositories/transactionRepository');

beforeEach(() => jest.clearAllMocks());

describe('transactionService.addTransaction', () => {
  const userId = 1;
  const validPayload = { txn_date: '2026-01-15', category: 'Groceries', amount: 50.00 };

  it('throws 422 when txn_date is missing', async () => {
    const err = await transactionService.addTransaction(userId, { ...validPayload, txn_date: '' }).catch(e => e);
    expect(err.statusCode).toBe(422);
  });

  it('throws 422 when category is missing', async () => {
    const err = await transactionService.addTransaction(userId, { ...validPayload, category: '' }).catch(e => e);
    expect(err.statusCode).toBe(422);
  });

  it('throws 422 when amount is not a finite number', async () => {
    const err = await transactionService.addTransaction(userId, { ...validPayload, amount: 'not-a-number' }).catch(e => e);
    expect(err.statusCode).toBe(422);
  });

  it('throws 422 when category is shorter than 2 characters', async () => {
    const err = await transactionService.addTransaction(userId, { ...validPayload, category: 'A' }).catch(e => e);
    expect(err.statusCode).toBe(422);
    expect(err.message).toMatch(/2 and 100/);
  });

  it('throws 422 when category exceeds 100 characters', async () => {
    const longCategory = 'A'.repeat(101);
    const err = await transactionService.addTransaction(userId, { ...validPayload, category: longCategory }).catch(e => e);
    expect(err.statusCode).toBe(422);
    expect(err.message).toMatch(/2 and 100/);
  });

  it('calls repository and returns result for valid data', async () => {
    transactionRepository.addTransaction.mockResolvedValue({ id: 10 });

    const result = await transactionService.addTransaction(userId, validPayload);

    expect(transactionRepository.addTransaction).toHaveBeenCalledWith(userId, {
      txnDate: validPayload.txn_date,
      category: validPayload.category,
      description: undefined,
      amount: 50,
    });
    expect(result).toEqual({ id: 10 });
  });

  it('trims whitespace from category before saving', async () => {
    transactionRepository.addTransaction.mockResolvedValue({ id: 11 });

    await transactionService.addTransaction(userId, { ...validPayload, category: '  Food  ' });

    expect(transactionRepository.addTransaction).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ category: 'Food' })
    );
  });
});

describe('transactionService.getAllTransactions', () => {
  it('delegates to repository with userId and filters', async () => {
    const rows = [{ id: 1, amount: 10 }];
    transactionRepository.getAllByUser.mockResolvedValue(rows);

    const result = await transactionService.getAllTransactions(5, { sortby: 'date_asc' });

    expect(transactionRepository.getAllByUser).toHaveBeenCalledWith(5, { sortby: 'date_asc' });
    expect(result).toBe(rows);
  });

  it('uses empty object as default filters', async () => {
    transactionRepository.getAllByUser.mockResolvedValue([]);

    await transactionService.getAllTransactions(5);

    expect(transactionRepository.getAllByUser).toHaveBeenCalledWith(5, {});
  });
});

describe('transactionService.deleteTransaction', () => {
  it('delegates to repository and returns its result', async () => {
    transactionRepository.deleteTransaction.mockResolvedValue({ id: 3 });

    const result = await transactionService.deleteTransaction(3, 1);

    expect(transactionRepository.deleteTransaction).toHaveBeenCalledWith(3, 1);
    expect(result).toEqual({ id: 3 });
  });
});

describe('transactionService.updateTransaction', () => {
  it('delegates to repository and returns its result', async () => {
    transactionRepository.updateTransaction.mockResolvedValue({ id: 7 });

    const result = await transactionService.updateTransaction(1, 7, { amount: 20 });

    expect(transactionRepository.updateTransaction).toHaveBeenCalledWith(1, 7, { amount: 20 });
    expect(result).toEqual({ id: 7 });
  });
});
