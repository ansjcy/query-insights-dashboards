/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useHistory, Route, Switch } from 'react-router-dom';
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiTitle,
  EuiSpacer,
  EuiTabs,
  EuiTab,
} from '@elastic/eui';
import { AppMountParameters, CoreStart } from 'opensearch-dashboards/public';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { QueryInsightsDashboardsPluginStartDependencies } from '../../types';
import { ErrorAnalysis } from '../ErrorAnalysis/ErrorAnalysis';
import { LatencyAnalysis } from '../LatencyAnalysis/LatencyAnalysis';

interface IntelligentAlertsProps {
  core: CoreStart;
  depsStart: QueryInsightsDashboardsPluginStartDependencies;
  params: AppMountParameters;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

export const IntelligentAlerts: React.FC<IntelligentAlertsProps> = ({
  core,
  depsStart,
  params,
  dataSourceManagement,
}) => {
  const location = useLocation();
  const history = useHistory();
  
  // Determine active tab from URL path
  const getActiveTab = () => {
    if (location.pathname.includes('/latencyAnalysis') || location.pathname.includes('/intelligentAlerts/latency')) {
      return 'latency';
    }
    if (location.pathname.includes('/errorAnalysis') || location.pathname.includes('/intelligentAlerts/errors')) {
      return 'errors';
    }
    return 'errors'; // Default to errors tab
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  const tabs = [
    {
      id: 'errors',
      name: 'Search Error Alerts',
    },
    {
      id: 'latency',
      name: 'Search Latency Alerts',
    },
  ];

  const onTabClick = (tabId: string) => {
    setActiveTab(tabId);
    // Update URL to reflect the active subtab
    const basePath = '/intelligentAlerts';
    const newPath = tabId === 'errors' ? basePath : `${basePath}/${tabId}`;
    history.push(newPath);
  };

  // Check if we're in a detail view
  const isDetailView = location.pathname.includes('/error-detail/') || location.pathname.includes('/latency-detail/');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'latency':
        return (
          <LatencyAnalysis
            core={core}
            depsStart={depsStart}
            params={params}
            dataSourceManagement={dataSourceManagement}
          />
        );
      case 'errors':
      default:
        return (
          <ErrorAnalysis
            core={core}
            depsStart={depsStart}
            params={params}
            dataSourceManagement={dataSourceManagement}
          />
        );
    }
  };

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageContent>
          {!isDetailView && (
            <>
              <EuiPageContentHeader>
                <EuiPageContentHeaderSection>
                  <EuiTitle>
                    <h1>Intelligent Alerts</h1>
                  </EuiTitle>
                </EuiPageContentHeaderSection>
              </EuiPageContentHeader>

              <EuiSpacer size="m" />

              <EuiTabs>
                {tabs.map((tab) => (
                  <EuiTab
                    key={tab.id}
                    onClick={() => onTabClick(tab.id)}
                    isSelected={tab.id === activeTab}
                  >
                    {tab.name}
                  </EuiTab>
                ))}
              </EuiTabs>

              <EuiSpacer size="l" />
            </>
          )}

          {renderTabContent()}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};