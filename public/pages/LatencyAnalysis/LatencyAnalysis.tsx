/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiTitle,
  EuiSpacer,
  EuiBasicTable,
  EuiHealth,
  EuiBadge,
  EuiButton,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiToolTip,
} from '@elastic/eui';
import { AppMountParameters, CoreStart } from 'opensearch-dashboards/public';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { QueryInsightsDashboardsPluginStartDependencies } from '../../types';
import { LatencyRecord, loadLatencyData, getLatencyById } from './utils/dataLoader';
import { LatencyDetailView } from './components/LatencyDetailView';

interface LatencyAnalysisProps {
  core: CoreStart;
  depsStart: QueryInsightsDashboardsPluginStartDependencies;
  params: AppMountParameters;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

export const LatencyAnalysis: React.FC<LatencyAnalysisProps> = ({
  core,
  depsStart,
  params,
  dataSourceManagement,
}) => {
  const history = useHistory();
  const location = useLocation();
  const [latencyRecords, setLatencyRecords] = useState<LatencyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<LatencyRecord | null>(null);

  const isDetailView = location.pathname.includes('/latency-detail/');
  const recordId = isDetailView ? location.pathname.split('/latency-detail/')[1] : null;

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadLatencyData();
        setLatencyRecords(data);
        
        if (recordId) {
          const record = await getLatencyById(recordId);
          setSelectedRecord(record);
        }
      } catch (error) {
        console.error('Failed to load latency data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [recordId]);

  const handleViewDetails = (record: LatencyRecord) => {
    history.push(`/intelligentAlerts/latency/latency-detail/${record.id}`);
  };

  const handleBackToList = () => {
    history.push('/intelligentAlerts/latency');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning'; 
      case 'medium': return 'primary';
      case 'low': return 'success';
      default: return 'subdued';
    }
  };

  if (isDetailView && selectedRecord) {
    return (
      <EuiPage>
        <EuiPageBody>
          <EuiPageContent>
            <LatencyDetailView 
              record={selectedRecord} 
              onBack={handleBackToList}
            />
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }

  return (
    <LatencySummaryView 
      records={latencyRecords}
      loading={loading}
      onViewDetails={handleViewDetails}
    />
  );
};

interface LatencySummaryViewProps {
  records: LatencyRecord[];  
  loading: boolean;
  onViewDetails: (record: LatencyRecord) => void;
}

const LatencySummaryView: React.FC<LatencySummaryViewProps> = ({ 
  records, 
  loading, 
  onViewDetails 
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'success';
      default: return 'subdued';
    }
  };

  const columns = [
    {
      field: 'severity',
      name: 'Severity',
      width: '100px',
      render: (severity: string) => (
        <EuiHealth color={getSeverityColor(severity)}>
          {severity.toUpperCase()}
        </EuiHealth>
      ),
    },
    {
      field: 'queryHash',
      name: 'Query',
      truncateText: true,
      render: (queryHash: string, record: LatencyRecord) => (
        <EuiButton
          color="text"
          size="s"
          onClick={() => onViewDetails(record)}
        >
          {record.queryText ? record.queryText.substring(0, 60) + '...' : queryHash}
        </EuiButton>
      ),
    },
    {
      field: 'avgLatency',
      name: 'Avg Latency',
      width: '120px',
      render: (avgLatency: number) => (
        <EuiText size="s">
          <strong>{avgLatency.toFixed(1)}ms</strong>
        </EuiText>
      ),
    },
    {
      field: 'maxLatency',
      name: 'Max Latency',
      width: '120px',
      render: (maxLatency: number) => (
        <EuiText size="s" color={maxLatency > 10000 ? 'danger' : 'default'}>
          {maxLatency.toFixed(1)}ms
        </EuiText>
      ),
    },
    {
      field: 'frequency',
      name: 'Frequency',
      width: '100px',
      render: (frequency: number) => (
        <EuiFlexGroup alignItems="center" gutterSize="xs">
          <EuiFlexItem grow={false}>
            <EuiIcon type="clock" size="s" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s">{frequency}</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    {
      field: 'timestamp',
      name: 'Last Seen',
      width: '180px',
      render: (timestamp: string) => (
        <EuiText size="s">
          {new Date(timestamp).toLocaleString()}
        </EuiText>
      ),
    },
    {
      field: 'affectedShards',
      name: 'Affected Shards',
      render: (shards: string[]) => (
        <EuiFlexGroup gutterSize="xs" wrap>
          {shards.slice(0, 3).map((shard, index) => (
            <EuiFlexItem grow={false} key={index}>
              <EuiBadge color="default" size="s">
                {shard}
              </EuiBadge>
            </EuiFlexItem>
          ))}
          {shards.length > 3 && (
            <EuiFlexItem grow={false}>
              <EuiToolTip content={shards.slice(3).join(', ')}>
                <EuiBadge color="subdued" size="s">
                  +{shards.length - 3} more
                </EuiBadge>
              </EuiToolTip>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      ),
    },
    {
      name: 'Actions',
      width: '120px',
      render: (record: LatencyRecord) => (
        <EuiButton
          size="s"
          fill
          onClick={() => onViewDetails(record)}
        >
          Analyze
        </EuiButton>
      ),
    },
  ];

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageContent>
          <EuiFlexGroup gutterSize="l">
            <EuiFlexItem>
              <EuiText>
                <p>
                  AI-generated alerts for queries exceeding latency thresholds in OpenSearch. 
                  View intelligent performance analysis, execution breakdowns, and automated 
                  optimization suggestions for slow queries.
                </p>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="l" />

          <EuiBasicTable
            items={records}
            columns={columns}
            loading={loading}
            hasActions={true}
            responsive={true}
            tableLayout="fixed"
          />
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};