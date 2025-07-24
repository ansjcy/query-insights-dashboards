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
import { ErrorRecord, loadErrorData, getErrorById } from './utils/dataLoader';
import { ErrorDetailView } from './components/ErrorDetailView';

interface ErrorAnalysisProps {
  core: CoreStart;
  depsStart: QueryInsightsDashboardsPluginStartDependencies;
  params: AppMountParameters;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

export const ErrorAnalysis: React.FC<ErrorAnalysisProps> = ({
  core,
  depsStart,
  params,
  dataSourceManagement,
}) => {
  const history = useHistory();
  const location = useLocation();
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorRecord | null>(null);

  const isDetailView = location.pathname.includes('/error-detail/');
  const errorId = isDetailView ? location.pathname.split('/error-detail/')[1] : null;

  useEffect(() => {
    const loadData = async () => {
      try {
        const errorData = await loadErrorData();
        setErrors(errorData);
        
        if (errorId) {
          const error = await getErrorById(errorId);
          setSelectedError(error);
        }
      } catch (error) {
        console.error('Failed to load error data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [errorId]);

  const handleViewDetails = (error: ErrorRecord) => {
    history.push(`/intelligentAlerts/errors/error-detail/${error.id}`);
  };

  const handleBackToList = () => {
    history.push('/intelligentAlerts');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning'; 
      case 'low': return 'success';
      default: return 'subdued';
    }
  };


  if (isDetailView && selectedError) {
    return (
      <EuiPage>
        <EuiPageBody>
          <EuiPageContent>
            <ErrorDetailView 
              error={selectedError} 
              onBack={handleBackToList}
            />
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }

  return (
    <ErrorSummaryView 
      errors={errors}
      loading={loading}
      onViewDetails={handleViewDetails}
    />
  );
};

interface ErrorSummaryViewProps {
  errors: ErrorRecord[];  
  loading: boolean;
  onViewDetails: (error: ErrorRecord) => void;
}

const ErrorSummaryView: React.FC<ErrorSummaryViewProps> = ({ 
  errors, 
  loading, 
  onViewDetails 
}) => {
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
      field: 'title',
      name: 'Error Title',
      truncateText: true,
      render: (title: string, record: ErrorRecord) => (
        <EuiButton
          color="text"
          size="s"
          onClick={() => onViewDetails(record)}
        >
          {title}
        </EuiButton>
      ),
    },
    {
      field: 'category',
      name: 'Category',
      width: '150px',
      render: (category: string) => (
        <EuiBadge color="hollow">{category}</EuiBadge>
      ),
    },
    {
      field: 'frequency',
      name: 'Frequency',
      width: '100px',
      render: (frequency: number) => (
        <EuiFlexGroup alignItems="center" gutterSize="xs">
          <EuiFlexItem grow={false}>
            <EuiIcon type="alert" size="s" />
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
      field: 'affectedComponents',
      name: 'Affected Components',
      render: (components: string[]) => (
        <EuiFlexGroup gutterSize="xs" wrap>
          {components.slice(0, 3).map((component, index) => (
            <EuiFlexItem grow={false} key={index}>
              <EuiBadge color="default" size="s">
                {component}
              </EuiBadge>
            </EuiFlexItem>
          ))}
          {components.length > 3 && (
            <EuiFlexItem grow={false}>
              <EuiToolTip content={components.slice(3).join(', ')}>
                <EuiBadge color="subdued" size="s">
                  +{components.length - 3} more
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
      render: (record: ErrorRecord) => (
        <EuiButton
          size="s"
          fill
          onClick={() => onViewDetails(record)}
        >
          View Details  
        </EuiButton>
      ),
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'subdued';
    }
  };

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageContent>
          <EuiFlexGroup gutterSize="l">
            <EuiFlexItem>
              <EuiText>
                <p>
                  AI-generated alerts for critical search errors and exceptions in OpenSearch. 
                  View detailed root cause analysis, stack trace examination, and automated 
                  resolution recommendations for each error.
                </p>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="l" />

          <EuiBasicTable
            items={errors}
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