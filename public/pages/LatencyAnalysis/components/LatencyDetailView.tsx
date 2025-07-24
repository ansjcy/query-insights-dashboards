/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { LatencyRecord, loadLatencyData } from '../utils/dataLoader';
import { QueryExecutionWaterfall, QueryExecutionAggregatedWaterfall } from './QueryExecutionWaterfall';
import { ShardHeatMap } from './ShardHeatMap';
import { CPUUtilizationChart } from './CPUUtilizationChart';
import { QueryLatencyChart } from './QueryLatencyChart';
import { JVMUsageChart } from './JVMUsageChart';
import { QueryOptimizationPanel } from './QueryOptimizationPanel';

interface LatencyDetailViewProps {
  record: LatencyRecord;
  onBack: () => void;
}

export const LatencyDetailView: React.FC<LatencyDetailViewProps> = ({ record, onBack }) => {
  const [allRecords, setAllRecords] = useState<LatencyRecord[]>([]);

  useEffect(() => {
    const loadAllRecords = async () => {
      try {
        const records = await loadLatencyData();
        setAllRecords(records);
      } catch (error) {
        console.error('Failed to load all latency records:', error);
      }
    };
    loadAllRecords();
  }, []);

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
      title: 'Query Pattern Hash',
      description: record.queryHash,
    },
    {
      title: 'Group Avg Latency',
      description: (
        <EuiText>
          <strong>{record.avgLatency.toFixed(1)}ms</strong>
        </EuiText>
      ),
    },
    {
      title: 'Peak Latency Observed',
      description: (
        <EuiText color={record.maxLatency > 10000 ? 'danger' : 'default'}>
          <strong>{record.maxLatency.toFixed(1)}ms</strong>
        </EuiText>
      ),
    },
    {
      title: 'Pattern Frequency',
      description: `${record.frequency} similar queries`,
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
Back to Search Performance Alerts
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size="l">
            <h1>Search Performance Alert</h1>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHealth color={getSeverityColor(record.severity)}>
            {record.severity.toUpperCase()} LATENCY
          </EuiHealth>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      {/* Query Group Alert Context */}
      <EuiPanel paddingSize="m" color="subdued">
        <EuiText size="s">
          <p>
            <strong>About this alert:</strong> This performance alert represents a pattern of similar queries 
            that have been identified as causing latency issues in your OpenSearch cluster. The analysis 
            below shows aggregated performance characteristics and execution patterns across multiple 
            queries matching this group pattern.
          </p>
        </EuiText>
      </EuiPanel>

      <EuiSpacer size="l" />

      {/* Alert Pattern and Sample Query Section */}
      <EuiFlexGroup style={{ alignItems: 'stretch' }} gutterSize="l">
        <EuiFlexItem grow={1}>
          <EuiPanel paddingSize="l" style={{ height: '100%' }}>
            <EuiTitle size="m">
              <h3>Alert Summary</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiText size="xs" color="subdued">
              Performance characteristics for this search query group pattern
            </EuiText>
            <EuiSpacer />
            <EuiDescriptionList listItems={metadataItems} />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem grow={1}>
          <EuiPanel paddingSize="l" style={{ height: '100%' }}>
            <EuiTitle size="m">
              <h3>Query Pattern Sample</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiText size="xs" color="subdued">
              Representative query from this group pattern ({record.frequency} similar queries detected)
            </EuiText>
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

      {/* Query Latency Chart */}
      <QueryLatencyChart />

      <EuiSpacer size="l" />

      {/* CPU Utilization Chart */}
      <CPUUtilizationChart record={record} />

      <EuiSpacer size="l" />

      {/* JVM Memory Usage Chart */}
      <JVMUsageChart />

      <EuiSpacer size="l" />

      {/* Query Execution Waterfall and Shard Heat Map Side by Side */}
      <EuiFlexGroup style={{ alignItems: 'stretch' }} gutterSize="l">
        <EuiFlexItem grow={1}>
          <QueryExecutionAggregatedWaterfall records={allRecords} />
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