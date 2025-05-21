const fetch = require('node-fetch');

async function testPerplexityAPI(key) {
  console.log(`Testing Perplexity API with key: ${key.substring(0, 10)}...`);
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: 'Hello, are you working?' }],
        temperature: 0.2,
        max_tokens: 100
      })
    });
    
    const status = response.status;
    console.log(`Status code: ${status}`);
    
    if (status === 200) {
      const data = await response.json();
      console.log('✅ SUCCESS! API response:', data.choices[0].message.content);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ ERROR response:', error);
      return false;
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
    return false;
  }
}

async function main() {
  // This is the key from vercel.json
  const vercelApiKey = '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';
  console.log('Testing Vercel API key:');
  await testPerplexityAPI(vercelApiKey);
}

main().catch(console.error);
