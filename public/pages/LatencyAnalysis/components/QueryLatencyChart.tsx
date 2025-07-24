/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect } from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
} from '@elastic/eui';
import Plotly from 'plotly.js-dist';
import { generateCorrelatedData } from './chartDataUtils';

export const QueryLatencyChart: React.FC = () => {
  const sampleData = useMemo(() => generateCorrelatedData('queryLatency'), []);

  const plotData = useMemo(() => {
    const timestamps = sampleData.map(d => d.timestamp);
    const values = sampleData.map(d => d.value);
    const upperThreshold = sampleData.map(d => d.threshold_upper);
    const lowerThreshold = sampleData.map(d => d.threshold_lower);
    const statuses = sampleData.map(d => d.status);

    // Split line into blue (OK) and red (alarm) segments
    const blueSegments = [];
    const redSegments = [];
    
    let currentSegment = { x: [], y: [], isAlarm: false };
    
    sampleData.forEach((d, i) => {
      const isAlarm = d.status === 'In alarm';
      
      if (currentSegment.isAlarm !== isAlarm) {
        // Segment change - save current segment and start new one
        if (currentSegment.x.length > 0) {
          if (currentSegment.isAlarm) {
            redSegments.push({ x: [...currentSegment.x], y: [...currentSegment.y] });
          } else {
            blueSegments.push({ x: [...currentSegment.x], y: [...currentSegment.y] });
          }
        }
        
        // Start new segment, including the current point in both segments for continuity
        currentSegment = { 
          x: currentSegment.x.length > 0 ? [currentSegment.x[currentSegment.x.length - 1], d.timestamp] : [d.timestamp], 
          y: currentSegment.y.length > 0 ? [currentSegment.y[currentSegment.y.length - 1], d.value] : [d.value], 
          isAlarm 
        };
      } else {
        // Same segment type - add point
        currentSegment.x.push(d.timestamp);
        currentSegment.y.push(d.value);
      }
    });
    
    // Don't forget the last segment
    if (currentSegment.x.length > 0) {
      if (currentSegment.isAlarm) {
        redSegments.push(currentSegment);
      } else {
        blueSegments.push(currentSegment);
      }
    }

    return {
      timestamps,
      values,
      upperThreshold,
      lowerThreshold,
      statuses,
      blueSegments,
      redSegments,
    };
  }, [sampleData]);

  const overallStatus = useMemo(() => {
    const hasAlarms = sampleData.some(d => d.status === 'In alarm');
    return hasAlarms ? 'In alarm' : 'OK';
  }, [sampleData]);

  useEffect(() => {
    const data = [
      // Blue line segments (normal operation)
      ...plotData.blueSegments.map((segment, i) => ({
        x: segment.x,
        y: segment.y,
        type: 'scatter',
        mode: 'lines',
        name: undefined,
        line: { color: '#1f77b4', width: 2 },
        showlegend: false,
        legendgroup: 'latency',
      })),
      
      // Red line segments (alarm state)
      ...plotData.redSegments.map((segment, i) => ({
        x: segment.x,
        y: segment.y,
        type: 'scatter',
        mode: 'lines',
        name: undefined,
        line: { color: '#d62728', width: 2 },
        showlegend: false,
        legendgroup: 'latency-alarm',
      })),
    ];

    // Create threshold rectangles and timeline status rectangles
    const shapes = [];
    
    // Add spike threshold rectangles
    const spikeRanges = [];
    let inSpike = false;
    let spikeStart = 0;
    
    for (let i = 0; i < plotData.values.length; i++) {
      const isHighValue = plotData.values[i] > 300; // Detect actual high latency
      
      if (!inSpike && isHighValue) {
        inSpike = true;
        spikeStart = i;
      } else if (inSpike && !isHighValue) {
        spikeRanges.push({
          startIdx: spikeStart,
          endIdx: i - 1,
          upperBound: Math.max(...plotData.values.slice(spikeStart, i)) + 100,
          lowerBound: Math.min(...plotData.values.slice(spikeStart, i)) - 50
        });
        inSpike = false;
      }
    }
    
    // Handle case where spike continues to the end
    if (inSpike) {
      spikeRanges.push({
        startIdx: spikeStart,
        endIdx: plotData.values.length - 1,
        upperBound: Math.max(...plotData.values.slice(spikeStart)) + 100,
        lowerBound: Math.min(...plotData.values.slice(spikeStart)) - 50
      });
    }
    
    // Create rectangles for actual spike ranges
    spikeRanges.forEach(range => {
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'y',
        x0: plotData.timestamps[range.startIdx],
        x1: plotData.timestamps[range.endIdx],
        y0: Math.max(0, range.lowerBound),
        y1: range.upperBound,
        fillcolor: 'rgba(200, 200, 200, 0.4)',
        line: { width: 0 },
        layer: 'below',
      });
    });
    
    // Add normal period rectangles
    let currentThresholdUpper = plotData.upperThreshold[0];
    let currentThresholdLower = plotData.lowerThreshold[0];
    let thresholdStartIdx = 0;
    
    for (let i = 1; i <= plotData.upperThreshold.length; i++) {
      if (i === plotData.upperThreshold.length || 
          plotData.upperThreshold[i] !== currentThresholdUpper || 
          plotData.lowerThreshold[i] !== currentThresholdLower) {
        
        // Only add rectangle if it's a normal period (low threshold)
        if (currentThresholdUpper <= 250) {
          shapes.push({
            type: 'rect',
            xref: 'x',
            yref: 'y',
            x0: plotData.timestamps[thresholdStartIdx],
            x1: plotData.timestamps[Math.min(i, plotData.timestamps.length - 1)],
            y0: currentThresholdLower,
            y1: currentThresholdUpper,
            fillcolor: 'rgba(200, 200, 200, 0.4)',
            line: { width: 0 },
            layer: 'below',
          });
        }

        if (i < plotData.upperThreshold.length) {
          currentThresholdUpper = plotData.upperThreshold[i];
          currentThresholdLower = plotData.lowerThreshold[i];
          thresholdStartIdx = i;
        }
      }
    }
    
    // Add timeline status rectangles  
    let currentStatus = plotData.statuses[0];
    let statusStartIdx = 0;

    for (let i = 1; i <= plotData.statuses.length; i++) {
      if (i === plotData.statuses.length || plotData.statuses[i] !== currentStatus) {
        const color = currentStatus === 'In alarm' ? '#d62728' : '#2ca02c';
        
        shapes.push({
          type: 'rect',
          xref: 'x',
          yref: 'y2',
          x0: plotData.timestamps[statusStartIdx],
          x1: plotData.timestamps[Math.min(i, plotData.timestamps.length - 1)],
          y0: 0,
          y1: 1,
          fillcolor: color,
          line: { width: 0 },
          layer: 'below',
        });

        if (i < plotData.statuses.length) {
          currentStatus = plotData.statuses[i];
          statusStartIdx = i;
        }
      }
    }

    const layout = {
      xaxis: {
        domain: [0, 1],
        type: 'date',
        showgrid: true,
        gridcolor: 'rgba(200, 200, 200, 0.3)',
        zeroline: false,
        range: [plotData.timestamps[0], plotData.timestamps[plotData.timestamps.length - 1]],
      },
      yaxis: {
        domain: [0.1, 1],
        title: 'Milliseconds',
        showgrid: true,
        gridcolor: 'rgba(200, 200, 200, 0.3)',
        zeroline: true,
        zerolinecolor: 'rgba(200, 200, 200, 0.5)',
        range: [0, Math.max(...plotData.values) * 1.1],
        rangemode: 'tozero',
      },
      yaxis2: {
        domain: [0, 0.05],
        showticklabels: false,
        showgrid: false,
        range: [0, 1],
        fixedrange: true,
      },
      shapes: shapes,
      showlegend: false,
      margin: { l: 60, r: 20, t: 10, b: 80 },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      hovermode: 'x unified',
    };

    const config = {
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'],
      responsive: true,
    };

    Plotly.newPlot('query-latency-chart', data, layout, config);

    return () => {
      Plotly.purge('query-latency-chart');
    };
  }, [plotData]);

  return (
    <EuiPanel paddingSize="l">
      <EuiFlexGroup alignItems="center" gutterSize="m">
        <EuiFlexItem grow={false}>
          <EuiTitle size="m">
            <h3>Query Latency</h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="xs">
            <EuiFlexItem grow={false}>
              <EuiIcon 
                type={overallStatus === 'OK' ? 'check' : 'alert'} 
                color={overallStatus === 'OK' ? 'success' : 'danger'} 
                size="m" 
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="m" color={overallStatus === 'OK' ? 'success' : 'danger'}>
                <strong>{overallStatus}</strong>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      
      <EuiSpacer size="xs" />
      <EuiText size="s" color="subdued">
        Query latency is above the threshold for sustained periods
      </EuiText>
      
      <EuiSpacer size="l" />

      <div id="query-latency-chart" style={{ width: '100%', height: '400px' }} />

      <EuiSpacer size="s" />

      <EuiFlexGroup gutterSize="m" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiIcon type="dot" color="#d62728" size="m" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s">In alarm</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginLeft: '20px' }}>
              <EuiText size="s">OK</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};