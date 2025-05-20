/**
 * Custom Jest resolver to handle missing modules during testing
 */
module.exports = (path, options) => {
  // Special handling for certain modules
  const mockedModules = {
    // Mock the monte-carlo engine directory
    '../monte-carlo/UnifiedMonteCarloEngine': './mock/UnifiedMonteCarloEngine.js',
    './SimulationTreeVisualization': '../test/mock/SimulationTreeVisualization.js',
    '../TariffImpactHeatmapVisualization': '../test/mock/TariffImpactHeatmapVisualization.js',
    '../../common/ModelCitationPanel': '../test/mock/ModelCitationPanel.js'
  };

  // If this is a path we want to mock, return the mock path
  if (mockedModules[path]) {
    return options.defaultResolver(
      mockedModules[path], 
      {
        ...options,
        // Tell jest about our mock
        basedir: __dirname
      }
    );
  }

  // Otherwise use the default resolver
  return options.defaultResolver(path, options);
};
