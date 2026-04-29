const budgetService = require("../services/budgetService");
const { validationResult } = require("express-validator");

const createBudget = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors: errors.array(),
      });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const created = await budgetService.createBudget(userId, req.body);
    return res.status(201).json({
      success: true,
      message: "Budget created successfully.",
      data: created,
    });
  } catch (error) {
    return next(error);
  }
};

const getBudgets = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors: errors.array(),
      });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const budgets = await budgetService.getBudgets(userId);
    return res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    return next(error);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors: errors.array(),
      });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const updated = await budgetService.updateBudget(userId, Number(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Budget not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Budget updated successfully.",
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors: errors.array(),
      });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const deleted = await budgetService.deleteBudget(userId, Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Budget not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Budget deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};