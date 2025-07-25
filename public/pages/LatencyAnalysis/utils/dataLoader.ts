/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LatencyRecord {
  id: string;
  queryHash: string;
  queryText?: string;
  queryStructure: any;
  avgLatency: number;
  maxLatency: number;
  p95Latency?: number;
  p99Latency?: number;
  frequency: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  affectedShards: string[];
  shardPerformance: ShardPerformance[];
  nodePerformance: NodePerformance[];
  historicalData: HistoricalDataPoint[];
  rootCause?: string;
  optimizedQuery?: string;
}

export interface ShardPerformance {
  shardId: string;
  nodeId: string;
  latency: number;
  status: 'success' | 'failed' | 'timeout';
  docCount: number;
  // Additional latency percentiles for realistic data
  p50Latency?: number;
  p90Latency?: number;
  p95Latency?: number;
  p99Latency?: number;
  latencyDistribution?: number[]; // Array of latency measurements
}

export interface NodePerformance {
  nodeId: string;
  avgLatency: number;
  status: 'healthy' | 'degraded' | 'failed';
}

export interface HistoricalDataPoint {
  timestamp: string;
  latency: number;
  count: number;
}

// Helper function to generate realistic latency distribution for a shard
function generateShardLatencyDistribution(baseLatency: number, variance: number = 0.3): {
  latencies: number[];
  p50: number;
  p90: number;
  p95: number;
  p99: number;
} {
  const measurements = [];
  const sampleSize = 50; // Simulate 50 measurements per shard
  
  for (let i = 0; i < sampleSize; i++) {
    // Generate latencies with realistic distribution (log-normal-ish)
    const randomFactor = Math.random() * 2 - 1; // -1 to 1
    const varianceFactor = 1 + (randomFactor * variance);
    
    // Add occasional spikes (5% chance of 2-5x spike)
    const spikeChance = Math.random();
    const spikeFactor = spikeChance < 0.05 ? (2 + Math.random() * 3) : 1;
    
    const latency = Math.max(10, baseLatency * varianceFactor * spikeFactor);
    measurements.push(latency);
  }
  
  const sorted = measurements.sort((a, b) => a - b);
  
  return {
    latencies: measurements,
    p50: percentileCalc(sorted, 0.5),
    p90: percentileCalc(sorted, 0.9),
    p95: percentileCalc(sorted, 0.95),
    p99: percentileCalc(sorted, 0.99)
  };
}

