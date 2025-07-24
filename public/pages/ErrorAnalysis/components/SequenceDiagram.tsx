/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
} from '@elastic/eui';
import { ErrorRecord } from '../utils/dataLoader';

interface SequenceDiagramProps {
  error: ErrorRecord;
}

interface SequenceStep {
  from: number;
  to: number;
  message: string;
  type: 'success' | 'warning' | 'error';
  y: number;
}

interface Actor {
  name: string;
  x: number;
}

export const SequenceDiagram: React.FC<SequenceDiagramProps> = ({ error }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Generate sequence steps and actors based on error type
  const generateSequenceData = (error: ErrorRecord): { actors: Actor[], steps: SequenceStep[] } => {
    switch (error.category) {
      case 'Search Query Execution':
        return {
          actors: [
            { name: 'RestSearchAction', x: 150 },
            { name: 'SearchService', x: 350 },
            { name: 'QueryPhase', x: 550 },
            { name: 'DataNode', x: 750 }
          ],
          steps: [
            { from: 0, to: 1, message: '1. prepareRequest()', y: 100, type: 'success' },
            { from: 1, to: 2, message: '2. executeQueryPhase()', y: 130, type: 'success' },
            { from: 2, to: 3, message: '3. searchShard()', y: 160, type: 'success' },
            { from: 3, to: 2, message: '4. fielddata disabled error', y: 190, type: 'error' },
            { from: 2, to: 1, message: '5. SearchException', y: 220, type: 'error' },
            { from: 1, to: 0, message: '6. SearchPhaseExecutionException', y: 250, type: 'error' }
          ]
        };
      
      case 'Query Parsing':
        return {
          actors: [
            { name: 'RestSearchAction', x: 150 },
            { name: 'SearchSourceBuilder', x: 350 },
            { name: 'BoolQueryBuilder', x: 550 },
            { name: 'QueryParseContext', x: 750 }
          ],
          steps: [
            { from: 0, to: 1, message: '1. prepareRequest()', y: 100, type: 'success' },
            { from: 1, to: 2, message: '2. parseXContent()', y: 130, type: 'success' },
            { from: 2, to: 3, message: '3. parseInnerQueryBuilder()', y: 160, type: 'success' },
            { from: 3, to: 2, message: '4. Malformed JSON structure', y: 190, type: 'error' },
            { from: 2, to: 1, message: '5. QueryParsingException', y: 220, type: 'error' },
            { from: 1, to: 0, message: '6. Exception propagated', y: 250, type: 'error' }
          ]
        };
      
      case 'Query Performance':
        return {
          actors: [
            { name: 'SearchTransport', x: 150 },
            { name: 'SearchService', x: 350 },
            { name: 'WildcardQuery', x: 550 },
            { name: 'IndexSearcher', x: 750 }
          ],
          steps: [
            { from: 0, to: 1, message: '1. messageReceived()', y: 100, type: 'success' },
            { from: 1, to: 2, message: '2. executeQueryPhase()', y: 130, type: 'success' },
            { from: 2, to: 3, message: '3. execute wildcard query', y: 160, type: 'success' },
            { from: 3, to: 2, message: '4. Processing... (slow)', y: 190, type: 'warning' },
            { from: 2, to: 1, message: '5. Time exceeded 30000ms', y: 220, type: 'error' },
            { from: 1, to: 0, message: '6. SearchTimeoutException', y: 250, type: 'error' }
          ]
        };

      case 'Memory Management':
        return {
          actors: [
            { name: 'SearchService', x: 150 },
            { name: 'StringTermsAggregator', x: 350 },
            { name: 'FieldDataCache', x: 550 },
            { name: 'CircuitBreaker', x: 750 }
          ],
          steps: [
            { from: 0, to: 1, message: '1. executeQueryPhase()', y: 100, type: 'success' },
            { from: 1, to: 2, message: '2. collectFromGlobalOrdinals()', y: 130, type: 'success' },
            { from: 2, to: 3, message: '3. addBytesAndMaybeBreak()', y: 160, type: 'success' },
            { from: 3, to: 2, message: '4. Memory limit exceeded', y: 190, type: 'error' },
            { from: 2, to: 1, message: '5. CircuitBreakingException', y: 220, type: 'error' },
            { from: 1, to: 0, message: '6. Exception propagated', y: 250, type: 'error' }
          ]
        };

      case 'Script Execution':
        return {
          actors: [
            { name: 'SearchService', x: 150 },
            { name: 'ScriptService', x: 350 },
            { name: 'PainlessScriptEngine', x: 550 },
            { name: 'Compiler', x: 750 }
          ],
          steps: [
            { from: 0, to: 1, message: '1. executeQueryPhase()', y: 100, type: 'success' },
            { from: 1, to: 2, message: '2. compileInContext()', y: 130, type: 'success' },
            { from: 2, to: 3, message: '3. compile script', y: 160, type: 'success' },
            { from: 3, to: 2, message: '4. Variable [multiplier] not defined', y: 190, type: 'error' },
            { from: 2, to: 1, message: '5. ScriptException', y: 220, type: 'error' },
            { from: 1, to: 0, message: '6. Exception propagated', y: 250, type: 'error' }
          ]
        };

      case 'Query Complexity':
        return {
          actors: [
            { name: 'SearchService', x: 150 },
            { name: 'QueryPhase', x: 350 },
            { name: 'BoolQueryBuilder', x: 550 },
            { name: 'LuceneQuery', x: 750 }
          ],
          steps: [
            { from: 0, to: 1, message: '1. executeQueryPhase()', y: 100, type: 'success' },
            { from: 1, to: 2, message: '2. execute()', y: 130, type: 'success' },
            { from: 2, to: 3, message: '3. doToQuery()', y: 160, type: 'success' },
            { from: 3, to: 2, message: '4. maxClauseCount exceeded (1547 > 1024)', y: 190, type: 'error' },
            { from: 2, to: 1, message: '5. TooManyClauses', y: 220, type: 'error' },
            { from: 1, to: 0, message: '6. Exception propagated', y: 250, type: 'error' }
          ]
        };

      case 'Indexing Conflicts':
        return {
          actors: [
            { name: 'BulkProcessor', x: 150 },
            { name: 'IndexShard', x: 350 },
            { name: 'InternalEngine', x: 550 },
            { name: 'DocumentStore', x: 750 }
          ],
          steps: [
            { from: 0, to: 1, message: '1. executeBulkRequest()', y: 100, type: 'success' },
            { from: 1, to: 2, message: '2. applyIndexOperation()', y: 130, type: 'success' },
            { from: 2, to: 3, message: '3. updateDocument(version=3)', y: 160, type: 'success' },
            { from: 3, to: 2, message: '4. Version conflict (current=5)', y: 190, type: 'error' },
            { from: 2, to: 1, message: '5. VersionConflictEngineException', y: 220, type: 'error' },
            { from: 1, to: 0, message: '6. Bulk operation failed', y: 250, type: 'error' }
          ]
        };
      
      default:
        return {
          actors: [
            { name: 'Client', x: 200 },
            { name: 'Service', x: 500 },
            { name: 'Backend', x: 800 }
          ],
          steps: [
            { from: 0, to: 1, message: '1. request()', y: 100, type: 'success' },
            { from: 1, to: 2, message: '2. process()', y: 130, type: 'success' },
            { from: 2, to: 1, message: '3. Error occurred', y: 160, type: 'error' },
            { from: 1, to: 0, message: '4. Exception thrown', y: 190, type: 'error' }
          ]
        };
    }
  };

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous render
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const { actors, steps } = generateSequenceData(error);
    const width = 1200;
    const height = Math.max(600, steps[steps.length - 1]?.y + 150 || 600);

    // Set SVG dimensions
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());

    // Create main group
    const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(mainGroup);

    // Draw actor headers
    const actorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    actorGroup.setAttribute('class', 'actors');
    mainGroup.appendChild(actorGroup);

    actors.forEach(actor => {
      // Actor box
      const actorBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      actorBox.setAttribute('x', (actor.x - 80).toString());
      actorBox.setAttribute('y', '20');
      actorBox.setAttribute('width', '160');
      actorBox.setAttribute('height', '50');
      actorBox.setAttribute('fill', '#e3f2fd');
      actorBox.setAttribute('stroke', '#1976d2');
      actorBox.setAttribute('rx', '4');
      actorGroup.appendChild(actorBox);

      // Actor name
      const actorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      actorText.setAttribute('x', actor.x.toString());
      actorText.setAttribute('y', '50');
      actorText.setAttribute('text-anchor', 'middle');
      actorText.setAttribute('font-weight', 'bold');
      actorText.setAttribute('font-size', '14px');
      actorText.textContent = actor.name;
      actorGroup.appendChild(actorText);

      // Lifeline
      const lifeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lifeline.setAttribute('x1', actor.x.toString());
      lifeline.setAttribute('y1', '70');
      lifeline.setAttribute('x2', actor.x.toString());
      lifeline.setAttribute('y2', (height - 80).toString());
      lifeline.setAttribute('stroke', '#999');
      lifeline.setAttribute('stroke-width', '3');
      lifeline.setAttribute('stroke-dasharray', '8,8');
      actorGroup.appendChild(lifeline);
    });

    // Draw sequence arrows and messages
    const sequenceGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sequenceGroup.setAttribute('class', 'sequence');
    mainGroup.appendChild(sequenceGroup);

    // Add error highlight zone if there are error steps
    const errorSteps = steps.filter(step => step.type === 'error');
    if (errorSteps.length > 0) {
      const firstErrorY = errorSteps[0].y;
      const lastErrorY = errorSteps[errorSteps.length - 1].y;
      
      const errorZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      errorZone.setAttribute('x', '40');
      errorZone.setAttribute('y', (firstErrorY - 20).toString());
      errorZone.setAttribute('width', (width - 80).toString());
      errorZone.setAttribute('height', (lastErrorY - firstErrorY + 40).toString());
      errorZone.setAttribute('fill', '#ffebee');
      errorZone.setAttribute('stroke', '#d32f2f');
      errorZone.setAttribute('stroke-width', '2');
      errorZone.setAttribute('stroke-dasharray', '5,5');
      errorZone.setAttribute('opacity', '0.3');
      sequenceGroup.appendChild(errorZone);
    }

    steps.forEach(step => {
      const fromX = actors[step.from].x;
      const toX = actors[step.to].x;
      const y = step.y;
      
      const direction = fromX < toX ? 1 : -1;
      const color = step.type === 'error' ? '#d32f2f' : step.type === 'warning' ? '#ed6c02' : '#2e7d32';

      // Draw arrow line
      const arrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      arrowLine.setAttribute('x1', (fromX + (direction > 0 ? 10 : -10)).toString());
      arrowLine.setAttribute('y1', y.toString());
      arrowLine.setAttribute('x2', (toX + (direction > 0 ? -10 : 10)).toString());
      arrowLine.setAttribute('y2', y.toString());
      arrowLine.setAttribute('stroke', color);
      arrowLine.setAttribute('stroke-width', '2');
      sequenceGroup.appendChild(arrowLine);

      // Draw arrowhead
      const arrowSize = 8;
      const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const arrowX = toX + (direction > 0 ? -10 : 10);
      const points = `${arrowX},${y} ${arrowX + (direction > 0 ? -arrowSize : arrowSize)},${y - arrowSize/2} ${arrowX + (direction > 0 ? -arrowSize : arrowSize)},${y + arrowSize/2}`;
      arrowHead.setAttribute('points', points);
      arrowHead.setAttribute('fill', color);
      sequenceGroup.appendChild(arrowHead);

      // Draw message background
      const textX = (fromX + toX) / 2;
      const messageWidth = step.message.length * 7;
      const messageBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      messageBackground.setAttribute('x', (textX - messageWidth/2).toString());
      messageBackground.setAttribute('y', (y - 18).toString());
      messageBackground.setAttribute('width', messageWidth.toString());
      messageBackground.setAttribute('height', '16');
      messageBackground.setAttribute('fill', 'white');
      messageBackground.setAttribute('stroke', '#ddd');
      messageBackground.setAttribute('rx', '2');
      sequenceGroup.appendChild(messageBackground);

      // Draw message text
      const messageText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      messageText.setAttribute('x', textX.toString());
      messageText.setAttribute('y', (y - 6).toString());
      messageText.setAttribute('text-anchor', 'middle');
      messageText.setAttribute('font-size', '13px');
      messageText.setAttribute('fill', color);
      if (step.type === 'error') {
        messageText.setAttribute('font-weight', 'bold');
      }
      messageText.textContent = step.message;
      sequenceGroup.appendChild(messageText);
    });

    // Add legend
    const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legend.setAttribute('class', 'legend');
    legend.setAttribute('transform', `translate(50, ${height - 80})`);
    mainGroup.appendChild(legend);

    const legendItems = [
      { color: '#2e7d32', label: 'Successful Step' },
      { color: '#ed6c02', label: 'Warning' },
      { color: '#d32f2f', label: 'Error/Failure' }
    ];

    legendItems.forEach((item, index) => {
      const legendCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      legendCircle.setAttribute('cx', '10');
      legendCircle.setAttribute('cy', (index * 20 + 10).toString());
      legendCircle.setAttribute('r', '6');
      legendCircle.setAttribute('fill', item.color);
      legend.appendChild(legendCircle);

      const legendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      legendText.setAttribute('x', '20');
      legendText.setAttribute('y', (index * 20 + 15).toString());
      legendText.setAttribute('font-size', '12px');
      legendText.textContent = item.label;
      legend.appendChild(legendText);
    });

  }, [error]);

  const { steps } = generateSequenceData(error);

  return (
    <EuiPanel paddingSize="l" style={{ height: '100%' }}>
      <EuiTitle size="m">
        <h3>Error Sequence Diagram</h3>
      </EuiTitle>
      <EuiSpacer />
      
      <EuiText size="s">
        <p>This diagram shows the sequence of method calls and interactions that led to the error:</p>
      </EuiText>
      
      <EuiSpacer />
      
      <EuiFlexGroup gutterSize="m">
        <EuiFlexItem grow={false}>
          <EuiBadge color="success" iconType="check" size="s">
            Successful Step
          </EuiBadge>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiBadge color="danger" iconType="cross" size="s">
            Error/Exception
          </EuiBadge>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiBadge color="warning" iconType="alert" size="s">
            Warning
          </EuiBadge>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer />

      <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }}>
        <svg ref={svgRef} style={{ display: 'block' }}></svg>
      </div>

    </EuiPanel>
  );
};