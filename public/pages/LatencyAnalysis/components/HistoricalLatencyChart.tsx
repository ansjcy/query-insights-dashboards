/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiIcon,
  EuiHealth,
} from '@elastic/eui';
import {
  XYPlot,
  XAxis,
  YAxis,
  LineSeries,
  AreaSeries,
  MarkSeries,
  Crosshair,
  Hint,
} from 'react-vis';
import 'react-vis/dist/style.css';
import { LatencyRecord } from '../utils/dataLoader';

interface HistoricalLatencyChartProps {
  record: LatencyRecord;
}

interface CrosshairValue {
  x: number;
  y: number;
}

export const HistoricalLatencyChart: React.FC<HistoricalLatencyChartProps> = ({ record }) => {
  const [crosshairValues, setCrosshairValues] = React.useState<CrosshairValue[]>([]);
  const [hoveredPoint, setHoveredPoint] = React.useState<any>(null);

  const chartWidth = 800;
  const chartHeight = 300;

  // Process historical data
  const latencyData = record.historicalData.map(point => ({
    x: new Date(point.timestamp).getTime(),
    y: point.latency,
    timestamp: point.timestamp,
    count: point.count,
  }));

  // Calculate anomaly detection bands (simple moving average + standard deviation)
  const calculateAnomalyBands = () => {
    const windowSize = 10;
    const bands = [];
    
    for (let i = windowSize - 1; i < latencyData.length; i++) {
      const window = latencyData.slice(i - windowSize + 1, i + 1);
      const avg = window.reduce((sum, point) => sum + point.y, 0) / windowSize;
      const variance = window.reduce((sum, point) => sum + Math.pow(point.y - avg, 2), 0) / windowSize;
      const stdDev = Math.sqrt(variance);
      
      bands.push({
        x: latencyData[i].x,
        y: avg,
        y0: Math.max(0, avg - 2 * stdDev), // Lower bound
        y1: avg + 2 * stdDev, // Upper bound
      });
    }
    
    return bands;
  };

  const anomalyBands = calculateAnomalyBands();

  // Detect anomaly points
  const anomalies = latencyData.filter((point, index) => {
    if (index < 9) return false; // Skip first 9 points due to window size
    const band = anomalyBands[index - 9];
    return point.y > band.y1 || point.y < band.y0;
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatLatency = (latency: number) => {
    return `${latency.toFixed(1)}ms`;
  };

  // Calculate trend
  const getTrend = () => {
    if (latencyData.length < 2) return { direction: 'stable', percentage: 0 };
    
    const first = latencyData.slice(0, Math.floor(latencyData.length / 3));
    const last = latencyData.slice(-Math.floor(latencyData.length / 3));
    
    const firstAvg = first.reduce((sum, p) => sum + p.y, 0) / first.length;
    const lastAvg = last.reduce((sum, p) => sum + p.y, 0) / last.length;
    
    const change = ((lastAvg - firstAvg) / firstAvg) * 100;
    
    if (Math.abs(change) < 5) return { direction: 'stable', percentage: change };
    return { 
      direction: change > 0 ? 'increasing' : 'decreasing', 
      percentage: Math.abs(change) 
    };
  };

  const trend = getTrend();

  return (
    <EuiPanel paddingSize="l">
      <EuiFlexGroup alignItems="center" gutterSize="m">
        <EuiFlexItem grow={false}>
          <EuiTitle size="m">
            <h3>
              <EuiIcon type="visLine" size="m" /> Historical Latency Trend
            </h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHealth 
            color={trend.direction === 'increasing' ? 'danger' : 
                   trend.direction === 'decreasing' ? 'success' : 'subdued'}
          >
            {trend.direction === 'stable' ? 'Stable' : 
             `${trend.direction === 'increasing' ? 'Rising' : 'Improving'} ${trend.percentage.toFixed(1)}%`}
          </EuiHealth>
        </EuiFlexItem>
      </EuiFlexGroup>
      
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        Query latency over time with anomaly detection bands
      </EuiText>
      
      <EuiSpacer size="l" />

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <XYPlot
          width={chartWidth}
          height={chartHeight}
          xType="time"
          onMouseLeave={() => {
            setCrosshairValues([]);
            setHoveredPoint(null);
          }}
        >
          <XAxis tickFormat={formatTime} />
          <YAxis tickFormat={formatLatency} />
          
          {/* Anomaly Detection Bands */}
          <AreaSeries
            data={anomalyBands}
            fill="rgba(255, 193, 7, 0.2)"
            stroke="transparent"
          />
          
          {/* Main Latency Line */}
          <LineSeries
            data={latencyData}
            color="#007bff"
            strokeWidth={2}
            onNearestX={(value: any) => {
              setCrosshairValues([value]);
            }}
          />
          
          {/* Anomaly Points */}
          <MarkSeries
            data={anomalies}
            color="#dc3545"
            size={6}
            onValueMouseOver={(value: any) => setHoveredPoint(value)}
            onValueMouseOut={() => setHoveredPoint(null)}
          />
          
          {crosshairValues.length > 0 && (
            <Crosshair values={crosshairValues}>
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.8)', 
                color: 'white', 
                padding: '8px', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <div><strong>Time:</strong> {formatTime(crosshairValues[0].x)}</div>
                <div><strong>Latency:</strong> {formatLatency(crosshairValues[0].y)}</div>
              </div>
            </Crosshair>
          )}
          
          {hoveredPoint && (
            <Hint value={hoveredPoint}>
              <div style={{ 
                background: 'rgba(220, 53, 69, 0.9)', 
                color: 'white', 
                padding: '8px', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <div><strong>⚠️ Anomaly Detected</strong></div>
                <div><strong>Time:</strong> {formatTime(hoveredPoint.x)}</div>
                <div><strong>Latency:</strong> {formatLatency(hoveredPoint.y)}</div>
              </div>
            </Hint>
          )}
        </XYPlot>
      </div>

      <EuiSpacer size="l" />

      {/* Statistics */}
      <EuiFlexGroup gutterSize="l">
        <EuiFlexItem>
          <EuiFlexGroup direction="column" gutterSize="s">
            <EuiFlexItem>
              <EuiText size="s">
                <strong>Average Latency:</strong> {record.avgLatency.toFixed(1)}ms
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <strong>Max Latency:</strong> {record.maxLatency.toFixed(1)}ms
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup direction="column" gutterSize="s">
            <EuiFlexItem>
              <EuiText size="s">
                <strong>P95 Latency:</strong> {(record.p95Latency || record.maxLatency * 0.85).toFixed(1)}ms
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <strong>P99 Latency:</strong> {(record.p99Latency || record.maxLatency * 0.95).toFixed(1)}ms
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup direction="column" gutterSize="s">
            <EuiFlexItem>
              <EuiText size="s">
                <strong>Data Points:</strong> {latencyData.length}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFlexGroup alignItems="center" gutterSize="xs">
                <EuiFlexItem grow={false}>
                  <EuiText size="s">
                    <strong>Anomalies:</strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiBadge color={anomalies.length > 0 ? 'danger' : 'success'}>
                    {anomalies.length}
                  </EuiBadge>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      {anomalies.length > 0 && (
        <>
          <EuiSpacer size="m" />
          <EuiText size="s" color="danger">
            <EuiIcon type="alert" size="s" /> 
            <strong> {anomalies.length} anomalies detected</strong> - latency spikes significantly above normal patterns
          </EuiText>
        </>
      )}
    </EuiPanel>
  );
};