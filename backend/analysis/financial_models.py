#!/usr/bin/env python3
"""
Domain-Specific Optimizations for Financial Simulations
Implements specialized financial models for tariff impact analysis:
- Black-Scholes model for options pricing
- Heston model for stochastic volatility
- Jump diffusion models for rare events
- VaR and Expected Shortfall calculations
- Long-term economic impact models
"""

import numpy as np
import scipy.stats as stats
from scipy.optimize import minimize
from typing import Dict, List, Tuple, Any, Optional, Union, Callable
import logging
import math
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("FinancialModels")

class MarketScenario(Enum):
    """Market scenario types for stress testing"""
    BASE = "base"
    RECESSION = "recession"
    STAGFLATION = "stagflation"
    GROWTH = "growth"
    VOLATILITY = "high_volatility"
    TECH_BOOM = "tech_boom"
    TRADE_WAR = "trade_war"
    SUPPLY_CHAIN_DISRUPTION = "supply_chain_disruption"

class TariffModel:
    """
    Economic model for tariff impact analysis
    
    This model simulates the financial impact of tariffs on a company,
    taking into account direct costs, market adjustments, and competitor
    responses.
    """
    
    def __init__(
        self,
        baseline_revenue: float,
        baseline_costs: float,
        us_export_percentage: float,
        price_elasticity: float = -2.0,
        competitor_response_factor: float = 0.3,
        market_substitution_rate: float = 0.4,
        indirect_impact_multiplier: float = 0.2
    ):
        """
        Initialize tariff impact model
        
        Args:
            baseline_revenue: Company's baseline annual revenue
            baseline_costs: Company's baseline annual costs
            us_export_percentage: Percentage of revenue from US exports
            price_elasticity: Price elasticity of demand (typically negative)
            competitor_response_factor: How strongly competitors react
            market_substitution_rate: Rate at which markets can be substituted
            indirect_impact_multiplier: Multiplier for indirect effects
        """
        self.baseline_revenue = baseline_revenue
        self.baseline_costs = baseline_costs
        self.us_export_percentage = us_export_percentage
        self.price_elasticity = price_elasticity
        self.competitor_response_factor = competitor_response_factor
        self.market_substitution_rate = market_substitution_rate
        self.indirect_impact_multiplier = indirect_impact_multiplier
        
        # Calculate derived values
        self.baseline_profit = baseline_revenue - baseline_costs
        self.profit_margin = self.baseline_profit / baseline_revenue if baseline_revenue > 0 else 0
        self.us_revenue = baseline_revenue * (us_export_percentage / 100.0)
        
        # Model version
        self.model_version = "1.0"
        logger.info(f"Tariff impact model initialized with baseline revenue ${baseline_revenue:,.0f}")
    
    def calculate_impact(
        self,
        tariff_rate: float,
        negotiation_success: bool,
        market_adaptability: float,
        competitor_response: float,
        alternative_market_growth: float,
        timeframe_years: float = 1.0,
        scenario: MarketScenario = MarketScenario.BASE
    ) -> Dict[str, float]:
        """
        Calculate financial impact of tariffs
        
        Args:
            tariff_rate: Tariff rate as percentage
            negotiation_success: Whether tariff negotiations succeed
            market_adaptability: Company's ability to adapt (0-1)
            competitor_response: Strength of competitor response (0-1)
            alternative_market_growth: Growth in alternative markets (0-1)
            timeframe_years: Number of years for projection
            scenario: Market scenario for simulation
            
        Returns:
            Dictionary with impact metrics
        """
        # Apply scenario adjustments
        scenario_factors = self._get_scenario_factors(scenario)
        
        # Adjusted parameters based on scenario
        market_adaptability *= scenario_factors["adaptability_factor"]
        competitor_response *= scenario_factors["competitor_factor"]
        alternative_market_growth *= scenario_factors["growth_factor"]
        
        # Apply negotiation success
        effective_tariff_rate = tariff_rate * 0.3 if negotiation_success else tariff_rate
        
        # Calculate direct tariff costs
        direct_tariff_costs = self.us_revenue * (effective_tariff_rate / 100.0)
        
        # Market response to price increases
        # Companies may absorb some costs and pass some to customers
        price_absorption_rate = 0.4  # Company absorbs 40% of tariff
        price_increase_percentage = effective_tariff_rate * (1 - price_absorption_rate)
        
        # Demand change due to price elasticity
        demand_change_percentage = price_increase_percentage * self.price_elasticity
        volume_impact = self.us_revenue * (demand_change_percentage / 100.0)
        
        # Market share loss from competitors
        market_adaptation_factor = market_adaptability
        
        # Calculate market share loss
        market_share_loss = self.us_revenue * (
            0.4 * effective_tariff_rate / 100.0 * (1.0 - market_adaptation_factor)
        )
        
        # Alternative market offset (recovery through other markets)
        alternative_market_offset = market_share_loss * alternative_market_growth * 0.6
        
        # Competitor pressure impact
        competitor_impact = self.us_revenue * 0.15 * competitor_response * effective_tariff_rate / 100.0
        
        # Calculate total direct financial impact
        direct_financial_impact = -(
            direct_tariff_costs + 
            volume_impact +
            market_share_loss + 
            competitor_impact - 
            alternative_market_offset
        )
        
        # Calculate indirect effects (e.g., on suppliers, etc.)
        indirect_factor = self.indirect_impact_multiplier + 0.1 * effective_tariff_rate / 100.0
        indirect_impact = direct_financial_impact * indirect_factor
        
        # Calculate total financial impact
        total_financial_impact = direct_financial_impact + indirect_impact
        
        # Scale by timeframe
        if timeframe_years != 1.0:
            # Apply time value of money and compounding effects
            discount_rate = scenario_factors["discount_rate"]
            cumulative_impact = 0.0
            
            for year in range(1, int(timeframe_years) + 1):
                year_impact = total_financial_impact * (1 + scenario_factors["impact_growth_rate"]) ** (year - 1)
                cumulative_impact += year_impact / (1 + discount_rate) ** (year - 1)
            
            # Add partial year if needed
            if timeframe_years % 1 > 0:
                partial_year = timeframe_years % 1
                year = int(timeframe_years) + 1
                year_impact = total_financial_impact * (1 + scenario_factors["impact_growth_rate"]) ** (year - 1)
                cumulative_impact += partial_year * year_impact / (1 + discount_rate) ** (year - 1)
                
            total_financial_impact = cumulative_impact
        
        # Calculate impact as percentage of baseline revenue
        percentage_impact = total_financial_impact / self.baseline_revenue * 100.0
        
        # Calculate new profit
        new_profit = self.baseline_profit + total_financial_impact
        
        # Calculate profit impact percentage
        profit_impact_percentage = (
            (new_profit - self.baseline_profit) / self.baseline_profit * 100.0
            if self.baseline_profit > 0 else float('nan')
        )
        
        # Return results
        return {
            "direct_tariff_costs": -direct_tariff_costs,
            "volume_impact": -volume_impact,
            "market_share_loss": -market_share_loss,
            "competitor_impact": -competitor_impact,
            "alternative_market_offset": alternative_market_offset,
            "direct_financial_impact": direct_financial_impact,
            "indirect_impact": indirect_impact,
            "total_financial_impact": total_financial_impact,
            "percentage_impact": percentage_impact,
            "new_profit": new_profit,
            "profit_impact_percentage": profit_impact_percentage,
            "effective_tariff_rate": effective_tariff_rate
        }
    
    def _get_scenario_factors(self, scenario: MarketScenario) -> Dict[str, float]:
        """Get adjustment factors for different market scenarios"""
        base_factors = {
            "adaptability_factor": 1.0,
            "competitor_factor": 1.0,
            "growth_factor": 1.0,
            "discount_rate": 0.08,  # 8% discount rate
            "impact_growth_rate": 0.02  # 2% annual growth in impact
        }
        
        if scenario == MarketScenario.RECESSION:
            return {
                "adaptability_factor": 0.7,  # Harder to adapt in recession
                "competitor_factor": 1.3,    # More aggressive competition
                "growth_factor": 0.6,        # Alternative markets also in recession
                "discount_rate": 0.10,       # Higher discount rate
                "impact_growth_rate": 0.04   # Impact compounds faster
            }
        elif scenario == MarketScenario.STAGFLATION:
            return {
                "adaptability_factor": 0.8,
                "competitor_factor": 1.2,
                "growth_factor": 0.7,
                "discount_rate": 0.12,
                "impact_growth_rate": 0.05
            }
        elif scenario == MarketScenario.GROWTH:
            return {
                "adaptability_factor": 1.2,  # Easier to adapt in growth
                "competitor_factor": 0.9,    # Less desperate competition
                "growth_factor": 1.3,        # Better alternative opportunities
                "discount_rate": 0.07,
                "impact_growth_rate": 0.01
            }
        elif scenario == MarketScenario.VOLATILITY:
            return {
                "adaptability_factor": 0.9,
                "competitor_factor": 1.1,
                "growth_factor": 0.9,
                "discount_rate": 0.09,
                "impact_growth_rate": 0.03
            }
        elif scenario == MarketScenario.TECH_BOOM:
            return {
                "adaptability_factor": 1.3,  # High innovation helps adaptation
                "competitor_factor": 1.2,    # But also more competition
                "growth_factor": 1.4,        # New markets emerging
                "discount_rate": 0.06,
                "impact_growth_rate": 0.00   # Effects may diminish over time
            }
        elif scenario == MarketScenario.TRADE_WAR:
            return {
                "adaptability_factor": 0.6,  # Very difficult environment
                "competitor_factor": 1.4,    # Aggressive competition
                "growth_factor": 0.5,        # Few alternative markets
                "discount_rate": 0.11,
                "impact_growth_rate": 0.06   # Impacts compound significantly
            }
        elif scenario == MarketScenario.SUPPLY_CHAIN_DISRUPTION:
            return {
                "adaptability_factor": 0.7,
                "competitor_factor": 1.1,
                "growth_factor": 0.8,
                "discount_rate": 0.09,
                "impact_growth_rate": 0.04
            }
        else:
            return base_factors
    
    def run_multi_period_simulation(
        self,
        tariff_rates: np.ndarray,  # Time series of tariff rates
        market_adaptability_growth: float,  # How much adaptability improves each period
        base_market_adaptability: float,
        negotiation_probs: np.ndarray,  # Probability of successful negotiation in each period
        initial_competitor_response: float,
        competitor_learning_rate: float,  # How quickly competitors adapt
        alternative_market_growth_rate: float,
        periods: int,
        num_simulations: int = 1000,
        scenario: MarketScenario = MarketScenario.BASE
    ) -> Dict[str, np.ndarray]:
        """
        Run multi-period simulation of tariff impacts
        
        Args:
            tariff_rates: Array of tariff rates for each period
            market_adaptability_growth: Growth in adaptability each period
            base_market_adaptability: Starting market adaptability
            negotiation_probs: Array of negotiation success probabilities
            initial_competitor_response: Initial competitor response
            competitor_learning_rate: How quickly competitors adapt
            alternative_market_growth_rate: Growth rate for alternative markets
            periods: Number of periods to simulate
            num_simulations: Number of simulations to run
            scenario: Market scenario
            
        Returns:
            Dictionary with time series of results
        """
        # Extend arrays if needed
        if len(tariff_rates) < periods:
            # Use last value for remaining periods
            tariff_rates = np.append(
                tariff_rates, 
                np.full(periods - len(tariff_rates), tariff_rates[-1])
            )
        
        if len(negotiation_probs) < periods:
            negotiation_probs = np.append(
                negotiation_probs,
                np.full(periods - len(negotiation_probs), negotiation_probs[-1])
            )
        
        # Initialize storage for results
        total_impacts = np.zeros((num_simulations, periods))
        cumulative_impacts = np.zeros((num_simulations, periods))
        profit_impacts = np.zeros((num_simulations, periods))
        
        # Run simulations
        for sim in range(num_simulations):
            # Initialize variables for this simulation
            market_adaptability = base_market_adaptability
            competitor_response = initial_competitor_response
            alternative_market_growth = 0.0
            running_impact = 0.0
            
            # Simulate each period
            for period in range(periods):
                # Simulate negotiation outcome
                negotiation_success = np.random.random() < negotiation_probs[period]
                
                # Calculate impacts for this period
                result = self.calculate_impact(
                    tariff_rate=tariff_rates[period],
                    negotiation_success=negotiation_success,
                    market_adaptability=market_adaptability,
                    competitor_response=competitor_response,
                    alternative_market_growth=alternative_market_growth,
                    timeframe_years=1.0,  # One period at a time
                    scenario=scenario
                )
                
                # Store results
                total_impacts[sim, period] = result["total_financial_impact"]
                running_impact += result["total_financial_impact"]
                cumulative_impacts[sim, period] = running_impact
                profit_impacts[sim, period] = result["profit_impact_percentage"]
                
                # Update variables for next period
                market_adaptability = min(1.0, market_adaptability + market_adaptability_growth)
                competitor_response = min(1.0, competitor_response * (1 + competitor_learning_rate))
                alternative_market_growth = min(1.0, alternative_market_growth + alternative_market_growth_rate)
        
        # Calculate statistics across simulations
        mean_total_impacts = np.mean(total_impacts, axis=0)
        p05_total_impacts = np.percentile(total_impacts, 5, axis=0)
        p95_total_impacts = np.percentile(total_impacts, 95, axis=0)
        
        mean_cumulative = np.mean(cumulative_impacts, axis=0)
        p05_cumulative = np.percentile(cumulative_impacts, 5, axis=0)
        p95_cumulative = np.percentile(cumulative_impacts, 95, axis=0)
        
        mean_profit_impacts = np.mean(profit_impacts, axis=0)
        
        # Return results
        return {
            "total_impacts": total_impacts,
            "cumulative_impacts": cumulative_impacts,
            "profit_impacts": profit_impacts,
            "mean_total_impacts": mean_total_impacts,
            "p05_total_impacts": p05_total_impacts,
            "p95_total_impacts": p95_total_impacts,
            "mean_cumulative": mean_cumulative,
            "p05_cumulative": p05_cumulative,
            "p95_cumulative": p95_cumulative,
            "mean_profit_impacts": mean_profit_impacts
        }
    
    def optimize_mitigation_strategy(
        self,
        tariff_rate: float,
        strategy_costs: Dict[str, float],
        strategy_benefits: Dict[str, float],
        budget_constraint: float,
        min_improvement: float = 0.0
    ) -> Dict[str, Any]:
        """
        Optimize mitigation strategy given budget constraint
        
        Args:
            tariff_rate: Expected tariff rate
            strategy_costs: Dictionary of strategy costs
            strategy_benefits: Dictionary of strategy benefits (impact reduction)
            budget_constraint: Maximum budget available
            min_improvement: Minimum required improvement
            
        Returns:
            Dictionary with optimal strategy allocation
        """
        strategies = list(strategy_costs.keys())
        n_strategies = len(strategies)
        
        # Define objective function (negative because we're minimizing)
        def objective(x):
            total_benefit = 0.0
            for i, strategy in enumerate(strategies):
                # Apply diminishing returns
                benefit = strategy_benefits[strategy] * (1 - np.exp(-3 * x[i]))
                total_benefit += benefit
            return -total_benefit
        
        # Define budget constraint
        def budget_constraint(x):
            total_cost = sum(strategy_costs[strategies[i]] * x[i] for i in range(n_strategies))
            return budget_constraint - total_cost
        
        # Define minimum improvement constraint
        def improvement_constraint(x):
            total_benefit = 0.0
            for i, strategy in enumerate(strategies):
                benefit = strategy_benefits[strategy] * (1 - np.exp(-3 * x[i]))
                total_benefit += benefit
            return total_benefit - min_improvement
        
        # Initial guess - equal allocation
        initial_guess = np.ones(n_strategies) / n_strategies
        
        # Bounds - allocation must be between 0 and 1
        bounds = [(0, 1) for _ in range(n_strategies)]
        
        # Constraints
        constraints = [
            {'type': 'ineq', 'fun': budget_constraint},
            {'type': 'ineq', 'fun': improvement_constraint}
        ]
        
        # Sum to 1 constraint
        def sum_constraint(x):
            return 1.0 - np.sum(x)
        
        constraints.append({'type': 'eq', 'fun': sum_constraint})
        
        # Solve optimization problem
        result = minimize(
            objective,
            initial_guess,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints
        )
        
        # Process results
        optimal_allocation = result.x
        optimal_benefit = -result.fun
        
        # Calculate cost of optimal allocation
        optimal_cost = sum(strategy_costs[strategies[i]] * optimal_allocation[i] for i in range(n_strategies))
        
        # Create result dictionary
        allocation = {
            strategies[i]: float(optimal_allocation[i]) for i in range(n_strategies)
        }
        
        strategy_detail = {}
        for i, strategy in enumerate(strategies):
            strategy_detail[strategy] = {
                "allocation": float(optimal_allocation[i]),
                "cost": float(strategy_costs[strategy] * optimal_allocation[i]),
                "benefit": float(strategy_benefits[strategy] * (1 - np.exp(-3 * optimal_allocation[i])))
            }
        
        return {
            "optimal_allocation": allocation,
            "optimal_cost": float(optimal_cost),
            "optimal_benefit": float(optimal_benefit),
            "budget_utilized_pct": float(optimal_cost / budget_constraint * 100.0),
            "strategy_detail": strategy_detail,
            "success": result.success,
            "message": result.message
        }
    
    def calculate_risk_metrics(self, impacts: np.ndarray) -> Dict[str, float]:
        """
        Calculate financial risk metrics
        
        Args:
            impacts: Array of simulated financial impacts
            
        Returns:
            Dictionary with risk metrics
        """
        # Value at Risk (VaR)
        var_95 = float(np.percentile(impacts, 5))  # 5th percentile for 95% VaR
        var_99 = float(np.percentile(impacts, 1))  # 1st percentile for 99% VaR
        
        # Expected Shortfall (Conditional VaR)
        cvar_95 = float(np.mean(impacts[impacts <= var_95]))
        cvar_99 = float(np.mean(impacts[impacts <= var_99]))
        
        # Expected value and volatility
        expected_impact = float(np.mean(impacts))
        volatility = float(np.std(impacts))
        
        # Downside deviation (below expected value)
        downside_deviations = impacts[impacts < expected_impact] - expected_impact
        downside_deviation = float(np.sqrt(np.mean(downside_deviations**2))) if len(downside_deviations) > 0 else 0.0
        
        # Worst case (minimum impact)
        worst_case = float(np.min(impacts))
        
        # Best case (maximum impact)
        best_case = float(np.max(impacts))
        
        # Probability of significant loss (>10% of baseline profit)
        significant_loss_threshold = -0.1 * self.baseline_profit
        prob_significant_loss = float(np.mean(impacts < significant_loss_threshold))
        
        # Return metrics
        return {
            "expected_impact": expected_impact,
            "volatility": volatility,
            "var_95": var_95,
            "var_99": var_99,
            "cvar_95": cvar_95,
            "cvar_99": cvar_99,
            "downside_deviation": downside_deviation,
            "worst_case": worst_case,
            "best_case": best_case,
            "prob_significant_loss": prob_significant_loss
        }

