/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  EuiAccordion, 
  EuiPanel, 
  EuiText, 
  EuiFlexGroup, 
  EuiFlexItem, 
  EuiIcon, 
  EuiCodeBlock, 
  EuiSpacer, 
  EuiBadge,
  EuiMarkdownFormat 
} from '@elastic/eui';
import { ToolOutput } from '../types/langgraph';
import { MetricChart } from './MetricChart';

interface ToolOutputDisplayProps {
  toolOutput: ToolOutput;
}

export const ToolOutputDisplay: React.FC<ToolOutputDisplayProps> = ({ toolOutput }) => {
  const extractTextFromOutput = (output: string): string => {
    try {
      // Try to parse as JSON array with structured text
      const parsed = JSON.parse(output);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type === 'text' && parsed[0].text) {
        return parsed[0].text;
      }
    } catch (e) {
      // If parsing fails, return original output
    }
    return output;
  };

  const isMarkdown = (text: string): boolean => {
    const content = extractTextFromOutput(text);
    // Simple heuristics to detect markdown content
    const markdownPatterns = [
      /^#{1,6}\s+/m,     // Headers (# ## ###)
      /\*\*.*?\*\*/,     // Bold text
      /\*.*?\*/,         // Italic text
      /^\- /m,           // Bullet points
      /^\d+\. /m,        // Numbered lists
      /\[.*?\]\(.*?\)/,  // Links
      /```.*?```/s,      // Code blocks
      /`.*?`/,           // Inline code
      /^\|.*?\|/m,       // Tables
      /^>/m              // Blockquotes
    ];
    
    return markdownPatterns.some(pattern => pattern.test(content));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check';
      case 'running':
        return 'clock';
      case 'error':
        return 'alert';
      default:
        return 'empty';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'primary';
      case 'error':
        return 'danger';
      default:
        return 'subdued';
    }
  };

  const getToolName = (toolOutput: ToolOutput) => {
    let name = toolOutput.tool_name;
    try {
      const inputs = JSON.parse(toolOutput.input);
      if (inputs.aws_account_id && inputs.aws_opensearch_domain) {
        name += ` - ${inputs.aws_account_id}:${inputs.aws_opensearch_domain}`;
      }
      if (inputs.metric_name) {
        name += ` - ${inputs.metric_name}`;
      }
    } catch (e) {
      // Keep original name if input parsing fails
    }
    return name;
  };

  const buttonContent = (
    <div style={{ padding: '8px 4px', minHeight: '48px', display: 'flex', alignItems: 'center' }}>
      <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: toolOutput.status === 'completed' ? '#E6F9E6' : 
                           toolOutput.status === 'running' ? '#E6F4FF' : 
                           toolOutput.status === 'error' ? '#FFE6E6' : '#F5F5F5'
          }}>
            <EuiIcon
              type={getStatusIcon(toolOutput.status)}
              color={getStatusColor(toolOutput.status)}
              size="m"
            />
          </div>
        </EuiFlexItem>
        <EuiFlexItem style={{ minWidth: 0 }}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiText size="m" style={{ fontWeight: '600', lineHeight: '20px' }}>
                {getToolName(toolOutput)}
              </EuiText>
            </EuiFlexItem>
            {toolOutput.chart_data && toolOutput.chart_data.length > 0 && (
              <EuiFlexItem grow={false}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  backgroundColor: '#E6F4FF',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#0066CC',
                  height: '20px'
                }}>
                  <EuiIcon type="visBarVerticalStacked" size="s" color="primary" />
                  Chart
                </div>
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={false}>
              <EuiBadge 
                color={getStatusColor(toolOutput.status)}
                style={{
                  textTransform: 'capitalize',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {toolOutput.status}
              </EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiText size="xs" color="subdued" style={{ marginTop: '2px' }}>
            {new Date(toolOutput.timestamp).toLocaleString()}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );

  return (
    <EuiPanel 
      paddingSize="none" 
      style={{ 
        backgroundColor: '#FAFBFD', 
        border: '1px solid #D3DAE6', 
        borderRadius: '8px',
        marginBottom: '8px',
        transition: 'all 0.2s ease',
        ':hover': {
          borderColor: '#98A2B3',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <EuiAccordion
        id={`tool-output-${toolOutput.timestamp}`}
        buttonContent={buttonContent}
        paddingSize="none"
        initialIsOpen={false}
        style={{
          '.euiAccordion__button': {
            padding: '4px',
            borderRadius: '8px'
          }
        }}
      >
        <div style={{ padding: '16px' }}>
          {toolOutput.input && (
          <>
            <EuiText size="s" color="subdued">
              <strong>Input:</strong>
            </EuiText>
            <EuiSpacer size="xs" />
            <EuiCodeBlock 
              language="json" 
              fontSize="s" 
              paddingSize="s"
              style={{ maxHeight: '200px', overflow: 'auto' }}
            >
              {toolOutput.input}
            </EuiCodeBlock>
            <EuiSpacer size="m" />
          </>
        )}
        
        {toolOutput.output && (
          <>
            <EuiText size="s" color="subdued">
              <strong>Output:</strong>
            </EuiText>
            <EuiSpacer size="xs" />
            {isMarkdown(toolOutput.output) ? (
              <div style={{ 
                maxHeight: '400px', 
                overflow: 'auto',
                padding: '12px',
                backgroundColor: toolOutput.status === 'error' ? '#FDF2F2' : '#FAFBFD',
                border: '1px solid #D3DAE6',
                borderRadius: '6px'
              }}>
                <EuiMarkdownFormat>
                  {extractTextFromOutput(toolOutput.output)}
                </EuiMarkdownFormat>
              </div>
            ) : (
              <EuiCodeBlock 
                language="text" 
                fontSize="s" 
                paddingSize="s"
                style={{ 
                  maxHeight: '200px', 
                  overflow: 'auto',
                  backgroundColor: toolOutput.status === 'error' ? '#FDF2F2' : undefined,
                  color: toolOutput.status === 'error' ? '#D93026' : undefined
                }}
              >
                {extractTextFromOutput(toolOutput.output)}
              </EuiCodeBlock>
            )}
            <EuiSpacer size="m" />
          </>
        )}
        
        {toolOutput.chart_data && toolOutput.chart_data.length > 0 && toolOutput.metadata && (
          <>
            <EuiText size="s" color="subdued">
              <strong>Time Series Chart:</strong>
            </EuiText>
            <EuiSpacer size="s" />
            <MetricChart 
              chartData={toolOutput.chart_data} 
              metadata={toolOutput.metadata}
            />
            <EuiSpacer size="m" />
          </>
        )}

          <EuiText size="xs" color="subdued">
            Executed at: {new Date(toolOutput.timestamp).toLocaleString()}
          </EuiText>
        </div>
      </EuiAccordion>
    </EuiPanel>
  );
};