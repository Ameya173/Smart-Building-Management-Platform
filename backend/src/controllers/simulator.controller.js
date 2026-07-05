const asyncHandler = require("express-async-handler");
const Asset = require("../models/Asset");
const ApiResponse = require("../utils/apiResponse");

exports.simulateBudget = asyncHandler(async (req, res) => {
  const { building } = req.query;
  const budget = parseInt(req.query.budget) || 500000;

  // Attempt to get real average health from building's assets
  let currentHealth = 92; // default
  if (building) {
    const stats = await Asset.aggregate([
      { $match: { building: require("mongoose").Types.ObjectId.createFromHexString(building), isActive: { $ne: false } } },
      { $group: { _id: null, avgHealth: { $avg: "$healthScore" } } }
    ]);
    if (stats.length > 0 && stats[0].avgHealth) {
      currentHealth = Math.round(stats[0].avgHealth);
    }
  }

  // Simulator Logic
  // Optimal budget for this theoretical building size is set to 800,000
  const OPTIMAL_BUDGET = 800000;
  
  // Calculate budget ratio (capped between 0.2 and 2.0 to prevent extreme anomalies)
  let ratio = budget / OPTIMAL_BUDGET;
  ratio = Math.max(0.2, Math.min(ratio, 2.0));

  const predictions = [];
  let simulatedHealth = currentHealth;
  let totalSavings = 0;
  let totalBreakdowns = 0;

  for (let month = 1; month <= 12; month++) {
    // Health decay: 
    // If ratio is 1 (optimal), decays by 0.5% per month.
    // If ratio < 1 (underfunded), decays faster (up to 3% per month).
    // If ratio > 1 (overfunded), decays slower (down to 0.1% per month), maybe even recovers slightly if highly overfunded.
    
    let decayRate = 0.5 + ((1 - ratio) * 2.5); 
    
    simulatedHealth = simulatedHealth - decayRate;
    // Cap health at 100 and floor at 40
    simulatedHealth = Math.max(40, Math.min(100, simulatedHealth));

    // Predicted breakdowns based on health and budget
    // Lower health = more breakdowns. Higher budget = faster preventive maintenance = fewer breakdowns.
    let baseBreakdowns = Math.max(0, (100 - simulatedHealth) / 10);
    let monthlyBreakdowns = Math.max(0, Math.round(baseBreakdowns * (2 - ratio)));
    totalBreakdowns += monthlyBreakdowns;

    // Estimated savings
    // If you spend well (ratio ~ 1.0 - 1.5), you prevent catastrophic failures which saves money.
    // Overspending (ratio > 1.5) yields diminishing returns.
    // Underspending causes negative savings (unexpected high repair costs).
    let monthlySavings = 0;
    if (ratio >= 0.8) {
      monthlySavings = Math.round((budget / 12) * 0.15 * (simulatedHealth / 100));
    } else {
      // Penalty for underfunding
      monthlySavings = -Math.round(((OPTIMAL_BUDGET - budget) / 12) * 0.4);
    }
    
    totalSavings += monthlySavings;

    predictions.push({
      month: `M+${month}`,
      health: Math.round(simulatedHealth),
      breakdowns: monthlyBreakdowns,
      savings: monthlySavings
    });
  }

  const sixMonthHealth = predictions[5].health;
  const twelveMonthHealth = predictions[11].health;

  // Generate dynamic recommendation
  let recommendation = "";
  if (ratio < 0.8) {
    recommendation = `Critically underfunded. Increasing maintenance budget by ₹${((OPTIMAL_BUDGET * 0.8) - budget).toLocaleString()} may prevent a sharp drop in building health to ${twelveMonthHealth}% and reduce breakdowns significantly.`;
  } else if (ratio >= 0.8 && ratio <= 1.2) {
    recommendation = `Optimal funding range. The current budget maintains steady health. An additional 15% investment could further reduce breakdowns by roughly 30%.`;
  } else {
    recommendation = `Well-funded. Health remains high at ${twelveMonthHealth}%. Diminishing returns on extra budget; consider reallocating surplus to energy-efficiency upgrades.`;
  }

  res.status(200).json(new ApiResponse(200, {
    currentHealth,
    sixMonthHealth,
    twelveMonthHealth,
    budget,
    totalBreakdowns,
    totalSavings,
    predictions,
    recommendation
  }, "Simulation successful"));
});
