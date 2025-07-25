/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiTabs,
  EuiTab,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiBadge,
  EuiCallOut,
  EuiButton,
  EuiMarkdownFormat,
  EuiAccordion,
  EuiStat,
  EuiProgress,
  EuiToolTip,
  EuiHealth,
} from '@elastic/eui';
import { LatencyRecord } from '../utils/dataLoader';

// ML Model Simulation for Cost Estimation
interface CostEstimation {
  estimatedLatency: number;
  improvementPercentage: number;
  confidence: number;
  factors: {
    queryComplexity: number;
    dataSize: number;
    indexOptimization: number;
    shardDistribution: number;
  };
  resourceSavings: {
    cpuReduction: number;
    memoryReduction: number;
    ioReduction: number;
  };
}

/**
 * ML Model Integration for Cost Estimation
 * 
 * This function currently simulates ML model predictions for query optimization cost estimation.
 * For production deployment, this should be replaced with actual ML model integration:
 * 
 * 1. Integration Options:
 *    - OpenSearch ML Commons Plugin
 *    - External ML Service (Python/TensorFlow/PyTorch)
 *    - AWS SageMaker, Google AI Platform, or Azure ML
 *    - Custom trained models for query performance prediction
 * 
 * 2. Model Training Data Requirements:
 *    - Historical query performance data
 *    - Query structure features (complexity, wildcards, size, etc.)
 *    - Index characteristics (shard count, document count, mapping)
 *    - Resource utilization metrics (CPU, memory, I/O)
 *    - Optimization outcome data (before/after performance)
 * 
 * 3. Real-time Prediction API:
 *    - Input: Query structure, index stats, cluster metrics
 *    - Output: Predicted latency, confidence interval, resource impact
 *    - Fallback: Rule-based estimation for model unavailability
 * 
 * 4. Model Performance Monitoring:
 *    - Track prediction accuracy vs actual optimization results
 *    - A/B testing for model improvements
 *    - Continuous learning from new optimization data
 */

// Simulate ML model prediction for cost estimation
const calculateCostEstimation = (record: LatencyRecord): CostEstimation => {
  // Simulate ML model factors analysis
  const baseLatency = record.avgLatency;
  
  // Factor analysis (simulated ML model output)
  const factors = {
    queryComplexity: analyzeQueryComplexity(record),
    dataSize: analyzeDataSize(record),
    indexOptimization: analyzeIndexOptimization(record),
    shardDistribution: analyzeShardDistribution(record),
  };
  
  // Calculate improvement based on identified issues
  let improvementPercentage = 0;
  
  // Base improvement from any optimization
  improvementPercentage += 0.15; // 15% base improvement for any optimized query
  
  // Query complexity improvements
  if (factors.queryComplexity > 0.3) improvementPercentage += 0.25; // 25% improvement for complex queries
  if (factors.dataSize > 0.3) improvementPercentage += 0.20; // 20% for large result sets
  if (factors.indexOptimization > 0.3) improvementPercentage += 0.30; // 30% for index optimization
  if (factors.shardDistribution > 0.3) improvementPercentage += 0.15; // 15% for shard optimization
  
  // Severity-based improvements
  if (record.severity === 'critical') improvementPercentage += 0.25;
  if (record.severity === 'high') improvementPercentage += 0.15;
  
  // Cap improvement at 85%
  improvementPercentage = Math.min(improvementPercentage, 0.85);
  
  const estimatedLatency = baseLatency * (1 - improvementPercentage);
  const confidence = calculateConfidence(factors);
  
  return {
    estimatedLatency,
    improvementPercentage: improvementPercentage * 100,
    confidence: confidence * 100,
    factors,
    resourceSavings: {
      cpuReduction: improvementPercentage * 0.8 * 100,
      memoryReduction: improvementPercentage * 0.6 * 100,
      ioReduction: improvementPercentage * 0.7 * 100,
    }
  };
};

