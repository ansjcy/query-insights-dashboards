/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  EuiPage,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiTitle,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiText,
  EuiButton,
  EuiIcon,
  EuiCallOut,
  EuiResizableContainer,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { AppMountParameters, CoreStart } from 'opensearch-dashboards/public';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { QueryInsightsDashboardsPluginStartDependencies } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { ConversationSidebar } from './Components/ConversationSidebar';
import { Conversation } from './Components/Conversation';
import { WorkflowProgressSidebar } from './Components/WorkflowProgressSidebar';
import { useLangGraph } from './hooks/useLangGraph';

interface IntelligentInsightsProps {
  core: CoreStart;
  depsStart: QueryInsightsDashboardsPluginStartDependencies;
  params: AppMountParameters;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

export const IntelligentInsights: React.FC<IntelligentInsightsProps> = ({
  core,
  depsStart,
  params,
  dataSourceManagement,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [workflowSidebarExpanded, setWorkflowSidebarExpanded] = useState(true);
  const [workflowData, setWorkflowData] = useState<{
    currentStep: string;
    stepProgress: Record<string, any>;
    workflowStatus: 'running' | 'waiting_for_input' | 'completed' | 'error';
  }>({
    currentStep: '',
    stepProgress: {},
    workflowStatus: 'completed',
  });

  const {
    threads,
    currentThread,
    assistants,
    currentAssistant,
    createNewThreadLoading,
    loadThreads,
    loadAssistants,
    createNewThread,
    selectThread,
  } = useLangGraph(core);

  useEffect(() => {
    loadThreads();
    loadAssistants();
  }, [loadThreads, loadAssistants]);

  const handleCreateNewThread = useCallback(() => {
    createNewThread();
  }, [createNewThread]);

  const renderWelcomeContent = () => (
    <EuiFlexGroup direction="column" alignItems="center" justifyContent="center" style={{ height: '60vh' }}>
      <EuiFlexItem grow={false}>
        <EuiTitle size="m">
          <h2>Welcome to Intelligent Insights Agent</h2>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText color="subdued" textAlign="center">
          <p>Create a new conversation or select an existing one from the sidebar</p>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton
          fill
          iconType="plus"
          onClick={handleCreateNewThread}
          isLoading={createNewThreadLoading}
        >
          Start New Conversation
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const renderMainContent = () => {
    if (!currentAssistant) {
      return (
        <EuiFlexGroup direction="column" alignItems="center" justifyContent="center" style={{ height: '60vh' }}>
          <EuiFlexItem grow={false}>
            <EuiCallOut
              title="No assistants available"
              color="warning"
              iconType="alert"
            >
              <p>Make sure your LangGraph server is running on http://127.0.0.1:2024</p>
            </EuiCallOut>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    if (createNewThreadLoading) {
      return (
        <EuiFlexGroup direction="column" alignItems="center" justifyContent="center" style={{ height: '60vh' }}>
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="xl" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText>
              <p>Creating new conversation...</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    if (!currentThread) {
      return renderWelcomeContent();
    }

    return (
      <Conversation
        currentThread={currentThread}
        currentAssistant={currentAssistant}
        onWorkflowUpdate={setWorkflowData}
        core={core}
      />
    );
  };

  return (
    <EuiPage>
      <EuiPageContent>
        <EuiResizableContainer style={{ height: '80vh' }}>
          {(EuiResizablePanel, EuiResizableButton) => (
            <>
              {/* Conversation Sidebar */}
              <EuiResizablePanel
                initialSize={20}
                minSize="200px"
                style={{ display: sidebarOpen ? 'block' : 'none' }}
              >
                <ConversationSidebar
                  threads={threads}
                  currentThread={currentThread}
                  onSelectThread={selectThread}
                  onCreateThread={handleCreateNewThread}
                  onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  createNewThreadLoading={createNewThreadLoading}
                />
              </EuiResizablePanel>
              
              {sidebarOpen && <EuiResizableButton />}
              
              {/* Main Content */}
              <EuiResizablePanel initialSize={sidebarOpen ? 55 : 75}>
                <EuiPanel style={{ height: '100%', paddingTop: '8px' }}>
                  {renderMainContent()}
                </EuiPanel>
              </EuiResizablePanel>
              
              <EuiResizableButton />
              
              {/* Workflow Progress Sidebar */}
              <EuiResizablePanel
                initialSize={workflowSidebarExpanded ? 25 : 5}
                minSize="48px"
              >
                <WorkflowProgressSidebar
                  currentStep={workflowData.currentStep}
                  stepProgress={workflowData.stepProgress}
                  workflowStatus={workflowData.workflowStatus}
                  onExpandedChange={setWorkflowSidebarExpanded}
                  expanded={workflowSidebarExpanded}
                />
              </EuiResizablePanel>
            </>
          )}
        </EuiResizableContainer>
      </EuiPageContent>
    </EuiPage>
  );
};

export default IntelligentInsights;