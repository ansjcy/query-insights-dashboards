/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPanel, EuiText, EuiButton, EuiFlexGroup, EuiFlexItem, EuiFieldText } from '@elastic/eui';

interface HumanInputRequestProps {
  interruptMessage: string;
  onSendMessage: (message: string, data?: Record<string, any>) => void;
  disabled: boolean;
  approveLoading: boolean;
}

export const HumanInputRequest: React.FC<HumanInputRequestProps> = ({
  interruptMessage,
  onSendMessage,
  disabled,
  approveLoading,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <EuiPanel paddingSize="m" style={{ backgroundColor: '#FFF8E8' }}>
      <EuiText size="s">
        <strong>Human Input Required</strong>
      </EuiText>
      <EuiText size="s">{interruptMessage}</EuiText>
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem>
          <EuiFieldText
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder="Enter your response..."
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
            isLoading={approveLoading}
          >
            Submit
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};