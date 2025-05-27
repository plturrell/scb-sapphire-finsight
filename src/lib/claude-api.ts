import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function callClaude(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  model: string = 'claude-3-opus-20240229'
) {
  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4000,
      messages,
    });

    return {
      content: response.content[0]?.type === 'text' ? response.content[0].text : '',
      usage: response.usage,
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

export const CLAUDE_MODELS = {
  OPUS: 'claude-3-opus-20240229',
  SONNET: 'claude-3-sonnet-20240229',
  HAIKU: 'claude-3-haiku-20240307',
} as const;