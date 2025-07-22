/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Thread, ThreadState, Assistant } from '../types/langgraph';

const API_BASE_URL = 'http://127.0.0.1:2024';

export class LangGraphAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async createThread(): Promise<Thread> {
    const response = await fetch(`${this.baseUrl}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata: {} }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create thread: ${response.statusText}`);
    }
    
    return response.json();
  }

  async searchThreads(): Promise<Thread[]> {
    const response = await fetch(`${this.baseUrl}/threads/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: 50,
        offset: 0,
        sort_by: 'created_at',
        sort_order: 'desc',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search threads: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getThreadHistory(threadId: string): Promise<ThreadState[]> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/history`);
    
    if (!response.ok) {
      throw new Error(`Failed to get thread history: ${response.statusText}`);
    }
    
    return response.json();
  }

  async streamRun(
    threadId: string,
    assistantId: string,
    anyInput: any,
    config: Record<string, any> = {},
    isInterrupt: boolean = false,
    onEvent?: (event: any) => void
  ): Promise<void> {
    let input: any = {};
    let command = null;
    
    if (isInterrupt) {
      command = { resume: anyInput };
    } else {
      input = { messages: [{ role: 'user', content: anyInput }] };
      // If config contains selected_workflow, add it to the input
      if (config.selected_workflow) {
        input.selected_workflow = config.selected_workflow;
      }
    }

    const response = await fetch(
      `${this.baseUrl}/threads/${threadId}/runs/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistant_id: assistantId,
          input,
          command,
          config,
          stream_mode: ['values', 'updates', 'messages'],
          stream_subgraphs: true,
          stream_resumable: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to stream run: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader || !onEvent) return;

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            let event;
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              event = JSON.parse(data);
            } else if (line.startsWith('{')) {
              event = JSON.parse(line);
            }

            if (event) {
              onEvent(event);
            }
          } catch (error) {
            console.warn('Failed to parse stream event:', error);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async searchAssistants(): Promise<Assistant[]> {
    const response = await fetch(`${this.baseUrl}/assistants/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 100, offset: 0 }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search assistants: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getThreadState(threadId: string): Promise<ThreadState> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/state?subgraphs=true`);
    
    if (!response.ok) {
      throw new Error(`Failed to get thread state: ${response.statusText}`);
    }
    
    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/assistants/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 1, offset: 0 }),
      });
      return response.ok;
    } catch (error) {
      console.error('LangGraph connection test failed:', error);
      return false;
    }
  }
}

export const langGraphAPI = new LangGraphAPI();