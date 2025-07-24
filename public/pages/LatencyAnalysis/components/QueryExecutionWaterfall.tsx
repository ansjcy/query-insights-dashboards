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
  EuiProgress,
  EuiToolTip,
} from '@elastic/eui';
import { LatencyRecord } from '../utils/dataLoader';

interface QueryExecutionWaterfallProps {
  record: LatencyRecord;
}

interface ExecutionPhase {
  name: string;
  duration: number;
  startTime: number;
  color: string;
  description: string;
  details?: string;
}

export const QueryExecutionWaterfall: React.FC<QueryExecutionWaterfallProps> = ({ record }) => {
  // Generate execution phases based on latency data
  const generateExecutionPhases = (): ExecutionPhase[] => {
    const totalLatency = record.avgLatency;
    
    return [
      {
        name: 'Query Parsing',
        duration: totalLatency * 0.05, // ~5% of total time
        startTime: 0,
        color: '#6DCCB1',
        description: 'Parse and validate query DSL',
        details: 'Query structure validation, field mapping resolution'
      },
      {
        name: 'Query Planning',
        duration: totalLatency * 0.10, // ~10% of total time
        startTime: totalLatency * 0.05,
        color: '#54B399',
        description: 'Generate execution plan and shard targeting',
        details: 'Shard selection, routing decisions, execution optimization'
      },
      {
        name: 'Query Phase',
        duration: totalLatency * 0.40, // ~40% of total time
        startTime: totalLatency * 0.15,
        color: '#6092C0',
        description: 'Execute query on each shard',
        details: 'Term lookup, scoring, filtering across all targeted shards'
      },
      {
        name: 'Fetch Phase',
        duration: totalLatency * 0.30, // ~30% of total time
        startTime: totalLatency * 0.55,
        color: '#D36086', 
        description: 'Retrieve document contents',
        details: 'Document field retrieval, _source loading, highlighting'
      },
      {
        name: 'Reduce Phase',
        duration: totalLatency * 0.15, // ~15% of total time
        startTime: totalLatency * 0.85,
        color: '#9170B8',
        description: 'Merge and sort results',
        details: 'Result aggregation, global sorting, response formatting'
      }
    ];
  };

  const phases = generateExecutionPhases();
  const totalDuration = Math.max(...phases.map(p => p.startTime + p.duration));

  const getPhaseWidth = (duration: number) => {
    return (duration / totalDuration) * 100;
  };

  const getPhaseOffset = (startTime: number) => {
    return (startTime / totalDuration) * 100;
  };

  const formatDuration = (duration: number) => {
    return `${duration.toFixed(1)}ms`;
  };

  const getPerformanceColor = (phase: ExecutionPhase) => {
    const percentage = (phase.duration / totalDuration) * 100;
    if (percentage > 50) return 'danger';
    if (percentage > 30) return 'warning';
    return 'success';
  };

  return (
    <EuiPanel paddingSize="l">
      <EuiTitle size="m">
        <h3>
          <EuiIcon type="timeline" size="m" /> Query Execution Waterfall
        </h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        Breakdown of query execution phases and timing
      </EuiText>
      
      <EuiSpacer size="l" />

      {/* Timeline Visualization */}
      <div style={{ position: 'relative', height: '60px', background: '#f7f7f7', borderRadius: '4px' }}>
        {phases.map((phase, index) => (
          <EuiToolTip
            key={index}
            content={
              <div>
                <strong>{phase.name}</strong><br/>
                <em>{phase.description}</em><br/>
                Duration: {formatDuration(phase.duration)}<br/>
                {phase.details}
              </div>
            }
          >
            <div
              style={{
                position: 'absolute',
                left: `${getPhaseOffset(phase.startTime)}%`,
                width: `${getPhaseWidth(phase.duration)}%`,
                height: '40px',
                top: '10px',
                backgroundColor: phase.color,
                borderRadius: '2px',
                border: '1px solid #ddd',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
              }}
            >
              {phase.name}
            </div>
          </EuiToolTip>
        ))}
      </div>

      <EuiSpacer size="l" />

      {/* Phase Details */}
      <div>
        {phases.map((phase, index) => (
          <EuiFlexGroup key={index} alignItems="center" gutterSize="m" style={{ marginBottom: '8px' }}>
            <EuiFlexItem grow={false} style={{ width: '20px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: phase.color,
                  borderRadius: '2px',
                  border: '1px solid #ddd',
                }}
              />
            </EuiFlexItem>
            <EuiFlexItem style={{ minWidth: '140px' }}>
              <EuiText size="s">
                <strong>{phase.name}</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiProgress
                value={phase.duration}
                max={totalDuration}
                color={getPerformanceColor(phase)}
                size="m"
                style={{ width: '200px' }}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: '80px' }}>
              <EuiBadge color={getPerformanceColor(phase)}>
                {formatDuration(phase.duration)}
              </EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ width: '60px', textAlign: 'right' }}>
              <EuiText size="xs" color="subdued">
                {((phase.duration / totalDuration) * 100).toFixed(1)}%
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="xs" color="subdued">
                {phase.description}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        ))}
      </div>

      <EuiSpacer size="l" />

      {/* Summary Statistics */}
      <EuiFlexGroup gutterSize="l">
        <EuiFlexItem>
          <EuiFlexGroup direction="column" gutterSize="s">
            <EuiFlexItem>
              <EuiText size="s">
                <strong>Total Execution Time:</strong> {formatDuration(totalDuration)}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <strong>Slowest Phase:</strong> {phases.reduce((prev, curr) => prev.duration > curr.duration ? prev : curr).name}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup direction="column" gutterSize="s">
            <EuiFlexItem>
              <EuiText size="s">
                <strong>Query Efficiency:</strong>{' '}
                <EuiBadge color={totalDuration < 1000 ? 'success' : totalDuration < 5000 ? 'warning' : 'danger'}>
                  {totalDuration < 1000 ? 'Excellent' : totalDuration < 5000 ? 'Good' : 'Needs Optimization'}
                </EuiBadge>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <strong>Shards Involved:</strong> {record.shardPerformance?.length || 0}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      {/* Performance Insights */}
      {totalDuration > 5000 && (
        <>
          <EuiSpacer size="m" />
          <EuiText size="s" color="danger">
            <EuiIcon type="alert" size="s" /> 
            <strong> Performance Alert:</strong> Query execution time exceeds 5 seconds. Consider optimization strategies.
          </EuiText>
        </>
      )}
    </EuiPanel>
  );
};