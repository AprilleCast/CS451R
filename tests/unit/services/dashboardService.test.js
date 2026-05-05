jest.mock('../../../src/repositories/dashboardRepository');

const dashboardService = require('../../../src/services/dashboardService');
const dashboardRepository = require('../../../src/repositories/dashboardRepository');

beforeEach(() => jest.clearAllMocks());

describe('dashboardService.getSummary', () => {
  it('calls all three repository methods and assembles the summary', async () => {
    dashboardRepository.getTotalSpent.mockResolvedValue(500);
    dashboardRepository.getSpendingByCategory.mockResolvedValue([{ category: 'Food', total: 200 }]);
    dashboardRepository.getRecentTransactions.mockResolvedValue([{ id: 1, amount: 50 }]);

    const filters = { startDate: '2026-01-01' };
    const result = await dashboardService.getSummary(3, filters);

    expect(dashboardRepository.getTotalSpent).toHaveBeenCalledWith(3, filters);
    expect(dashboardRepository.getSpendingByCategory).toHaveBeenCalledWith(3, filters);
    expect(dashboardRepository.getRecentTransactions).toHaveBeenCalledWith(3, filters);

    expect(result).toEqual({
      totalSpent: 500,
      spendingByCategory: [{ category: 'Food', total: 200 }],
      recentTransactions: [{ id: 1, amount: 50 }],
    });
  });

  it('uses empty object as default filters', async () => {
    dashboardRepository.getTotalSpent.mockResolvedValue(0);
    dashboardRepository.getSpendingByCategory.mockResolvedValue([]);
    dashboardRepository.getRecentTransactions.mockResolvedValue([]);

    await dashboardService.getSummary(3);

    expect(dashboardRepository.getTotalSpent).toHaveBeenCalledWith(3, {});
  });
});

describe('dashboardService.getTrend', () => {
  it('delegates to repository and returns trend data', async () => {
    const trend = [{ month: '2026-01', total: 300 }];
    dashboardRepository.getSpendingTrend.mockResolvedValue(trend);

    const result = await dashboardService.getTrend(3, { period: 'monthly' });

    expect(dashboardRepository.getSpendingTrend).toHaveBeenCalledWith(3, { period: 'monthly' });
    expect(result).toBe(trend);
  });
});
