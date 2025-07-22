/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { TicketOption } from '../types/langgraph';

interface TicketPickerProps {
  interruptMessage: string;
  ticketOptions: TicketOption[];
  onSendMessage: (message: string, data?: Record<string, any>) => void;
  disabled: boolean;
  approveLoading: boolean;
}

export const TicketPicker: React.FC<TicketPickerProps> = ({
  interruptMessage,
  ticketOptions,
  onSendMessage,
  disabled,
  approveLoading,
}) => {
  return (
    <EuiPanel paddingSize="m" style={{ backgroundColor: '#F8F0FF' }}>
      <EuiText size="s">
        <strong>Ticket Selection Required</strong>
      </EuiText>
      <EuiText size="s">{interruptMessage}</EuiText>
      <EuiFlexGroup direction="column" gutterSize="s">
        {ticketOptions.map((ticket, index) => (
          <EuiFlexItem key={index}>
            <EuiButton
              size="s"
              onClick={() => onSendMessage(`Selected ticket: ${ticket.title}`, { selected_ticket: ticket })}
              disabled={disabled}
              isLoading={approveLoading}
            >
              {ticket.title} - {ticket.status}
            </EuiButton>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </EuiPanel>
  );
};