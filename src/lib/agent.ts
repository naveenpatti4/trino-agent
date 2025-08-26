import OpenAI from "openai";
import { trinoTools, callTrinoTool } from "./trino";

export type ChatMessage = { role: "user" | "assistant"; content: string };

function toolsForOpenAI() {
  return trinoTools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }));
}

async function handleToolCall(name: string, args: unknown): Promise<string> {
  const input = (args && typeof args === "object") ? (args as Record<string, unknown>) : {};
  let result: unknown;
  try {
    result = await callTrinoTool(name, input);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Tool ${name} failed: ${msg}`);
  }
  return typeof result === "string" ? result : JSON.stringify(result);
}

export function buildAgent() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `You are an expert Trino data assistant with intelligent discovery capabilities. 

DISCOVERY STRATEGY:
When users ask about specific tables/data (like "customer", "orders", "sales"):
1. First use list_catalogs to see available data sources
2. Then use list_schemas on relevant catalogs (like 'tpch', 'main', etc.)  
3. Then use list_tables to find tables matching the user's intent
4. Use get_table_schema to understand table structure before querying
5. Finally execute_query with appropriate SQL

INTELLIGENT CONTEXT BUILDING:
- Chain multiple tool calls in logical sequence
- Use results from previous calls to inform next ones
- When looking for "customer" data, check multiple catalogs/schemas
- Be proactive in discovering the data landscape
- Explain your discovery process to the user

QUERY SAFETY:
- Always use LIMIT clauses for exploratory queries
- Prefer SELECT over other operations
- Use proper schema.table syntax: catalog.schema.table
- Validate table existence before complex queries

RESPONSE FORMATTING:
- Format query results as tables when appropriate
- Use pipe-separated format for tabular data: | Column 1 | Column 2 |
- Include clear headers and separate data rows
- Explain what the data shows and any insights discovered
- Always provide a conversational summary after executing tools
- When you get data from execute_query, format it nicely and explain the results

Be conversational and explain what you're discovering as you explore the data. After using tools, always provide a summary of what you found.`;

  async function* streamChat(messages: ChatMessage[]) {
    const tools = toolsForOpenAI();
    
    const conversationHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];
    
    const maxRounds = 50; // Prevent infinite loops
    let currentRound = 0;
    
    while (currentRound < maxRounds) {
      currentRound++;
      
      console.log(`Agent round ${currentRound}, conversation length: ${conversationHistory.length}`);
      
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        stream: false,
        messages: conversationHistory,
        tools,
        tool_choice: "auto",
      });

      const message = response.choices[0].message;
      console.log(`Round ${currentRound} response:`, { 
        hasContent: !!message.content, 
        contentLength: message.content?.length || 0,
        hasToolCalls: !!message.tool_calls,
        toolCallsCount: message.tool_calls?.length || 0 
      });
      
      // If no tool calls, stream the final response and exit
      if (!message.tool_calls || message.tool_calls.length === 0) {
        if (message.content) {
          // Stream the final response more naturally
          const words = message.content.split(' ');
          for (const word of words) {
            yield { type: "token", chunk: word + ' ' } as const;
            await new Promise(resolve => setTimeout(resolve, 20)); // Faster streaming
          }
        } else {
          // If no content, provide a helpful message
          yield { type: "token", chunk: "I've completed the analysis. " } as const;
        }
        break;
      }

      // Add assistant message with tool calls to conversation history
      conversationHistory.push({
        role: "assistant",
        content: message.content || null,
        tool_calls: message.tool_calls,
      });

      // Execute tool calls
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === "function") {
          const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
          yield { type: "tool_call", name: toolCall.function.name, input: args } as const;
          
          try {
            const output = await handleToolCall(toolCall.function.name, args);
            yield { type: "tool_result", name: toolCall.function.name, output } as const;
            
            // Add tool result to conversation
            conversationHistory.push({
              role: "tool",
              tool_call_id: toolCall.id!,
              content: typeof output === 'string' ? output : JSON.stringify(output),
            });
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            yield { type: "tool_result", name: toolCall.function.name, output: `Error: ${errorMsg}` } as const;
            
            conversationHistory.push({
              role: "tool",
              tool_call_id: toolCall.id!,
              content: `Error: ${errorMsg}`,
            });
          }
        }
      }
      
      // Continue to next round to process tool results
      continue;
    }
    
    // If we exit the loop without a response, provide a fallback
    console.log("Agent reached max rounds without final response");
    yield { type: "token", chunk: "I've completed the tool execution but reached the maximum number of processing rounds. Please try rephrasing your question or ask for specific information." } as const;
    
    yield { type: "done" } as const;
  }

  return {
    agent: {
      stream: streamChat,
    },
  } as const;
}

export function toOpenAIMessages(history: ChatMessage[]) {
  const system = { role: "system" as const, content: "You are a helpful Trino data assistant. Use list_* and get_table_schema to explore before execute_query. Prefer safe, read-only SQL." };
  return [system, ...history.map((m) => ({ role: m.role, content: m.content }))];
}