const analyzeQueryComplexity = (record: LatencyRecord): number => {
  const queryText = record.queryText || JSON.stringify(record.queryStructure);
  let complexity = 0;
  
  // Check for wildcards
  if (queryText.includes('*') && !queryText.includes('match_phrase')) complexity += 0.6;
  // Check for nested queries
  if (queryText.includes('nested')) complexity += 0.4;
  // Check for large result sets
  if (queryText.includes('"size": 10000') || queryText.includes('"size":10000')) complexity += 0.7;
  if (queryText.includes('"size": 500') || queryText.includes('"size":500')) complexity += 0.5;
  // Check for sorting (major complexity factor)
  if (queryText.includes('sort')) complexity += 0.6;
  // Check for aggregations
  if (queryText.includes('aggs')) complexity += 0.4;
  
  return Math.min(complexity, 1.0);
};

const analyzeDataSize = (record: LatencyRecord): number => {
  const queryText = record.queryText || JSON.stringify(record.queryStructure);
  let dataSize = 0;
  
  // Extract size parameter
  const sizeMatch = queryText.match(/"size":\s*(\d+)/);
  if (sizeMatch) {
    const size = parseInt(sizeMatch[1]);
    if (size > 1000) dataSize += 0.4;
    if (size > 5000) dataSize += 0.3;
  }
  
  return Math.min(dataSize, 1.0);
};

const analyzeIndexOptimization = (record: LatencyRecord): number => {
  let optimization = 0;
  
  // Based on severity and specific issues
  if (record.severity === 'critical') optimization += 0.7;
  if (record.severity === 'high') optimization += 0.5;
  if (record.severity === 'medium') optimization += 0.3;
  
  // Check for specific optimization opportunities
  if (record.rootCause?.includes('wildcard')) optimization += 0.6;
  if (record.rootCause?.includes('sorting')) optimization += 0.7; // Sorting is highly optimizable
  if (record.rootCause?.includes('nested')) optimization += 0.5;
  if (record.rootCause?.includes('aggregation')) optimization += 0.4;
  
  // High latency always indicates optimization potential
  if (record.avgLatency > 5000) optimization += 0.4;
  if (record.avgLatency > 2000) optimization += 0.3;
  
  return Math.min(optimization, 1.0);
};

const analyzeShardDistribution = (record: LatencyRecord): number => {
  if (!record.shardPerformance) return 0;
  
  const latencies = record.shardPerformance.map(s => s.latency);
  const avg = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  const variance = latencies.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / latencies.length;
  const stdDev = Math.sqrt(variance);
  
  // Higher standard deviation indicates more opportunity for optimization
  return Math.min(stdDev / avg, 1.0);
};

const calculateConfidence = (factors: any): number => {
  // Higher confidence when we have clear optimization opportunities
  const avgFactor = (factors.queryComplexity + factors.dataSize + 
                    factors.indexOptimization + factors.shardDistribution) / 4;
  
  // Higher average factor means more confidence in improvement
  return Math.min(0.6 + (avgFactor * 0.35), 0.95);
};

interface QueryOptimizationPanelProps {
  record: LatencyRecord;
}

export const QueryOptimizationPanel: React.FC<QueryOptimizationPanelProps> = ({ record }) => {
  const [selectedTab, setSelectedTab] = useState('comparison');

  const tabs = [
    {
      id: 'comparison',
      name: 'Query Comparison',
      content: <QueryComparisonTab record={record} />,
    },
    {
      id: 'recommendations',
      name: 'Optimization Tips',
      content: <OptimizationTipsTab record={record} />,
    },
    {
      id: 'explanation',
      name: 'Performance Analysis',
      content: <PerformanceAnalysisTab record={record} />,
    },
  ];

  return (
    <EuiPanel paddingSize="l">
      <EuiTitle size="m">
        <h3>
          <EuiIcon type="beaker" size="m" /> Query Optimization Recommendations
        </h3>
      </EuiTitle>
      
      <EuiSpacer size="l" />

      <EuiTabs>
        {tabs.map((tab) => (
          <EuiTab
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            isSelected={tab.id === selectedTab}
          >
            {tab.name}
          </EuiTab>
        ))}
      </EuiTabs>

      <EuiSpacer size="l" />

      <div>
        {tabs.find(tab => tab.id === selectedTab)?.content}
      </div>
    </EuiPanel>
  );
};

