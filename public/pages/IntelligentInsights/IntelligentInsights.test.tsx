/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntelligentInsights } from './IntelligentInsights';
import { coreMock } from '../../../../../src/core/public/mocks';

// Mock the hooks
jest.mock('./hooks/useLangGraph', () => ({
  useLangGraph: jest.fn(() => ({
    threads: [],
    currentThread: null,
    assistants: [],
    currentAssistant: null,
    createNewThreadLoading: false,
    loadThreads: jest.fn(),
    loadAssistants: jest.fn(),
    createNewThread: jest.fn(),
    selectThread: jest.fn(),
  })),
}));

// Mock the components
jest.mock('./Components/ConversationSidebar', () => ({
  ConversationSidebar: ({ onCreateThread }: any) => (
    <div data-testid="conversation-sidebar">
      <button onClick={onCreateThread}>New Conversation</button>
    </div>
  ),
}));

jest.mock('./Components/Conversation', () => ({
  Conversation: () => <div data-testid="conversation">Conversation Component</div>,
}));

jest.mock('./Components/WorkflowProgressSidebar', () => ({
  WorkflowProgressSidebar: () => <div data-testid="workflow-sidebar">Workflow Sidebar</div>,
}));

jest.mock('../../components/PageHeader', () => ({
  PageHeader: ({ fallBackComponent }: any) => (
    <div data-testid="page-header">{fallBackComponent}</div>
  ),
}));

const mockCore = coreMock.createStart();
const mockDepsStart = {};
const mockParams = {} as any;

describe('IntelligentInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <IntelligentInsights
        core={mockCore}
        depsStart={mockDepsStart}
        params={mockParams}
      />
    );

    expect(screen.getByText('Query Insights - Intelligent Insights')).toBeInTheDocument();
  });

  it('renders the conversation sidebar', () => {
    render(
      <IntelligentInsights
        core={mockCore}
        depsStart={mockDepsStart}
        params={mockParams}
      />
    );

    expect(screen.getByTestId('conversation-sidebar')).toBeInTheDocument();
  });

  it('renders the workflow sidebar', () => {
    render(
      <IntelligentInsights
        core={mockCore}
        depsStart={mockDepsStart}
        params={mockParams}
      />
    );

    expect(screen.getByTestId('workflow-sidebar')).toBeInTheDocument();
  });

  it('shows welcome message when no thread is selected', () => {
    render(
      <IntelligentInsights
        core={mockCore}
        depsStart={mockDepsStart}
        params={mockParams}
      />
    );

    expect(screen.getByText('Welcome to Intelligent Insights Agent')).toBeInTheDocument();
    expect(screen.getByText('Create a new conversation or select an existing one from the sidebar')).toBeInTheDocument();
  });
});