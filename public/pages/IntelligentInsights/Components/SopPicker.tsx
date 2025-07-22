/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { SopOption } from '../types/langgraph';

interface SopPickerProps {
  interruptMessage: string;
  sopOptions: SopOption[];
  onSendMessage: (message: string, data?: Record<string, any>) => void;
  disabled: boolean;
  approveLoading: boolean;
}

export const SopPicker: React.FC<SopPickerProps> = ({
  interruptMessage,
  sopOptions,
  onSendMessage,
  disabled,
  approveLoading,
}) => {
  return (
    <EuiPanel paddingSize="m" style={{ backgroundColor: '#F0F8FF' }}>
      <EuiText size="s">
        <strong>SOP Selection Required</strong>
      </EuiText>
      <EuiText size="s">{interruptMessage}</EuiText>
      <EuiFlexGroup direction="column" gutterSize="s">
        {sopOptions.map((sop, index) => (
          <EuiFlexItem key={index}>
            <EuiButton
              size="s"
              onClick={() => onSendMessage(`Selected SOP: ${sop.title}`, { selected_sop: sop })}
              disabled={disabled}
              isLoading={approveLoading}
            >
              {sop.title}
            </EuiButton>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </EuiPanel>
  );
};