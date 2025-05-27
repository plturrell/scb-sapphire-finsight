// Simple test to verify app functionality
console.log('Testing FinSight Desktop functionality...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, testing...');
  
  // Test 1: Check if electronAPI is available
  if (window.electronAPI) {
    console.log('✅ electronAPI is available');
    
    // Test 2: Check git command
    window.electronAPI.gitCommand('branch')
      .then(result => {
        console.log('✅ Git command works:', result);
      })
      .catch(error => {
        console.error('❌ Git command failed:', error);
      });
      
    // Test 3: Check switch branch
    setTimeout(() => {
      if (window.app && window.app.switchToBranch) {
        console.log('✅ switchToBranch method exists');
      } else {
        console.error('❌ switchToBranch method not found');
      }
      
      // Test 4: Check launch Claude
      if (window.app && window.app.launchClaudeCode) {
        console.log('✅ launchClaudeCode method exists');
      } else {
        console.error('❌ launchClaudeCode method not found');
      }
    }, 2000);
    
  } else {
    console.error('❌ electronAPI not available');
  }
});