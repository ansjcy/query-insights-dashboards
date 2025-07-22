/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { 
  Thread, 
  ThreadState,
  Assistant, 
  Message, 
  TokenUsage, 
  SopOption, 
  TicketOption, 
  StepInfo, 
  ToolOutput,
  StepProgress
} from '../types/langgraph';
import { langGraphAPI } from '../utils/api';

function parseSelectedSopUrls(input: string, sopOptions: SopOption[]): string[] {
  // Parse comma-separated numbers from input
  const numbers = input.match(/\d+/g);
  if (!numbers) return [];
  
  const urls: string[] = [];
  for (const num of numbers) {
    const index = parseInt(num) - 1; // Convert to 0-based index
    if (index >= 0 && index < sopOptions.length) {
      urls.push(sopOptions[index].url);
    }
  }
  
  return urls;
}

function parseSelectedTicketIds(input: string, ticketOptions: TicketOption[]): string[] {
  // Parse comma-separated numbers from input
  const numbers = input.match(/\d+/g);
  if (!numbers) return [];
  
  const ticketIds: string[] = [];
  for (const num of numbers) {
    const index = parseInt(num) - 1; // Convert to 0-based index
    if (index >= 0 && index < ticketOptions.length) {
      ticketIds.push(ticketOptions[index].ticket_id);
    }
  }
  
  return ticketIds;
}

