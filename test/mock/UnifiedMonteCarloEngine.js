/**
 * Mock for UnifiedMonteCarloEngine
 */
class UnifiedMonteCarloEngine {
  constructor() {
    this.runSimulation = jest.fn().mockResolvedValue({
      iterations: 5000,
      results: {
        mean: 0.15,
        median: 0.12,
        percentiles: {
          25: 0.05,
          75: 0.25,
          95: 0.45
        },
        distribution: [
          { value: 0.05, frequency: 500 },
          { value: 0.15, frequency: 3000 },
          { value: 0.25, frequency: 1500 }
        ]
      }
    });
  }
}

module.exports = {
  UnifiedMonteCarloEngine
};
