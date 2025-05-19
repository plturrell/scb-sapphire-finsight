import axios from 'axios';

const GROK_API_URL = 'https://api.x.ai/v1';
const GROK_API_KEY = process.env.NEXT_PUBLIC_GROK_API_KEY || '';

export interface GrokMessageContent {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

export interface GrokCompletionRequest {
  messages: GrokMessageContent[];
  model: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  tools?: any[];
  tool_choice?: 'auto' | 'none' | { type: string; function: { name: string } };
}

export interface GrokFunctionCall {
  name: string;
  arguments: string;
}

export interface GrokCompletionResponse {
  id: string;
  choices: [
    {
      message: {
        role: 'assistant';
        content: string | null;
        tool_calls?: Array<{
          id: string;
          type: string;
          function: GrokFunctionCall;
        }>;
      };
      finish_reason: string;
    }
  ];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Define available tools for Grok
const grokTools = [
  {
    type: 'function',
    function: {
      name: 'get_financial_data',
      description: 'Get financial data and metrics for a specific asset or portfolio',
      parameters: {
        type: 'object',
        properties: {
          asset_id: {
            type: 'string',
            description: 'The ID of the asset or portfolio to get data for'
          },
          timeframe: {
            type: 'string',
            description: 'The timeframe to get data for (e.g. "1d", "1w", "1m", "1y")',
            enum: ['1d', '1w', '1m', '3m', '6m', '1y', '5y']
          },
          metrics: {
            type: 'array',
            description: 'The metrics to retrieve',
            items: {
              type: 'string',
              enum: ['price', 'returns', 'volatility', 'sharpe_ratio', 'drawdown']
            }
          }
        },
        required: ['asset_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_report',
      description: 'Generate a financial report based on specified parameters',
      parameters: {
        type: 'object',
        properties: {
          report_type: {
            type: 'string',
            description: 'The type of report to generate',
            enum: ['performance', 'allocation', 'risk', 'forecast']
          },
          assets: {
            type: 'array',
            description: 'The assets to include in the report',
            items: {
              type: 'string'
            }
          },
          timeframe: {
            type: 'string',
            description: 'The timeframe for the report',
            enum: ['1m', '3m', '6m', '1y', 'ytd']
          }
        },
        required: ['report_type']
      }
    }
  }
];

// Function to handle tool calls
export const handleGrokToolCall = async (toolCall: GrokFunctionCall) => {
  const { name, arguments: argsJson } = toolCall;
  const args = JSON.parse(argsJson);
  
  switch (name) {
    case 'get_financial_data':
      // In a real implementation, this would call your financial data service
      return {
        status: 'success',
        data: {
          asset_id: args.asset_id,
          timeframe: args.timeframe || '1m',
          metrics: {
            price: args.asset_id === 'SPX' ? 5123.45 : 245.67,
            returns: args.asset_id === 'SPX' ? 0.0823 : 0.0456,
            volatility: args.asset_id === 'SPX' ? 0.12 : 0.18,
            sharpe_ratio: args.asset_id === 'SPX' ? 1.42 : 0.95,
            drawdown: args.asset_id === 'SPX' ? -0.035 : -0.047
          },
          timestamp: new Date().toISOString()
        }
      };
      
    case 'generate_report':
      // In a real implementation, this would call your report generation service
      return {
        status: 'success',
        report_id: `report-${Date.now()}`,
        report_type: args.report_type,
        assets: args.assets || [],
        timeframe: args.timeframe || '1m',
        url: `/reports/view?id=report-${Date.now()}`
      };
      
    default:
      return {
        status: 'error',
        message: `Unknown function: ${name}`
      };
  }
};

export async function getGrokCompletion(messages: GrokMessageContent[], useTools: boolean = false): Promise<string> {
  if (!GROK_API_KEY) {
    console.error('GROK API key is missing. Please set NEXT_PUBLIC_GROK_API_KEY in your .env.local file.');
    return 'Sorry, I am unable to respond due to a configuration issue. Please contact support.';
  }

  try {
    // Prepare the request with system message
    const systemMessage: GrokMessageContent = {
      role: 'system',
      content: `You are Joule, an AI assistant for the SCB Sapphire FinSight platform. Your purpose is to help users analyze financial data, provide insights, and assist with navigating the platform. 
      
You have access to real-time financial data and can generate reports. When users request financial information or reports, use the appropriate tools to retrieve or generate this information.

Provide concise, helpful responses focused on financial insights. Always format financial numbers appropriately (e.g., percentages, currency symbols, commas for thousands).

When providing insights, follow these financial best practices:
1. Mention both risks and potential rewards
2. Consider market conditions and economic indicators
3. Reference historical performance but emphasize it doesn't predict future results
4. Suggest diversification when appropriate

Format your responses with clear sections and bullet points when providing lists or steps.`
    };
    
    const requestPayload: GrokCompletionRequest = {
      messages: [
        systemMessage,
        ...messages
      ],
      model: 'grok-3',  // Specifically using Grok 3 model
      max_tokens: 1024,
      temperature: 0.7,
    };
    
    // Add tools if enabled
    if (useTools) {
      requestPayload.tools = grokTools;
      requestPayload.tool_choice = 'auto';
    }
    
    const response = await axios.post<GrokCompletionResponse>(
      `${GROK_API_URL}/chat/completions`,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        }
      }
    );

    const assistantMessage = response.data.choices[0].message;
    
    // Handle tool calls if present
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Process the tool calls
      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall) => {
          const result = await handleGrokToolCall(toolCall.function);
          return {
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            name: toolCall.function.name,
            content: JSON.stringify(result)
          };
        })
      );
      
      // Make a follow-up request to incorporate tool results
      const followUpMessages: GrokMessageContent[] = [
        systemMessage as GrokMessageContent,
        ...messages,
        // Need to cast assistantMessage to the correct type
        {
          role: 'assistant',
          content: assistantMessage.content || '',
          ...(assistantMessage.tool_calls ? { tool_calls: assistantMessage.tool_calls } : {})
        } as unknown as GrokMessageContent,
        ...toolResults as GrokMessageContent[]
      ];
      
      const followUpResponse = await axios.post<GrokCompletionResponse>(
        `${GROK_API_URL}/chat/completions`,
        {
          messages: followUpMessages,
          model: 'grok-3',
          max_tokens: 1024,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROK_API_KEY}`
          }
        }
      );
      
      return followUpResponse.data.choices[0].message.content || 'I processed your request but encountered an issue formatting the response.';
    }
    
    return assistantMessage.content || 'I processed your request but encountered an issue with the response format.';
  } catch (error) {
    console.error('Error calling Grok API:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Grok API error details:', error.response.data);
      }
      if (error.response?.status === 401) {
        return 'Authentication failed. Please check your Grok API key configuration.';
      }
      if (error.response?.status === 429) {
        return 'Rate limit exceeded. Please try again in a moment.';
      }
    }
    return 'Sorry, I encountered an issue while processing your request. Please try again later.';
  }
}
