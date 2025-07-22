/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiCodeBlock, EuiSpacer } from '@elastic/eui';
import { ToolOutput } from '../types/langgraph';

interface ToolOutputDisplayProps {
  toolOutput: ToolOutput;
}

export const ToolOutputDisplay: React.FC<ToolOutputDisplayProps> = ({ toolOutput }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check';
      case 'running':
        return 'clock';
      case 'error':
        return 'alert';
      default:
        return 'empty';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'primary';
      case 'error':
        return 'danger';
      default:
        return 'subdued';
    }
  };

  return (
    <EuiPanel paddingSize="m" style={{ backgroundColor: '#F8F9FA', border: '1px solid #E7EDF3' }}>
      <EuiFlexGroup gutterSize="s" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiIcon
            type={getStatusIcon(toolOutput.status)}
            color={getStatusColor(toolOutput.status)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s">
            <strong>Tool: {toolOutput.tool_name}</strong>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            {new Date(toolOutput.timestamp).toLocaleTimeString()}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      
      <EuiSpacer size="s" />
      
      {toolOutput.input && (
        <>
          <EuiText size="s">
            <strong>Input:</strong>
          </EuiText>
          <EuiCodeBlock language="text" fontSize="s" paddingSize="s">
            {toolOutput.input}
          </EuiCodeBlock>
        </>
      )}
      
      {toolOutput.output && (
        <>
          <EuiText size="s">
            <strong>Output:</strong>
          </EuiText>
          <EuiCodeBlock language="text" fontSize="s" paddingSize="s">
            {toolOutput.output}
          </EuiCodeBlock>
        </>
      )}
      
      {toolOutput.chart_data && toolOutput.chart_data.length > 0 && (
        <>
          <EuiSpacer size="s" />
          <EuiText size="s">
            <strong>Chart Data Available:</strong> {toolOutput.chart_data.length} data points
          </EuiText>
        </>
      )}
    </EuiPanel>
  );
};