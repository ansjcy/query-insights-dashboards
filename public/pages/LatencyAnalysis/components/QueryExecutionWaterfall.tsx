/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
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
  EuiButtonGroup,
  EuiStat,
  EuiHorizontalRule,
} from '@elastic/eui';
import { LatencyRecord } from '../utils/dataLoader';

interface QueryExecutionAggregatedWaterfallProps {
  records: LatencyRecord[];
  timeRange?: { start: string; end: string };
}

// Legacy single-record interface for backward compatibility
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

interface AggregatedPhaseData {
  name: string;
  p50Duration: number;
  p90Duration: number;
  p95Duration: number;
  p99Duration: number;
  avgDuration: number;
  medianDuration: number;
  color: string;
  description: string;
  trendData: PhaseTimeTrend[];
  queryCount: number;
}

interface PhaseTimeTrend {
  timestamp: string;
  avgDuration: number;
  queryCount: number;
}

type ViewMode = 'p50' | 'p90' | 'p95' | 'p99' | 'avg';

// Aggregated multi-query analysis component
export const QueryExecutionAggregatedWaterfall: React.FC<QueryExecutionAggregatedWaterfallProps> = ({ 
  records, 
  timeRange 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('p95');

  // Compute phase timing based on actual query characteristics
  const computePhaseTimingFromQuery = (record: LatencyRecord): ExecutionPhase[] => {
    const totalLatency = record.avgLatency;
    const queryComplexity = analyzeQueryComplexity(record);
    const shardCount = record.affectedShards.length;
    const resultSize = extractResultSize(record.queryStructure);
    const hasAggregations = hasQueryAggregations(record.queryStructure);

    // Dynamic phase allocation based on query characteristics
    const phaseAllocation = calculateDynamicPhaseAllocation({
      totalLatency,
      queryComplexity,
      shardCount,
      resultSize,
      hasAggregations
    });

    return [
      {
        name: 'Query Parsing',
        duration: totalLatency * phaseAllocation.parsing,
        startTime: 0,
        color: '#6DCCB1',
        description: 'Parse and validate query DSL',
        details: `Complexity: ${queryComplexity.level}, Fields: ${queryComplexity.fieldCount}`
      },
      {
        name: 'Query Planning',
        duration: totalLatency * phaseAllocation.planning,
        startTime: totalLatency * phaseAllocation.parsing,
        color: '#54B399',
        description: 'Generate execution plan and shard targeting',
        details: `Shards: ${shardCount}, Strategy: ${queryComplexity.executionStrategy}`
      },
      {
        name: 'Query Phase',
        duration: totalLatency * phaseAllocation.query,
        startTime: totalLatency * (phaseAllocation.parsing + phaseAllocation.planning),
        color: '#6092C0',
        description: 'Execute query on each shard',
        details: `Scan type: ${queryComplexity.scanType}, Shards: ${shardCount}`
      },
      {
        name: 'Fetch Phase',
        duration: totalLatency * phaseAllocation.fetch,
        startTime: totalLatency * (phaseAllocation.parsing + phaseAllocation.planning + phaseAllocation.query),
        color: '#D36086',
        description: 'Retrieve document contents',
        details: `Result size: ${resultSize}, Fields loaded: ${queryComplexity.fieldsToLoad}`
      },
      {
        name: 'Reduce Phase',
        duration: totalLatency * phaseAllocation.reduce,
        startTime: totalLatency * (1 - phaseAllocation.reduce),
        color: '#9170B8',
        description: 'Merge and sort results',
        details: `Aggregations: ${hasAggregations ? 'Yes' : 'No'}, Sorting: ${queryComplexity.hasSorting ? 'Yes' : 'No'}`
      }
    ];
  };

  // Aggregate phase data across all records
  const aggregatedPhases = useMemo(() => {
    if (!records || records.length === 0) return [];

    const allPhaseData = records.map(record => computePhaseTimingFromQuery(record));
    const phaseNames = ['Query Parsing', 'Query Planning', 'Query Phase', 'Fetch Phase', 'Reduce Phase'];
    
    return phaseNames.map((phaseName, phaseIndex) => {
      const durations = allPhaseData.map(phases => phases[phaseIndex].duration).sort((a, b) => a - b);
      const colors = ['#6DCCB1', '#54B399', '#6092C0', '#D36086', '#9170B8'];
      const descriptions = [
        'Parse and validate query DSL',
        'Generate execution plan and shard targeting', 
        'Execute query on each shard',
        'Retrieve document contents',
        'Merge and sort results'
      ];

      // Calculate percentiles
      const p50 = percentile(durations, 0.5);
      const p90 = percentile(durations, 0.9); 
      const p95 = percentile(durations, 0.95);
      const p99 = percentile(durations, 0.99);
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const median = p50;

      // Generate trend data (group by time periods)
      const trendData = generateTrendData(records, phaseIndex, phaseName);

      return {
        name: phaseName,
        p50Duration: p50,
        p90Duration: p90,
        p95Duration: p95,
        p99Duration: p99,
        avgDuration: avg,
        medianDuration: median,
        color: colors[phaseIndex],
        description: descriptions[phaseIndex],
        trendData,
        queryCount: records.length
      } as AggregatedPhaseData;
    });
  }, [records]);

  const getCurrentPhaseView = (phase: AggregatedPhaseData) => {
    switch (viewMode) {
      case 'p50': return phase.p50Duration;
      case 'p90': return phase.p90Duration;
      case 'p95': return phase.p95Duration;
      case 'p99': return phase.p99Duration;
      case 'avg': return phase.avgDuration;
      default: return phase.p95Duration;
    }
  };

  const totalDuration = aggregatedPhases.reduce((sum, phase) => sum + getCurrentPhaseView(phase), 0);

  const viewModeOptions = [
    { id: 'p50', label: 'P50 (Median)' },
    { id: 'p90', label: 'P90' },
    { id: 'p95', label: 'P95' },
    { id: 'p99', label: 'P99' },
    { id: 'avg', label: 'Average' },
  ];

  const getPhaseWidth = (duration: number) => {
    return totalDuration > 0 ? (duration / totalDuration) * 100 : 0;
  };

  const getPhaseOffset = (phases: AggregatedPhaseData[], currentIndex: number) => {
    const precedingDuration = phases
      .slice(0, currentIndex)
      .reduce((sum, phase) => sum + getCurrentPhaseView(phase), 0);
    return totalDuration > 0 ? (precedingDuration / totalDuration) * 100 : 0;
  };

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration.toFixed(1)}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (phase: AggregatedPhaseData) => {
    const percentage = totalDuration > 0 ? (getCurrentPhaseView(phase) / totalDuration) * 100 : 0;
    if (percentage > 50) return 'danger';
    if (percentage > 30) return 'warning';
    return 'success';
  };

  if (!records || records.length === 0) {
    return (
      <EuiPanel paddingSize="l">
        <EuiText>No query data available for analysis</EuiText>
      </EuiPanel>
    );
  }

  return (
    <EuiPanel paddingSize="l">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiTitle size="m">
            <h3>
              <EuiIcon type="timeline" size="m" /> Search Query Group Execution Patterns
            </h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonGroup
            legend="View mode selection"
            options={viewModeOptions}
            idSelected={viewMode}
            onChange={(id) => setViewMode(id as ViewMode)}
            buttonSize="s"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        Query group performance patterns across {records.length} queries showing {viewModeOptions.find(opt => opt.id === viewMode)?.label} execution timing
      </EuiText>

      <EuiSpacer size="l" />

      {/* Summary Stats */}
      <EuiFlexGroup gutterSize="l">
        <EuiFlexItem>
          <EuiStat
            title={formatDuration(totalDuration)}
            description={`Typical Execution Time (${viewModeOptions.find(opt => opt.id === viewMode)?.label})`}
            color="primary"
            titleSize="s"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            title={records.length.toString()}
            description="Group Queries"
            color="success"
            titleSize="s"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            title={aggregatedPhases.find(p => 
              getCurrentPhaseView(p) === Math.max(...aggregatedPhases.map(ph => getCurrentPhaseView(ph)))
            )?.name || 'N/A'}
            description="Bottleneck Phase"
            color="warning"
            titleSize="s"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            title={totalDuration < 1000 ? 'Excellent' : totalDuration < 5000 ? 'Good' : 'Needs Optimization'}
            description="Group Performance"
            color={totalDuration < 1000 ? 'success' : totalDuration < 5000 ? 'warning' : 'danger'}
            titleSize="s"
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiHorizontalRule />

      {/* Aggregated Timeline Visualization */}
      <div style={{ position: 'relative', height: '60px', background: '#f7f7f7', borderRadius: '4px' }}>
        {aggregatedPhases.map((phase, index) => {
          const width = getPhaseWidth(getCurrentPhaseView(phase));
          const offset = getPhaseOffset(aggregatedPhases, index);
          
          return (
            <EuiToolTip
              key={index}
              content={
                <div>
                  <strong>{phase.name}</strong><br/>
                  <em>{phase.description}</em><br/>
                  {viewMode}: {formatDuration(getCurrentPhaseView(phase))}<br/>
                  P50: {formatDuration(phase.p50Duration)}<br/>
                  P95: {formatDuration(phase.p95Duration)}<br/>
                  P99: {formatDuration(phase.p99Duration)}<br/>
                  Group Size: {phase.queryCount} queries
                </div>
              }
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${offset}%`,
                  width: `${width}%`,
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
                {width > 15 ? phase.name : ''}
              </div>
            </EuiToolTip>
          );
        })}
      </div>

      <EuiSpacer size="l" />

      {/* Detailed Phase Analysis */}
      <div>
        {aggregatedPhases.map((phase, index) => (
          <EuiFlexGroup key={index} alignItems="center" gutterSize="m" style={{ marginBottom: '12px' }}>
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
            <EuiFlexItem style={{ minWidth: '200px' }}>
              <EuiProgress
                value={getCurrentPhaseView(phase)}
                max={totalDuration}
                color={getPerformanceColor(phase)}
                size="m"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: '100px' }}>
              <EuiBadge color={getPerformanceColor(phase)}>
                {formatDuration(getCurrentPhaseView(phase))}
              </EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ width: '60px', textAlign: 'right' }}>
              <EuiText size="xs" color="subdued">
                {totalDuration > 0 ? ((getCurrentPhaseView(phase) / totalDuration) * 100).toFixed(1) : 0}%
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <EuiText size="xs" color="subdued">
                  P50: {formatDuration(phase.p50Duration)}
                </EuiText>
                <EuiText size="xs" color="subdued">
                  P95: {formatDuration(phase.p95Duration)}
                </EuiText>
                <EuiText size="xs" color="subdued">
                  P99: {formatDuration(phase.p99Duration)}
                </EuiText>
              </div>
            </EuiFlexItem>
          </EuiFlexGroup>
        ))}
      </div>

      {/* Performance Insights */}
      {totalDuration > 5000 && (
        <>
          <EuiSpacer size="m" />
          <EuiText size="s" color="danger">
            <EuiIcon type="alert" size="s" /> 
            <strong> Query Group Performance Alert:</strong> This query group pattern shows execution times exceeding 5 seconds - optimization recommended.
          </EuiText>
        </>
      )}
    </EuiPanel>
  );
};

// Legacy component for backward compatibility  
export const QueryExecutionWaterfall: React.FC<QueryExecutionWaterfallProps> = ({ record }) => {
  // Generate execution phases using dynamic allocation instead of hardcoded percentages
  const generateExecutionPhases = (): ExecutionPhase[] => {
    const phases = computePhaseTimingFromRecord(record);
    console.log('Generated phases for record:', record.id, phases);
    return phases;
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
          <EuiIcon type="timeline" size="m" /> Query Performance Analysis
        </h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        Execution phase breakdown based on query pattern characteristics and group analysis
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
                <strong>Representative Execution Time:</strong> {formatDuration(totalDuration)}
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
                <strong>Pattern Efficiency:</strong>{' '}
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
            <strong> Pattern Performance Alert:</strong> This query pattern shows execution times exceeding 5 seconds. Query group optimization recommended.
          </EuiText>
        </>
      )}
    </EuiPanel>
  );
};

// Utility functions for phase analysis
function analyzeQueryComplexity(record: LatencyRecord) {
  const query = record.queryStructure;
  let complexity = 'simple';
  let fieldCount = 0;
  let scanType = 'index';
  let executionStrategy = 'standard';
  let fieldsToLoad = 'minimal';
  let hasSorting = false;

  // Analyze query structure complexity
  if (query?.query) {
    if (query.query.bool) {
      fieldCount += (query.query.bool.must?.length || 0);
      fieldCount += (query.query.bool.should?.length || 0);
      fieldCount += (query.query.bool.filter?.length || 0);
      
      if (fieldCount > 5) complexity = 'complex';
      else if (fieldCount > 2) complexity = 'medium';
    }
    
    // Check for expensive operations
    const queryStr = JSON.stringify(query);
    if (queryStr.includes('wildcard') && queryStr.includes('*')) {
      scanType = 'full_scan';
      complexity = 'complex';
      executionStrategy = 'expensive';
    }
    if (queryStr.includes('nested')) {
      complexity = 'complex';
      executionStrategy = 'nested';
    }
    if (queryStr.includes('script')) {
      complexity = 'complex';
      executionStrategy = 'scripted';
    }
  }

  // Check result size and field loading
  const size = query?.size || 10;
  if (size > 1000) {
    fieldsToLoad = 'heavy';
  } else if (size > 100) {
    fieldsToLoad = 'moderate';
  }

  // Check for sorting
  if (query?.sort) {
    hasSorting = true;
  }

  return {
    level: complexity,
    fieldCount,
    scanType,
    executionStrategy,
    fieldsToLoad,
    hasSorting
  };
}

function calculateDynamicPhaseAllocation({
  totalLatency,
  queryComplexity,
  shardCount,
  resultSize,
  hasAggregations
}: {
  totalLatency: number;
  queryComplexity: any;
  shardCount: number;
  resultSize: number;
  hasAggregations: boolean;
}) {
  // Base allocations
  let parsing = 0.03;  // 3%
  let planning = 0.07; // 7%
  let query = 0.50;    // 50%
  let fetch = 0.25;    // 25%
  let reduce = 0.15;   // 15%

  // Adjust based on query complexity
  if (queryComplexity.level === 'complex') {
    parsing += 0.02;
    planning += 0.05;
    query += 0.10;
  } else if (queryComplexity.level === 'medium') {
    parsing += 0.01;
    planning += 0.02;
    query += 0.05;
  }

  // Adjust based on shard count
  if (shardCount > 5) {
    planning += 0.03;
    query += 0.05;
    reduce += 0.05;
  }

  // Adjust based on result size
  if (resultSize > 1000) {
    fetch += 0.10;
    reduce += 0.05;
  }

  // Adjust for aggregations
  if (hasAggregations) {
    query += 0.05;
    reduce += 0.10;
  }

  // Adjust for expensive operations
  if (queryComplexity.scanType === 'full_scan') {
    query += 0.15;
    fetch -= 0.05;
  }

  // Normalize to ensure total = 1.0
  const total = parsing + planning + query + fetch + reduce;
  return {
    parsing: parsing / total,
    planning: planning / total,
    query: query / total,
    fetch: fetch / total,
    reduce: reduce / total
  };
}

function extractResultSize(queryStructure: any): number {
  return queryStructure?.size || 10;
}

function hasQueryAggregations(queryStructure: any): boolean {
  return !!(queryStructure?.aggs || queryStructure?.aggregations);
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const index = p * (arr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  
  if (upper >= arr.length) return arr[arr.length - 1];
  return arr[lower] * (1 - weight) + arr[upper] * weight;
}

function generateTrendData(records: LatencyRecord[], phaseIndex: number, phaseName: string): PhaseTimeTrend[] {
  // Group records by time periods (e.g., hourly)
  const timeGroups = records.reduce((groups, record) => {
    const time = new Date(record.timestamp);
    const hourKey = new Date(time.getFullYear(), time.getMonth(), time.getDate(), time.getHours()).toISOString();
    
    if (!groups[hourKey]) {
      groups[hourKey] = [];
    }
    groups[hourKey].push(record);
    return groups;
  }, {} as Record<string, LatencyRecord[]>);

  // Calculate average phase duration for each time period
  return Object.entries(timeGroups).map(([timestamp, groupRecords]) => {
    const phaseDurations = groupRecords.map(record => {
      const phases = computePhaseTimingFromRecord(record);
      return phases[phaseIndex]?.duration || 0;
    });
    
    const avgDuration = phaseDurations.reduce((sum, d) => sum + d, 0) / phaseDurations.length;
    
    return {
      timestamp,
      avgDuration,
      queryCount: groupRecords.length
    };
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function computePhaseTimingFromRecord(record: LatencyRecord): ExecutionPhase[] {
  const totalLatency = record.avgLatency;
  const queryComplexity = analyzeQueryComplexity(record);
  const shardCount = record.affectedShards.length;
  const resultSize = extractResultSize(record.queryStructure);
  const hasAggregations = hasQueryAggregations(record.queryStructure);

  const phaseAllocation = calculateDynamicPhaseAllocation({
    totalLatency,
    queryComplexity,
    shardCount,
    resultSize,
    hasAggregations
  });

  return [
    {
      name: 'Query Parsing',
      duration: totalLatency * phaseAllocation.parsing,
      startTime: 0,
      color: '#6DCCB1',
      description: 'Parse and validate query DSL'
    },
    {
      name: 'Query Planning',
      duration: totalLatency * phaseAllocation.planning,
      startTime: totalLatency * phaseAllocation.parsing,
      color: '#54B399',
      description: 'Generate execution plan and shard targeting'
    },
    {
      name: 'Query Phase',
      duration: totalLatency * phaseAllocation.query,
      startTime: totalLatency * (phaseAllocation.parsing + phaseAllocation.planning),
      color: '#6092C0',
      description: 'Execute query on each shard'
    },
    {
      name: 'Fetch Phase',
      duration: totalLatency * phaseAllocation.fetch,
      startTime: totalLatency * (phaseAllocation.parsing + phaseAllocation.planning + phaseAllocation.query),
      color: '#D36086',
      description: 'Retrieve document contents'
    },
    {
      name: 'Reduce Phase',
      duration: totalLatency * phaseAllocation.reduce,
      startTime: totalLatency * (1 - phaseAllocation.reduce),
      color: '#9170B8',
      description: 'Merge and sort results'
    }
  ];
}