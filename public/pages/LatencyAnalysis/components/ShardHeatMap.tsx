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
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiIcon,
  EuiToolTip,
} from '@elastic/eui';
import { LatencyRecord } from '../utils/dataLoader';

interface ShardHeatMapProps {
  record: LatencyRecord;
}

export const ShardHeatMap: React.FC<ShardHeatMapProps> = ({ record }) => {
  const getLatencyColor = (latency: number) => {
    if (latency > 5000) return '#d63031'; // Red for > 5s
    if (latency > 2000) return '#e17055'; // Orange for > 2s
    if (latency > 1000) return '#fdcb6e'; // Yellow for > 1s
    if (latency > 500) return '#a7d957';  // Light green for > 500ms
    return '#00b894'; // Green for < 500ms
  };

  const getLatencyIntensity = (latency: number) => {
    const maxLatency = Math.max(...record.shardPerformance.map(s => s.latency));
    return Math.min(latency / maxLatency, 1);
  };

  const shardGrid = () => {
    const shardsPerRow = 8;
    const rows = [];
    
    for (let i = 0; i < record.shardPerformance.length; i += shardsPerRow) {
      const rowShards = record.shardPerformance.slice(i, i + shardsPerRow);
      rows.push(
        <EuiFlexGroup key={i} gutterSize="xs" justifyContent="center">
          {rowShards.map((shard, index) => (
            <EuiFlexItem key={shard.shardId} grow={false}>
              <EuiToolTip
                content={
                  <div>
                    <strong>Shard:</strong> {shard.shardId}<br/>
                    <strong>Node:</strong> {shard.nodeId}<br/>
                    <strong>Latency:</strong> {shard.latency.toFixed(1)}ms<br/>
                    <strong>Status:</strong> {shard.status}<br/>
                    <strong>Docs:</strong> {shard.docCount.toLocaleString()}
                  </div>
                }
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: getLatencyColor(shard.latency),
                    opacity: 0.3 + (getLatencyIntensity(shard.latency) * 0.7),
                    border: shard.status === 'failed' ? '2px solid #d63031' : '1px solid #ccc',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: shard.latency > 2000 ? 'white' : 'black',
                  }}
                >
                  {shard.status === 'failed' ? '!' : shard.shardId.split('-')[1] || index}
                </div>
              </EuiToolTip>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      );
    }
    return rows;
  };

  const legendItems = [
    { color: '#00b894', label: '< 500ms', range: 'Fast' },
    { color: '#a7d957', label: '500ms - 1s', range: 'Good' },
    { color: '#fdcb6e', label: '1s - 2s', range: 'Slow' },
    { color: '#e17055', label: '2s - 5s', range: 'Very Slow' },
    { color: '#d63031', label: '> 5s', range: 'Critical' },
  ];

  const nodeStats = record.nodePerformance.map(node => ({
    nodeId: node.nodeId,
    avgLatency: node.avgLatency,
    shardCount: record.shardPerformance.filter(s => s.nodeId === node.nodeId).length,
    status: node.status,
  }));

  return (
    <EuiPanel paddingSize="l">
      <EuiTitle size="m">
        <h3>
          <EuiIcon type="grid" size="m" /> Shard Latency Heat Map
        </h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        Visual representation of query latency across shards and nodes
      </EuiText>
      
      <EuiSpacer size="l" />

      {/* Heat Map Grid */}
      <div style={{ textAlign: 'center' }}>
        {shardGrid()}
      </div>

      <EuiSpacer size="l" />

      {/* Legend */}
      <EuiFlexGroup gutterSize="s" justifyContent="center" wrap>
        <EuiFlexItem grow={false}>
          <EuiText size="xs"><strong>Latency Legend:</strong></EuiText>
        </EuiFlexItem>
        {legendItems.map((item, index) => (
          <EuiFlexItem key={index} grow={false}>
            <EuiFlexGroup alignItems="center" gutterSize="xs">
              <EuiFlexItem grow={false}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: item.color,
                    borderRadius: '2px',
                  }}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="xs">{item.label}</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Node Performance Summary */}
      <EuiTitle size="s">
        <h4>Node Performance Summary</h4>
      </EuiTitle>
      <EuiSpacer size="s" />
      
      <EuiFlexGroup wrap gutterSize="s">
        {nodeStats.map((node, index) => (
          <EuiFlexItem key={index} grow={false}>
            <EuiBadge
              color={node.status === 'failed' ? 'danger' : 
                     node.avgLatency > 2000 ? 'warning' : 
                     node.avgLatency > 1000 ? 'primary' : 'success'}
            >
              {node.nodeId}: {node.avgLatency.toFixed(0)}ms ({node.shardCount} shards)
            </EuiBadge>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      {/* Summary Stats */}
      <EuiFlexGroup gutterSize="l">
        <EuiFlexItem>
          <EuiText size="s">
            <strong>Total Shards:</strong> {record.shardPerformance.length}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s">
            <strong>Failed Shards:</strong> {record.shardPerformance.filter(s => s.status === 'failed').length}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s">
            <strong>Slowest Shard:</strong> {Math.max(...record.shardPerformance.map(s => s.latency)).toFixed(1)}ms
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};