// setupMocks.ts - Setup mocks for D3 and related dependencies
import d3Mock from '../__mocks__/d3-mock';

// Make sure d3 and related modules are mocked
jest.mock('d3', () => d3Mock);
jest.mock('d3-zoom', () => ({
  zoom: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    transform: jest.fn(),
    translateBy: jest.fn(),
    scaleBy: jest.fn(),
  }),
  zoomIdentity: {
    translate: jest.fn().mockReturnThis(),
    scale: jest.fn().mockReturnThis(),
    x: 0,
    y: 0,
    k: 1,
  }
}));

// Mock ResizeObserver
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

window.ResizeObserver = ResizeObserverMock;

// Mock MutationObserver
class MutationObserverMock {
  observe = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn();
}

window.MutationObserver = MutationObserverMock;