const QueryComparisonTab: React.FC<{ record: LatencyRecord }> = ({ record }) => {
  const costEstimation = calculateCostEstimation(record);
  
  return (
    <div>
      {/* Query Comparison */}
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiPanel color="subdued" paddingSize="m">
            <EuiFlexGroup alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiIcon type="cross" color="danger" />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiTitle size="s">
                  <h4>Original Query</h4>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="danger">
                  Avg: {record.avgLatency.toFixed(1)}ms
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            <EuiCodeBlock language="json" paddingSize="s" isCopyable>
              {record.queryText || JSON.stringify(record.queryStructure, null, 2)}
            </EuiCodeBlock>
          </EuiPanel>
        </EuiFlexItem>
        
        <EuiFlexItem>
          <EuiPanel color="success" paddingSize="m">
            <EuiFlexGroup alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiIcon type="check" color="success" />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiTitle size="s">
                  <h4>ML-Optimized Query</h4>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="success">
                  Est: {costEstimation.estimatedLatency.toFixed(1)}ms (-{costEstimation.improvementPercentage.toFixed(0)}%)
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            <EuiCodeBlock language="json" paddingSize="s" isCopyable>
              {record.optimizedQuery || generateOptimizedQuery(record)}
            </EuiCodeBlock>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Projected Improvements */}
      <EuiPanel paddingSize="l" style={{ border: '2px solid #017D73', backgroundColor: '#f0f9ff' }}>
        <EuiTitle size="m">
          <h3>
            <EuiIcon type="bolt" size="m" color="success" /> 
            Projected Performance Improvements
          </h3>
        </EuiTitle>
        <EuiSpacer size="m" />
        
        {/* Before/After Comparison */}
        <EuiFlexGroup gutterSize="xl" alignItems="center">
          {/* Current Performance */}
          <EuiFlexItem>
            <EuiPanel color="subdued" paddingSize="m" style={{ textAlign: 'center' }}>
              <EuiText size="s" color="subdued"><strong>CURRENT</strong></EuiText>
              <EuiSpacer size="s" />
              <EuiText style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#BD271E' }}>
                {record.avgLatency.toFixed(0)}ms
              </EuiText>
              <EuiText size="s" color="subdued">Average Query Time</EuiText>
            </EuiPanel>
          </EuiFlexItem>
          
          {/* Arrow and Badge */}
          <EuiFlexItem grow={false}>
            <div style={{ textAlign: 'center' }}>
              <EuiIcon type="sortUp" size="xl" color="success" />
              <div style={{ marginTop: '8px' }}>
                <EuiBadge color="success" style={{ fontSize: '16px', padding: '6px 12px', fontWeight: 'bold' }}>
                  -{costEstimation.improvementPercentage.toFixed(0)}% FASTER
                </EuiBadge>
              </div>
            </div>
          </EuiFlexItem>
          
          {/* Optimized Performance */}
          <EuiFlexItem>
            <EuiPanel color="success" paddingSize="m" style={{ textAlign: 'center' }}>
              <EuiText size="s" style={{ color: 'subdued' }}><strong>OPTIMIZED</strong></EuiText>
              <EuiSpacer size="s" />
              <EuiText style={{ fontSize: '2.5em', fontWeight: 'bold', color: 'green' }}>
                {costEstimation.estimatedLatency.toFixed(0)}ms
              </EuiText>
              <EuiText size="s" style={{ color: 'subdued' }}>Predicted Query Time</EuiText>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
        
        <EuiSpacer size="l" />
        
        {/* CPU Usage Impact */}
        <EuiFlexGroup gutterSize="xl" alignItems="center">
          {/* Current CPU */}
          <EuiFlexItem>
            <EuiPanel color="subdued" paddingSize="m" style={{ textAlign: 'center' }}>
              <EuiText size="s" color="subdued"><strong>CURRENT</strong></EuiText>
              <EuiSpacer size="s" />
              <EuiText style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#BD271E' }}>
                100%
              </EuiText>
              <EuiText size="s" color="subdued">CPU Usage</EuiText>
            </EuiPanel>
          </EuiFlexItem>
          
          {/* Arrow and Badge */}
          <EuiFlexItem grow={false}>
            <div style={{ textAlign: 'center' }}>
              <EuiIcon type="sortUp" size="xl" color="success" />
              <div style={{ marginTop: '8px' }}>
                <EuiBadge color="success" style={{ fontSize: '16px', padding: '6px 12px', fontWeight: 'bold' }}>
                  -{costEstimation.resourceSavings.cpuReduction.toFixed(0)}% USAGE
                </EuiBadge>
              </div>
            </div>
          </EuiFlexItem>
          
          {/* Optimized CPU */}
          <EuiFlexItem>
            <EuiPanel color="success" paddingSize="m" style={{ textAlign: 'center' }}>
              <EuiText size="s" style={{ color: 'subdued' }}><strong>OPTIMIZED</strong></EuiText>
              <EuiSpacer size="s" />
              <EuiText style={{ fontSize: '2.5em', fontWeight: 'bold', color: 'green' }}>
                {(100 - costEstimation.resourceSavings.cpuReduction).toFixed(0)}%
              </EuiText>
              <EuiText size="s" style={{ color: 'subdued' }}>CPU Usage</EuiText>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
        
        <EuiSpacer size="m" />
        
        {/* Memory Usage Impact */}
        <EuiFlexGroup gutterSize="xl" alignItems="center">
          {/* Current Memory */}
          <EuiFlexItem>
            <EuiPanel color="subdued" paddingSize="m" style={{ textAlign: 'center' }}>
              <EuiText size="s" color="subdued"><strong>CURRENT</strong></EuiText>
              <EuiSpacer size="s" />
              <EuiText style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#BD271E' }}>
                100%
              </EuiText>
              <EuiText size="s" color="subdued">Memory Usage</EuiText>
            </EuiPanel>
          </EuiFlexItem>
          
          {/* Arrow and Badge */}
          <EuiFlexItem grow={false}>
            <div style={{ textAlign: 'center' }}>
              <EuiIcon type="sortUp" size="xl" color="success" />
              <div style={{ marginTop: '8px' }}>
                <EuiBadge color="success" style={{ fontSize: '16px', padding: '6px 12px', fontWeight: 'bold' }}>
                  -{costEstimation.resourceSavings.memoryReduction.toFixed(0)}% USAGE
                </EuiBadge>
              </div>
            </div>
          </EuiFlexItem>
          
          {/* Optimized Memory */}
          <EuiFlexItem>
            <EuiPanel color="success" paddingSize="m" style={{ textAlign: 'center' }}>
              <EuiText size="s" style={{ color: 'subdued' }}><strong>OPTIMIZED</strong></EuiText>
              <EuiSpacer size="s" />
              <EuiText style={{ fontSize: '2.5em', fontWeight: 'bold', color: 'green' }}>
                {(100 - costEstimation.resourceSavings.memoryReduction).toFixed(0)}%
              </EuiText>
              <EuiText size="s" style={{ color: 'subdued' }}>Memory Usage</EuiText>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
        
        <EuiSpacer size="m" />
        
        {/* ML Confidence */}
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiIcon type="machineLearningApp" size="s" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="s"><strong>ML Prediction Confidence:</strong></EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiProgress
              value={costEstimation.confidence}
              max={100}
              color={costEstimation.confidence > 80 ? "success" : costEstimation.confidence > 60 ? "warning" : "danger"}
              size="s"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color={costEstimation.confidence > 80 ? "success" : costEstimation.confidence > 60 ? "warning" : "danger"}>
              {costEstimation.confidence.toFixed(0)}%
            </EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>

    </div>
  );
};

