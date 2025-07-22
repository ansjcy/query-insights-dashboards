/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiTitle,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiEmptyPrompt,
  EuiIcon,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { Thread, Assistant, Message, ToolOutput } from '../types/langgraph';
import { MessageDisplay } from './MessageDisplay';
import { InputArea } from './InputArea';
import { MetricPicker } from './MetricPicker';
import { SopPicker } from './SopPicker';
import { TicketPicker } from './TicketPicker';
import { ParameterCollector } from './ParameterCollector';
import { HumanInputRequest } from './HumanInputRequest';
import { StepExecutionDisplay } from './StepExecutionDisplay';
import { ToolOutputDisplay } from './ToolOutputDisplay';
import { useLangGraphConversation } from '../hooks/useLangGraphConversation';

interface ConversationProps {
  currentThread: Thread | null;
  currentAssistant: Assistant | null;
  onWorkflowUpdate?: (data: {
    currentStep: string;
    stepProgress: Record<string, any>;
    workflowStatus: 'running' | 'waiting_for_input' | 'completed' | 'error';
  }) => void;
  core: CoreStart;
}

export const Conversation: React.FC<ConversationProps> = ({
  currentThread,
  currentAssistant,
  onWorkflowUpdate,
  core,
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('auto_route');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    setupLoading,
    messages,
    sendMessageLoading,
    tokenUsage,
    fetchMetrics,
    notFetchMetrics,
    isHumanPlanInterrupt,
    humanPlanInterruptMessage,
    isHumanSopInterrupt,
    humanSopInterruptMessage,
    sopOptions,
    isHumanTicketInterrupt,
    humanTicketInterruptMessage,
    ticketOptions,
    isParameterCollectionInterrupt,
    parameterCollectionMessage,
    parameterNames,
    isHumanInputInterrupt,
    humanInputMessage,
    isStepExecutionInterrupt,
    stepExecutionMessage,
    stepsInfo,
    currentStep,
    stepProgress,
    workflowStatus,
    toolOutputs,
    sendMessage,
    moveToFetch,
    moveToNotFetch,
    clearMessages,
  } = useLangGraphConversation(currentThread, currentAssistant, core);

  // Create a combined array of messages and tool outputs with their positions
  const combinedItems = useMemo(() => {
    const items: Array<{
      type: 'message' | 'toolOutput';
      data: Message | ToolOutput;
      originalIndex: number;
    }> = [];

    // Add all messages with their indices
    messages.forEach((message, index) => {
      items.push({
        type: 'message',
        data: message,
        originalIndex: index,
      });
    });

    // Add tool outputs at their specified indices
    let counter = 0;
    toolOutputs.forEach((toolOutput) => {
      items.splice(toolOutput.index + counter, 0, {
        type: 'toolOutput',
        data: toolOutput,
        originalIndex: -1,
      });
      counter += 1;
    });

    return items;
  }, [messages, toolOutputs]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear messages when thread changes
  useEffect(() => {
    if (currentThread) {
      clearMessages();
    }
  }, [currentThread, clearMessages]);

  // Update workflow data in parent component
  useEffect(() => {
    if (onWorkflowUpdate) {
      onWorkflowUpdate({
        currentStep,
        stepProgress,
        workflowStatus,
      });
    }
  }, [currentStep, stepProgress, workflowStatus, onWorkflowUpdate]);

  const showStartConversation = messages.length === 0 && currentThread;

  const isLastUserMessage = (messageIndex: number) =>
    messageIndex === messages.findLastIndex((msg) => msg.type === 'human');

  const handleSendMessage = (message: string, workflow?: string) => {
    if (workflow && workflow !== selectedWorkflow) {
      sendMessage(message, { selected_workflow: workflow });
    } else {
      sendMessage(message, { selected_workflow: selectedWorkflow });
    }
  };

  if (setupLoading) {
    return (
      <EuiPanel style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EuiFlexGroup direction="column" alignItems="center">
          <EuiFlexItem>
            <EuiLoadingSpinner size="xl" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText>Setting up conversation...</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }

  return (
    <EuiFlexGroup direction="column" style={{ height: '100%' }}>
      {/* Messages Area */}
      <EuiFlexItem style={{ overflow: 'auto', padding: '16px' }}>
        {showStartConversation && (
          <EuiEmptyPrompt
            icon={<EuiIcon type="discuss" size="xxl" />}
            title={<h3>Start a conversation</h3>}
            body={<p>Type a message below to begin chatting with the intelligent insights agent.</p>}
          />
        )}

        {combinedItems.map((item, combinedIndex) => {
          if (item.type === 'toolOutput') {
            const toolOutput = item.data as ToolOutput;
            return (
              <div key={`tool-${toolOutput.tool_name}-${toolOutput.timestamp}`}>
                <ToolOutputDisplay toolOutput={toolOutput} />
                <EuiSpacer size="m" />
              </div>
            );
          }

          const message = item.data as Message;
          const messageIndex = item.originalIndex;
          const isLastUserMsg = message.type === 'human' && isLastUserMessage(messageIndex);

          return (
            <div key={message.id || `message-${messageIndex}`}>
              <MessageDisplay message={message} />
              <EuiSpacer size="m" />

              {message.type === 'human' && isLastUserMsg && (
                <>
                  {isHumanPlanInterrupt && (
                    <MetricPicker
                      interruptMessage={humanPlanInterruptMessage}
                      fetchMetrics={fetchMetrics}
                      notFetchMetrics={notFetchMetrics}
                      onMoveToFetch={moveToFetch}
                      onMoveToNotFetch={moveToNotFetch}
                      disabled={!isHumanPlanInterrupt}
                      onSendMessage={sendMessage}
                      approveLoading={sendMessageLoading}
                    />
                  )}

                  {isHumanSopInterrupt && (
                    <SopPicker
                      interruptMessage={humanSopInterruptMessage}
                      sopOptions={sopOptions}
                      onSendMessage={sendMessage}
                      disabled={!isHumanSopInterrupt}
                      approveLoading={sendMessageLoading}
                    />
                  )}

                  {isHumanTicketInterrupt && (
                    <TicketPicker
                      interruptMessage={humanTicketInterruptMessage}
                      ticketOptions={ticketOptions}
                      onSendMessage={sendMessage}
                      disabled={!isHumanTicketInterrupt}
                      approveLoading={sendMessageLoading}
                    />
                  )}

                  {isParameterCollectionInterrupt && (
                    <ParameterCollector
                      interruptMessage={parameterCollectionMessage}
                      onSendMessage={sendMessage}
                      disabled={!isParameterCollectionInterrupt}
                      approveLoading={sendMessageLoading}
                      interruptData={{ parameter_names: parameterNames }}
                    />
                  )}

                  {isHumanInputInterrupt && (
                    <HumanInputRequest
                      interruptMessage={humanInputMessage}
                      onSendMessage={sendMessage}
                      disabled={!isHumanInputInterrupt}
                      approveLoading={sendMessageLoading}
                    />
                  )}

                  {(isStepExecutionInterrupt || stepsInfo.length > 0) && (
                    <StepExecutionDisplay
                      interruptMessage={stepExecutionMessage}
                      stepsInfo={stepsInfo}
                      onSendMessage={sendMessage}
                      disabled={!isStepExecutionInterrupt && !stepsInfo.length}
                      approveLoading={sendMessageLoading}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}

        {sendMessageLoading && (
          <EuiFlexGroup justifyContent="center">
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="m" />
            </EuiFlexItem>
          </EuiFlexGroup>
        )}

        <div ref={messagesEndRef} />
      </EuiFlexItem>

      {/* Input Area */}
      <EuiFlexItem grow={false}>
        <InputArea
          onSendMessage={handleSendMessage}
          disabled={
            sendMessageLoading ||
            isHumanPlanInterrupt ||
            isHumanSopInterrupt ||
            isHumanTicketInterrupt ||
            isParameterCollectionInterrupt ||
            isHumanInputInterrupt ||
            isStepExecutionInterrupt ||
            !currentAssistant
          }
          placeholder={
            !currentAssistant
              ? 'Waiting for assistant to be available...'
              : 'Type your message...'
          }
          tokenUsage={tokenUsage}
          selectedWorkflow={selectedWorkflow}
          onWorkflowChange={setSelectedWorkflow}
          showWorkflowSelector={true}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};