/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  EuiPanel, 
  EuiText, 
  EuiButton, 
  EuiFlexGroup, 
  EuiFlexItem,
  EuiCollapsibleNavGroup,
  EuiBadge,
  EuiHorizontalRule,
  EuiSpacer,
  EuiButtonIcon
} from '@elastic/eui';
import { InputArea } from './InputArea';

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
  const [isEditing, setIsEditing] = useState(false);

  const handleProceedWithAnalysis = () => {
    // Send empty message to proceed with finalized plan (matches RCA workflow expectation)
    onSendMessage('');
  };

  const handleEditPlan = (message: string) => {
    // Send plan modification message
    onSendMessage(message);
    setIsEditing(false);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleMetricClick = (metric: string, moveToFetch: boolean) => {
    if (moveToFetch) {
      onMoveToFetch(metric);
    } else {
      onMoveToNotFetch(metric);
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <EuiPanel paddingSize="l" style={{ backgroundColor: '#FFF9E8', border: '2px solid #F5A623' }}>
      <EuiText size="s">
        <strong>Root Cause Analysis Plan</strong>
      </EuiText>
      <EuiSpacer size="s" />
      
      <div dangerouslySetInnerHTML={{ __html: interruptMessage.replace(/\n/g, '<br>') }} />
      
      <EuiSpacer size="m" />

      {isEditing && (
        <>
          <EuiCollapsibleNavGroup
            title="Edit Plan"
            iconType="documentEdit"
            isCollapsible={false}
            initialIsOpen={true}
          >
            <InputArea
              onSendMessage={handleEditPlan}
              disabled={approveLoading}
              placeholder="Modify the plan or provide additional instructions..."
            />
          </EuiCollapsibleNavGroup>
          
          <EuiSpacer size="m" />
          
          {/* Interactive Metric Selection */}
          <EuiCollapsibleNavGroup
            title="Metrics to Fetch"
            iconType="visLine"
            isCollapsible={false}
            initialIsOpen={true}
          >
            <EuiText size="s" color="subdued">
              Click metrics below to move them between fetch and skip lists
            </EuiText>
            <EuiSpacer size="s" />
            
            {fetchMetrics.length > 0 && (
              <>
                <EuiText size="xs"><strong>Will fetch:</strong></EuiText>
                <EuiFlexGroup gutterSize="xs" wrap>
                  {fetchMetrics.map((metric) => (
                    <EuiFlexItem grow={false} key={metric}>
                      <EuiBadge 
                        color="primary"
                        onClick={() => handleMetricClick(metric, false)}
                        onClickAriaLabel={`Remove ${metric} from fetch list`}
                        style={{ cursor: 'pointer' }}
                      >
                        {metric}
                        <EuiButtonIcon
                          iconType="cross"
                          size="xs"
                          color="inherit"
                          aria-label={`Remove ${metric}`}
                        />
                      </EuiBadge>
                    </EuiFlexItem>
                  ))}
                </EuiFlexGroup>
                <EuiSpacer size="s" />
              </>
            )}
            
            {notFetchMetrics.length > 0 && (
              <>
                <EuiText size="xs"><strong>Will skip:</strong></EuiText>
                <EuiFlexGroup gutterSize="xs" wrap>
                  {notFetchMetrics.map((metric) => (
                    <EuiFlexItem grow={false} key={metric}>
                      <EuiBadge 
                        color="default"
                        onClick={() => handleMetricClick(metric, true)}
                        onClickAriaLabel={`Add ${metric} to fetch list`}
                        style={{ cursor: 'pointer' }}
                      >
                        {metric}
                      </EuiBadge>
                    </EuiFlexItem>
                  ))}
                </EuiFlexGroup>
              </>
            )}
          </EuiCollapsibleNavGroup>
          
          <EuiSpacer size="m" />
        </>
      )}
      
      <EuiHorizontalRule margin="m" />
      
      <EuiFlexGroup gutterSize="m" justifyContent="center">
        <EuiFlexItem grow={false}>
          <EuiButton
            iconType="documentEdit"
            onClick={toggleEditing}
            disabled={approveLoading}
          >
            {isEditing ? 'Close Plan Editor' : 'Edit Plan'}
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            color="primary"
            iconType="play"
            onClick={handleProceedWithAnalysis}
            disabled={approveLoading}
            isLoading={approveLoading}
          >
            {approveLoading ? 'Processing...' : 'Proceed with Analysis'}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};