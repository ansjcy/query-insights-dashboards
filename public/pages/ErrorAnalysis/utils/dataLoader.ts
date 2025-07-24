/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ErrorRecord {
  id: string;
  title: string;
  category: string;
  timestamp: string;
  frequency: number;
  severity: 'high' | 'medium' | 'low';
  rawStackTrace: string;
  errorMessage: string;
  affectedComponents: string[];
  rootCause?: string;
  suggestedFix?: string;
}

// Search-focused mock data with realistic stack traces for query error analysis
const mockErrorData: ErrorRecord[] = [
  {
    id: 'error-001',
    title: 'SearchPhaseExecutionException - No Shards Available',
    category: 'Search Query Execution',
    timestamp: '2024-10-26T11:41:45.891Z',
    frequency: 15,
    severity: 'high',
    rawStackTrace: `SearchPhaseExecutionException[Failed to execute phase [query], all shards failed; shardFailures {[UaP_8tXhQ1K4W1lv7jn5Uw][product_index][0]: RemoteTransportException[[data-node-1][10.0.1.15:9300][indices:data/read/search[phase/query]]]; nested: SearchException[Query Failed [Failed to execute main query]]; nested: IllegalArgumentException[fielddata is disabled on text fields by default. Set fielddata=true on [description] to enable]; }]
	at org.opensearch.action.search.AbstractSearchAsyncAction.onFirstPhaseResult(AbstractSearchAsyncAction.java:317)
	at org.opensearch.action.search.AbstractSearchAsyncAction.executeNextPhase(AbstractSearchAsyncAction.java:209)
	at org.opensearch.action.search.AbstractSearchAsyncAction.onShardFailure(AbstractSearchAsyncAction.java:393)
	at org.opensearch.action.search.SearchQueryThenFetchAsyncAction.executeQuery(SearchQueryThenFetchAsyncAction.java:91)
	at org.opensearch.action.search.SearchService.executeQueryPhase(SearchService.java:410)
	at org.opensearch.rest.action.search.RestSearchAction.prepareRequest(RestSearchAction.java:144)`,
    errorMessage: 'SearchPhaseExecutionException: Query failed on all shards - fielddata disabled on text field',
    affectedComponents: ['SearchService', 'RestSearchAction', 'QueryPhase', 'FieldDataCache'],
    rootCause: `## Root Cause Analysis

### Issue Overview
The query is attempting to perform sorting or aggregation operations on a text field that has fielddata disabled, which is the default behavior for memory optimization in OpenSearch.

### Technical Details
- **Field Type**: Text field with fielddata disabled by default
- **Operation**: Sorting/aggregation on "description" field
- **Memory Impact**: Text fields are analyzed and can consume significant heap memory
- **Protection Mechanism**: OpenSearch disables fielddata on text fields to prevent excessive memory usage

### Error Flow
1. Query attempts to access field values for "description" field
2. FieldDataCache tries to load field data
3. Operation blocked due to fielddata=false setting
4. SearchPhaseExecutionException thrown across all shards`,
    suggestedFix: `## Suggested Fix

### 🚨 Immediate Action
Use the corresponding .keyword subfield for sorting/aggregation operations.

**❌ Problematic Query:**
\`\`\`json
{
  "query": {"match_all": {}},
  "sort": [{"description": {"order": "asc"}}]
}
\`\`\`

**✅ Fixed Query:**
\`\`\`json
{
  "query": {"match_all": {}},
  "sort": [{"description.keyword": {"order": "asc"}}]
}
\`\`\`

### 🔧 Configuration Option (Use Cautiously)
If fielddata is absolutely required, enable it with careful monitoring:

\`\`\`json
PUT /your_index/_mapping
{
  "properties": {
    "description": {
      "type": "text",
      "fielddata": true
    }
  }
}
\`\`\`

### 🏗️ Recommended Architecture
Restructure mapping to use multi-field mapping:

\`\`\`json
PUT /your_index/_mapping
{
  "properties": {
    "description": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword",
          "ignore_above": 256
        },
        "search": {
          "type": "text",
          "analyzer": "standard"
        }
      }
    }
  }
}
\`\`\`

### 📊 Monitoring
- Monitor heap usage after enabling fielddata
- Set up alerts for high memory consumption
- Use \`GET /_cat/fielddata?v\` to track fielddata usage`
  },
  {
    id: 'error-002', 
    title: 'QueryParsingException - Invalid Bool Query Structure',
    category: 'Query Parsing',
    timestamp: '2024-02-18T11:41:45.891Z',
    frequency: 28,
    severity: 'high',
    rawStackTrace: `org.opensearch.index.query.QueryParsingException: [bool] query malformed, no start_object after query name
	at org.opensearch.index.query.BoolQueryBuilder.parseInnerQueryBuilder(BoolQueryBuilder.java:487)
	at org.opensearch.index.query.BoolQueryBuilder.fromXContent(BoolQueryBuilder.java:431)
	at org.opensearch.index.query.QueryParseContext.parseInnerQueryBuilder(QueryParseContext.java:89)
	at org.opensearch.index.query.AbstractQueryBuilder.parseInnerQueryBuilder(AbstractQueryBuilder.java:94)
	at org.opensearch.search.builder.SearchSourceBuilder.parseXContent(SearchSourceBuilder.java:823)
	at org.opensearch.search.builder.SearchSourceBuilder.fromXContent(SearchSourceBuilder.java:756)
	at org.opensearch.rest.action.search.RestSearchAction.prepareRequest(RestSearchAction.java:144)
	at org.opensearch.rest.BaseRestHandler.handleRequest(BaseRestHandler.java:127)
	at org.opensearch.rest.RestController.dispatchRequest(RestController.java:320)
	at org.opensearch.http.AbstractHttpServerTransport.dispatchRequest(AbstractHttpServerTransport.java:366)
Request body: {"query":{"bool":{"must":[{"term":{"status":"active"}},{"range":{"created_at":{"gte":"2024-01-01"}}}],"filter":[invalid_syntax_here]}}}`,
    errorMessage: 'QueryParsingException: Malformed bool query with invalid filter syntax',
    affectedComponents: ['BoolQueryBuilder', 'QueryParseContext', 'SearchSourceBuilder', 'RestSearchAction'],
    rootCause: `## Root Cause Analysis

### Issue Overview
The boolean query contains malformed JSON syntax in the filter clause, causing the query parser to fail during the deserialization phase.

### Technical Details
- **Parser Error**: Expected proper JSON object structure
- **Invalid Content**: "invalid_syntax_here" is not valid JSON
- **Failure Point**: BoolQueryBuilder.parseInnerQueryBuilder method
- **Missing Token**: Expected start_object token after query name

### Error Flow
1. Request received with malformed JSON in bool query
2. SearchSourceBuilder attempts to parse query DSL
3. BoolQueryBuilder.parseInnerQueryBuilder fails to find valid structure
4. QueryParsingException thrown before query execution`,
    suggestedFix: `## Suggested Fix

### 🚨 Immediate Action
Validate and fix the JSON structure in the bool query.

**❌ Problematic Query:**
\`\`\`json
{
  "query": {
    "bool": {
      "must": [
        {"term": {"status": "active"}},
        {"range": {"created_at": {"gte": "2024-01-01"}}}
      ],
      "filter": [invalid_syntax_here]
    }
  }
}
\`\`\`

**✅ Fixed Query:**
\`\`\`json
{
  "query": {
    "bool": {
      "must": [
        {"term": {"status": "active"}},
        {"range": {"created_at": {"gte": "2024-01-01"}}}
      ],
      "filter": [
        {"term": {"category": "product"}},
        {"range": {"price": {"gte": 10}}}
      ]
    }
  }
}
\`\`\`

### 🔍 Debugging Steps
1. Use JSON validator to check syntax
2. Validate each bool query clause structure
3. Ensure proper nesting of query objects

### 🛡️ Prevention Strategies

**Client-side Validation:**
\`\`\`javascript
function validateBoolQuery(query) {
  if (!query.query || !query.query.bool) return false;
  
  const boolQuery = query.query.bool;
  const validClauses = ['must', 'filter', 'should', 'must_not'];
  
  for (let clause of validClauses) {
    if (boolQuery[clause] && !Array.isArray(boolQuery[clause])) {
      return false;
    }
  }
  return true;
}
\`\`\`

**Query Builder Pattern:**
\`\`\`javascript
const queryBuilder = {
  bool: () => ({
    must: [],
    filter: [],
    should: [],
    must_not: []
  }),
  addMust: (query, clause) => {
    query.must.push(clause);
    return query;
  }
};
\`\`\`

### 📋 JSON Schema Validation
Implement schema validation for query payloads to catch structural issues before submission.`
  },
  {
    id: 'error-003',
    title: 'SearchTimeoutException - Query Execution Timeout',
    category: 'Query Performance',
    timestamp: '2024-10-26T10:15:32.123Z',
    frequency: 42,
    severity: 'medium',
    rawStackTrace: `org.opensearch.search.SearchTimeoutException: Time exceeded [30000ms > 30000ms]
	at org.opensearch.search.SearchService.executeQueryPhase(SearchService.java:457)
	at org.opensearch.search.SearchService.sendExecuteQuery(SearchService.java:319)
	at org.opensearch.action.search.SearchTransportService$SearchQueryTransportHandler.messageReceived(SearchTransportService.java:390)
	at org.opensearch.transport.TransportRequestHandler.messageReceived(TransportRequestHandler.java:33)
	at org.opensearch.transport.TcpTransport.handleRequest(TcpTransport.java:1845)
	at org.opensearch.transport.TcpTransport.handleInboundMessage(TcpTransport.java:1812)
Query: {"query":{"bool":{"must":[{"wildcard":{"description":"*search*term*"}}],"filter":[{"range":{"timestamp":{"gte":"2024-01-01","lte":"2024-12-31"}}}]}},"size":10000,"sort":[{"_score":{"order":"desc"}}]}`,
    errorMessage: 'SearchTimeoutException: Query execution exceeded 30 second timeout limit',
    affectedComponents: ['SearchService', 'SearchTransportService', 'WildcardQuery', 'QueryPhase'],
    rootCause: `## Root Cause Analysis

### Issue Overview
The query contains a computationally expensive wildcard pattern that cannot complete within the 30-second timeout limit.

### Technical Details
- **Wildcard Pattern**: \`*search*term*\` requires scanning all terms in the index
- **Performance Impact**: Cannot utilize inverted index efficiently for leading wildcards
- **Result Size**: Requesting 10,000 results with scoring increases processing time
- **Timeout Limit**: 30-second default timeout exceeded during execution

### Performance Factors
1. **Leading Wildcards**: Patterns starting with \`*\` are particularly expensive
2. **Large Result Set**: 10,000 documents with scoring computation
3. **Index Size**: Performance degrades with dataset size
4. **Resource Contention**: Other queries competing for cluster resources`,
    suggestedFix: `## Suggested Fix

### 🚨 Immediate Action
Optimize the query structure and reduce result size.

**❌ Problematic Query:**
\`\`\`json
{
  "query": {
    "bool": {
      "must": [{"wildcard": {"description": "*search*term*"}}],
      "filter": [{"range": {"timestamp": {"gte": "2024-01-01", "lte": "2024-12-31"}}}]
    }
  },
  "size": 10000,
  "sort": [{"_score": {"order": "desc"}}]
}
\`\`\`

**✅ Optimized Query:**
\`\`\`json
{
  "query": {
    "bool": {
      "must": [{"match_phrase_prefix": {"description": "search term"}}],
      "filter": [{"range": {"timestamp": {"gte": "2024-01-01", "lte": "2024-12-31"}}}]
    }
  },
  "size": 100,
  "sort": [{"_score": {"order": "desc"}}],
  "timeout": "60s"
}
\`\`\`

### 🏗️ Better Alternatives

**NGram Analysis for Autocomplete:**
\`\`\`json
PUT /your_index/_settings
{
  "analysis": {
    "tokenizer": {
      "edge_ngram_tokenizer": {
        "type": "edge_ngram",
        "min_gram": 2,
        "max_gram": 10,
        "token_chars": ["letter", "digit"]
      }
    },
    "analyzer": {
      "autocomplete_analyzer": {
        "type": "custom",
        "tokenizer": "edge_ngram_tokenizer",
        "filters": ["lowercase"]
      }
    }
  }
}
\`\`\`

**Using the Autocomplete Field:**
\`\`\`json
{
  "query": {
    "match": {
      "description.autocomplete": "search term"
    }
  },
  "size": 100
}
\`\`\`

### ⚡ Performance Optimizations

**Pagination with search_after:**
\`\`\`json
{
  "query": {"match_phrase_prefix": {"description": "search term"}},
  "size": 100,
  "sort": [{"_score": {"order": "desc"}}, {"_id": {"order": "asc"}}],
  "search_after": [0.85, "previous_doc_id"]
}
\`\`\`

**Async Search for Long Queries:**
\`\`\`bash
POST /your_index/_async_search
{
  "keep_on_completion": true,
  "wait_for_completion_timeout": "10s",
  "query": {
    "wildcard": {"description": "*search*term*"}
  },
  "size": 1000
}
\`\`\`

### 📊 Monitoring & Alerting
- Set up query performance monitoring
- Alert on queries exceeding 10-second thresholds
- Implement query complexity scoring
- Use slow query logging: \`index.search.slowlog.threshold.query.warn: 5s\``
  },
  {
    id: 'error-004',
    title: 'CircuitBreakerException - Query Memory Limit',
    category: 'Memory Management', 
    timestamp: '2024-10-26T09:30:15.456Z',
    frequency: 8,
    severity: 'low',
    rawStackTrace: `org.opensearch.common.breaker.CircuitBreakingException: [parent] Data too large, data for [<http_request>] would be [2147483648/2.0gb], which is larger than the limit of [2040109465/1.9gb], real usage: [2040109465/1.9gb], new bytes reserved: [107374183/102.4mb], usages [request=0/0b, fielddata=536870912/512mb, in_flight_requests=1610612736/1.5gb, model_inference=0/0b, eql_sequence=0/0b]
	at org.opensearch.search.aggregations.bucket.terms.GlobalOrdinalsStringTermsAggregator.collectFromGlobalOrdinals(GlobalOrdinalsStringTermsAggregator.java:201)
	at org.opensearch.search.aggregations.bucket.terms.StringTermsAggregatorFactory.create(StringTermsAggregatorFactory.java:98)
	at org.opensearch.search.SearchService.executeQueryPhase(SearchService.java:410)
Query: {"aggs":{"categories":{"terms":{"field":"category.keyword","size":50000}}}}`,
    errorMessage: 'CircuitBreakerException: Aggregation query exceeded memory circuit breaker limit',
    affectedComponents: ['StringTermsAggregator', 'CircuitBreaker', 'FieldDataCache', 'SearchService'],
    rootCause: `## Root Cause Analysis

### Issue Overview
The terms aggregation requesting 50,000 unique terms triggered the circuit breaker protection mechanism due to excessive memory consumption.

### Memory Breakdown
- **Current Usage**: 1.9GB at capacity limit
- **Fielddata**: 512MB currently loaded
- **In-flight Requests**: 1.5GB active
- **Requested Operation**: Would exceed 1.9GB limit by 102.4MB

### Circuit Breaker Details
- **Protection Mechanism**: Prevents OutOfMemoryError exceptions
- **Trigger Point**: GlobalOrdinalsStringTermsAggregator memory allocation
- **Memory Components**: request=0/0b, fielddata=512MB, in_flight_requests=1.5GB`,
    suggestedFix: `## Suggested Fix

### 🚨 Immediate Action
Reduce aggregation size and implement pagination.

**❌ Memory-Heavy Query:**
\`\`\`json
{
  "aggs": {
    "categories": {
      "terms": {
        "field": "category.keyword", 
        "size": 50000
      }
    }
  }
}
\`\`\`

**✅ Optimized Query:**
\`\`\`json
{
  "aggs": {
    "categories": {
      "composite": {
        "sources": [
          {"categories": {"terms": {"field": "category.keyword"}}}
        ],
        "size": 1000
      }
    }
  }
}
\`\`\`

### 🔄 Pagination Implementation
**First Request:**
\`\`\`json
{
  "aggs": {
    "categories": {
      "composite": {
        "sources": [{"categories": {"terms": {"field": "category.keyword"}}}],
        "size": 1000
      }
    }
  }
}
\`\`\`

**Subsequent Requests:**
\`\`\`json
{
  "aggs": {
    "categories": {
      "composite": {
        "sources": [{"categories": {"terms": {"field": "category.keyword"}}}],
        "size": 1000,
        "after": {"categories": "last_key_from_previous_response"}
      }
    }
  }
}
\`\`\`

### ⚙️ Memory Tuning
**Circuit Breaker Settings:**
\`\`\`json
PUT /_cluster/settings
{
  "transient": {
    "indices.breaker.fielddata.limit": "50%",
    "indices.breaker.request.limit": "40%"
  }
}
\`\`\`

### 📊 Alternative Approaches
**Cardinality Check First:**
\`\`\`json
{
  "aggs": {
    "category_count": {
      "cardinality": {"field": "category.keyword"}
    }
  }
}
\`\`\`

**Significant Terms (Focus on Important Terms):**
\`\`\`json
{
  "aggs": {
    "significant_categories": {
      "significant_terms": {
        "field": "category.keyword",
        "size": 1000
      }
    }
  }
}
\`\`\``
  },
  {
    id: 'error-005',
    title: 'ScriptException - Painless Script Error',
    category: 'Script Execution',
    timestamp: '2024-10-26T08:45:22.789Z', 
    frequency: 12,
    severity: 'medium',
    rawStackTrace: `org.opensearch.script.ScriptException: compile error
	at org.opensearch.painless.Compiler.compile(Compiler.java:212)
	at org.opensearch.painless.PainlessScriptEngine.compile(PainlessScriptEngine.java:142)
	at org.opensearch.script.ScriptService.compileInContext(ScriptService.java:345)
	at org.opensearch.search.aggregations.metrics.scripted.ScriptedMetricAggregatorFactory.create(ScriptedMetricAggregatorFactory.java:128)
	at org.opensearch.search.SearchService.executeQueryPhase(SearchService.java:410)
Script: "doc['price'].value * params.multiplier"
Error: variable [multiplier] is not defined`,
    errorMessage: 'ScriptException: Painless script compilation failed due to undefined variable',
    affectedComponents: ['PainlessScriptEngine', 'ScriptService', 'ScriptedMetricAggregator', 'SearchService'],
    rootCause: `## Root Cause Analysis

### Issue Overview
The Painless script references a parameter "multiplier" that was not provided in the script parameters during compilation.

### Technical Details
- **Script Code**: \`doc['price'].value * params.multiplier\`
- **Missing Parameter**: "multiplier" not defined in params object
- **Error Type**: Compile-time error, not runtime
- **Validation Point**: Painless compiler variable reference check

### Error Flow
1. ScriptedMetricAggregator receives script
2. PainlessScriptEngine attempts compilation
3. Compiler validates variable references
4. "multiplier" parameter not found in context
5. ScriptException thrown before execution`,
    suggestedFix: `## Suggested Fix

### 🚨 Immediate Action
Add the missing parameter to the script configuration.

**❌ Script Missing Parameters:**
\`\`\`json
{
  "aggs": {
    "calculated_value": {
      "scripted_metric": {
        "map_script": {
          "source": "doc['price'].value * params.multiplier"
        }
      }
    }
  }
}
\`\`\`

**✅ Script with Parameters:**
\`\`\`json
{
  "aggs": {
    "calculated_value": {
      "scripted_metric": {
        "map_script": {
          "source": "doc['price'].value * params.multiplier",
          "params": {
            "multiplier": 1.5
          }
        }
      }
    }
  }
}
\`\`\`

### 🔒 Stored Scripts (Recommended)
**Create Stored Script:**
\`\`\`json
PUT /_scripts/price_calculator
{
  "script": {
    "lang": "painless",
    "source": "doc['price'].value * params.multiplier"
  }
}
\`\`\`

**Use Stored Script:**
\`\`\`json
{
  "aggs": {
    "calculated_value": {
      "scripted_metric": {
        "map_script": {
          "id": "price_calculator",
          "params": {"multiplier": 1.5}
        }
      }
    }
  }
}
\`\`\`

### 🛡️ Parameter Validation
\`\`\`javascript
function validateScriptParams(script, params) {
  const requiredParams = script.match(/params\\.(\\w+)/g) || [];
  const paramNames = requiredParams.map(p => p.replace('params.', ''));
  
  for (let param of paramNames) {
    if (!(param in params)) {
      throw new Error(\`Missing required parameter: \${param}\`);
    }
  }
}
\`\`\``
  },
  {
    id: 'error-006',
    title: 'TooManyClauses Exception - Complex Query',
    category: 'Query Complexity',
    timestamp: '2024-10-26T07:22:11.456Z',
    frequency: 6,
    severity: 'medium',
    rawStackTrace: `org.apache.lucene.search.TooManyClauses: maxClauseCount is set to 1024
	at org.apache.lucene.search.BooleanQuery$Builder.build(BooleanQuery.java:385)
	at org.opensearch.index.query.BoolQueryBuilder.doToQuery(BoolQueryBuilder.java:395)
	at org.opensearch.index.query.AbstractQueryBuilder.toQuery(AbstractQueryBuilder.java:105)
	at org.opensearch.search.query.QueryPhase.execute(QueryPhase.java:115)
	at org.opensearch.search.SearchService.executeQueryPhase(SearchService.java:410)
Query contains 1547 boolean clauses in terms filter`,
    errorMessage: 'TooManyClauses: Boolean query exceeded maximum clause limit of 1024',
    affectedComponents: ['BoolQueryBuilder', 'LuceneQuery', 'QueryPhase', 'SearchService'],
    rootCause: `## Root Cause Analysis

### Issue Overview
The boolean query contains 1,547 clauses, exceeding Lucene's default maximum of 1,024 boolean clauses per query.

### Technical Details
- **Clause Count**: 1,547 boolean clauses in terms filter
- **Lucene Limit**: Default maximum of 1,024 clauses
- **Validation Point**: BooleanQuery$Builder during query construction
- **Protection Mechanism**: Prevents memory exhaustion and performance degradation

### Common Causes
1. Large terms filters with many values
2. Extensive OR conditions in programmatically generated queries
3. Complex multi-criteria search implementations
4. Batch processing queries with large ID lists`,
    suggestedFix: `## Suggested Fix

### 🚨 Immediate Action
Replace boolean query with more efficient terms query.

**❌ Complex Boolean Query:**
\`\`\`json
{
  "query": {
    "bool": {
      "should": [
        {"term": {"id": "value1"}},
        {"term": {"id": "value2"}},
        ...
        {"term": {"id": "value1547"}}
      ]
    }
  }
}
\`\`\`

**✅ Optimized Terms Query:**
\`\`\`json
{
  "query": {
    "terms": {
      "id": ["value1", "value2", "value3", ..., "value1547"]
    }
  }
}
\`\`\`

### ⚙️ Configuration Option (Temporary)
Increase the clause limit cautiously:

\`\`\`json
PUT /_cluster/settings
{
  "transient": {
    "indices.query.bool.max_clause_count": 2048
  }
}
\`\`\`

### 🔄 Query Batching
For extremely large datasets:

\`\`\`json
{
  "query": {
    "bool": {
      "should": [
        {"terms": {"id": ["batch1_values"]}},
        {"terms": {"id": ["batch2_values"]}}
      ]
    }
  }
}
\`\`\`

### 🏗️ Alternative Architectures
**Scroll API for Large Results:**
\`\`\`bash
POST /index/_search?scroll=1m
{
  "size": 1000,
  "query": {"terms": {"id": ["your_values"]}}
}
\`\`\`

**Parent-Child Relationships:**
\`\`\`json
PUT /index/_mapping
{
  "properties": {
    "relationship": {
      "type": "join",
      "relations": {"parent": "child"}
    }
  }
}
\`\`\``
  },
  {
    id: 'error-007',
    title: 'VersionConflictEngineException - Document Update Conflict',
    category: 'Indexing Conflicts',
    timestamp: '2024-10-26T06:10:05.123Z',
    frequency: 3,
    severity: 'high',
    rawStackTrace: `org.opensearch.index.engine.VersionConflictEngineException: [_doc][ABC123]: version conflict, current version [5] is different than the one provided [3]
	at org.opensearch.index.engine.InternalEngine.updateDocument(InternalEngine.java:1756)
	at org.opensearch.index.shard.IndexShard.applyIndexOperation(IndexShard.java:891)
	at org.opensearch.index.shard.IndexShard.index(IndexShard.java:715)
	at org.opensearch.action.bulk.TransportShardBulkAction.executeIndexRequestOnPrimary(TransportShardBulkAction.java:548)
	at org.opensearch.search.suggest.completion.CompletionSuggester.innerExecute(CompletionSuggester.java:87)
Bulk update operation failed on document with outdated version`,
    errorMessage: 'VersionConflictEngineException: Document version conflict during bulk update operation',
    affectedComponents: ['InternalEngine', 'IndexShard', 'TransportShardBulkAction', 'BulkProcessor'],
    rootCause: `## Root Cause Analysis

### Issue Overview
A version conflict occurred during a bulk update operation due to concurrent document modifications.

### Technical Details
- **Document ID**: ABC123
- **Expected Version**: 3 (from application)
- **Current Version**: 5 (in index)
- **Concurrency Control**: Optimistic locking mechanism
- **Detection Point**: InternalEngine during document update

### Conflict Scenario
1. Application reads document version 3
2. Another process updates document (versions 4, 5)
3. Original application attempts update with stale version 3
4. InternalEngine detects mismatch and rejects update
5. VersionConflictEngineException thrown to maintain consistency`,
    suggestedFix: `## Suggested Fix

### 🚨 Immediate Action
Implement retry logic and version fetching.

**❌ Update with Stale Version:**
\`\`\`json
POST /index/_doc/ABC123/_update
{
  "_version": 3,
  "doc": {"field": "new_value"}
}
\`\`\`

**✅ Fetch Current Version First:**
\`\`\`bash
# 1. Get current document
GET /index/_doc/ABC123

# 2. Use current version in update
POST /index/_doc/ABC123/_update
{
  "_version": 5,
  "doc": {"field": "new_value"}
}
\`\`\`

### 🔄 Retry Logic Implementation
\`\`\`javascript
async function updateWithRetry(docId, updateData, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Fetch current document
      const current = await client.get({
        index: 'your_index',
        id: docId
      });
      
      // Update with current version
      return await client.update({
        index: 'your_index',
        id: docId,
        version: current.body._version,
        body: { doc: updateData }
      });
      
    } catch (error) {
      if (error.meta?.body?.error?.type === 'version_conflict_engine_exception') {
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 100)
        );
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded for version conflict');
}
\`\`\`

### 🏗️ Alternative Strategies

**External Versioning:**
\`\`\`json
POST /index/_doc/ABC123
{
  "_version": 12345,
  "_version_type": "external",
  "field": "value"
}
\`\`\`

**Upsert Operations:**
\`\`\`json
POST /index/_doc/ABC123/_update
{
  "doc": {"field": "new_value"},
  "doc_as_upsert": true
}
\`\`\`

**Bulk Operation Conflict Handling:**
\`\`\`javascript
const bulkResponse = await client.bulk({
  body: bulkOperations
});

// Handle conflicts
const conflicts = bulkResponse.body.items
  .filter(item => item.update?.error?.type === 'version_conflict_engine_exception');

// Retry conflicts with fresh versions
for (const conflict of conflicts) {
  await updateWithRetry(conflict.update._id, updateData);
}
\`\`\`

### 📊 Monitoring
- Track conflict rates by document/index
- Alert on high conflict scenarios (>5% of operations)
- Monitor concurrent update patterns
- Implement conflict resolution metrics`
  }
];

export const loadErrorData = (): Promise<ErrorRecord[]> => {
  // Returns mock error data for demonstration purposes
  return Promise.resolve(mockErrorData);
};

export const getErrorById = (id: string): Promise<ErrorRecord | null> => {
  const error = mockErrorData.find(e => e.id === id);
  return Promise.resolve(error || null);
};

export const parseStackTrace = (stackTrace: string) => {
  const lines = stackTrace.split('\n');
  const mainError = lines[0];
  const stackFrames = lines.slice(1).filter(line => line.trim().startsWith('at '));
  
  return {
    mainError,
    stackFrames: stackFrames.map(frame => {
      const match = frame.match(/at\s+([^(]+)\(([^:]+):?(\d+)?\)/);
      if (match) {
        return {
          method: match[1].trim(),
          file: match[2],
          line: match[3] ? parseInt(match[3]) : null,
          raw: frame.trim()
        };
      }
      return { raw: frame.trim() };
    })
  };
};