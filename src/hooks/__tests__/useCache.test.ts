import { renderHook, act } from '@testing-library/react-hooks';
import '@testing-library/jest-dom';
import useCache from '../useCache';

describe('useCache Hook', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: jest.fn((key: string) => { delete store[key]; }),
      clear: jest.fn(() => { store = {}; }),
      store
    };
  })();

  // Mock sessionStorage
  const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: jest.fn((key: string) => { delete store[key]; }),
      clear: jest.fn(() => { store = {}; }),
      store
    };
  })();

  beforeEach(() => {
    // Clear storage mocks
    localStorageMock.clear();
    sessionStorageMock.clear();
    
    // Reset jest mocks
    jest.clearAllMocks();
    
    // Setup storage mocks
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
    
    // Mock Date.now() to control time
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns initial loading state', () => {
    const fetchData = jest.fn().mockResolvedValue({ data: 'test' });
    
    const { result } = renderHook(() => useCache('test-key', fetchData));
    
    // Initial state should be [null, loading, null, fetchFunction]
    expect(result.current[0]).toBeNull(); // data
    expect(result.current[1]).toBeTruthy(); // loading
    expect(result.current[2]).toBeNull(); // error
    expect(typeof result.current[3]).toBe('function'); // fetchAndCache function
  });

  test('fetches and caches data', async () => {
    const testData = { name: 'test', value: 123 };
    const fetchData = jest.fn().mockResolvedValue(testData);
    
    const { result, waitForNextUpdate } = renderHook(() => useCache('test-key', fetchData));
    
    // Wait for initial data fetch to complete
    await waitForNextUpdate();
    
    // Check that fetchData was called
    expect(fetchData).toHaveBeenCalledTimes(1);
    
    // Check that the result now has the data
    expect(result.current[0]).toEqual(testData);
    expect(result.current[1]).toBeFalsy(); // loading should be false
    
    // Check that the data was stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalled();
    const cachedData = JSON.parse(localStorageMock.store['perplexity_cache:test-key']);
    expect(cachedData.data).toEqual(testData);
  });

  test('returns cached data without fetching again', async () => {
    const testData = { name: 'cached', value: 456 };
    
    // Manually put data in localStorage
    const cachedEntry = {
      data: testData,
      timestamp: Date.now(),
      expiry: Date.now() + 60000 // 1 minute in the future
    };
    localStorageMock.setItem('perplexity_cache:cached-key', JSON.stringify(cachedEntry));
    
    // Mock fetchData but it should not be called
    const fetchData = jest.fn().mockResolvedValue({ name: 'fresh', value: 789 });
    
    const { result, waitForNextUpdate } = renderHook(() => useCache('cached-key', fetchData));
    
    // Wait for hook to process
    await waitForNextUpdate();
    
    // The fetch function should not have been called
    expect(fetchData).not.toHaveBeenCalled();
    
    // The result should be the cached data
    expect(result.current[0]).toEqual(testData);
  });

  test('forces fresh data when forceFresh is true', async () => {
    const cachedData = { name: 'cached', value: 456 };
    const freshData = { name: 'fresh', value: 789 };
    
    // Manually put data in localStorage
    const cachedEntry = {
      data: cachedData,
      timestamp: Date.now(),
      expiry: Date.now() + 60000 // 1 minute in the future
    };
    localStorageMock.setItem('perplexity_cache:force-fresh-key', JSON.stringify(cachedEntry));
    
    // Mock fetchData to return fresh data
    const fetchData = jest.fn().mockResolvedValue(freshData);
    
    const { result, waitForNextUpdate } = renderHook(() => useCache('force-fresh-key', fetchData));
    
    // Wait for hook to initialize
    await waitForNextUpdate();
    
    // Initial data should be the cached value
    expect(result.current[0]).toEqual(cachedData);
    
    // Call the fetch function with forceFresh = true
    act(() => {
      result.current[3](true);
    });
    
    // Wait for the forced fetch to complete
    await waitForNextUpdate();
    
    // The fetch function should have been called
    expect(fetchData).toHaveBeenCalledTimes(1);
    
    // The result should now be the fresh data
    expect(result.current[0]).toEqual(freshData);
  });

  test('handles fetch errors correctly', async () => {
    const testError = new Error('Fetch failed');
    const fetchData = jest.fn().mockRejectedValue(testError);
    
    const { result, waitForNextUpdate } = renderHook(() => useCache('error-key', fetchData));
    
    // Wait for the fetch to fail
    await waitForNextUpdate();
    
    // The result should have the error
    expect(result.current[2]).toEqual(testError);
    expect(result.current[0]).toBeNull(); // data should be null
    expect(result.current[1]).toBeFalsy(); // loading should be false
  });

  test('respects TTL for cached data', async () => {
    const testData = { name: 'expired', value: 999 };
    const freshData = { name: 'fresh', value: 111 };
    
    // Manually put expired data in localStorage
    const expiredEntry = {
      data: testData,
      timestamp: Date.now() - 60000, // 1 minute in the past
      expiry: Date.now() - 10000 // 10 seconds in the past
    };
    localStorageMock.setItem('perplexity_cache:ttl-key', JSON.stringify(expiredEntry));
    
    // Mock fetchData to return fresh data
    const fetchData = jest.fn().mockResolvedValue(freshData);
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useCache('ttl-key', fetchData, { ttl: 30000 }) // 30 second TTL
    );
    
    // Wait for hook to fetch fresh data
    await waitForNextUpdate();
    
    // The fetch function should have been called because cache was expired
    expect(fetchData).toHaveBeenCalledTimes(1);
    
    // The result should be the fresh data
    expect(result.current[0]).toEqual(freshData);
    
    // Check that the new data was stored with the correct TTL
    const newCachedData = JSON.parse(localStorageMock.store['perplexity_cache:ttl-key']);
    expect(newCachedData.expiry).toBe(Date.now() + 30000);
  });

  test('uses sessionStorage when specified', async () => {
    const testData = { name: 'session', value: 222 };
    const fetchData = jest.fn().mockResolvedValue(testData);
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useCache('session-key', fetchData, { storage: 'sessionStorage' })
    );
    
    // Wait for initial data fetch to complete
    await waitForNextUpdate();
    
    // Check that the data was stored in sessionStorage, not localStorage
    expect(sessionStorageMock.setItem).toHaveBeenCalled();
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    
    const cachedData = JSON.parse(sessionStorageMock.store['perplexity_cache:session-key']);
    expect(cachedData.data).toEqual(testData);
  });

  test('uses custom namespace', async () => {
    const testData = { name: 'namespaced', value: 333 };
    const fetchData = jest.fn().mockResolvedValue(testData);
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useCache('custom-key', fetchData, { namespace: 'custom_namespace' })
    );
    
    // Wait for initial data fetch to complete
    await waitForNextUpdate();
    
    // Check that the data was stored with the custom namespace
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'custom_namespace:custom-key',
      expect.any(String)
    );
  });
});