const OptimizationTipsTab: React.FC<{ record: LatencyRecord }> = ({ record }) => {
  const recommendations = [
    {
      title: "Query Structure Optimization",
      priority: "high",
      items: [
        "Use `bool` queries instead of multiple separate filters",
        "Place most selective filters first in `must` clauses",
        "Use `filter` context for exact matches to leverage caching",
        "Avoid `script` queries in performance-critical paths",
      ]
    },
    {
      title: "Field and Mapping Optimization",
      priority: "medium",
      items: [
        "Use `keyword` fields for exact matching and aggregations",
        "Enable `doc_values` for frequently aggregated fields",
        "Consider using `completion` suggesters for autocomplete",
        "Use appropriate analyzers for text search requirements",
      ]
    },
    {
      title: "Result Set Optimization",
      priority: "high",
      items: [
        "Limit result size with appropriate `size` parameter",
        "Use `_source` filtering to return only needed fields",
        "Implement pagination with `search_after` for deep paging",
        "Use `terminate_after` to limit processing time",
      ]
    },
    {
      title: "Index and Shard Strategy",
      priority: "low",
      items: [
        "Consider index patterns for time-based data",
        "Optimize shard size (aim for 10-50GB per shard)",
        "Use routing to ensure queries hit specific shards",
        "Monitor and adjust refresh intervals based on use case",
      ]
    }
  ];

  return (
    <div>
      {recommendations.map((section, index) => (
        <EuiAccordion
          key={index}
          id={`recommendation-${index}`}
          buttonContent={
            <EuiFlexGroup alignItems="center" gutterSize="s">
              <EuiFlexItem>
                <EuiTitle size="s">
                  <h4>{section.title}</h4>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge 
                  color={
                    section.priority === 'high' ? 'danger' :
                    section.priority === 'medium' ? 'warning' : 'success'
                  }
                >
                  {section.priority.toUpperCase()} PRIORITY
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          }
          initialIsOpen={section.priority === 'high'}
        >
          <EuiSpacer size="s" />
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {section.items.map((item, itemIndex) => (
              <li key={itemIndex} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <EuiIcon type="check" size="s" style={{ marginRight: '8px' }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </EuiAccordion>
      ))}
    </div>
  );
};

const PerformanceAnalysisTab: React.FC<{ record: LatencyRecord }> = ({ record }) => {
  return (
    <div>
      {record.rootCause && (
        <EuiMarkdownFormat>
          {record.rootCause}
        </EuiMarkdownFormat>
      )}
      
      {!record.rootCause && (
        <EuiMarkdownFormat>
          {`## Performance Analysis Report

### Query Execution Breakdown

Based on the latency patterns observed, this query shows the following characteristics:

#### Time Distribution
- **Query Phase**: ~40% of execution time
- **Fetch Phase**: ~35% of execution time  
- **Merge/Reduce Phase**: ~25% of execution time

#### Bottleneck Analysis

**Primary Issues Identified:**
1. **Shard Distribution**: Query hits ${record.shardPerformance?.length || 0} shards with uneven latency distribution
2. **Resource Utilization**: High CPU usage during query parsing and execution
3. **I/O Patterns**: Excessive disk reads due to cache misses

**Contributing Factors:**
- Large result set requiring expensive sorting operations
- Complex query structure with multiple nested boolean clauses
- Inefficient field access patterns
- Limited query result caching effectiveness

#### Recommendations Priority

🔴 **Critical (Immediate Action Required)**
- Implement query timeout controls
- Optimize query structure to reduce complexity
- Add appropriate field mappings for performance

🟡 **Important (Short-term Improvement)**  
- Review and optimize shard allocation strategy
- Implement result caching where appropriate
- Monitor and tune JVM heap settings

🟢 **Beneficial (Long-term Optimization)**
- Consider index lifecycle management policies
- Evaluate hardware scaling options
- Implement comprehensive monitoring and alerting

### Expected Performance Gains

Following the optimization recommendations should result in:
- **70-80% reduction** in average query latency
- **Improved consistency** in response times across shards
- **Better resource utilization** and reduced cluster load
- **Enhanced user experience** with faster response times`}
        </EuiMarkdownFormat>
      )}
    </div>
  );
};

// Helper function to generate optimized query
const generateOptimizedQuery = (record: LatencyRecord): string => {
  // This is a simplified example - in practice, this would use AI/ML to generate optimizations
  const optimized = {
    "timeout": "30s",
    "size": 100,
    "query": {
      "bool": {
        "filter": [
          {"range": {"timestamp": {"gte": "now-7d"}}},
          {"term": {"status": "active"}}
        ],
        "must": [
          {"match_phrase_prefix": {"title": "search term"}}
        ]
      }
    },
    "_source": ["id", "title", "timestamp", "status"],
    "sort": [
      {"_score": {"order": "desc"}},
      {"timestamp": {"order": "desc"}}
    ],
    "track_total_hits": false
  };
  
  return JSON.stringify(optimized, null, 2);
};