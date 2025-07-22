/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

interface MetricPickerProps {
  interruptMessage: string;
  fetchMetrics: string[];
  notFetchMetrics: string[];
  onMoveToFetch: (metric: string) => void;
  onMoveToNotFetch: (metric: string) => void;
  disabled: boolean;
  onSendMessage: (message: string, data?: Record<string, any>) => void;
  approveLoading: boolean;
}

export const MetricPicker: React.FC<MetricPickerProps> = ({
  interruptMessage,
  fetchMetrics,
  notFetchMetrics,
  onMoveToFetch,
  onMoveToNotFetch,
  disabled,
  onSendMessage,
  approveLoading,
}) => {
  const handleApprove = () => {
    onSendMessage('Approved metric selection', { fetch_metrics: fetchMetrics });
  };

  return (
    <EuiPanel paddingSize="m" style={{ backgroundColor: '#FFF9E8' }}>
      <EuiText size="s">
        <strong>Metric Selection Required</strong>
      </EuiText>
      <EuiText size="s">{interruptMessage}</EuiText>
      
      {/* Show current metric selections */}
      {fetchMetrics.length > 0 && (
        <EuiText size="s">
          <strong>Metrics to fetch:</strong> {fetchMetrics.join(', ')}
        </EuiText>
      )}
      
      {notFetchMetrics.length > 0 && (
        <EuiText size="s">
          <strong>Metrics to skip:</strong> {notFetchMetrics.join(', ')}
        </EuiText>
      )}
      
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem>
          <EuiButton
            size="s"
            fill
            onClick={handleApprove}
            disabled={disabled}
            isLoading={approveLoading}
          >
            Proceed with Selection
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};