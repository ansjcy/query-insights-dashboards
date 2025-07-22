/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiButton,
  EuiButtonEmpty,
  EuiIcon,
  EuiSpacer,
  EuiProgress,
  EuiEmptyPrompt,
} from '@elastic/eui';

interface WorkflowProgressSidebarProps {
  currentStep: string;
  stepProgress: Record<string, any>;
  workflowStatus: 'running' | 'waiting_for_input' | 'completed' | 'error';
  onExpandedChange: (expanded: boolean) => void;
  expanded: boolean;
}

export const WorkflowProgressSidebar: React.FC<WorkflowProgressSidebarProps> = ({
  currentStep,
  stepProgress,
  workflowStatus,
  onExpandedChange,
  expanded,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'error':
        return 'danger';
      default:
        return 'subdued';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return 'clock';
      case 'completed':
        return 'check';
      case 'error':
        return 'alert';
      default:
        return 'empty';
    }
  };

  const renderCollapsedSidebar = () => (
    <EuiPanel style={{ height: '100%', padding: '8px' }}>
      <EuiFlexGroup direction="column" alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="s"
            iconType="menuRight"
            onClick={() => onExpandedChange(true)}
            aria-label="Expand workflow sidebar"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiIcon
            type={getStatusIcon(workflowStatus)}
            color={getStatusColor(workflowStatus)}
            size="m"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );

  const renderExpandedSidebar = () => (
    <EuiPanel style={{ height: '100%', padding: '16px' }}>
      <EuiFlexGroup direction="column" style={{ height: '100%' }}>
        {/* Header */}
        <EuiFlexItem grow={false}>
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
            <EuiFlexItem>
              <EuiTitle size="s">
                <h4>Workflow Progress</h4>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                iconType="menuLeft"
                onClick={() => onExpandedChange(false)}
                aria-label="Collapse workflow sidebar"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        <EuiSpacer size="m" />

        {/* Status */}
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiIcon
                type={getStatusIcon(workflowStatus)}
                color={getStatusColor(workflowStatus)}
                size="m"
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <strong>Status: {workflowStatus}</strong>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        {/* Current Step */}
        {currentStep && (
          <EuiFlexItem grow={false}>
            <EuiText size="s">
              <strong>Current Step:</strong> {currentStep}
            </EuiText>
          </EuiFlexItem>
        )}

        {/* Progress Details */}
        <EuiFlexItem style={{ overflow: 'auto' }}>
          {Object.keys(stepProgress).length > 0 ? (
            <EuiFlexGroup direction="column" gutterSize="s">
              {Object.entries(stepProgress).map(([step, progress]: [string, any]) => (
                <EuiFlexItem key={step} grow={false}>
                  <EuiPanel paddingSize="s" style={{ backgroundColor: '#F7F9FC' }}>
                    <EuiText size="s">
                      <strong>{step}</strong>
                    </EuiText>
                    <EuiText size="xs" color="subdued">
                      {progress.status || 'Unknown'}
                    </EuiText>
                    {progress.details && (
                      <EuiText size="xs">{progress.details}</EuiText>
                    )}
                  </EuiPanel>
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
          ) : (
            <EuiEmptyPrompt
              iconType="empty"
              title={<h4>No active workflow</h4>}
              body={<p>Start a conversation to see workflow progress</p>}
              titleSize="s"
            />
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );

  return expanded ? renderExpandedSidebar() : renderCollapsedSidebar();
};