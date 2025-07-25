/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  EuiButtonGroup,
  EuiStat,
  EuiHorizontalRule,
  EuiProgress,
} from '@elastic/eui';
import { LatencyRecord } from '../utils/dataLoader';

// Aggregated multi-query shard analysis component
interface ShardHeatMapAggregatedProps {
  records: LatencyRecord[];
  timeRange?: { start: string; end: string };
}

// Legacy single-record interface for backward compatibility
interface ShardHeatMapProps {
  record: LatencyRecord;
}

interface AggregatedShardData {
  shardId: string;
  nodeId: string;
  p50Latency: number;
  p90Latency: number;
  p95Latency: number;
  p99Latency: number;
  avgLatency: number;
  medianLatency: number;
  maxLatency: number;
  minLatency: number;
  queryCount: number;
  successRate: number;
  totalDocCount: number;
  avgDocCount: number;
}

interface AggregatedNodeData {
  nodeId: string;
  p50Latency: number;
  p90Latency: number;
  p95Latency: number;
  p99Latency: number;
  avgLatency: number;
  shardCount: number;
  queryCount: number;
  healthScore: number;
  status: 'excellent' | 'good' | 'degraded' | 'critical';
}

type ViewMode = 'p50' | 'p90' | 'p95' | 'p99' | 'avg';

interface ShardDataPoint {
  latency: number;
  status: string;
  docCount: number;
  nodeId: string;
}

interface NodeDataPoint {
  latency: number;
  status: string;
}

// Utility function for percentile calculation
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const index = p * (arr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  
  if (upper >= arr.length) return arr[arr.length - 1];
  return arr[lower] * (1 - weight) + arr[upper] * weight;
}

