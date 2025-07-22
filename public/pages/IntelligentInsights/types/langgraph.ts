/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Thread {
  thread_id: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface Message {
  id?: string;
  content: string | any;
  type: 'human' | 'ai';
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ThreadState {
  values: Record<string, any>;
  next: string[];
  checkpoint: {
    thread_id: string;
    checkpoint_id: string;
    checkpoint_ns: string;
    parent_checkpoint_id?: string;
  };
  metadata: Record<string, any>;
  created_at: string;
  parent_config?: Record<string, any>;
  tasks: any[];
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface StepProgress {
  status: 'started' | 'in_progress' | 'completed' | 'error';
  timestamp: string;
  details: string;
}

export interface WorkflowState {
  current_step: string;
  step_progress: Record<string, StepProgress>;
  workflow_status: 'running' | 'waiting_for_input' | 'completed' | 'error';
}

export interface ToolOutput {
  tool_name: string;
  input: string;
  output: string;
  timestamp: string;
  status: 'running' | 'completed' | 'error';
  chart_data?: ChartDataPoint[];
  metadata?: MetricMetadata;
  index: number;
}

export interface ChartDataPoint {
  nodeId: string;
  metric_name: string;
  values: number[];
  timestamps: string[];
  unit: string;
  stat: string;
}

export interface MetricMetadata {
  metric_name: string;
  stat: string;
  start_time: string;
  end_time: string;
  per_node: boolean;
}

export interface SopOption {
  title: string;
  url: string;
  domain: string;
  summary: string;
}

export interface TicketOption {
  title: string;
  ticket_id: string;
  status: string;
  time: string;
  description: string;
  url: string;
}

export interface ParameterOption {
  name: string;
  description: string;
  value?: string;
}

export interface StepInfo {
  step_number: number;
  total_steps: number;
  description: string;
  action_type: string;
  command: string;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'error';
  can_execute: boolean;
  requires_manual: boolean;
  result?: any;
  completed_at?: string;
}

export interface Assistant {
  assistant_id: string;
  graph_id: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  version: number;
  name: string;
  description?: string;
}