/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText, EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';
import { TokenUsage } from '../types/langgraph';

interface TokenCounterProps {
  tokenUsage: TokenUsage;
}

export const TokenCounter: React.FC<TokenCounterProps> = ({ tokenUsage }) => {
  const totalTokens = tokenUsage.input_tokens + tokenUsage.output_tokens;

  return (
    <EuiFlexGroup gutterSize="s" alignItems="center">
      <EuiFlexItem grow={false}>
        <EuiIcon type="tokenUsage" size="s" />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText size="s" color="subdued">
          {totalTokens.toLocaleString()} tokens
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};