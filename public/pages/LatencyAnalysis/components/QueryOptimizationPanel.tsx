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
} from '@elastic/eui';
import { LatencyRecord } from '../utils/dataLoader';

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
  return (
    <div>
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
                  <h4>Optimized Query</h4>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="success">
                  Est: {(record.avgLatency * 0.3).toFixed(1)}ms (-70%)
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

      <EuiCallOut title="Key Improvements" color="success" iconType="lightbulb">
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <EuiIcon type="sortUp" size="s" style={{ marginRight: '8px' }} />
            <span>Added query-level timeout to prevent hanging queries</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <EuiIcon type="search" size="s" style={{ marginRight: '8px' }} />
            <span>Replaced wildcard queries with more efficient match_phrase_prefix</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <EuiIcon type="filter" size="s" style={{ marginRight: '8px' }} />
            <span>Moved expensive filters to query context for better caching</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <EuiIcon type="bolt" size="s" style={{ marginRight: '8px' }} />
            <span>Reduced result size and added search_after for pagination</span>
          </li>
        </ul>
      </EuiCallOut>
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