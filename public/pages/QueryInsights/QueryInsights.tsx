/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { EuiBasicTableColumn, EuiInMemoryTable, EuiLink, EuiSuperDatePicker } from '@elastic/eui';
import { useHistory, useLocation } from 'react-router-dom';
import hash from 'object-hash';
import { CoreStart } from 'opensearch-dashboards/public';
import { QUERY_INSIGHTS } from '../TopNQueries/TopNQueries';
import { SearchQueryRecord } from '../../../types/types';
import {
  CPU_TIME,
  INDICES,
  LATENCY,
  MEMORY_USAGE,
  NODE_ID,
  SEARCH_TYPE,
  TIMESTAMP,
  TOTAL_SHARDS,
} from '../../../common/constants';

const TIMESTAMP_FIELD = 'timestamp';
const MEASUREMENTS_FIELD = 'measurements';
const INDICES_FIELD = 'indices';
const SEARCH_TYPE_FIELD = 'search_type';
const NODE_ID_FIELD = 'node_id';
const TOTAL_SHARDS_FIELD = 'total_shards';
const METRIC_DEFAULT_MSG = 'Not enabled';

const QueryInsights = ({
  queries,
  loading,
  onTimeChange,
  recentlyUsedRanges,
  currStart,
  currEnd,
  core,
}: {
  queries: SearchQueryRecord[];
  loading: boolean;
  onTimeChange: any;
  recentlyUsedRanges: any[];
  currStart: string;
  currEnd: string;
  core: CoreStart;
}) => {
  const history = useHistory();
  const location = useLocation();
  const [pagination, setPagination] = useState({ pageIndex: 0 });

  useEffect(() => {
    core.chrome.setBreadcrumbs([
      {
        text: 'Query insights',
        href: QUERY_INSIGHTS,
        onClick: (e) => {
          e.preventDefault();
          history.push(QUERY_INSIGHTS);
        },
      },
    ]);
  }, [core.chrome, history, location]);

  const convertTime = (unixTime: number) => {
    const date = new Date(unixTime);
    const loc = date.toDateString().split(' ');
    return `${loc[1]} ${loc[2]}, ${loc[3]} @ ${date.toLocaleTimeString('en-US')}`;
  };

  const cols: Array<EuiBasicTableColumn<any>> = [
    {
      // Make into flyout instead?
      name: TIMESTAMP,
      render: (query: any) => {
        return (
          <span>
            <EuiLink onClick={() => history.push(`/query-details/${hash(query)}`)}>
              {convertTime(query.timestamp)}
            </EuiLink>
          </span>
        );
      },
      sortable: (query) => query.timestamp,
      truncateText: true,
    },
    {
      field: MEASUREMENTS_FIELD,
      name: LATENCY,
      render: (measurements: any) => {
        const latencyValue = measurements?.latency?.number;
        return latencyValue !== undefined ? `${latencyValue} ms` : METRIC_DEFAULT_MSG;
      },
      sortable: true,
      truncateText: true,
    },
    {
      field: MEASUREMENTS_FIELD,
      name: CPU_TIME,
      render: (measurements: { cpu?: { number?: number } }) => {
        const cpuValue = measurements?.cpu?.number;
        return cpuValue !== undefined ? `${cpuValue / 1000000} ms` : METRIC_DEFAULT_MSG;
      },
      sortable: true,
      truncateText: true,
    },
    {
      field: MEASUREMENTS_FIELD,
      name: MEMORY_USAGE,
      render: (measurements: { memory?: { number?: number } }) => {
        const memoryValue = measurements?.memory?.number;
        return memoryValue !== undefined ? `${memoryValue} B` : METRIC_DEFAULT_MSG;
      },
      sortable: true,
      truncateText: true,
    },
    {
      field: INDICES_FIELD,
      name: INDICES,
      render: (indices: string[]) => Array.from(new Set(indices.flat())).join(', '),
      sortable: true,
      truncateText: true,
    },
    {
      field: SEARCH_TYPE_FIELD,
      name: SEARCH_TYPE,
      render: (searchType: string) => searchType.replaceAll('_', ' '),
      sortable: true,
      truncateText: true,
    },
    {
      field: NODE_ID_FIELD,
      name: NODE_ID,
      sortable: true,
      truncateText: true,
    },
    {
      field: TOTAL_SHARDS_FIELD,
      name: TOTAL_SHARDS,
      sortable: true,
      truncateText: true,
    },
  ];

  const onRefresh = async ({ start, end }: { start: string; end: string }) => {
    onTimeChange({ start, end });
  };

  const filterDuplicates = (options: any[]) =>
    options.filter(
      (value, index, self) => index === self.findIndex((t) => t.value === value.value)
    );

  return (
    <EuiInMemoryTable
      items={queries}
      columns={cols}
      sorting={{
        sort: {
          field: TIMESTAMP_FIELD,
          direction: 'desc',
        },
      }}
      onTableChange={({ page: { index } }) => setPagination({ pageIndex: index })}
      pagination={pagination}
      loading={loading}
      search={{
        box: {
          placeholder: 'Search queries',
          schema: false,
        },
        filters: [
          {
            type: 'field_value_selection',
            field: INDICES_FIELD,
            name: INDICES,
            multiSelect: true,
            options: filterDuplicates(
              queries.map((query) => {
                const values = Array.from(new Set(query[INDICES_FIELD].flat()));
                return {
                  value: values.join(','),
                  name: values.join(','),
                  view: values.join(', '),
                };
              })
            ),
          },
          {
            type: 'field_value_selection',
            field: SEARCH_TYPE_FIELD,
            name: SEARCH_TYPE,
            multiSelect: false,
            options: filterDuplicates(
              queries.map((query) => ({
                value: query[SEARCH_TYPE_FIELD],
                name: query[SEARCH_TYPE_FIELD],
                view: query[SEARCH_TYPE_FIELD],
              }))
            ),
          },
          {
            type: 'field_value_selection',
            field: NODE_ID_FIELD,
            name: NODE_ID,
            multiSelect: true,
            options: filterDuplicates(
              queries.map((query) => ({
                value: query[NODE_ID_FIELD],
                name: query[NODE_ID_FIELD],
                view: query[NODE_ID_FIELD].replaceAll('_', ' '),
              }))
            ),
          },
        ],
        toolsRight: [
          <EuiSuperDatePicker
            start={currStart}
            end={currEnd}
            onTimeChange={onTimeChange}
            recentlyUsedRanges={recentlyUsedRanges}
            onRefresh={onRefresh}
            updateButtonProps={{ fill: false }}
          />,
        ],
      }}
      executeQueryOptions={{
        defaultFields: [
          TIMESTAMP_FIELD,
          MEASUREMENTS_FIELD,
          INDICES_FIELD,
          SEARCH_TYPE_FIELD,
          NODE_ID_FIELD,
          TOTAL_SHARDS_FIELD,
        ],
      }}
      allowNeutralSort={false}
    />
  );
};

// eslint-disable-next-line import/no-default-export
export default QueryInsights;
