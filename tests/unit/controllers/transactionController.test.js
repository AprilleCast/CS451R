jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));
jest.mock('../../../src/services/transactionService');

const { validationResult } = require('express-validator');
const transactionService = require('../../../src/services/transactionService');
const {
  getAllTransactions,
  createTransaction,
  deleteTransaction,
  updateTransaction,
} = require('../../../src/controllers/transactionController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const noErrors = { isEmpty: () => true, array: () => [] };
const withErrors = { isEmpty: () => false, array: () => [{ msg: 'invalid' }] };

beforeEach(() => jest.clearAllMocks());

// ── getAllTransactions ────────────────────────────────────────────────────────

describe('getAllTransactions', () => {
  it('returns 401 when no userId on request', async () => {
    validationResult.mockReturnValue(noErrors);
    const req = { user: null, query: {} };
    const res = makeRes();

    await getAllTransactions(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('returns 422 when validation fails', async () => {
    validationResult.mockReturnValue(withErrors);
    const req = { user: { id: 1 }, query: {} };
    const res = makeRes();

    await getAllTransactions(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('returns 200 with transactions on success', async () => {
    validationResult.mockReturnValue(noErrors);
    const rows = [{ id: 1, amount: 50 }];
    transactionService.getAllTransactions.mockResolvedValue(rows);

    const req = { user: { id: 1 }, query: { sortby: 'date_asc' } };
    const res = makeRes();

    await getAllTransactions(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ transactions: rows });
  });

  it('calls next with error when service throws', async () => {
    validationResult.mockReturnValue(noErrors);
    const serviceError = new Error('DB failure');
    transactionService.getAllTransactions.mockRejectedValue(serviceError);

    const req = { user: { id: 1 }, query: {} };
    const res = makeRes();
    const next = jest.fn();

    await getAllTransactions(req, res, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});

// ── createTransaction ─────────────────────────────────────────────────────────

describe('createTransaction', () => {
  it('returns 401 when no userId on request', async () => {
    validationResult.mockReturnValue(noErrors);
    const req = { user: null, body: {} };
    const res = makeRes();

    await createTransaction(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 422 when validation fails', async () => {
    validationResult.mockReturnValue(withErrors);
    const req = { user: { id: 1 }, body: {} };
    const res = makeRes();

    await createTransaction(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('returns 201 with id on success', async () => {
    validationResult.mockReturnValue(noErrors);
    transactionService.addTransaction.mockResolvedValue({ id: 99 });

    const req = { user: { id: 1 }, body: { txn_date: '2026-01-01', category: 'Food', amount: 20 } };
    const res = makeRes();

    await createTransaction(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, id: 99 });
  });
});

// ── deleteTransaction ─────────────────────────────────────────────────────────

describe('deleteTransaction', () => {
  it('returns 401 when no userId on request', async () => {
    const req = { user: null, params: { id: '5' } };
    const res = makeRes();

    await deleteTransaction(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when transaction is not found', async () => {
    transactionService.deleteTransaction.mockResolvedValue(null);

    const req = { user: { id: 1 }, params: { id: '99' } };
    const res = makeRes();

    await deleteTransaction(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 200 on successful delete', async () => {
    transactionService.deleteTransaction.mockResolvedValue({ id: 5 });

    const req = { user: { id: 1 }, params: { id: '5' } };
    const res = makeRes();

    await deleteTransaction(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ── updateTransaction ─────────────────────────────────────────────────────────

describe('updateTransaction', () => {
  it('returns 401 when no userId on request', async () => {
    const req = { user: null, params: { id: '5' }, body: {} };
    const res = makeRes();

    await updateTransaction(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 200 on successful update', async () => {
    transactionService.updateTransaction.mockResolvedValue();

    const req = { user: { id: 1 }, params: { id: '5' }, body: { amount: 75 } };
    const res = makeRes();

    await updateTransaction(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('calls next with error when service throws', async () => {
    const serviceError = new Error('Not found');
    transactionService.updateTransaction.mockRejectedValue(serviceError);

    const req = { user: { id: 1 }, params: { id: '5' }, body: {} };
    const res = makeRes();
    const next = jest.fn();

    await updateTransaction(req, res, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});
