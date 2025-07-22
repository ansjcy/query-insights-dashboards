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
  EuiSpacer
} from '@elastic/eui';
import { InputArea } from './InputArea';

// Parse and render the RCA plan using EUI components
const RCAPlanRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n').filter(line => line.trim());
  
  return (
    <div>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('## ')) {
          return <EuiText key={index} size="m"><h2>{trimmedLine.replace('## ', '')}</h2></EuiText>;
        }
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          return (
            <EuiText key={index} size="s">
              <strong>{trimmedLine.replace(/\*\*/g, '')}</strong>
            </EuiText>
          );
        }
        if (trimmedLine.includes('**')) {
          const parts = trimmedLine.split(/(\*\*.*?\*\*)/);
          return (
            <EuiText key={index} size="s">
              {parts.map((part, partIndex) => 
                part.startsWith('**') && part.endsWith('**') ? 
                  <strong key={partIndex}>{part.replace(/\*\*/g, '')}</strong> : 
                  part
              )}
            </EuiText>
          );
        }
        if (trimmedLine) {
          return <EuiText key={index} size="s">{trimmedLine}</EuiText>;
        }
        return <EuiSpacer key={index} size="xs" />;
      })}
    </div>
  );
};

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
      <EuiSpacer size="s" />
      
      <RCAPlanRenderer content={interruptMessage} />
      
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
                <EuiText size="s" color="success"><strong>✓ Will fetch:</strong></EuiText>
                <EuiSpacer size="xs" />
                <EuiFlexGroup gutterSize="s" wrap>
                  {fetchMetrics.map((metric) => (
                    <EuiFlexItem grow={false} key={metric}>
                      <EuiBadge 
                        color="success"
                        onClick={() => handleMetricClick(metric, false)}
                        onClickAriaLabel={`Remove ${metric} from fetch list`}
                        style={{ 
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          position: 'relative'
                        }}
                        iconType="cross"
                        iconSide="right"
                        iconOnClick={() => handleMetricClick(metric, false)}
                        iconOnClickAriaLabel={`Remove ${metric} from fetch list`}
                      >
                        {metric}
                      </EuiBadge>
                    </EuiFlexItem>
                  ))}
                </EuiFlexGroup>
                <EuiSpacer size="m" />
              </>
            )}
            
            {notFetchMetrics.length > 0 && (
              <>
                <EuiText size="s" color="subdued"><strong>⊘ Will skip:</strong></EuiText>
                <EuiSpacer size="xs" />
                <EuiFlexGroup gutterSize="s" wrap>
                  {notFetchMetrics.map((metric) => (
                    <EuiFlexItem grow={false} key={metric}>
                      <EuiBadge 
                        color="hollow"
                        onClick={() => handleMetricClick(metric, true)}
                        onClickAriaLabel={`Add ${metric} to fetch list`}
                        style={{ 
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '400',
                          transition: 'all 0.2s ease',
                          border: '1.5px dashed #D3DAE6',
                          backgroundColor: '#FAFBFD',
                          color: '#69707D',
                          boxShadow: 'none'
                        }}
                        iconType="plus"
                        iconSide="right"
                        iconOnClick={() => handleMetricClick(metric, true)}
                        iconOnClickAriaLabel={`Add ${metric} to fetch list`}
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