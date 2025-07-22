/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiButton,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import { TokenUsage } from '../types/langgraph';
import { TokenCounter } from './TokenCounter';
import { WorkflowSelector } from './WorkflowSelector';

interface InputAreaProps {
  onSendMessage: (message: string, selectedWorkflow?: string) => void;
  disabled: boolean;
  placeholder?: string;
  tokenUsage?: TokenUsage;
  selectedWorkflow?: string;
  onWorkflowChange?: (workflow: string) => void;
  showWorkflowSelector?: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
  tokenUsage,
  selectedWorkflow = 'auto_route',
  onWorkflowChange = () => {},
  showWorkflowSelector = false,
}) => {
  const [input, setInput] = useState('');
  const textFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textFieldRef.current) {
      textFieldRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || disabled) {
      return;
    }

    const message = input.trim();
    setInput('');

    try {
      onSendMessage(message, selectedWorkflow);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <EuiPanel paddingSize="m">
      <form onSubmit={handleSubmit}>
        <EuiFlexGroup gutterSize="s" alignItems="flexEnd">
          <EuiFlexItem>
            <EuiFieldText
              inputRef={textFieldRef}
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              type="submit"
              fill
              iconType="returnKey"
              disabled={!input.trim() || disabled}
            >
              Send
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </form>

      {(tokenUsage || showWorkflowSelector) && (
        <>
          <EuiSpacer size="m" />
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
            {showWorkflowSelector && (
              <EuiFlexItem grow={false}>
                <WorkflowSelector
                  selectedWorkflow={selectedWorkflow}
                  onWorkflowChange={onWorkflowChange}
                  disabled={disabled}
                />
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={false}>
              {tokenUsage && <TokenCounter tokenUsage={tokenUsage} />}
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </EuiPanel>
  );
};