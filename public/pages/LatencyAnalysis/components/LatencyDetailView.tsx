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
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiHealth,
  EuiButton,
  EuiDescriptionList,
  EuiMarkdownFormat,
} from '@elastic/eui';
import { LatencyRecord } from '../utils/dataLoader';
import { QueryExecutionWaterfall } from './QueryExecutionWaterfall';
import { ShardHeatMap } from './ShardHeatMap';
import { HistoricalLatencyChart } from './HistoricalLatencyChart';
import { QueryOptimizationPanel } from './QueryOptimizationPanel';

interface LatencyDetailViewProps {
  record: LatencyRecord;
  onBack: () => void;
}

export const LatencyDetailView: React.FC<LatencyDetailViewProps> = ({ record, onBack }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'success';
      default: return 'subdued';
    }
  };

  const metadataItems = [
    {
      title: 'Query Hash',
      description: record.queryHash,
    },
    {
      title: 'Average Latency',
      description: (
        <EuiText>
          <strong>{record.avgLatency.toFixed(1)}ms</strong>
        </EuiText>
      ),
    },
    {
      title: 'Max Latency',
      description: (
        <EuiText color={record.maxLatency > 10000 ? 'danger' : 'default'}>
          <strong>{record.maxLatency.toFixed(1)}ms</strong>
        </EuiText>
      ),
    },
    {
      title: 'Frequency',
      description: `${record.frequency} occurrences`,
    },
    {
      title: 'Last Seen',
      description: new Date(record.timestamp).toLocaleString(),
    },
    {
      title: 'Affected Shards',
      description: (
        <EuiFlexGroup gutterSize="s" wrap>
          {record.affectedShards.map((shard, index) => (
            <EuiFlexItem grow={false} key={index}>
              <EuiBadge color="accent" size="s">
                {shard}
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
            Back to Latency List
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size="l">
            <h1>Query Latency Analysis</h1>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHealth color={getSeverityColor(record.severity)}>
            {record.severity.toUpperCase()} LATENCY
          </EuiHealth>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Query Details and Metadata Section */}
      <EuiFlexGroup style={{ alignItems: 'stretch' }} gutterSize="l">
        <EuiFlexItem grow={1}>
          <EuiPanel paddingSize="l" style={{ height: '100%' }}>
            <EuiTitle size="m">
              <h3>Query Metadata</h3>
            </EuiTitle>
            <EuiSpacer />
            <EuiDescriptionList listItems={metadataItems} />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem grow={1}>
          <EuiPanel paddingSize="l" style={{ height: '100%' }}>
            <EuiTitle size="m">
              <h3>Query</h3>
            </EuiTitle>
            <EuiSpacer />
            <EuiCodeBlock 
              language="json" 
              paddingSize="s" 
              isCopyable 
              style={{ height: '400px', overflow: 'auto' }}
            >
              {record.queryText || JSON.stringify(record.queryStructure, null, 2)}
            </EuiCodeBlock>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Historical Latency Trend */}
      <HistoricalLatencyChart record={record} />

      <EuiSpacer size="l" />

      {/* Query Execution Waterfall and Shard Heat Map Side by Side */}
      <EuiFlexGroup style={{ alignItems: 'stretch' }} gutterSize="l">
        <EuiFlexItem grow={1}>
          <QueryExecutionWaterfall record={record} />
        </EuiFlexItem>
        <EuiFlexItem grow={1}>
          <ShardHeatMap record={record} />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Root Cause Analysis Section */}
      {record.rootCause && (
        <>
          <EuiPanel paddingSize="l">
            <EuiMarkdownFormat>
              {record.rootCause}
            </EuiMarkdownFormat>
          </EuiPanel>
          <EuiSpacer size="l" />
        </>
      )}

      {/* Query Optimization Recommendations */}
      <QueryOptimizationPanel record={record} />
    </div>
  );
};