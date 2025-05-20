// Mock for d3-zoom
const d3Zoom = {
  zoom: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    transform: jest.fn(),
    translateBy: jest.fn(),
    scaleBy: jest.fn(),
    filter: jest.fn().mockReturnThis(),
    wheelDelta: jest.fn().mockReturnThis(),
    extent: jest.fn().mockReturnThis(),
    scaleExtent: jest.fn().mockReturnThis(),
  }),
  zoomIdentity: {
    translate: jest.fn().mockReturnThis(),
    scale: jest.fn().mockReturnThis(),
    x: 0,
    y: 0,
    k: 1,
  }
};

module.exports = d3Zoom;
