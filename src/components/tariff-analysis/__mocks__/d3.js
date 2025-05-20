// Manual mock for d3
const d3 = {
  select: jest.fn().mockReturnValue({
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnThis(),
    enter: jest.fn().mockReturnThis(),
    exit: jest.fn().mockReturnThis(),
    remove: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    html: jest.fn().mockReturnThis(),
    classed: jest.fn().mockReturnThis(),
    transition: jest.fn().mockReturnThis(),
    duration: jest.fn().mockReturnThis(),
    node: jest.fn().mockReturnValue(document.createElement('div')),
  }),
  selectAll: jest.fn().mockReturnValue({
    data: jest.fn().mockReturnThis(),
    enter: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    exit: jest.fn().mockReturnThis(),
    remove: jest.fn().mockReturnThis(),
    merge: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  }),
  hierarchy: jest.fn().mockReturnValue({
    descendants: jest.fn().mockReturnValue([]),
    links: jest.fn().mockReturnValue([]),
    each: jest.fn(),
    sum: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
  }),
  tree: jest.fn().mockImplementation(() => {
    return {
      size: jest.fn().mockReturnThis(),
      separation: jest.fn().mockReturnThis(),
      call: jest.fn().mockImplementation((root) => root)
    };
  }),
  cluster: jest.fn().mockImplementation(() => {
    return {
      size: jest.fn().mockReturnThis(),
      separation: jest.fn().mockReturnThis(),
      call: jest.fn().mockImplementation((root) => root)
    };
  }),
  zoom: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    transform: jest.fn(),
    translateBy: jest.fn(),
    scaleBy: jest.fn(),
  }),
  // Scale functions
  scaleOrdinal: jest.fn().mockReturnValue(() => '#cccccc'),
  scaleLinear: jest.fn().mockReturnValue(() => 1),
  scaleSequential: jest.fn().mockImplementation(() => {
    return {
      domain: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      copy: jest.fn().mockReturnThis(),
      clamp: jest.fn().mockReturnThis(),
      call: jest.fn().mockReturnValue('#36c'),
    };
  }),
  scaleDiverging: jest.fn().mockImplementation(() => {
    return {
      domain: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      copy: jest.fn().mockReturnThis(),
      clamp: jest.fn().mockReturnThis(),
      call: jest.fn().mockReturnValue('#c63'),
    };
  }),
  // Color scales and interpolators
  interpolateViridis: jest.fn().mockReturnValue('#36c'),
  interpolateInferno: jest.fn().mockReturnValue('#c63'),
  interpolatePlasma: jest.fn().mockReturnValue('#6c3'),
  interpolateRdYlGn: jest.fn().mockReturnValue('#6c3'),
  interpolateBuPu: jest.fn().mockReturnValue('#63c'),
  interpolateRainbow: jest.fn().mockReturnValue('#36c'),
  // Category schemes
  schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
  schemePaired: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
  schemeSet3: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
  // Zoom
  zoomIdentity: {
    translate: jest.fn().mockReturnThis(),
    scale: jest.fn().mockReturnThis(),
    x: 0,
    y: 0,
    k: 1,
  },
  // Links
  linkHorizontal: jest.fn().mockReturnValue(() => 'M0,0L10,10'),
  linkRadial: jest.fn().mockReturnValue(() => 'M0,0L10,10'),
  linkVertical: jest.fn().mockReturnValue(() => 'M0,0L10,10'),
  // Colors
  color: jest.fn().mockReturnValue({
    darker: jest.fn().mockReturnValue('#000000'),
    brighter: jest.fn().mockReturnValue('#ffffff'),
  }),
  rgb: jest.fn().mockReturnValue({
    darker: jest.fn().mockReturnValue('#000000'),
    brighter: jest.fn().mockReturnValue('#ffffff'),
    formatHex: jest.fn().mockReturnValue('#36c'),
  }),
  hsl: jest.fn().mockReturnValue({
    darker: jest.fn().mockReturnValue('#000000'),
    brighter: jest.fn().mockReturnValue('#ffffff'),
    formatHex: jest.fn().mockReturnValue('#36c'),
  }),
  // Patterns
  symbol: jest.fn(),
  symbolCircle: {},
  symbolCross: {},
  symbolDiamond: {},
  symbolSquare: {},
  symbolStar: {},
  symbolTriangle: {},
  symbolWye: {},
  // Events
  event: null,
  mouse: jest.fn().mockReturnValue([0, 0]),
};

module.exports = d3;