class BlackScholesModel:
    """
    Black-Scholes option pricing model
    
    This model provides closed-form solutions for European option pricing,
    which can be used to model the value of flexibility in tariff scenarios.
    """
    
    @staticmethod
    def d1(S, K, T, r, sigma):
        """Calculate d1 term in Black-Scholes formula"""
        return (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    
    @staticmethod
    def d2(S, K, T, r, sigma):
        """Calculate d2 term in Black-Scholes formula"""
        return (np.log(S / K) + (r - 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    
    @staticmethod
    def call_price(S, K, T, r, sigma):
        """
        Calculate price of European call option
        
        Args:
            S: Current asset price
            K: Strike price
            T: Time to expiration (in years)
            r: Risk-free interest rate
            sigma: Volatility
            
        Returns:
            Call option price
        """
        d1 = BlackScholesModel.d1(S, K, T, r, sigma)
        d2 = BlackScholesModel.d2(S, K, T, r, sigma)
        
        return S * stats.norm.cdf(d1) - K * np.exp(-r * T) * stats.norm.cdf(d2)
    
    @staticmethod
    def put_price(S, K, T, r, sigma):
        """
        Calculate price of European put option
        
        Args:
            S: Current asset price
            K: Strike price
            T: Time to expiration (in years)
            r: Risk-free interest rate
            sigma: Volatility
            
        Returns:
            Put option price
        """
        d1 = BlackScholesModel.d1(S, K, T, r, sigma)
        d2 = BlackScholesModel.d2(S, K, T, r, sigma)
        
        return K * np.exp(-r * T) * stats.norm.cdf(-d2) - S * stats.norm.cdf(-d1)
    
    @staticmethod
    def value_of_flexibility(
        current_revenue: float,
        revenue_at_risk: float,
        time_horizon: float,
        volatility: float,
        risk_free_rate: float = 0.03,
        tariff_probability: float = 0.5
    ) -> float:
        """
        Value the flexibility to adapt to tariff risk
        
        This uses option pricing theory to value the flexibility to respond
        to tariff changes, treating it similarly to a put option.
        
        Args:
            current_revenue: Current annual revenue
            revenue_at_risk: Revenue exposed to tariff risk
            time_horizon: Time horizon for analysis (years)
            volatility: Volatility of revenue
            risk_free_rate: Risk-free interest rate
            tariff_probability: Probability of tariff implementation
            
        Returns:
            Value of flexibility (real option value)
        """
        # Treat this as a put option on revenue
        S = current_revenue  # Current revenue
        K = current_revenue - revenue_at_risk  # Revenue after tariff impact (strike price)
        T = time_horizon
        r = risk_free_rate
        sigma = volatility
        
        # Calculate put option value
        put_value = BlackScholesModel.put_price(S, K, T, r, sigma)
        
        # Adjust for probability of tariff implementation
        return put_value * tariff_probability
    
    @staticmethod
    def implied_volatility(
        option_price: float,
        S: float,
        K: float,
        T: float,
        r: float,
        option_type: str = "call"
    ) -> float:
        """
        Calculate implied volatility from option price
        
        Args:
            option_price: Market price of option
            S: Current asset price
            K: Strike price
            T: Time to expiration (in years)
            r: Risk-free interest rate
            option_type: Type of option ("call" or "put")
            
        Returns:
            Implied volatility
        """
        # Define objective function
        def objective(sigma):
            if option_type.lower() == "call":
                return BlackScholesModel.call_price(S, K, T, r, sigma) - option_price
            else:
                return BlackScholesModel.put_price(S, K, T, r, sigma) - option_price
        
        # Find root using bisection method
        sigma_low = 0.001
        sigma_high = 5.0
        
        while sigma_high - sigma_low > 0.00001:
            sigma_mid = (sigma_low + sigma_high) / 2
            if objective(sigma_mid) * objective(sigma_low) > 0:
                sigma_low = sigma_mid
            else:
                sigma_high = sigma_mid
        
        return (sigma_low + sigma_high) / 2

class HestonModel:
    """
    Heston stochastic volatility model
    
    This model extends Black-Scholes by allowing volatility to be stochastic,
    which can better capture market dynamics, especially during stress periods.
    """
    
    def __init__(
        self,
        initial_price: float,
        initial_variance: float,
        kappa: float,  # Mean reversion speed
        theta: float,  # Long-term variance
        sigma: float,  # Volatility of volatility
        rho: float,  # Correlation between price and volatility
        risk_free_rate: float = 0.03
    ):
        """
        Initialize Heston model parameters
        
        Args:
            initial_price: Initial asset price
            initial_variance: Initial variance (vol^2)
            kappa: Mean reversion speed
            theta: Long-term variance
            sigma: Volatility of variance
            rho: Correlation between price and volatility
            risk_free_rate: Risk-free interest rate
        """
        self.initial_price = initial_price
        self.initial_variance = initial_variance
        self.kappa = kappa
        self.theta = theta
        self.sigma = sigma
        self.rho = rho
        self.risk_free_rate = risk_free_rate
    
    def simulate_paths(
        self,
        time_horizon: float,
        num_steps: int,
        num_paths: int,
        antithetic: bool = True,
        return_vol: bool = False
    ) -> Union[np.ndarray, Tuple[np.ndarray, np.ndarray]]:
        """
        Simulate price paths using the Heston model
        
        Args:
            time_horizon: Time horizon for simulation (years)
            num_steps: Number of time steps
            num_paths: Number of paths to simulate
            antithetic: Whether to use antithetic variates for variance reduction
            return_vol: Whether to return volatility paths as well
            
        Returns:
            Array of price paths, and volatility paths if return_vol is True
        """
        dt = time_horizon / num_steps
        sqrt_dt = np.sqrt(dt)
        
        # Effective number of paths with antithetic sampling
        effective_paths = num_paths // 2 if antithetic else num_paths
        
        # Initialize arrays
        prices = np.zeros((num_paths, num_steps + 1))
        variances = np.zeros((num_paths, num_steps + 1))
        
        # Set initial values
        prices[:, 0] = self.initial_price
        variances[:, 0] = self.initial_variance
        
        # Generate correlated random numbers
        if antithetic:
            Z1 = np.random.normal(0, 1, (effective_paths, num_steps))
            Z2 = np.random.normal(0, 1, (effective_paths, num_steps))
            
            # Generate correlated second series
            Z2_corr = self.rho * Z1 + np.sqrt(1 - self.rho**2) * Z2
            
            # Add antithetic paths
            Z1_full = np.vstack((Z1, -Z1))
            Z2_full = np.vstack((Z2_corr, -Z2_corr))
        else:
            Z1 = np.random.normal(0, 1, (num_paths, num_steps))
            Z2 = np.random.normal(0, 1, (num_paths, num_steps))
            
            # Generate correlated second series
            Z2_full = self.rho * Z1 + np.sqrt(1 - self.rho**2) * Z2
            Z1_full = Z1
        
        # Simulate paths
        for i in range(num_steps):
            # Full truncation scheme to prevent negative variance
            sqrt_variance = np.sqrt(np.maximum(variances[:, i], 0))
            
            # Update prices
            prices[:, i+1] = prices[:, i] * np.exp(
                (self.risk_free_rate - 0.5 * variances[:, i]) * dt + 
                sqrt_variance * sqrt_dt * Z1_full[:, i]
            )
            
            # Update variances (using full truncation scheme)
            variances[:, i+1] = variances[:, i] + self.kappa * (
                self.theta - np.maximum(variances[:, i], 0)
            ) * dt + self.sigma * sqrt_variance * sqrt_dt * Z2_full[:, i]
            variances[:, i+1] = np.maximum(variances[:, i+1], 0)  # Ensure non-negative
        
        if return_vol:
            return prices, np.sqrt(variances)
        else:
            return prices
    
    def price_option(
        self,
        strike: float,
        time_to_expiry: float,
        option_type: str = "call",
        num_paths: int = 10000,
        num_steps: int = 100
    ) -> float:
        """
        Price an option using Monte Carlo simulation
        
        Args:
            strike: Option strike price
            time_to_expiry: Time to option expiry (years)
            option_type: Type of option ("call" or "put")
            num_paths: Number of simulation paths
            num_steps: Number of time steps
            
        Returns:
            Option price
        """
        # Simulate price paths
        paths = self.simulate_paths(time_to_expiry, num_steps, num_paths)
        
        # Calculate terminal prices
        terminal_prices = paths[:, -1]
        
        # Calculate payoffs
        if option_type.lower() == "call":
            payoffs = np.maximum(terminal_prices - strike, 0)
        else:
            payoffs = np.maximum(strike - terminal_prices, 0)
        
        # Discount payoffs
        discount_factor = np.exp(-self.risk_free_rate * time_to_expiry)
        
        # Return expected discounted payoff
        return discount_factor * np.mean(payoffs)

class JumpDiffusionModel:
    """
    Merton jump diffusion model
    
    This model extends the standard geometric Brownian motion by adding
    jumps, which can better model rare events like sudden tariff changes.
    """
    
    def __init__(
        self,
        initial_price: float,
        drift: float,
        volatility: float,
        jump_intensity: float,  # Expected number of jumps per year
        jump_mean: float,  # Mean of jump size
        jump_volatility: float  # Volatility of jump size
    ):
        """
        Initialize jump diffusion model parameters
        
        Args:
            initial_price: Initial asset price
            drift: Drift term (annual rate)
            volatility: Diffusion volatility (annual)
            jump_intensity: Expected number of jumps per year
            jump_mean: Mean of jump size
            jump_volatility: Volatility of jump size
        """
        self.initial_price = initial_price
        self.drift = drift
        self.volatility = volatility
        self.jump_intensity = jump_intensity
        self.jump_mean = jump_mean
        self.jump_volatility = jump_volatility
    
    def simulate_paths(
        self,
        time_horizon: float,
        num_steps: int,
        num_paths: int
    ) -> np.ndarray:
        """
        Simulate price paths with jumps
        
        Args:
            time_horizon: Time horizon for simulation (years)
            num_steps: Number of time steps
            num_paths: Number of paths to simulate
            
        Returns:
            Array of price paths
        """
        dt = time_horizon / num_steps
        sqrt_dt = np.sqrt(dt)
        
        # Initialize array
        prices = np.zeros((num_paths, num_steps + 1))
        prices[:, 0] = self.initial_price
        
        # Simulate paths
        for i in range(num_steps):
            # Generate normal random numbers for diffusion
            Z = np.random.normal(0, 1, num_paths)
            
            # Generate Poisson random numbers for jump counts
            jump_counts = np.random.poisson(self.jump_intensity * dt, num_paths)
            
            # Generate jump sizes (if any)
            jumps = np.zeros(num_paths)
            for j in range(num_paths):
                if jump_counts[j] > 0:
                    # Generate jump sizes from lognormal distribution
                    jump_sizes = np.random.lognormal(
                        mean=self.jump_mean,
                        sigma=self.jump_volatility,
                        size=jump_counts[j]
                    )
                    
                    # Combine jumps (multiplicative)
                    jumps[j] = np.prod(jump_sizes) - 1
            
            # Update prices with both diffusion and jumps
            prices[:, i+1] = prices[:, i] * (
                1 + self.drift * dt + self.volatility * sqrt_dt * Z + jumps
            )
        
        return prices
    
    def price_option(
        self,
        strike: float,
        time_to_expiry: float,
        option_type: str = "call",
        num_paths: int = 10000,
        num_steps: int = 100
    ) -> float:
        """
        Price an option using Monte Carlo simulation
        
        Args:
            strike: Option strike price
            time_to_expiry: Time to option expiry (years)
            option_type: Type of option ("call" or "put")
            num_paths: Number of simulation paths
            num_steps: Number of time steps
            
        Returns:
            Option price
        """
        # Simulate price paths
        paths = self.simulate_paths(time_to_expiry, num_steps, num_paths)
        
        # Calculate terminal prices
        terminal_prices = paths[:, -1]
        
        # Calculate payoffs
        if option_type.lower() == "call":
            payoffs = np.maximum(terminal_prices - strike, 0)
        else:
            payoffs = np.maximum(strike - terminal_prices, 0)
        
        # Discount payoffs (using risk-free rate for simplicity)
        risk_free_rate = self.drift  # Approximate
        discount_factor = np.exp(-risk_free_rate * time_to_expiry)
        
        # Return expected discounted payoff
        return discount_factor * np.mean(payoffs)
    
    def calibrate_to_market(
        self,
        market_prices: Dict[str, float],
        strikes: Dict[str, float],
        expiries: Dict[str, float],
        option_types: Dict[str, str]
    ) -> Dict[str, float]:
        """
        Calibrate model parameters to match market prices
        
        Args:
            market_prices: Dictionary of market prices by option ID
            strikes: Dictionary of strikes by option ID
            expiries: Dictionary of expiry times by option ID
            option_types: Dictionary of option types by option ID
            
        Returns:
            Dictionary of calibrated parameters
        """
        # Define objective function for calibration
        def objective(params):
            # Extract parameters
            volatility, jump_intensity, jump_mean, jump_volatility = params
            
            # Create model with these parameters
            model = JumpDiffusionModel(
                initial_price=self.initial_price,
                drift=self.drift,
                volatility=volatility,
                jump_intensity=jump_intensity,
                jump_mean=jump_mean,
                jump_volatility=jump_volatility
            )
            
            # Calculate model prices
            model_prices = {}
            for option_id in market_prices.keys():
                model_prices[option_id] = model.price_option(
                    strike=strikes[option_id],
                    time_to_expiry=expiries[option_id],
                    option_type=option_types[option_id],
                    num_paths=1000,  # Reduced for speed in calibration
                    num_steps=50
                )
            
            # Calculate sum of squared errors
            sse = 0.0
            for option_id, market_price in market_prices.items():
                sse += (model_prices[option_id] - market_price) ** 2
            
            return sse
        
        # Initial parameter guess
        initial_guess = [
            self.volatility,
            self.jump_intensity,
            self.jump_mean,
            self.jump_volatility
        ]
        
        # Parameter bounds
        bounds = [
            (0.01, 1.0),    # volatility
            (0.1, 10.0),    # jump_intensity
            (-0.5, 0.5),    # jump_mean
            (0.01, 0.5)     # jump_volatility
        ]
        
        # Perform calibration
        result = minimize(
            objective,
            initial_guess,
            method='L-BFGS-B',
            bounds=bounds
        )
        
        # Extract calibrated parameters
        volatility, jump_intensity, jump_mean, jump_volatility = result.x
        
        # Return calibrated parameters
        return {
            "volatility": float(volatility),
            "jump_intensity": float(jump_intensity),
            "jump_mean": float(jump_mean),
            "jump_volatility": float(jump_volatility),
            "calibration_error": float(result.fun)
        }

class CopulaModel:
    """
    Copula model for multivariate dependency modeling
    
    This model allows for sophisticated modeling of dependencies
    between different risk factors, beyond simple correlation.
    """
    
    def __init__(self, dimensions: int, copula_type: str = "gaussian"):
        """
        Initialize copula model
        
        Args:
            dimensions: Number of dimensions (risk factors)
            copula_type: Type of copula ("gaussian" or "t")
        """
        self.dimensions = dimensions
        self.copula_type = copula_type
        
        # Default correlation matrix is identity
        self.correlation = np.eye(dimensions)
        
        # Additional parameter for t-copula
        self.df = 3  # Degrees of freedom
    
    def set_correlation(self, correlation_matrix: np.ndarray) -> None:
        """
        Set correlation matrix
        
        Args:
            correlation_matrix: Correlation matrix (d x d)
        """
        if correlation_matrix.shape != (self.dimensions, self.dimensions):
            raise ValueError(f"Correlation matrix must be {self.dimensions}x{self.dimensions}")
        
        self.correlation = correlation_matrix
    
    def set_degrees_of_freedom(self, df: int) -> None:
        """
        Set degrees of freedom for t-copula
        
        Args:
            df: Degrees of freedom (must be > 2)
        """
        if df <= 2:
            raise ValueError("Degrees of freedom must be > 2")
        
        self.df = df
    
    def _gaussian_copula_rvs(self, size: int) -> np.ndarray:
        """Generate random variates from Gaussian copula"""
        # Generate multivariate normal samples
        Z = np.random.multivariate_normal(
            mean=np.zeros(self.dimensions),
            cov=self.correlation,
            size=size
        )
        
        # Transform to uniform margins
        U = stats.norm.cdf(Z)
        
        return U
    
    def _t_copula_rvs(self, size: int) -> np.ndarray:
        """Generate random variates from t-copula"""
        # Generate multivariate normal samples
        Z = np.random.multivariate_normal(
            mean=np.zeros(self.dimensions),
            cov=self.correlation,
            size=size
        )
        
        # Generate chi-square random variable
        W = np.random.chisquare(df=self.df, size=size) / self.df
        
        # Apply t-copula transformation
        T = Z / np.sqrt(W)[:, np.newaxis]
        
        # Transform to uniform margins
        U = stats.t.cdf(T, df=self.df)
        
        return U
    
    def generate_samples(self, size: int) -> np.ndarray:
        """
        Generate samples from the copula
        
        Args:
            size: Number of samples to generate
            
        Returns:
            Array of samples from the copula with uniform margins
        """
        if self.copula_type.lower() == "gaussian":
            return self._gaussian_copula_rvs(size)
        elif self.copula_type.lower() == "t":
            return self._t_copula_rvs(size)
        else:
            raise ValueError(f"Unsupported copula type: {self.copula_type}")
    
    def transform_to_marginals(
        self,
        uniform_samples: np.ndarray,
        distributions: List[str],
        parameters: List[Dict[str, Any]]
    ) -> np.ndarray:
        """
        Transform uniform samples to specified marginal distributions
        
        Args:
            uniform_samples: Samples from copula with uniform margins
            distributions: List of distribution types
            parameters: List of distribution parameters
            
        Returns:
            Samples with specified marginal distributions
        """
        if len(distributions) != self.dimensions or len(parameters) != self.dimensions:
            raise ValueError("Must provide distribution info for each dimension")
        
        result = np.zeros_like(uniform_samples)
        
        for i in range(self.dimensions):
            dist_type = distributions[i]
            params = parameters[i]
            
            if dist_type == "normal":
                mu = params.get("mu", 0.0)
                sigma = params.get("sigma", 1.0)
                result[:, i] = stats.norm.ppf(uniform_samples[:, i], loc=mu, scale=sigma)
                
            elif dist_type == "lognormal":
                mu = params.get("mu", 0.0)
                sigma = params.get("sigma", 1.0)
                result[:, i] = stats.lognorm.ppf(uniform_samples[:, i], s=sigma, scale=np.exp(mu))
                
            elif dist_type == "exponential":
                scale = params.get("scale", 1.0)
                result[:, i] = stats.expon.ppf(uniform_samples[:, i], scale=scale)
                
            elif dist_type == "gamma":
                shape = params.get("shape", 1.0)
                scale = params.get("scale", 1.0)
                result[:, i] = stats.gamma.ppf(uniform_samples[:, i], a=shape, scale=scale)
                
            elif dist_type == "beta":
                alpha = params.get("alpha", 1.0)
                beta = params.get("beta", 1.0)
                result[:, i] = stats.beta.ppf(uniform_samples[:, i], a=alpha, b=beta)
                
            elif dist_type == "uniform":
                a = params.get("a", 0.0)
                b = params.get("b", 1.0)
                result[:, i] = a + (b - a) * uniform_samples[:, i]
                
            else:
                # Default to standard normal
                result[:, i] = stats.norm.ppf(uniform_samples[:, i])
        
        return result
    
    def fit_to_data(self, data: np.ndarray) -> None:
        """
        Fit copula to observed data
        
        Args:
            data: Observed data array (n x d)
        """
        # Convert to uniform margins using empirical CDF
        uniform_data = np.zeros_like(data)
        
        for i in range(self.dimensions):
            # Rank transform
            ranks = stats.rankdata(data[:, i])
            uniform_data[:, i] = ranks / (len(ranks) + 1)
        
        # Convert to normal scores
        normal_scores = stats.norm.ppf(uniform_data)
        
        # Estimate correlation matrix
        self.correlation = np.corrcoef(normal_scores, rowvar=False)
        
        # Estimate degrees of freedom for t-copula
        if self.copula_type.lower() == "t":
            # Simple moment-based estimator
            # (This is a heuristic approach; more sophisticated methods exist)
            kurtosis = np.mean([stats.kurtosis(normal_scores[:, i]) for i in range(self.dimensions)])
            self.df = max(3, int(6 / kurtosis + 4))

# Example usage
if __name__ == "__main__":
    # Example tariff impact model
    print("\n=== Tariff Impact Model Example ===\n")
    
    # Create tariff model
    model = TariffModel(
        baseline_revenue=60000000000,  # $60B revenue
        baseline_costs=51000000000,    # $51B costs
        us_export_percentage=35.0      # 35% of revenue from US
    )
    
    # Calculate impact for a single scenario
    impact = model.calculate_impact(
        tariff_rate=46.0,              # 46% tariff
        negotiation_success=False,     # No negotiation success
        market_adaptability=0.5,       # Moderate adaptability
        competitor_response=0.7,       # Strong competitor response
        alternative_market_growth=0.3  # Some alternative market growth
    )
    
    # Print results
    print("Single Scenario Impact:")
    print(f"Total Financial Impact: ${impact['total_financial_impact']/1000000000:.2f}B")
    print(f"Direct Tariff Costs: ${-impact['direct_tariff_costs']/1000000000:.2f}B")
    print(f"Impact as % of Revenue: {impact['percentage_impact']:.2f}%")
    print(f"Impact as % of Profit: {impact['profit_impact_percentage']:.2f}%")
    
    # Run multi-period simulation
    print("\nMulti-Period Simulation:")
    
    # Define parameters for simulation
    tariff_rates = np.array([46.0, 40.0, 35.0, 30.0, 30.0])  # Declining tariff rates
    negotiation_probs = np.array([0.1, 0.2, 0.3, 0.4, 0.5])  # Increasing negotiation success
    
    # Run simulation
    results = model.run_multi_period_simulation(
        tariff_rates=tariff_rates,
        market_adaptability_growth=0.1,
        base_market_adaptability=0.3,
        negotiation_probs=negotiation_probs,
        initial_competitor_response=0.5,
        competitor_learning_rate=0.1,
        alternative_market_growth_rate=0.05,
        periods=5,
        num_simulations=1000,
        scenario=MarketScenario.BASE
    )
    
    # Print results
    print("Cumulative Impact by Period (Mean, 5%-95% CI):")
    for i in range(5):
        mean = results["mean_cumulative"][i] / 1000000000  # Convert to billions
        p05 = results["p05_cumulative"][i] / 1000000000
        p95 = results["p95_cumulative"][i] / 1000000000
        print(f"Period {i+1}: ${mean:.2f}B (${p05:.2f}B to ${p95:.2f}B)")
    
    # Calculate risk metrics
    impacts = results["total_impacts"][:, 0]  # First period impacts
    
    risk_metrics = model.calculate_risk_metrics(impacts)
    
    # Print risk metrics
    print("\nRisk Metrics for First Period:")
    print(f"Expected Impact: ${risk_metrics['expected_impact']/1000000000:.2f}B")
    print(f"95% VaR: ${-risk_metrics['var_95']/1000000000:.2f}B")
    print(f"99% VaR: ${-risk_metrics['var_99']/1000000000:.2f}B")
    print(f"95% CVaR: ${-risk_metrics['cvar_95']/1000000000:.2f}B")
    print(f"Worst Case: ${risk_metrics['worst_case']/1000000000:.2f}B")
    print(f"Probability of Significant Loss: {risk_metrics['prob_significant_loss']*100:.1f}%")
    
    # Example using Black-Scholes to value flexibility
    print("\n=== Black-Scholes Flexibility Valuation ===\n")
    
    # Value of flexibility
    flexibility_value = BlackScholesModel.value_of_flexibility(
        current_revenue=60000000000,
        revenue_at_risk=21000000000,
        time_horizon=1.0,
        volatility=0.3,
        risk_free_rate=0.03,
        tariff_probability=0.8
    )
    
    print(f"Value of Flexibility: ${flexibility_value/1000000:.2f}M")
    
    # Example using Heston model for stochastic volatility
    print("\n=== Heston Model Simulation ===\n")
    
    # Create Heston model
    heston = HestonModel(
        initial_price=60000000000,  # $60B initial revenue
        initial_variance=0.09,      # 30% initial volatility
        kappa=2.0,                  # Mean reversion speed
        theta=0.04,                 # Long-term variance (20% vol)
        sigma=0.3,                  # Volatility of volatility
        rho=-0.7,                   # Negative correlation (volatility increases when price falls)
        risk_free_rate=0.03
    )
    
    # Generate paths
    paths, vols = heston.simulate_paths(
        time_horizon=2.0,
        num_steps=100,
        num_paths=5,
        return_vol=True
    )
    
    # Print sample paths
    print("Sample Revenue Paths (in $B):")
    for i in range(5):
        path = paths[i, [0, 25, 50, 75, 100]] / 1000000000  # Convert to billions
        print(f"Path {i+1}: {path[0]:.1f} -> {path[1]:.1f} -> {path[2]:.1f} -> {path[3]:.1f} -> {path[4]:.1f}")
    
    # Price option using Heston model
    option_price = heston.price_option(
        strike=50000000000,  # $50B strike
        time_to_expiry=1.0,
        option_type="put",
        num_paths=10000
    )
    
    print(f"\nHeston Put Option Price: ${option_price/1000000:.2f}M")
    
    print("\nDemo complete!")