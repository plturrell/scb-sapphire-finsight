/*
 * Grok3 API Integration for FinSight Desktop
 * LLM-powered git analysis and intelligent task generation
 */

class GrokAPI {
  constructor() {
    this.apiKey = process.env.GROK_API_KEY || 'xai-1fe6hRBf8zz7bP8tC0ggI9ywIgujIwtkUDvvMH8F9W7SGTT7RHxXHX2yHWuW3pSI63MAcApiC5p7fWky';
    this.baseURL = 'https://api.x.ai/v1';
    this.model = 'grok-3-latest';
  }

  async analyzeGitChanges(branchName, changedFiles, lastCommit) {
    try {
      // Limit input to prevent token overflow
      const maxFiles = 20;
      const limitedFiles = changedFiles ? changedFiles.slice(0, maxFiles) : [];
      const fileCount = changedFiles ? changedFiles.length : 0;
      
      const prompt = `
Analyze this git branch for a financial technology project:

Branch: ${branchName}
Last Commit: ${lastCommit ? lastCommit.substring(0, 100) : 'Unknown'}
Changed Files (${fileCount} total, showing first ${Math.min(fileCount, maxFiles)}): ${limitedFiles.join(', ')}

Provide brief analysis in JSON format with keys: analysis, todos, risk, timeEstimate
Keep response under 200 words total.
`;

      const response = await this.makeRequest('chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert software engineer analyzing git changes for a financial technology project. Provide concise, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0,
        stream: false
      });

      return this.parseGrokResponse(response);
    } catch (error) {
      console.error('Grok API error:', error);
      return this.getFallbackAnalysis(branchName, changedFiles);
    }
  }

  async generateCommitMessage(changedFiles, diffSummary) {
    try {
      const prompt = `
Generate a concise git commit message for these changes in a financial technology project:

Changed Files: ${changedFiles.join(', ')}
Diff Summary: ${diffSummary}

Rules:
- Start with verb (Add, Update, Fix, Remove, etc.)
- Max 50 characters for title
- Be specific about what changed
- Use present tense

Example: "Add real-time branch analysis with Grok3 integration"
`;

      const response = await this.makeRequest('chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing clear, concise git commit messages for financial technology projects.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0,
        stream: false
      });

      return response.choices[0]?.message?.content?.trim() || 'Update project files';
    } catch (error) {
      console.error('Grok API error:', error);
      return `Update ${changedFiles.length} files`;
    }
  }

  async analyzeCodeQuality(eslintResults, tsErrors, testResults) {
    try {
      const prompt = `
Analyze code quality for a financial technology project:

ESLint Errors: ${eslintResults.errorCount}
ESLint Warnings: ${eslintResults.warningCount}
TypeScript Errors: ${tsErrors.length}
Test Coverage: ${testResults.coverage || 'Unknown'}

Provide:
1. Overall quality score (0-100)
2. Top 3 priority fixes
3. Quick wins for improvement
4. Technical debt assessment

Response format: JSON with keys: score, priorities, quickWins, techDebt
`;

      const response = await this.makeRequest('chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a senior software engineer providing code quality analysis for financial technology projects.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0,
        stream: false
      });

      return this.parseGrokResponse(response);
    } catch (error) {
      console.error('Grok API error:', error);
      return {
        score: 75,
        priorities: ['Fix ESLint errors', 'Add type safety', 'Improve test coverage'],
        quickWins: ['Format code', 'Add missing semicolons', 'Remove unused imports'],
        techDebt: 'Moderate - focus on type safety and testing'
      };
    }
  }

  async makeRequest(endpoint, data) {
    try {
      console.log(`[Grok API] Making request to ${endpoint}`);
      const response = await fetch(`${this.baseURL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'FinSight-Desktop/2.0.0'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Grok API] Error ${response.status}: ${errorText}`);
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[Grok API] Success: ${endpoint}`);
      return result;
    } catch (error) {
      console.error(`[Grok API] Request failed:`, error);
      throw error;
    }
  }

  parseGrokResponse(response) {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No content in response');

      // Try to parse as JSON first
      try {
        return JSON.parse(content);
      } catch {
        // If not JSON, return as analysis text
        return { analysis: content };
      }
    } catch (error) {
      console.error('Failed to parse Grok response:', error);
      return { analysis: 'Analysis failed', error: error.message };
    }
  }

  getFallbackAnalysis(branchName, changedFiles) {
    const fileTypes = this.categorizeFiles(changedFiles);
    
    return {
      analysis: `Branch ${branchName} contains ${changedFiles.length} changed files including ${fileTypes.join(', ')}`,
      todos: [
        'Review code changes',
        'Run tests',
        'Update documentation',
        'Check for breaking changes'
      ],
      risk: changedFiles.length > 10 ? 'Medium' : 'Low',
      timeEstimate: changedFiles.length > 5 ? '2-4 hours' : '1-2 hours'
    };
  }

  categorizeFiles(files) {
    const categories = new Set();
    
    files.forEach(file => {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) categories.add('TypeScript');
      if (file.endsWith('.js') || file.endsWith('.jsx')) categories.add('JavaScript');
      if (file.endsWith('.css') || file.endsWith('.scss')) categories.add('Styles');
      if (file.endsWith('.json')) categories.add('Config');
      if (file.includes('test') || file.includes('spec')) categories.add('Tests');
    });
    
    return Array.from(categories);
  }

  // Health check method
  async testConnection() {
    try {
      const response = await this.makeRequest('chat/completions', {
        model: this.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
        temperature: 0,
        stream: false
      });
      
      return { connected: true, model: this.model };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

module.exports = GrokAPI;