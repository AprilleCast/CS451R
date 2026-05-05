jest.mock('../../../src/repositories/budgetRepository');

const budgetService = require('../../../src/services/budgetService');
const budgetRepository = require('../../../src/repositories/budgetRepository');

beforeEach(() => jest.clearAllMocks());

describe('budgetService.createBudget', () => {
  it('delegates to repository and returns result', async () => {
    const payload = { category: 'Food', amount: 300 };
    budgetRepository.createBudget.mockResolvedValue({ id: 1, ...payload });

    const result = await budgetService.createBudget(5, payload);

    expect(budgetRepository.createBudget).toHaveBeenCalledWith(5, payload);
    expect(result).toEqual({ id: 1, ...payload });
  });
});

describe('budgetService.getBudgets', () => {
  it('delegates to repository and returns budgets', async () => {
    const budgets = [{ id: 1, category: 'Food', amount: 300, spent: 100 }];
    budgetRepository.getBudgetsWithTracking.mockResolvedValue(budgets);

    const result = await budgetService.getBudgets(5);

    expect(budgetRepository.getBudgetsWithTracking).toHaveBeenCalledWith(5);
    expect(result).toBe(budgets);
  });
});

describe('budgetService.updateBudget', () => {
  it('delegates to repository and returns result', async () => {
    const payload = { amount: 400 };
    budgetRepository.updateBudget.mockResolvedValue({ id: 2, amount: 400 });

    const result = await budgetService.updateBudget(5, 2, payload);

    expect(budgetRepository.updateBudget).toHaveBeenCalledWith(5, 2, payload);
    expect(result).toEqual({ id: 2, amount: 400 });
  });
});

describe('budgetService.deleteBudget', () => {
  it('delegates to repository and returns result', async () => {
    budgetRepository.deleteBudget.mockResolvedValue({ id: 2 });

    const result = await budgetService.deleteBudget(5, 2);

    expect(budgetRepository.deleteBudget).toHaveBeenCalledWith(5, 2);
    expect(result).toEqual({ id: 2 });
  });
});
