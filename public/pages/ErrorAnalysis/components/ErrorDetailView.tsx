/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiText,
  EuiCode,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiHealth,
  EuiButton,
  EuiDescriptionList,
  EuiIcon,
  EuiMarkdownFormat,
} from '@elastic/eui';
import { ErrorRecord, parseStackTrace } from '../utils/dataLoader';
import { SequenceDiagram } from './SequenceDiagram';
import { ServiceGraph } from './ServiceGraph';

interface ErrorDetailViewProps {
  error: ErrorRecord;
  onBack: () => void;
}

export const ErrorDetailView: React.FC<ErrorDetailViewProps> = ({ error, onBack }) => {
  const stackTrace = parseStackTrace(error.rawStackTrace);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'subdued';
    }
  };

  const metadataItems = [
    {
      title: 'Error ID',
      description: error.id,
    },
    {
      title: 'Category',
      description: <EuiBadge color="primary">{error.category}</EuiBadge>,
    },
    {
      title: 'Frequency',
      description: `${error.frequency} occurrences`,
    },
    {
      title: 'Last Seen',
      description: new Date(error.timestamp).toLocaleString(),
    },
    {
      title: 'Affected Components',
      description: (
        <EuiFlexGroup gutterSize="s" wrap>
          {error.affectedComponents.map((component, index) => (
            <EuiFlexItem grow={false} key={index}>
              <EuiBadge color="accent" size="s">
                {component}
              </EuiBadge>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <EuiFlexGroup alignItems="center" gutterSize="m">
        <EuiFlexItem grow={false}>
          <EuiButton
            onClick={onBack}
            iconType="arrowLeft"
            size="s"
          >
            Back to Error List
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size="l">
            <h1>{error.title}</h1>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHealth color={getSeverityColor(error.severity)}>
            {error.severity.toUpperCase()} SEVERITY
          </EuiHealth>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Raw Stack Trace and Error Metadata Section */}
      <EuiFlexGroup style={{ alignItems: 'stretch' }} gutterSize="l">
        <EuiFlexItem grow={1}>
          <EuiPanel paddingSize="l" style={{ height: '100%' }}>
            <EuiTitle size="m">
              <h3>Error Metadata</h3>
            </EuiTitle>
            <EuiSpacer />
            <EuiDescriptionList listItems={metadataItems} />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem grow={1}>
          <EuiPanel paddingSize="l" style={{ height: '100%' }}>
            <EuiTitle size="m">
              <h3>Raw Stack Trace</h3>
            </EuiTitle>
            <EuiSpacer />
            <EuiCodeBlock language="java" paddingSize="s" isCopyable style={{ height: '400px', overflow: 'auto' }}>
              {error.rawStackTrace}
            </EuiCodeBlock>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Sequence Diagram and Cluster Node Error Distribution Side by Side */}
      <EuiFlexGroup style={{ alignItems: 'stretch' }} gutterSize="l">
        <EuiFlexItem grow={1}>
          <SequenceDiagram error={error} />
        </EuiFlexItem>
        <EuiFlexItem grow={1}>
          <ServiceGraph error={error} />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Root Cause Analysis Section */}
      {error.rootCause && (
        <>
          <EuiPanel paddingSize="l">
            <EuiMarkdownFormat>
              {error.rootCause}
            </EuiMarkdownFormat>
          </EuiPanel>
          <EuiSpacer size="l" />
        </>
      )}

      {/* Suggested Fix Section */}
      {error.suggestedFix && (
        <EuiPanel paddingSize="l">
          <EuiMarkdownFormat>
            {error.suggestedFix}
          </EuiMarkdownFormat>
        </EuiPanel>
      )}

    </div>
  );
};