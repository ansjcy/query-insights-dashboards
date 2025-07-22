/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiSelect,
  EuiFormRow,
  EuiText,
  EuiToolTip,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
} from '@elastic/eui';

export interface WorkflowOption {
  value: string;
  text: string;
  description: string;
  icon: string;
}

const WORKFLOW_OPTIONS: WorkflowOption[] = [
  {
    value: 'auto_route',
    text: 'Auto Select',
    description: 'Let the AI assistant automatically choose the best workflow based on your request',
    icon: 'gear',
  },
  {
    value: 'rca',
    text: 'Root Cause Analysis',
    description: 'Analyze cluster performance issues, troubleshoot active problems, and perform root cause analysis',
    icon: 'search',
  },
  {
    value: 'opensearch_sop_search',
    text: 'Documentation Search',
    description: 'Search internal documentation for troubleshooting guides, best practices, and known issues',
    icon: 'documentation',
  },
  {
    value: 'opensearch_sim_search',
    text: 'Similar Issues Search',
    description: 'Find similar tickets and past issues with remediation steps and solutions',
    icon: 'list',
  },
  {
    value: 'opensearch_sop_execute',
    text: 'Execute SOPs',
    description: 'Execute Standard Operating Procedures through automated tools or guidance',
    icon: 'play',
  },
];

interface WorkflowSelectorProps {
  selectedWorkflow: string;
  onWorkflowChange: (workflow: string) => void;
  disabled?: boolean;
}

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  selectedWorkflow,
  onWorkflowChange,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onWorkflowChange(e.target.value);
  };

  const selectedOption = WORKFLOW_OPTIONS.find(option => option.value === selectedWorkflow);

  return (
    <EuiFormRow label="Agent Workflow">
      <EuiToolTip content={selectedOption?.description || ''}>
        <EuiSelect
          value={selectedWorkflow}
          onChange={handleChange}
          disabled={disabled}
          options={WORKFLOW_OPTIONS.map(option => ({
            value: option.value,
            text: option.text,
          }))}
          prepend={
            <EuiFlexGroup gutterSize="xs" alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiIcon type={selectedOption?.icon || 'gear'} />
              </EuiFlexItem>
            </EuiFlexGroup>
          }
        />
      </EuiToolTip>
    </EuiFormRow>
  );
};

export { WORKFLOW_OPTIONS };