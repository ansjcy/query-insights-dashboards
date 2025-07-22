/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { EuiPanel, EuiText, EuiSpacer, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import ReactEcharts from 'echarts-for-react';
import { ChartDataPoint, MetricMetadata } from '../types/langgraph';

interface MetricChartProps {
  chartData: ChartDataPoint[];
  metadata: MetricMetadata;
}

export const MetricChart: React.FC<MetricChartProps> = ({ chartData, metadata }) => {
  const chartOptions = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        title: {
          text: 'No data available for the selected time range',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#64748b',
            fontSize: 16,
            fontWeight: 500,
          },
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: [],
      };
    }

    // Filter out empty data points
    const validData = chartData.filter((d) => d.values && d.values.length > 0);

    if (validData.length === 0) {
      return {
        title: {
          text: 'No data available for the selected time range',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#64748b',
            fontSize: 16,
            fontWeight: 500,
          },
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: [],
      };
    }

    // Prepare data for ECharts
    const series = validData.map((nodeData, index) => {
      const data = nodeData.timestamps.map((timestamp, i) => [
        new Date(timestamp).getTime(),
        nodeData.values[i],
      ]);

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      
      return {
        name: nodeData.nodeId.length > 15 ? nodeData.nodeId.substring(0, 15) + '...' : nodeData.nodeId,
        type: 'line',
        data: data,
        smooth: true,
        lineStyle: {
          width: 2,
          color: colors[index % colors.length],
        },
        itemStyle: {
          color: colors[index % colors.length],
        },
        symbol: 'circle',
        symbolSize: 4,
      };
    });

    // Get all timestamps for x-axis
    const allTimestamps = [...new Set(validData.flatMap((d) => d.timestamps))]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((t) => new Date(t).getTime());

    const minTime = Math.min(...allTimestamps);
    const maxTime = Math.max(...allTimestamps);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999',
          },
        },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          
          const timestamp = new Date(params[0].value[0]);
          const date = timestamp.toLocaleDateString('en-US', { timeZone: 'UTC' });
          const time = timestamp.toLocaleTimeString('en-US', { timeZone: 'UTC' });
          
          let tooltipHtml = `<div style="margin-bottom: 8px; font-weight: 600; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 4px;">
            ${date} ${time}
          </div>`;
          
          params.forEach((param: any) => {
            const unit = validData.find(d => d.nodeId.startsWith(param.seriesName))?.unit || '';
            tooltipHtml += `
              <div style="margin-bottom: 4px; display: flex; align-items: center;">
                <div style="width: 8px; height: 8px; background: ${param.color}; border-radius: 50%; margin-right: 8px;"></div>
                <span style="font-weight: 500;">${param.seriesName}:</span>
                <span style="margin-left: 8px; font-weight: 600;">${param.value[1].toFixed(2)} ${unit}</span>
              </div>
            `;
          });
          
          return tooltipHtml;
        },
      },
      legend: {
        data: series.map(s => s.name),
        bottom: 10,
        textStyle: {
          fontSize: 12,
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        min: minTime,
        max: maxTime,
        axisLabel: {
          formatter: (value: number) => {
            const date = new Date(value);
            return date.toLocaleTimeString('en-US', { 
              timeZone: 'UTC',
              hour: '2-digit',
              minute: '2-digit',
            });
          },
          fontSize: 11,
        },
        name: 'Time',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          fontSize: 12,
          fontWeight: 500,
        },
      },
      yAxis: {
        type: 'value',
        name: `${metadata.metric_name} (${validData[0]?.unit || ''})`,
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          fontSize: 12,
          fontWeight: 500,
        },
        axisLabel: {
          fontSize: 11,
          formatter: (value: number) => {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value.toFixed(2);
          },
        },
      },
      series: series,
      animation: true,
      animationDuration: 1000,
    };
  }, [chartData, metadata]);

  return (
    <EuiPanel paddingSize="m" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
      <EuiFlexGroup direction="column" gutterSize="s">
        <EuiFlexItem>
          <EuiText size="m">
            <strong>{metadata.metric_name} - {metadata.stat}</strong>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s" color="subdued">
            {new Date(metadata.start_time).toLocaleDateString('en-US')}{' '}
            {new Date(metadata.start_time).toLocaleTimeString('en-US')}
            {' → '}
            {new Date(metadata.end_time).toLocaleDateString('en-US')}{' '}
            {new Date(metadata.end_time).toLocaleTimeString('en-US')} UTC
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      
      <EuiSpacer size="m" />
      
      <div style={{ height: '400px', width: '100%' }}>
        <ReactEcharts
          option={chartOptions}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </EuiPanel>
  );
};