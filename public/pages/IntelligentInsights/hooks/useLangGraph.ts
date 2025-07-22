/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { Thread, Assistant } from '../types/langgraph';
import { langGraphAPI } from '../utils/api';

export const useLangGraph = (core: CoreStart) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [currentAssistant, setCurrentAssistant] = useState<Assistant | null>(null);
  const [createNewThreadLoading, setNewThreadLoading] = useState<boolean>(false);

  const loadThreads = useCallback(async () => {
    try {
      const threadList = await langGraphAPI.searchThreads();
      setThreads(threadList);
    } catch (error) {
      console.error('Failed to load threads:', error);
      core.notifications.toasts.addError(error as Error, {
        title: 'Failed to load conversations',
      });
    }
  }, [core]);

  const loadAssistants = useCallback(async () => {
    try {
      const assistantList = await langGraphAPI.searchAssistants();
      setAssistants(assistantList);
      // Set current assistant only if we don't have one yet
      setCurrentAssistant(prev => prev || (assistantList.length > 0 ? assistantList[0] : null));
    } catch (error) {
      console.error('Failed to load assistants:', error);
      core.notifications.toasts.addError(error as Error, {
        title: 'Failed to load assistants',
      });
    }
  }, [core]);

  const createNewThread = useCallback(async () => {
    try {
      setNewThreadLoading(true);
      const newThread = await langGraphAPI.createThread();
      setCurrentThread(newThread);
      await loadThreads();
      return newThread;
    } catch (error) {
      console.error('Failed to create thread:', error);
      core.notifications.toasts.addError(error as Error, {
        title: 'Failed to create new conversation',
      });
    } finally {
      setNewThreadLoading(false);
    }
  }, [core, loadThreads]);

  const selectThread = useCallback(async (thread: Thread) => {
    try {
      setCurrentThread(thread);
    } catch (error) {
      console.error('Failed to select thread:', error);
      core.notifications.toasts.addError(error as Error, {
        title: 'Failed to select conversation',
      });
    }
  }, [core]);

  return {
    threads,
    currentThread,
    assistants,
    currentAssistant,
    createNewThreadLoading,
    loadThreads,
    loadAssistants,
    createNewThread,
    selectThread,
    setCurrentAssistant,
  };
};