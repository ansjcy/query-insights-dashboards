/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiText,
  EuiAvatar,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiMarkdownFormat,
} from '@elastic/eui';
import { Message } from '../types/langgraph';

interface MessageDisplayProps {
  message: Message;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  const isHuman = message.type === 'human';
  const isAI = message.type === 'ai';

  const getMessageContent = () => {
    if (typeof message.content === 'string') {
      return message.content;
    }

    // Handle LangChain AIMessage array format
    if (Array.isArray(message.content) && message.content.length > 0) {
      const lastContent = message.content[message.content.length - 1];
      if (lastContent && lastContent.text) {
        return lastContent.text;
      }
    }

    if (message.content?.text) {
      return message.content.text;
    }

    return JSON.stringify(message.content);
  };

  const renderContent = () => {
    const content = getMessageContent();
    return isAI ? (
      <EuiMarkdownFormat>{content}</EuiMarkdownFormat>
    ) : (
      <EuiText>{content}</EuiText>
    );
  };

  return (
    <EuiFlexGroup gutterSize="s" alignItems="flexStart">
      <EuiFlexItem grow={false}>
        {isHuman ? (
          <EuiAvatar name="User" size="m" color="#006BB8" />
        ) : (
          <EuiAvatar name="AI" size="m" color="#017D73" iconType="logoOpenSearch" />
        )}
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiPanel
          paddingSize="m"
          style={{
            backgroundColor: isHuman ? '#F7F9FC' : '#FFFFFF',
            border: isHuman ? '1px solid #D3DAE6' : '1px solid #E7EDF3',
          }}
        >
          {renderContent()}
          {message.tool_calls && message.tool_calls.length > 0 && (
            <EuiFlexGroup gutterSize="s" style={{ marginTop: '8px' }}>
              <EuiFlexItem grow={false}>
                <EuiIcon type="wrench" size="s" />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s" color="subdued">
                  Tool calls: {message.tool_calls.map(tc => tc.function.name).join(', ')}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};