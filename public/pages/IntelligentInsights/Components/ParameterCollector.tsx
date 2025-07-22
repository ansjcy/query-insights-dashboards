/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPanel, EuiText, EuiButton, EuiFlexGroup, EuiFlexItem, EuiFieldText, EuiFormRow } from '@elastic/eui';

interface ParameterCollectorProps {
  interruptMessage: string;
  onSendMessage: (message: string, data?: Record<string, any>) => void;
  disabled: boolean;
  approveLoading: boolean;
  interruptData: {
    parameter_names: string[];
  };
}

export const ParameterCollector: React.FC<ParameterCollectorProps> = ({
  interruptMessage,
  onSendMessage,
  disabled,
  approveLoading,
  interruptData,
}) => {
  const [parameters, setParameters] = useState<Record<string, string>>({});

  const handleParameterChange = (paramName: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleSubmit = () => {
    onSendMessage('Parameters collected', { parameters });
  };

  return (
    <EuiPanel paddingSize="m" style={{ backgroundColor: '#F0FFF0' }}>
      <EuiText size="s">
        <strong>Parameter Collection Required</strong>
      </EuiText>
      <EuiText size="s">{interruptMessage}</EuiText>
      <EuiFlexGroup direction="column" gutterSize="s">
        {interruptData.parameter_names.map((paramName, index) => (
          <EuiFlexItem key={index}>
            <EuiFormRow label={paramName}>
              <EuiFieldText
                value={parameters[paramName] || ''}
                onChange={(e) => handleParameterChange(paramName, e.target.value)}
                disabled={disabled}
              />
            </EuiFormRow>
          </EuiFlexItem>
        ))}
        <EuiFlexItem>
          <EuiButton
            size="s"
            onClick={handleSubmit}
            disabled={disabled}
            isLoading={approveLoading}
          >
            Submit Parameters
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};