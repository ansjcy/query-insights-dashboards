/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiText,
  EuiSpacer,
  EuiTitle,
  EuiButtonEmpty,
  EuiIcon,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { Thread } from '../types/langgraph';

interface ConversationSidebarProps {
  threads: Thread[];
  currentThread: Thread | null;
  onSelectThread: (thread: Thread) => void;
  onCreateThread: () => void;
  onToggleSidebar: () => void;
  createNewThreadLoading: boolean;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  threads,
  currentThread,
  onSelectThread,
  onCreateThread,
  onToggleSidebar,
  createNewThreadLoading,
}) => {
  const formatThreadId = (threadId: string) => {
    return threadId.length > 20 ? `${threadId.slice(0, 20)}...` : threadId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <EuiPanel style={{ height: '100%', overflow: 'hidden' }}>
      <EuiFlexGroup direction="column" style={{ height: '100%' }}>
        {/* Header */}
        <EuiFlexItem grow={false}>
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
            <EuiFlexItem>
              <EuiTitle size="s">
                <h3>Conversations</h3>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                iconType="cross"
                onClick={onToggleSidebar}
                aria-label="Close sidebar"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        {/* Create New Thread Button */}
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            fullWidth
            iconType="plus"
            onClick={onCreateThread}
            isLoading={createNewThreadLoading}
          >
            New Conversation
          </EuiButton>
        </EuiFlexItem>

        <EuiSpacer size="m" />

        {/* Threads List */}
        <EuiFlexItem style={{ overflow: 'auto' }}>
          {threads.length === 0 ? (
            <EuiFlexGroup direction="column" alignItems="center" justifyContent="center">
              <EuiFlexItem grow={false}>
                <EuiIcon type="discuss" size="l" color="subdued" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s" color="subdued" textAlign="center">
                  No conversations yet. Start a new one to begin.
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : (
            <EuiFlexGroup direction="column" gutterSize="s">
              {threads.map((thread) => {
                const isSelected = currentThread?.thread_id === thread.thread_id;
                return (
                  <EuiFlexItem key={thread.thread_id} grow={false}>
                    <EuiButtonEmpty
                      onClick={() => onSelectThread(thread)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px',
                        backgroundColor: isSelected ? '#F5F7FA' : 'transparent',
                        borderRadius: '4px',
                        border: isSelected ? '1px solid #D3DAE6' : '1px solid transparent',
                      }}
                    >
                      <EuiFlexGroup direction="column" gutterSize="xs">
                        <EuiFlexItem>
                          <EuiText size="s">
                            <strong>{formatThreadId(thread.thread_id)}</strong>
                          </EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiText size="xs" color="subdued">
                            {formatDate(thread.created_at)}
                          </EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                );
              })}
            </EuiFlexGroup>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};