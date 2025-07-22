/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiButton, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiSpacer } from '@elastic/eui';
import { StepInfo } from '../types/langgraph';

interface StepExecutionDisplayProps {
  interruptMessage: string;
  stepsInfo: StepInfo[];
  onSendMessage: (message: string, data?: Record<string, any>) => void;
  disabled: boolean;
  approveLoading: boolean;
}

export const StepExecutionDisplay: React.FC<StepExecutionDisplayProps> = ({
  interruptMessage,
  stepsInfo,
  onSendMessage,
  disabled,
  approveLoading,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check';
      case 'executing':
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
      case 'executing':
        return 'primary';
      case 'error':
        return 'danger';
      default:
        return 'subdued';
    }
  };

  return (
    <EuiPanel paddingSize="m" style={{ backgroundColor: '#F0F8FF' }}>
      <EuiText size="s">
        <strong>Step Execution</strong>
      </EuiText>
      <EuiText size="s">{interruptMessage}</EuiText>
      <EuiSpacer size="m" />
      
      <EuiFlexGroup direction="column" gutterSize="s">
        {stepsInfo.map((step, index) => (
          <EuiFlexItem key={index}>
            <EuiPanel paddingSize="s" style={{ backgroundColor: '#FAFAFA' }}>
              <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                <EuiFlexItem>
                  <EuiFlexGroup gutterSize="s" alignItems="center">
                    <EuiFlexItem grow={false}>
                      <EuiIcon
                        type={getStatusIcon(step.status)}
                        color={getStatusColor(step.status)}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText size="s">
                        <strong>Step {step.step_number}/{step.total_steps}</strong>
                      </EuiText>
                      <EuiText size="xs" color="subdued">
                        {step.description}
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  {step.can_execute && step.status === 'pending' && (
                    <EuiButton
                      size="s"
                      onClick={() => onSendMessage(`Execute step ${step.step_number}`, { step })}
                      disabled={disabled}
                      isLoading={approveLoading}
                    >
                      Execute
                    </EuiButton>
                  )}
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </EuiPanel>
  );
};