import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

interface TodoItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  linkedCommit?: string;
  category: 'feature' | 'bugfix' | 'refactor' | 'docs' | 'test';
  createdAt: string;
}

async function getRecentCommits(): Promise<GitCommit[]> {
  try {
    const { stdout } = await execAsync('git log --oneline -10 --name-only --format="%H|%s|%an|%ad" --date=iso');
    const commits: GitCommit[] = [];
    const lines = stdout.trim().split('\n');
    
    let currentCommit: Partial<GitCommit> = {};
    let files: string[] = [];
    
    for (const line of lines) {
      if (line.includes('|')) {
        if (currentCommit.hash) {
          commits.push({ ...currentCommit, files } as GitCommit);
        }
        const [hash, message, author, date] = line.split('|');
        currentCommit = { hash, message, author, date };
        files = [];
      } else if (line.trim() && !line.startsWith(' ')) {
        files.push(line.trim());
      }
    }
    
    if (currentCommit.hash) {
      commits.push({ ...currentCommit, files } as GitCommit);
    }
    
    return commits;
  } catch (error) {
    console.error('Git command failed:', error);
    return [];
  }
}

function generateIntelligentTodos(commits: GitCommit[]): TodoItem[] {
  const todos: TodoItem[] = [];
  
  commits.forEach((commit, index) => {
    const message = commit.message.toLowerCase();
    const files = commit.files;
    
    // Analyze commit patterns for intelligent todo generation
    if (message.includes('fix') || message.includes('bug')) {
      todos.push({
        id: `todo-${commit.hash}-fix`,
        title: 'Verify Bug Fix Implementation',
        description: `Review and test the bug fix: "${commit.message}". Ensure no regression issues.`,
        status: 'pending',
        priority: 'high',
        linkedCommit: commit.hash,
        category: 'bugfix',
        createdAt: commit.date
      });
    }
    
    if (message.includes('wip') || message.includes('work in progress')) {
      todos.push({
        id: `todo-${commit.hash}-complete`,
        title: 'Complete Work in Progress',
        description: `Finish implementation: "${commit.message}". Review affected files: ${files.slice(0, 3).join(', ')}`,
        status: 'in_progress',
        priority: 'high',
        linkedCommit: commit.hash,
        category: 'feature',
        createdAt: commit.date
      });
    }
    
    if (files.some(f => f.includes('test'))) {
      todos.push({
        id: `todo-${commit.hash}-test`,
        title: 'Extend Test Coverage',
        description: `Add comprehensive tests for changes in: ${files.filter(f => !f.includes('test')).slice(0, 2).join(', ')}`,
        status: 'pending',
        priority: 'medium',
        linkedCommit: commit.hash,
        category: 'test',
        createdAt: commit.date
      });
    }
    
    if (files.some(f => f.includes('.tsx') || f.includes('.ts'))) {
      const componentFiles = files.filter(f => f.includes('components/'));
      if (componentFiles.length > 0) {
        todos.push({
          id: `todo-${commit.hash}-refactor`,
          title: 'Optimize Component Performance',
          description: `Review and optimize React components: ${componentFiles.slice(0, 2).join(', ')}. Consider memoization and prop optimization.`,
          status: 'pending',
          priority: 'low',
          linkedCommit: commit.hash,
          category: 'refactor',
          createdAt: commit.date
        });
      }
    }
    
    if (message.includes('api') || files.some(f => f.includes('api/'))) {
      todos.push({
        id: `todo-${commit.hash}-api`,
        title: 'API Documentation Update',
        description: `Update API documentation for changes in: "${commit.message}". Ensure proper error handling and types.`,
        status: 'pending',
        priority: 'medium',
        linkedCommit: commit.hash,
        category: 'docs',
        createdAt: commit.date
      });
    }
  });
  
  // Remove duplicates and sort by priority
  const uniqueTodos = todos.filter((todo, index, self) => 
    index === self.findIndex(t => t.title === todo.title)
  );
  
  return uniqueTodos.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const commits = await getRecentCommits();
    const todos = generateIntelligentTodos(commits);
    
    res.status(200).json({
      success: true,
      todos,
      metadata: {
        totalCommits: commits.length,
        generatedTodos: todos.length,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to generate git todos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate intelligent todos from git history'
    });
  }
}