export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    // Register service worker
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
        
        // Check if registration is still valid before using it
        if (!registration || registration.unregistered) {
          console.warn('Service Worker registration is no longer valid');
          return;
        }

        // Check for updates periodically
        setInterval(() => {
          try {
            if (registration && !registration.unregistered) {
              registration.update();
            }
          } catch (error) {
            console.error('Error updating service worker:', error);
          }
        }, 60000); // Check every minute

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              const updateBanner = document.createElement('div');
              updateBanner.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-50';
              updateBanner.innerHTML = `
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    A new version is available!
                  </p>
                  <button 
                    onclick="window.location.reload()" 
                    class="ml-4 px-3 py-1 bg-primary-500 text-white text-sm font-medium rounded hover:bg-primary-600"
                  >
                    Update
                  </button>
                </div>
              `;
              document.body.appendChild(updateBanner);

              // Auto-dismiss after 10 seconds
              setTimeout(() => {
                updateBanner.remove();
              }, 10000);
            }
          });
        });
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });

    // Handle offline/online events
    let wasOffline = !navigator.onLine;

    window.addEventListener('online', () => {
      if (wasOffline) {
        // Show notification that we're back online
        showNotification('Back online', 'success');
        
        // Trigger background sync
        navigator.serviceWorker.ready.then((registration) => {
          if ('sync' in registration) {
            registration.sync.register('sync-data');
          }
        }).catch(error => {
          console.error('Service worker not ready:', error);
        });
      }
      wasOffline = false;
    });

    window.addEventListener('offline', () => {
      wasOffline = true;
      showNotification('You are offline. Some features may be limited.', 'warning');
    });
  });
}

function showNotification(message: string, type: 'success' | 'warning' | 'error' = 'success') {
  const notification = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' :
                  type === 'warning' ? 'bg-yellow-500' : 'bg-red-500';
  
  notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-in-right`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('animate-slide-out-right');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Request persistent storage
export async function requestPersistentStorage() {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    const isPersisted = await navigator.storage.persist();
    console.log(`Persistent storage ${isPersisted ? 'granted' : 'denied'}`);
  }
}

// Get storage estimate
export async function getStorageEstimate() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage || 0) / (estimate.quota || 1) * 100;
    
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentUsed: Math.round(percentUsed),
    };
  }
  
  return null;
}