// Aggregated multi-query shard analysis component
export const ShardHeatMapAggregated: React.FC<ShardHeatMapAggregatedProps> = ({ records, timeRange }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('p95');

  // Aggregate shard performance data across all records
  const aggregatedShardData = useMemo(() => {
    if (!records || records.length === 0) return [];

    // Collect all shard performance data with enhanced latency distributions
    const shardDataMap = new Map<string, ShardDataPoint[]>();
    
    records.forEach(record => {
      record.shardPerformance.forEach(shard => {
        const key = shard.shardId;
        if (!shardDataMap.has(key)) {
          shardDataMap.set(key, []);
        }
        
        // Use latency distribution if available, otherwise fallback to single latency
        const latencyMeasurements = shard.latencyDistribution || [shard.latency];
        
        latencyMeasurements.forEach(latency => {
          shardDataMap.get(key)!.push({
            latency: latency,
            status: shard.status,
            docCount: shard.docCount,
            nodeId: shard.nodeId
          });
        });
      });
    });

    // Calculate aggregated statistics for each shard
    return Array.from(shardDataMap.entries()).map(([shardId, data]) => {
      const latencies = data.map(d => d.latency).sort((a, b) => a - b);
      const docCounts = data.map(d => d.docCount);
      const successCount = data.filter(d => d.status === 'success').length;
      const nodeId = data[0].nodeId; // Assume shard stays on same node
      
      // Get the original shard data to use pre-calculated percentiles if available
      const originalShard = records[0]?.shardPerformance.find(s => s.shardId === shardId);

      return {
        shardId,
        nodeId,
        // Use pre-calculated percentiles if available, otherwise calculate from aggregated data
        p50Latency: originalShard?.p50Latency ?? percentile(latencies, 0.5),
        p90Latency: originalShard?.p90Latency ?? percentile(latencies, 0.9),
        p95Latency: originalShard?.p95Latency ?? percentile(latencies, 0.95),
        p99Latency: originalShard?.p99Latency ?? percentile(latencies, 0.99),
        avgLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
        medianLatency: originalShard?.p50Latency ?? percentile(latencies, 0.5),
        maxLatency: Math.max(...latencies),
        minLatency: Math.min(...latencies),
        queryCount: Math.ceil(data.length / (originalShard?.latencyDistribution?.length || 1)), // Account for multiple measurements per query
        successRate: (successCount / data.length) * 100,
        totalDocCount: docCounts.reduce((sum, c) => sum + c, 0),
        avgDocCount: docCounts.reduce((sum, c) => sum + c, 0) / docCounts.length
      } as AggregatedShardData;
    }).sort((a, b) => a.shardId.localeCompare(b.shardId));
  }, [records]);

  // Aggregate node performance data
  const aggregatedNodeData = useMemo(() => {
    if (!records || records.length === 0) return [];

    const nodeDataMap = new Map<string, NodeDataPoint[]>();
    
    records.forEach(record => {
      record.nodePerformance.forEach(node => {
        if (!nodeDataMap.has(node.nodeId)) {
          nodeDataMap.set(node.nodeId, []);
        }
        nodeDataMap.get(node.nodeId)!.push({
          latency: node.avgLatency,
          status: node.status
        });
      });
    });

    return Array.from(nodeDataMap.entries()).map(([nodeId, data]) => {
      const latencies = data.map(d => d.latency).sort((a, b) => a - b);
      const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
      const shardCount = aggregatedShardData.filter(s => s.nodeId === nodeId).length;
      const healthyCount = data.filter(d => d.status === 'healthy').length;
      const healthScore = (healthyCount / data.length) * 100;
      
      // Get original node data to use pre-calculated percentiles if available
      const originalNode = records[0]?.nodePerformance.find(n => n.nodeId === nodeId);
      
      let status: 'excellent' | 'good' | 'degraded' | 'critical' = 'excellent';
      if (avgLatency > 5000 || healthScore < 50) status = 'critical';
      else if (avgLatency > 2000 || healthScore < 70) status = 'degraded';
      else if (avgLatency > 1000 || healthScore < 90) status = 'good';

      return {
        nodeId,
        // Use pre-calculated percentiles from enhanced node data if available
        p50Latency: (originalNode as any)?.p50Latency ?? percentile(latencies, 0.5),
        p90Latency: (originalNode as any)?.p90Latency ?? percentile(latencies, 0.9),
        p95Latency: (originalNode as any)?.p95Latency ?? percentile(latencies, 0.95),
        p99Latency: (originalNode as any)?.p99Latency ?? percentile(latencies, 0.99),
        avgLatency,
        shardCount,
        queryCount: data.length,
        healthScore,
        status
      } as AggregatedNodeData;
    }).sort((a, b) => a.nodeId.localeCompare(b.nodeId));
  }, [records, aggregatedShardData]);

  const getCurrentShardLatency = (shard: AggregatedShardData) => {
    switch (viewMode) {
      case 'p50': return shard.p50Latency;
      case 'p90': return shard.p90Latency;
      case 'p95': return shard.p95Latency;
      case 'p99': return shard.p99Latency;
      case 'avg': return shard.avgLatency;
      default: return shard.p95Latency;
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency > 5000) return '#d63031'; // Red for > 5s
    if (latency > 2000) return '#e17055'; // Orange for > 2s
    if (latency > 1000) return '#fdcb6e'; // Yellow for > 1s
    if (latency > 500) return '#a7d957';  // Light green for > 500ms
    return '#00b894'; // Green for < 500ms
  };

  const getLatencyIntensity = (latency: number) => {
    const maxLatency = Math.max(...aggregatedShardData.map(s => getCurrentShardLatency(s)));
    return Math.min(latency / maxLatency, 1);
  };

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'degraded': return 'warning';
      case 'critical': return 'danger';
      default: return 'subdued';
    }
  };

  // Group shards by node for performance-focused analysis
  const shardsByNode = useMemo(() => {
    const nodeGroups = new Map<string, AggregatedShardData[]>();
    
    aggregatedShardData.forEach(shard => {
      if (!nodeGroups.has(shard.nodeId)) {
        nodeGroups.set(shard.nodeId, []);
      }
      nodeGroups.get(shard.nodeId)!.push(shard);
    });
    
    // Sort shards within each node by index name, then shard number
    nodeGroups.forEach((shards, nodeId) => {
      shards.sort((a, b) => {
        const aIndex = a.shardId.split('-')[0];
        const bIndex = b.shardId.split('-')[0];
        if (aIndex !== bIndex) {
          return aIndex.localeCompare(bIndex);
        }
        const aNum = parseInt(a.shardId.split('-')[1] || '0');
        const bNum = parseInt(b.shardId.split('-')[1] || '0');
        return aNum - bNum;
      });
    });
    
    return Array.from(nodeGroups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [aggregatedShardData]);

  // Get index color mapping for consistent coloring
  const indexColorMap = useMemo(() => {
    const indices = new Set(aggregatedShardData.map(s => s.shardId.split('-')[0]));
    const colors = ['#3185FC', '#00BFB3', '#FEC514', '#F04E98', '#7B68EE', '#FF6B6B', '#4ECDC4', '#45B7D1'];
    const colorMap = new Map<string, string>();
    Array.from(indices).forEach((index, i) => {
      colorMap.set(index, colors[i % colors.length]);
    });
    return colorMap;
  }, [aggregatedShardData]);

  const getNodeAvgLatency = (shards: AggregatedShardData[]) => {
    return shards.reduce((sum, s) => sum + getCurrentShardLatency(s), 0) / shards.length;
  };
  
  // Get current node latency based on view mode
  const getCurrentNodeLatency = (nodeData: AggregatedNodeData) => {
    switch (viewMode) {
      case 'p50': return nodeData.p50Latency;
      case 'p90': return nodeData.p90Latency;
      case 'p95': return nodeData.p95Latency;
      case 'p99': return nodeData.p99Latency;
      case 'avg': return nodeData.avgLatency;
      default: return nodeData.p95Latency;
    }
  };

  const viewModeOptions = [
    { id: 'p50', label: 'P50 (Median)' },
    { id: 'p90', label: 'P90' },
    { id: 'p95', label: 'P95' },
    { id: 'p99', label: 'P99' },
    { id: 'avg', label: 'Average' },
  ];

  const totalQueries = records.length;
  const totalShards = aggregatedShardData.length;
  const totalNodes = shardsByNode.length;
  const totalIndices = indexColorMap.size;
  const avgSuccessRate = aggregatedShardData.length > 0 ? 
    aggregatedShardData.reduce((sum, s) => sum + s.successRate, 0) / totalShards : 100;
  const bottleneckNode = shardsByNode.length > 0 ? 
    shardsByNode.reduce((prev, curr) => {
      const prevAvg = getNodeAvgLatency(curr[1]);
      const currAvg = getNodeAvgLatency(prev[1]);
      return prevAvg > currAvg ? curr : prev;
    }, shardsByNode[0]) : null;

  const getMaxLatencyAcrossAllShards = () => {
    return Math.max(...aggregatedShardData.map(s => getCurrentShardLatency(s)));
  };

  // Calculate chart dimensions and data
  const chartData = useMemo(() => {
    const maxLatency = getMaxLatencyAcrossAllShards();
    const chartWidth = 1200; // Much wider for excellent readability
    const margin = { top: 20, right: 50, bottom: 50, left: 200 };
    
    let yOffset = 0;
    const nodeGroups = shardsByNode.map(([nodeId, shards]) => {
      // Use the enhanced node data for more accurate latency values
      const nodeData = aggregatedNodeData.find(n => n.nodeId === nodeId);
      const nodeCurrentLatency = nodeData ? getCurrentNodeLatency(nodeData) : getNodeAvgLatency(shards);
      
      const nodeGroup = {
        nodeId,
        nodeAvgLatency: nodeCurrentLatency, // Use percentile-aware latency
        yPosition: yOffset,
        shards: shards.map((shard, i) => ({
          ...shard,
          currentLatency: getCurrentShardLatency(shard),
          yPosition: yOffset + 30 + (i * 20), // 30px offset for node bar, 20px per shard
          shardNumber: shard.shardId.split('-')[1] || i.toString(),
          indexName: shard.shardId.split('-')[0] || 'unknown'
        }))
      };
      yOffset += 30 + (shards.length * 20) + 20; // Node bar + shards + spacing
      return nodeGroup;
    });
    
    // Calculate proper chart height: content height + margins
    const contentHeight = yOffset; // Total height of all content
    const chartHeight = contentHeight + margin.top + margin.bottom;
    
    return { maxLatency, chartWidth, chartHeight, margin, nodeGroups, contentHeight };
  }, [shardsByNode, viewMode]);

  const multiLevelBarChart = () => {
    const { maxLatency, chartWidth, chartHeight, margin, nodeGroups, contentHeight } = chartData;
    const innerWidth = chartWidth - margin.left - margin.right;
    
    // Add minimal padding since we removed right-side labels
    const chartMaxLatency = maxLatency * 1.05;
    
    // Generate X-axis ticks
    const xAxisTicks = [];
    const tickCount = 6;
    for (let i = 0; i <= tickCount; i++) {
      const value = (chartMaxLatency / tickCount) * i;
      const x = (value / chartMaxLatency) * innerWidth;
      xAxisTicks.push({ value, x, label: value < 1000 ? `${value.toFixed(0)}ms` : `${(value/1000).toFixed(1)}s` });
    }
    
    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg width={chartWidth} height={chartHeight} style={{ border: '1px solid #e0e0e0', borderRadius: '4px', backgroundColor: '#fafafa' }}>
          {/* Chart background */}
          <rect x={margin.left} y={margin.top} width={innerWidth} height={contentHeight} fill="white" stroke="#e0e0e0" strokeWidth="1" />
          
          {/* Grid lines */}
          {xAxisTicks.map((tick, i) => (
            <line
              key={i}
              x1={margin.left + tick.x}
              y1={margin.top}
              x2={margin.left + tick.x}
              y2={margin.top + contentHeight}
              stroke="#f0f0f0"
              strokeWidth="1"
              strokeDasharray={i === 0 ? "none" : "2,2"}
            />
          ))}
          
          {/* Node and Shard Bars */}
          {nodeGroups.map((nodeGroup, groupIndex) => (
            <g key={nodeGroup.nodeId}>
              {/* Node Main Bar */}
              <g>
                <rect
                  x={margin.left}
                  y={margin.top + nodeGroup.yPosition}
                  width={(nodeGroup.nodeAvgLatency / chartMaxLatency) * innerWidth}
                  height="24"
                  fill={getLatencyColor(nodeGroup.nodeAvgLatency)}
                  stroke="#d3d3d3"
                  strokeWidth="2"
                  rx="2"
                  style={{ cursor: 'pointer' }}
                >
                  <title>
                    {(() => {
                      const nodeData = aggregatedNodeData.find(n => n.nodeId === nodeGroup.nodeId);
                      return `Node: ${nodeGroup.nodeId}\n${viewMode.toUpperCase()}: ${nodeGroup.nodeAvgLatency.toFixed(1)}ms\nP50: ${nodeData?.p50Latency?.toFixed(1) || 'N/A'}ms\nP90: ${nodeData?.p90Latency?.toFixed(1) || 'N/A'}ms\nP95: ${nodeData?.p95Latency?.toFixed(1) || 'N/A'}ms\nP99: ${nodeData?.p99Latency?.toFixed(1) || 'N/A'}ms\nShards: ${nodeGroup.shards.length}\nIndices: ${new Set(nodeGroup.shards.map(s => s.indexName)).size}\nAvg Success Rate: ${(nodeGroup.shards.reduce((sum, s) => sum + s.successRate, 0) / nodeGroup.shards.length).toFixed(1)}%\nTotal Queries: ${nodeGroup.shards.reduce((sum, s) => sum + s.queryCount, 0)}`;
                    })()}
                  </title>
                </rect>
                
                {/* Node Label */}
                <text
                  x={margin.left - 10}
                  y={margin.top + nodeGroup.yPosition + 16}
                  textAnchor="end"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#333"
                >
                  {nodeGroup.nodeId}
                </text>
                
                {/* Node Value Label */}
                <text
                  x={margin.left + (nodeGroup.nodeAvgLatency / chartMaxLatency) * innerWidth + 10}
                  y={margin.top + nodeGroup.yPosition + 16}
                  fontSize="12"
                  fontWeight="bold"
                  fill="#666"
                >
                  {nodeGroup.nodeAvgLatency.toFixed(0)}ms
                </text>
                
              </g>
              
              {/* Shard Sub-Bars with Index Color Coding */}
              {nodeGroup.shards.map((shard, shardIndex) => (
                <g key={shard.shardId}>
                  {/* Shard bar with consistent index color */}
                  <rect
                    x={margin.left}
                    y={margin.top + shard.yPosition}
                    width={(shard.currentLatency / chartMaxLatency) * innerWidth}
                    height="16"
                    fill={indexColorMap.get(shard.indexName) || '#666'}
                    fillOpacity="0.8"
                    stroke={shard.successRate < 95 ? "#d63031" : indexColorMap.get(shard.indexName) || '#666'}
                    strokeWidth={shard.successRate < 95 ? "2" : "1"}
                    rx="1"
                    style={{ cursor: 'pointer' }}
                  >
                    <title>
                      {`Shard: ${shard.shardId}\nIndex: ${shard.indexName}\nNode: ${shard.nodeId}\n${viewMode.toUpperCase()}: ${shard.currentLatency.toFixed(1)}ms\nP50: ${shard.p50Latency.toFixed(1)}ms\nP95: ${shard.p95Latency.toFixed(1)}ms\nP99: ${shard.p99Latency.toFixed(1)}ms\nQuery Count: ${shard.queryCount}\nSuccess Rate: ${shard.successRate.toFixed(1)}%\nAvg Docs: ${shard.avgDocCount.toLocaleString()}`}
                    </title>
                  </rect>
                  
                  {/* Shard Label with Index */}
                  <text
                    x={margin.left - 10}
                    y={margin.top + shard.yPosition + 11}
                    textAnchor="end"
                    fontSize="10"
                    fill="#666"
                  >
                    └ {shard.indexName}-{shard.shardNumber}
                  </text>
                  
                  {/* Shard Value Label */}
                  <text
                    x={margin.left + (shard.currentLatency / chartMaxLatency) * innerWidth + 10}
                    y={margin.top + shard.yPosition + 11}
                    fontSize="10"
                    fill="#666"
                  >
                    {shard.currentLatency.toFixed(0)}ms
                  </text>
                  
                  
                  
                </g>
              ))}
            </g>
          ))}
          
          {/* X-Axis */}
          <line
            x1={margin.left}
            y1={margin.top + contentHeight}
            x2={margin.left + innerWidth}
            y2={margin.top + contentHeight}
            stroke="#333"
            strokeWidth="2"
          />
          
          {/* X-Axis Ticks and Labels */}
          {xAxisTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={margin.left + tick.x}
                y1={margin.top + contentHeight}
                x2={margin.left + tick.x}
                y2={margin.top + contentHeight + 5}
                stroke="#333"
                strokeWidth="1"
              />
              <text
                x={margin.left + tick.x}
                y={margin.top + contentHeight + 18}
                textAnchor="middle"
                fontSize="11"
                fill="#666"
              >
                {tick.label}
              </text>
            </g>
          ))}
          
          {/* X-Axis Label */}
          <text
            x={margin.left + innerWidth / 2}
            y={margin.top + contentHeight + 35}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#333"
          >
            Latency ({viewModeOptions.find(opt => opt.id === viewMode)?.label})
          </text>
          
          {/* Y-Axis Label */}
          <text
            x={20}
            y={margin.top + contentHeight / 2}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#333"
            transform={`rotate(-90, 20, ${margin.top + contentHeight / 2})`}
          >
            Indices & Shards
          </text>
        </svg>
      </div>
    );
  };

  if (!records || records.length === 0) {
    return (
      <EuiPanel paddingSize="l">
        <EuiText>No query group data available for shard analysis</EuiText>
      </EuiPanel>
    );
  }

  return (
    <EuiPanel paddingSize="l">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiTitle size="m">
            <h3>
              <EuiIcon type="visBarHorizontalStacked" size="m" /> Node and Shard Performance
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
        Node-centric performance analysis across {totalQueries} queries showing {viewModeOptions.find(opt => opt.id === viewMode)?.label} latency distribution by node, index, and shard
      </EuiText>

      <EuiSpacer size="l" />

      {/* Summary Stats */}
      <EuiFlexGroup gutterSize="l">
        <EuiFlexItem>
          <EuiStat
            title={totalNodes.toString()}
            description="Nodes Analyzed"
            color="primary"
            titleSize="s"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            title={totalIndices.toString()}
            description="Indices Distributed"
            color="accent"
            titleSize="s"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            title={totalShards.toString()}
            description="Total Shards"
            color="subdued"
            titleSize="s"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            title={avgSuccessRate.toFixed(1) + '%'}
            description="Average Success Rate"
            color={avgSuccessRate > 95 ? 'success' : avgSuccessRate > 90 ? 'warning' : 'danger'}
            titleSize="s"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            title={bottleneckNode?.[0] || 'N/A'}
            description="Bottleneck Node"
            color="warning"
            titleSize="s"
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiHorizontalRule />

      {/* Node-Centric Performance Chart */}
      <div>
        {multiLevelBarChart()}
      </div>

      <EuiSpacer size="l" />

      {/* Comprehensive Legend */}
      <EuiFlexGroup gutterSize="l" wrap>
        <EuiFlexItem>
          <EuiText size="xs"><strong>Index Color Coding:</strong></EuiText>
          <EuiSpacer size="xs" />
          <EuiFlexGroup gutterSize="s" wrap>
            {Array.from(indexColorMap.entries()).map(([indexName, color]) => (
              <EuiFlexItem key={indexName} grow={false}>
                <EuiFlexGroup alignItems="center" gutterSize="xs">
                  <EuiFlexItem grow={false}>
                    <div style={{width: '12px', height: '12px', backgroundColor: color, borderRadius: '2px'}} />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="xs">{indexName}</EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </EuiFlexItem>
        
        <EuiFlexItem>
          <EuiText size="xs"><strong>Performance Indicators:</strong></EuiText>
          <EuiSpacer size="xs" />
          <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup alignItems="center" gutterSize="xs">
                <EuiFlexItem grow={false}>
                  <div style={{width: '20px', height: '8px', backgroundColor: '#00b894', borderRadius: '2px'}} />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs">Healthy Node</EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup alignItems="center" gutterSize="xs">
                <EuiFlexItem grow={false}>
                  <div style={{width: '20px', height: '8px', backgroundColor: '#fdcb6e', borderRadius: '2px'}} />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs">Warning Node</EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup alignItems="center" gutterSize="xs">
                <EuiFlexItem grow={false}>
                  <div style={{width: '20px', height: '8px', backgroundColor: '#d63031', borderRadius: '2px'}} />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs">Critical Node</EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup alignItems="center" gutterSize="xs">
                <EuiFlexItem grow={false}>
                  <div style={{
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: '#d63031', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>!</div>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      {/* Performance Insights */}
      {avgSuccessRate < 95 && (
        <>
          <EuiSpacer size="m" />
          <EuiText size="s" color="danger">
            <EuiIcon type="alert" size="s" /> 
            <strong> Shard Performance Alert:</strong> Multiple shards in this query group showing reliability issues - success rate below 95%.
          </EuiText>
        </>
      )}
    </EuiPanel>
  );
};

// Legacy component for backward compatibility
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
          <EuiIcon type="grid" size="m" /> Query Pattern Shard Analysis
        </h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        Representative shard performance for this query pattern group
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
        <h4>Node Performance for Pattern</h4>
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
            <strong>Pattern Shards:</strong> {record.shardPerformance.length}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s">
            <strong>Failed Shards:</strong> {record.shardPerformance.filter(s => s.status === 'failed').length}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s">
            <strong>Peak Shard Latency:</strong> {Math.max(...record.shardPerformance.map(s => s.latency)).toFixed(1)}ms
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};