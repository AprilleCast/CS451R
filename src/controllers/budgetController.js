const createBudget = async (req, res) => {
    const budget = req.body; 
    try {
      const result = await budgetService.createBudget();
      res.json(result);
    } catch (error) {
      console.error("Controller error in checkDbHealth:", error);
      res.status(500).json({ error: "Database health check failed" });
    }
  };
  