// Helper function for percentile calculation
function percentileCalc(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  const index = percentile * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  
  if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

// Enhanced function to generate realistic node performance that respects shard constraints
function generateNodePerformanceFromShards(shards: any[]): any[] {
  const nodeGroups = new Map<string, any[]>();
  
  // Group shards by node
  shards.forEach(shard => {
    if (!nodeGroups.has(shard.nodeId)) {
      nodeGroups.set(shard.nodeId, []);
    }
    nodeGroups.get(shard.nodeId)!.push(shard);
  });
  
  // Calculate node performance ensuring it respects shard constraints
  return Array.from(nodeGroups.entries()).map(([nodeId, nodeShards]) => {
    const allLatencies = nodeShards.flatMap(shard => shard.latencyDistribution || [shard.latency]);
    const sortedLatencies = allLatencies.sort((a, b) => a - b);
    const avgLatency = sortedLatencies.reduce((sum, l) => sum + l, 0) / sortedLatencies.length;
    const maxShardP99 = Math.max(...nodeShards.map(s => s.p99Latency || s.latency));
    
    // Node performance cannot be better than its worst shard
    const nodeAvgLatency = Math.max(avgLatency, maxShardP99 * 0.8); // Node avg should be close to but can be slightly better than max shard P99
    
    let status: 'healthy' | 'degraded' | 'failed' = 'healthy';
    if (nodeAvgLatency > 8000) status = 'failed';
    else if (nodeAvgLatency > 4000) status = 'degraded';
    
    return {
      nodeId,
      avgLatency: nodeAvgLatency,
      status,
      p50Latency: percentileCalc(sortedLatencies, 0.5),
      p90Latency: percentileCalc(sortedLatencies, 0.9),
      p95Latency: percentileCalc(sortedLatencies, 0.95),
      p99Latency: percentileCalc(sortedLatencies, 0.99)
    };
  });
}

// Mock data for demonstration - in production, this would call actual APIs
const mockLatencyData: LatencyRecord[] = [
  {
    id: 'latency-001',
    queryHash: 'hash_5f8a2b9c3d1e',
    queryText: `{
  "query": {
    "bool": {
      "must": [
        {"wildcard": {"product_name": "*book"}},
        {"wildcard": {"description": "*gaming*laptop*"}}
      ],
      "filter": [
        {"range": {"price": {"gte": 500, "lte": 2000}}},
        {"term": {"category": "electronics"}}
      ]
    }
  },
  "size": 10000,
  "sort": [{"price": {"order": "desc"}}]
}`,
    queryStructure: {
      query: {
        bool: {
          must: [
            { wildcard: { product_name: "*book" } },
            { wildcard: { description: "*gaming*laptop*" } }
          ],
          filter: [
            { range: { price: { gte: 500, lte: 2000 } } },
            { term: { category: "electronics" } }
          ]
        }
      },
      size: 10000,
      sort: [{ price: { order: "desc" } }]
    },
    avgLatency: 8500.5,
    maxLatency: 15200.8,
    p95Latency: 12800.2,
    p99Latency: 14500.1,
    frequency: 45,
    severity: 'critical',
    timestamp: '2024-10-26T14:30:45.891Z',
    affectedShards: ['products-0', 'products-1', 'products-2', 'products-3', 'products-4'],
    shardPerformance: (() => {
      const baseShards = [
        { shardId: 'products-0', nodeId: 'node-1', baseLatency: 7200.1, status: 'success', docCount: 125000 },
        { shardId: 'products-1', nodeId: 'node-2', baseLatency: 9800.5, status: 'success', docCount: 118000 },
        { shardId: 'products-2', nodeId: 'node-3', baseLatency: 8100.2, status: 'success', docCount: 132000 },
        { shardId: 'products-3', nodeId: 'node-1', baseLatency: 15200.8, status: 'timeout', docCount: 95000 },
        { shardId: 'products-4', nodeId: 'node-2', baseLatency: 6500.3, status: 'success', docCount: 142000 },
      ];
      
      return baseShards.map(shard => {
        const distribution = generateShardLatencyDistribution(shard.baseLatency, 0.4);
        return {
          shardId: shard.shardId,
          nodeId: shard.nodeId,
          latency: shard.baseLatency, // Keep for backward compatibility
          status: shard.status,
          docCount: shard.docCount,
          p50Latency: distribution.p50,
          p90Latency: distribution.p90,
          p95Latency: distribution.p95,
          p99Latency: distribution.p99,
          latencyDistribution: distribution.latencies
        };
      });
    })(),
    nodePerformance: [], // Will be generated dynamically
    historicalData: generateHistoricalData(8500, 24),
    rootCause: `## Root Cause Analysis - Critical Latency

### Issue Overview
This query uses extremely inefficient wildcard patterns causing severe performance degradation across the cluster.

### Primary Contributing Factors

**1. Leading Wildcard Pattern (\`*book\`)**
- Leading wildcards cannot utilize the inverted index efficiently
- OpenSearch must scan every term in the field to find matches ending with "book"
- Forces full-text examination instead of leveraging index optimization
- Reference: https://opensearch.org/docs/latest/query-dsl/term/wildcard/

**2. Multiple Wildcards Pattern (\`*gaming*laptop*\`)**
- Multiple wildcards cause excessive term expansion
- Pattern \`*gaming*laptop*\` requires complex matching across all terms
- Each wildcard multiplies the search complexity exponentially
- Reference: https://opensearch.org/docs/latest/query-dsl/term/wildcard/

**3. Large Result Set Processing**
- Requesting 10,000 documents compounds wildcard inefficiency
- Price-based sorting requires loading all matching documents
- Memory-intensive operation across multiple shards

**4. No Query Controls**
- Missing timeout controls allow runaway queries
- No result size limitations for wildcard operations

### Performance Impact
- **10x+ slower** than optimal query patterns due to wildcard inefficiency
- **Resource exhaustion** from term expansion
- **Index scanning** instead of efficient index lookups
- **User experience degradation** with 8+ second response times

### Immediate Actions Required
1. Replace leading wildcard \`*book\` with match query for "book"
2. Replace multiple wildcards \`*gaming*laptop*\` with match_phrase "gaming laptop"
3. Implement query timeout controls
4. Reduce result set size and add pagination`,
    optimizedQuery: `{
  "timeout": "30s",
  "size": 100,
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "product_name": "book"
          }
        },
        {
          "match_phrase": {
            "description": "gaming laptop"
          }
        }
      ],
      "filter": [
        {"range": {"price": {"gte": 500, "lte": 2000}}},
        {"term": {"category": "electronics"}}
      ]
    }
  },
  "_source": ["id", "product_name", "price", "category", "description"],
  "sort": [{"price": {"order": "desc"}}],
  "track_total_hits": false
}`
  },
  {
    id: 'latency-002',
    queryHash: 'hash_a1b2c3d4e5f6',
    queryText: `{
  "query": {
    "bool": {
      "must": [
        {"match": {"category": "electronics"}}
      ],
      "filter": [
        {"range": {"price": {"gte": 100, "lte": 1000}}}
      ]
    }
  },
  "sort": [
    {"popularity_score": {"order": "desc"}},
    {"relevance_score": {"order": "desc"}}
  ],
  "size": 500
}`,
    queryStructure: {
      query: {
        bool: {
          must: [{ match: { category: "electronics" } }],
          filter: [{ range: { price: { gte: 100, lte: 1000 } } }]
        }
      },
      sort: [
        { popularity_score: { order: "desc" } },
        { relevance_score: { order: "desc" } }
      ],
      size: 500
    },
    avgLatency: 3200.7,
    maxLatency: 5800.3,
    p95Latency: 4900.1,
    p99Latency: 5500.8,
    frequency: 28,
    severity: 'high',
    timestamp: '2024-10-26T13:15:22.456Z',
    affectedShards: ['products-0', 'products-1', 'products-2'],
    shardPerformance: (() => {
      const baseShards = [
        { shardId: 'products-0', nodeId: 'node-1', baseLatency: 2800.1, status: 'success', docCount: 89000 },
        { shardId: 'products-1', nodeId: 'node-2', baseLatency: 3500.5, status: 'success', docCount: 94000 },
        { shardId: 'products-2', nodeId: 'node-3', baseLatency: 3300.2, status: 'success', docCount: 91000 },
      ];
      
      return baseShards.map(shard => {
        const distribution = generateShardLatencyDistribution(shard.baseLatency, 0.25);
        return {
          shardId: shard.shardId,
          nodeId: shard.nodeId,
          latency: shard.baseLatency,
          status: shard.status,
          docCount: shard.docCount,
          p50Latency: distribution.p50,
          p90Latency: distribution.p90,
          p95Latency: distribution.p95,
          p99Latency: distribution.p99,
          latencyDistribution: distribution.latencies
        };
      });
    })(),
    nodePerformance: [], // Will be generated dynamically
    historicalData: generateHistoricalData(3200, 24),
    rootCause: `## Root Cause Analysis - High Latency

### Issue Overview
Query performance degraded due to sorting on unindexed fields, causing excessive memory usage and computational overhead.

### Contributing Factors

**1. Sorting on Unindexed Fields**
- \`popularity_score\` and \`relevance_score\` fields are not properly indexed for sorting
- OpenSearch must load all field values into memory for sorting operations
- No index-time sorting configuration to optimize frequent sort operations
- Reference: https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-index-sorting.html

**2. Multiple Sort Criteria**
- Dual sorting on \`popularity_score\` and \`relevance_score\` compounds memory pressure
- Each sort field requires separate field data loading
- Secondary sort operations add computational overhead

**3. Large Result Set Processing**
- Requesting 500 documents requires sorting entire match set
- Memory-intensive operation when sort fields are not optimized
- Cannot leverage index sorting for performance optimization

**4. Frequent Sort Pattern**
- High query frequency (28 executions) on same sort fields
- Repeated memory allocation for field data loading
- Missing index-level optimization for common sort patterns

### Performance Impact
- **3.2s average latency** from in-memory sorting operations
- **Memory pressure** from field data loading
- **Computational overhead** from multi-field sorting
- **Repeated field loading** due to lack of index sorting

### Immediate Actions Required
1. Configure index sorting for \`popularity_score\` and \`relevance_score\` fields
2. Optimize field mappings to support efficient sorting
3. Consider pre-sorting data at index time for frequently sorted fields
4. Monitor field data circuit breaker settings`,
    optimizedQuery: `// 1. Configure Index Sorting (Primary Recommendation)
PUT products_sorted
{
  "settings": {
    "index": {
      "sort.field": ["popularity_score", "relevance_score"],
      "sort.order": ["desc", "desc"]
    }
  },
  "mappings": {
    "properties": {
      "popularity_score": {
        "type": "integer",
        "doc_values": true
      },
      "relevance_score": {
        "type": "float",
        "doc_values": true
      },
      "category": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "price": {
        "type": "integer"
      }
    }
  }
}

// 2. Optimized Query (leverages index sorting)
{
  "timeout": "30s",
  "size": 100,
  "query": {
    "bool": {
      "must": [
        {"match": {"category": "electronics"}}
      ],
      "filter": [
        {"range": {"price": {"gte": 100, "lte": 1000}}}
      ]
    }
  },
  "_source": ["id", "category", "price", "popularity_score", "relevance_score"],
  "track_total_hits": false
}`
  },
  {
    id: 'latency-003',
    queryHash: 'hash_9x8y7z6w5v4u',
    queryText: `{
  "query": {
    "bool": {
      "filter": [
        {"term": {"status": "active"}},
        {"range": {"created_at": {"gte": "now-1d"}}}
      ]
    }
  },
  "size": 50
}`,
    queryStructure: {
      query: {
        bool: {
          filter: [
            { term: { status: "active" } },
            { range: { created_at: { gte: "now-1d" } } }
          ]
        }
      },
      size: 50
    },
    avgLatency: 450.2,
    maxLatency: 890.5,
    p95Latency: 720.3,
    p99Latency: 850.1,
    frequency: 156,
    severity: 'low',
    timestamp: '2024-10-26T12:45:33.789Z',
    affectedShards: ['users-0', 'users-1'],
    shardPerformance: (() => {
      const baseShards = [
        { shardId: 'users-0', nodeId: 'node-1', baseLatency: 420.1, status: 'success', docCount: 45000 },
        { shardId: 'users-1', nodeId: 'node-2', baseLatency: 480.3, status: 'success', docCount: 48000 },
      ];
      
      return baseShards.map(shard => {
        const distribution = generateShardLatencyDistribution(shard.baseLatency, 0.15);
        return {
          shardId: shard.shardId,
          nodeId: shard.nodeId,
          latency: shard.baseLatency,
          status: shard.status,
          docCount: shard.docCount,
          p50Latency: distribution.p50,
          p90Latency: distribution.p90,
          p95Latency: distribution.p95,
          p99Latency: distribution.p99,
          latencyDistribution: distribution.latencies
        };
      });
    })(),
    nodePerformance: [], // Will be generated dynamically
    historicalData: generateHistoricalData(450, 24),
    rootCause: `## Root Cause Analysis - Low Latency

### Issue Overview
Well-optimized query showing good performance characteristics with minimal optimization needs.

### Performance Characteristics

**1. Efficient Query Structure**
- Uses filter context for exact matching (leverages caching)
- Recent time range limits document scan volume
- Small result set (50 documents) reduces processing overhead

**2. Good Shard Distribution**
- Balanced performance across 2 shards
- Consistent latency patterns without outliers
- Healthy node performance indicators

**3. Optimal Resource Usage**
- Low memory footprint from small result size
- Effective use of query caching
- Minimal CPU intensive operations

### Performance Assessment
- **Excellent latency** (450ms average)
- **Consistent performance** across executions
- **Efficient resource utilization**
- **Good user experience** with sub-second response

### Recommendations
This query demonstrates good performance patterns and requires minimal optimization. Consider this as a baseline for other query optimizations:

1. **Maintain filter context usage** for exact matches
2. **Keep result sizes appropriate** for use case requirements  
3. **Continue time-based filtering** for recent data focus
4. **Monitor performance trends** to detect any degradation patterns`
  },
  {
    id: 'latency-004',
    queryHash: 'hash_m5n4o3p2q1r0',
    queryText: `{
  "query": {
    "nested": {
      "path": "transactions",
      "query": {
        "bool": {
          "must": [
            {"range": {"transactions.amount": {"gte": 1000}}},
            {"term": {"transactions.status": "completed"}}
          ]
        }
      }
    }
  },
  "aggs": {
    "transaction_stats": {
      "nested": {"path": "transactions"},
      "aggs": {
        "avg_amount": {"avg": {"field": "transactions.amount"}},
        "status_counts": {
          "terms": {"field": "transactions.status.keyword"}
        }
      }
    }
  },
  "size": 200
}`,
    queryStructure: {
      query: {
        nested: {
          path: "transactions",
          query: {
            bool: {
              must: [
                { range: { "transactions.amount": { gte: 1000 } } },
                { term: { "transactions.status": "completed" } }
              ]
            }
          }
        }
      },
      aggs: {
        transaction_stats: {
          nested: { path: "transactions" },
          aggs: {
            avg_amount: { avg: { field: "transactions.amount" } },
            status_counts: {
              terms: { field: "transactions.status.keyword" }
            }
          }
        }
      },
      size: 200
    },
    avgLatency: 2100.8,
    maxLatency: 3800.2,
    p95Latency: 3200.5,
    p99Latency: 3650.1,
    frequency: 19,
    severity: 'medium',
    timestamp: '2024-10-26T11:20:15.234Z',
    affectedShards: ['accounts-0', 'accounts-1', 'accounts-2', 'accounts-3'],
    shardPerformance: (() => {
      const baseShards = [
        { shardId: 'accounts-0', nodeId: 'node-1', baseLatency: 1800.1, status: 'success', docCount: 65000 },
        { shardId: 'accounts-1', nodeId: 'node-2', baseLatency: 2200.5, status: 'success', docCount: 71000 },
        { shardId: 'accounts-2', nodeId: 'node-3', baseLatency: 2100.2, status: 'success', docCount: 68000 },
        { shardId: 'accounts-3', nodeId: 'node-1', baseLatency: 2300.8, status: 'success', docCount: 73000 },
      ];
      
      return baseShards.map(shard => {
        const distribution = generateShardLatencyDistribution(shard.baseLatency, 0.2);
        return {
          shardId: shard.shardId,
          nodeId: shard.nodeId,
          latency: shard.baseLatency,
          status: shard.status,
          docCount: shard.docCount,
          p50Latency: distribution.p50,
          p90Latency: distribution.p90,
          p95Latency: distribution.p95,
          p99Latency: distribution.p99,
          latencyDistribution: distribution.latencies
        };
      });
    })(),
    nodePerformance: [], // Will be generated dynamically
    historicalData: generateHistoricalData(2100, 24),
    rootCause: `## Root Cause Analysis - Medium Latency

### Issue Overview
Nested query with aggregations showing moderate performance impact due to complex document structure processing.

### Contributing Factors

**1. Nested Query Complexity**
- Nested document structure requires specialized processing
- Each parent document can contain multiple nested transactions
- Join operations between parent and nested documents increase CPU usage

**2. Dual Aggregation Processing**
- Nested aggregations require separate execution context
- Statistics calculations across nested fields
- Terms aggregation on nested document fields

**3. Document Volume Impact**
- Processing 200+ parent documents with nested children
- Each parent potentially contains multiple transaction records
- Memory usage scales with nested document count

### Performance Analysis
- **Moderate latency** (2.1s average) for nested operations
- **Consistent shard performance** without major outliers
- **Stable execution patterns** across time periods
- **Acceptable resource utilization** for complex operations

### Optimization Strategies
1. **Consider parent-child relationships** instead of nested for some use cases
2. **Implement result caching** for common aggregation patterns
3. **Add filters early** to reduce nested document processing volume
4. **Monitor nested mapping strategies** for optimal field organization
5. **Use composite aggregations** for pagination-friendly results`,
    optimizedQuery: `{
  "timeout": "30s",
  "size": 50,
  "query": {
    "nested": {
      "path": "transactions",
      "query": {
        "bool": {
          "filter": [
            {"range": {"transactions.amount": {"gte": 1000}}},
            {"term": {"transactions.status": "completed"}}
          ]
        }
      }
    }
  },
  "aggs": {
    "transaction_stats": {
      "nested": {"path": "transactions"},
      "aggs": {
        "filtered_stats": {
          "filter": {
            "bool": {
              "filter": [
                {"range": {"transactions.amount": {"gte": 1000}}},
                {"term": {"transactions.status": "completed"}}
              ]
            }
          },
          "aggs": {
            "avg_amount": {"avg": {"field": "transactions.amount"}}
          }
        }
      }
    }
  },
  "_source": ["id", "account_id", "created_at"],
  "track_total_hits": false
}`
  }
];

// Generate realistic node performance data after creating the records
mockLatencyData.forEach(record => {
  record.nodePerformance = generateNodePerformanceFromShards(record.shardPerformance);
});

// Helper function to generate realistic historical data
function generateHistoricalData(baseLatency: number, hours: number): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  const now = Date.now();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now - (i * 60 * 60 * 1000)).toISOString();
    
    // Add some realistic variance to latency
    const variance = 0.2; // 20% variance
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
    const latency = baseLatency * randomFactor;
    
    // Add occasional spikes for anomaly detection
    const isSpike = Math.random() < 0.05; // 5% chance of spike
    const finalLatency = isSpike ? latency * (2 + Math.random()) : latency;
    
    const count = Math.floor(Math.random() * 20) + 5; // 5-25 queries per hour
    
    data.push({
      timestamp,
      latency: finalLatency,
      count
    });
  }
  
  return data;
}

export const loadLatencyData = (): Promise<LatencyRecord[]> => {
  // In production, this would make actual API calls to:
  // - OpenSearch Query Insights API
  // - Top queries index 
  // - Historical performance data
  // - LangGraph analysis service
  return Promise.resolve(mockLatencyData);
};

export const getLatencyById = (id: string): Promise<LatencyRecord | null> => {
  const record = mockLatencyData.find(r => r.id === id);
  return Promise.resolve(record || null);
};

// Future API integration functions that would connect to:
// - LangGraph for AI-powered analysis
// - MCP tools for OpenSearch query insights
// - Historical data from top_queries indices
// - Real-time performance monitoring

export const triggerLatencyAnalysis = async (queryHash: string): Promise<string> => {
  // This would trigger the LangGraph workflow for async analysis
  // Returns analysis job ID for polling
  return Promise.resolve(`analysis_job_${Date.now()}`);
};

export const getAnalysisStatus = async (jobId: string): Promise<{
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: any;
}> => {
  // Poll analysis job status
  return Promise.resolve({
    status: 'completed',
    progress: 100,
    result: { /* analysis results */ }
  });
};

export const saveLatencyReport = async (recordId: string, report: any): Promise<void> => {
  // Save generated analysis report
  return Promise.resolve();
};