export const useLangGraphConversation = (
  currentThread: Thread | null,
  currentAssistant: Assistant | null,
  core: CoreStart
) => {
  const [setupLoading, setSetupLoading] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    input_tokens: 0,
    output_tokens: 0,
  });
  const [fetchMetrics, setFetchMetrics] = useState<string[]>([]);
  const [notFetchMetrics, setNotFetchMetrics] = useState<string[]>([]);
  const [isHumanPlanInterrupt, setIsHumanPlanInterrupt] = useState<boolean>(false);
  const [humanPlanInterruptMessage, setHumanPlanInterruptMessage] = useState<string>('');
  const [allMetrics, setAllMetrics] = useState<string[]>([]);
  
  // SOP selection state
  const [isHumanSopInterrupt, setIsHumanSopInterrupt] = useState<boolean>(false);
  const [humanSopInterruptMessage, setHumanSopInterruptMessage] = useState<string>('');
  const [sopOptions, setSopOptions] = useState<SopOption[]>([]);
  
  // Ticket selection state
  const [isHumanTicketInterrupt, setIsHumanTicketInterrupt] = useState<boolean>(false);
  const [humanTicketInterruptMessage, setHumanTicketInterruptMessage] = useState<string>('');
  const [ticketOptions, setTicketOptions] = useState<TicketOption[]>([]);
  
  // Parameter collection state
  const [isParameterCollectionInterrupt, setIsParameterCollectionInterrupt] = useState<boolean>(false);
  const [parameterCollectionMessage, setParameterCollectionMessage] = useState<string>('');
  const [parameterNames, setParameterNames] = useState<string[]>([]);
  
  // Human input request state
  const [isHumanInputInterrupt, setIsHumanInputInterrupt] = useState<boolean>(false);
  const [humanInputMessage, setHumanInputMessage] = useState<string>('');
  
  // Step execution state
  const [isStepExecutionInterrupt, setIsStepExecutionInterrupt] = useState<boolean>(false);
  const [stepExecutionMessage, setStepExecutionMessage] = useState<string>('');
  const [stepsInfo, setStepsInfo] = useState<StepInfo[]>([]);

  // Step tracking state
  const [currentStep, setCurrentStep] = useState<string>('');
  const [stepProgress, setStepProgress] = useState<Record<string, StepProgress>>({});
  const [workflowStatus, setWorkflowStatus] = useState<
    'running' | 'waiting_for_input' | 'completed' | 'error'
  >('running');

  // Tool outputs for intermediate results
  const [toolOutputs, setToolOutputs] = useState<ToolOutput[]>([]);

  const sendMessage = useCallback(async (strInput: string, data?: any) => {
    if (!currentThread || !currentAssistant) return;

    let input = null;
    if (isHumanPlanInterrupt) {
      input = {
        message: strInput,
        fetch_metrics: fetchMetrics,
      };
    } else if (isHumanSopInterrupt) {
      // Parse the selected SOPs from the input if it contains numbers
      const selectedUrls = parseSelectedSopUrls(strInput, sopOptions);
      input = {
        message: strInput,
        selected_sop_urls: selectedUrls,
      };
    } else if (isHumanTicketInterrupt) {
      // Parse the selected tickets from the input if it contains numbers
      const selectedTicketIds = parseSelectedTicketIds(strInput, ticketOptions);
      input = {
        message: strInput,
        selected_ticket_ids: selectedTicketIds,
      };
    } else if (isParameterCollectionInterrupt) {
      // Parameter collection interrupt
      input = {
        message: strInput,
        ...data, // Include parameter data from the component
      };
    } else if (isHumanInputInterrupt) {
      // Human input request interrupt
      input = {
        message: strInput,
        ...data, // Include any additional data from the component
      };
    } else if (isStepExecutionInterrupt) {
      // Step execution interrupt
      input = {
        message: strInput,
        ...data, // Include step execution data
      };
    } else {
      input = strInput;
    }

    const saveIsMetricFetcherInterrupt = isHumanPlanInterrupt;
    const saveIsSopInterrupt = isHumanSopInterrupt;
    const saveIsTicketInterrupt = isHumanTicketInterrupt;
    const saveIsParameterCollectionInterrupt = isParameterCollectionInterrupt;
    const saveIsHumanInputInterrupt = isHumanInputInterrupt;
    const saveIsStepExecutionInterrupt = isStepExecutionInterrupt;
    
    setIsHumanPlanInterrupt(false);
    setIsHumanSopInterrupt(false);
    setIsHumanTicketInterrupt(false);
    setIsParameterCollectionInterrupt(false);
    setIsHumanInputInterrupt(false);
    setIsStepExecutionInterrupt(false);

    try {
      setSendMessageLoading(true);
      let allMetricsTemp: string[] = allMetrics;
      let fetchMetricsTemp: string[] = fetchMetrics;

      // Prepare config with workflow selection if provided
      const config = data?.selected_workflow ? { selected_workflow: data.selected_workflow } : {};
      
      await langGraphAPI.streamRun(
        currentThread.thread_id,
        currentAssistant.assistant_id,
        input,
        config,
        saveIsMetricFetcherInterrupt || saveIsSopInterrupt || saveIsTicketInterrupt || saveIsParameterCollectionInterrupt || saveIsHumanInputInterrupt || saveIsStepExecutionInterrupt,
        (event) => {
          console.log('stream event', event);
          if (event.messages) {
            setMessages(event.messages);
          }
          if (event.all_metrics) {
            allMetricsTemp = event.all_metrics;
            setAllMetrics(allMetricsTemp);
          }
          if (event.fetch_metrics) {
            fetchMetricsTemp = event.fetch_metrics;
            setFetchMetrics(fetchMetricsTemp);
            setNotFetchMetrics(
              allMetricsTemp.filter(
                (metric) => !fetchMetricsTemp.includes(metric)
              )
            );
          }
          if (event.token_usage) {
            setTokenUsage({
              input_tokens: event.token_usage.input_tokens || 0,
              output_tokens: event.token_usage.output_tokens || 0,
            });
          }

          // Handle step tracking updates
          if (event.current_step) {
            setCurrentStep(event.current_step);
          }
          if (event.step_progress) {
            setStepProgress(event.step_progress);
          }
          if (event.workflow_status) {
            setWorkflowStatus(event.workflow_status);
          }

          // Handle tool outputs updates
          if (event.tool_outputs) {
            setToolOutputs(event.tool_outputs);
          }

          if (
            '__interrupt__' in event &&
            event.__interrupt__ &&
            event.__interrupt__.length > 0
          ) {
            const interrupt = event.__interrupt__[0];
            
            if (interrupt.ns.at(-1).includes('human_plan')) {
              setIsHumanPlanInterrupt(true);
              setHumanPlanInterruptMessage(interrupt.value);
            } else if (interrupt.ns.at(-1).includes('human_sop_selection')) {
              // Handle SOP selection interrupt
              if (interrupt.value && typeof interrupt.value === 'object' && interrupt.value.sop_options) {
                setIsHumanSopInterrupt(true);
                setHumanSopInterruptMessage(interrupt.value.message || '');
                setSopOptions(interrupt.value.sop_options || []);
              }
            } else if (interrupt.ns.at(-1).includes('human_ticket_selection')) {
              // Handle ticket selection interrupt
              if (interrupt.value && typeof interrupt.value === 'object' && interrupt.value.ticket_options) {
                setIsHumanTicketInterrupt(true);
                setHumanTicketInterruptMessage(interrupt.value.message || '');
                setTicketOptions(interrupt.value.ticket_options || []);
              }
            } else if (interrupt.ns.at(-1).includes('parameter_collector')) {
              // Handle parameter collection interrupt
              if (interrupt.value && typeof interrupt.value === 'object') {
                setIsParameterCollectionInterrupt(true);
                setParameterCollectionMessage(interrupt.value.message || '');
                setParameterNames(interrupt.value.parameter_names || []);
              }
            } else if (interrupt.ns.at(-1).includes('human_input')) {
              // Handle human input request interrupt
              setIsHumanInputInterrupt(true);
              setHumanInputMessage(
                typeof interrupt.value === 'string' ? interrupt.value : interrupt.value?.message || ''
              );
            } else if (interrupt.value && typeof interrupt.value === 'object' && 
                       (interrupt.value.action === 'step_approval' || interrupt.value.action === 'step_execution' || 
                        interrupt.value.action === 'step_execution_update' || interrupt.value.action === 'step_execution_result' || 
                        interrupt.value.action === 'step_execution_error' || interrupt.value.steps_info || interrupt.value.step_info)) {
              // Handle step execution interrupt
              console.log('Stream step execution interrupt detected:', interrupt.value);
              setIsStepExecutionInterrupt(true);
              setStepExecutionMessage(interrupt.value.message || '');
              const stepsData = interrupt.value.steps_info || (interrupt.value.step_info ? [interrupt.value.step_info] : []);
              console.log('Stream steps data:', stepsData);
              setStepsInfo(stepsData);
            }
          }
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      core.notifications.toasts.addError(error as Error, {
        title: 'Failed to send message',
      });
    } finally {
      setSendMessageLoading(false);
    }
  }, [currentThread, currentAssistant, core, isHumanPlanInterrupt, fetchMetrics, isHumanSopInterrupt, sopOptions, isHumanTicketInterrupt, ticketOptions, isParameterCollectionInterrupt, isHumanInputInterrupt, isStepExecutionInterrupt, allMetrics]);

  const moveToFetch = useCallback((metric: string) => {
    setNotFetchMetrics((prev) => prev.filter((m) => m !== metric));
    setFetchMetrics((prev) => [...prev, metric]);
  }, []);

  const moveToNotFetch = useCallback((metric: string) => {
    setFetchMetrics((prev) => prev.filter((m) => m !== metric));
    setNotFetchMetrics((prev) => [...prev, metric]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSendMessageLoading(false);
    setFetchMetrics([]);
    setNotFetchMetrics([]);
    setIsHumanPlanInterrupt(false);
    setIsHumanSopInterrupt(false);
    setHumanSopInterruptMessage('');
    setSopOptions([]);
    setIsHumanTicketInterrupt(false);
    setHumanTicketInterruptMessage('');
    setTicketOptions([]);
    setIsParameterCollectionInterrupt(false);
    setParameterCollectionMessage('');
    setParameterNames([]);
    setIsHumanInputInterrupt(false);
    setHumanInputMessage('');
    setIsStepExecutionInterrupt(false);
    setStepExecutionMessage('');
    setStepsInfo([]);
    setTokenUsage({ input_tokens: 0, output_tokens: 0 });
    setCurrentStep('');
    setStepProgress({});
    setWorkflowStatus('running');
    setToolOutputs([]);
  }, []);

  // Load messages when thread changes
  useEffect(() => {
    setSetupLoading(true);

    const loadGraphState = (graphState: ThreadState) => {
      setMessages(graphState.values.messages || []);
      if (graphState.values.token_usage) {
        setTokenUsage({
          input_tokens: graphState.values.token_usage.input_tokens || 0,
          output_tokens: graphState.values.token_usage.output_tokens || 0,
        });
      }
      const allMetricsTemp = graphState.values.all_metrics || [];
      setAllMetrics(allMetricsTemp);
      setFetchMetrics(graphState.values.fetch_metrics || []);
      setNotFetchMetrics(
        allMetricsTemp.filter(
          (metric: string) => !(graphState.values.fetch_metrics || []).includes(metric)
        )
      );
      if (graphState.values.current_step) {
        setCurrentStep(graphState.values.current_step);
      }
      if (graphState.values.step_progress) {
        setStepProgress(graphState.values.step_progress);
      }
      if (graphState.values.workflow_status) {
        setWorkflowStatus(graphState.values.workflow_status);
      }
      if (graphState.values.tool_outputs) {
        setToolOutputs(graphState.values.tool_outputs);
      }
    };

    const loadThreadMessages = async () => {
      if (!currentThread) {
        setMessages([]);
        setTokenUsage({ input_tokens: 0, output_tokens: 0 });
        setSetupLoading(false);
        return;
      }

      try {
        const currentState = await langGraphAPI.getThreadState(
          currentThread.thread_id
        );
        console.log('history', currentState);
        if (currentState.values) {
          // Check root state
          loadGraphState(currentState);

          // Check subgraph state
          if (currentState.tasks && currentState.tasks[0]) {
            loadGraphState(currentState.tasks[0].state);
            if (currentState.tasks[0].interrupts && currentState.tasks[0].interrupts.length > 0) {
              const interrupt = currentState.tasks[0].interrupts[0];
              
              // Check interrupt types based on node name
              if (interrupt.ns.at(-1).includes('human_sop_selection')) {
                // SOP selection interrupt
                if (interrupt.value && typeof interrupt.value === 'object' && interrupt.value.sop_options) {
                  setIsHumanSopInterrupt(true);
                  setHumanSopInterruptMessage(interrupt.value.message || '');
                  setSopOptions(interrupt.value.sop_options || []);
                }
              } else if (interrupt.ns.at(-1).includes('human_ticket_selection')) {
                // Ticket selection interrupt
                if (interrupt.value && typeof interrupt.value === 'object' && interrupt.value.ticket_options) {
                  setIsHumanTicketInterrupt(true);
                  setHumanTicketInterruptMessage(interrupt.value.message || '');
                  setTicketOptions(interrupt.value.ticket_options || []);
                }
              } else if (interrupt.ns.at(-1).includes('parameter_collector')) {
                // Parameter collection interrupt
                if (interrupt.value && typeof interrupt.value === 'object') {
                  setIsParameterCollectionInterrupt(true);
                  setParameterCollectionMessage(interrupt.value.message || '');
                  setParameterNames(interrupt.value.parameter_names || []);
                }
              } else if (interrupt.ns.at(-1).includes('human_input')) {
                // Human input request interrupt
                setIsHumanInputInterrupt(true);
                setHumanInputMessage(
                  typeof interrupt.value === 'string' ? interrupt.value : interrupt.value?.message || ''
                );
              } else if (interrupt.value && typeof interrupt.value === 'object' && 
                         (interrupt.value.action === 'step_approval' || interrupt.value.action === 'step_execution' || 
                          interrupt.value.action === 'step_execution_update' || interrupt.value.action === 'step_execution_result' || 
                          interrupt.value.action === 'step_execution_error' || interrupt.value.steps_info || interrupt.value.step_info)) {
                // Step execution interrupt (showing steps, executing, or updating results)
                console.log('Step execution interrupt detected:', interrupt.value);
                setIsStepExecutionInterrupt(true);
                setStepExecutionMessage(interrupt.value.message || '');
                const stepsData = interrupt.value.steps_info || (interrupt.value.step_info ? [interrupt.value.step_info] : []);
                console.log('Steps data:', stepsData);
                setStepsInfo(stepsData);
              } else {
                // Default to plan interrupt
                setIsHumanPlanInterrupt(true);
                setHumanPlanInterruptMessage(
                  typeof interrupt.value === 'string' ? interrupt.value : interrupt.value?.message || ''
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load thread messages:', error);
        // Don't show error toast for connection issues when no server is running
      } finally {
        setSetupLoading(false);
      }
    };

    loadThreadMessages();
  }, [currentThread]);

  return {
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
  };
};