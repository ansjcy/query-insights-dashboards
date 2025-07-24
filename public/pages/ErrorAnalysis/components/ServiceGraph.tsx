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
} from '@elastic/eui';
import ReactECharts from 'echarts-for-react';
import { ErrorRecord } from '../utils/dataLoader';

interface ServiceGraphProps {
  error: ErrorRecord;
}

interface Node {
  id: string;
  name: string;
  symbolSize: number;
  category: number;
  itemStyle: {
    color: string;
  };
  label: {
    show: boolean;
    fontSize: number;
  };
  x?: number;
  y?: number;
  fixed?: boolean;
  symbol?: string;
}

interface Link {
  source: string;
  target: string;
  lineStyle: {
    color: string;
    width: number;
    type?: string;
  };
}

export const ServiceGraph: React.FC<ServiceGraphProps> = ({ error }) => {

  // Generate error count data for each component in the request flow
  const generateClusterNodeErrorCounts = () => {
    // Mock error counts for different components in the request flow
    return {
      'user-request': 0,
      'load-balancer': 2,
      'coordinating-node-1': 22,
      'coordinating-node-2': 14,
      'master-node-1': 8,
      'master-node-2': 3,
      'master-node-3': 5,
      'data-node-1': 42,
      'data-node-2': 28,
      'data-node-3': 15,
      'data-node-4': 6,
      'data-node-5': 12
    };
  };

  const generateGraphData = (error: ErrorRecord): { nodes: Node[], links: Link[], categories: any[] } => {
    const errorCounts = generateClusterNodeErrorCounts();
    const categories = [
      { name: 'User/Client', itemStyle: { color: '#9467bd' } },
      { name: 'Load Balancer', itemStyle: { color: '#8c564b' } },
      { name: 'Coordinating Node', itemStyle: { color: '#d62728' } },
      { name: 'Master Node', itemStyle: { color: '#1f77b4' } },
      { name: 'Data Node', itemStyle: { color: '#ff7f0e' } }
    ];

    // Generate nodes with error counts, fixed positions, and custom symbols
    const createNode = (id: string, name: string, category: number, nodeType: string, instance: string, x: number, y: number, baseSize: number = 50, symbol: string = 'circle'): Node => {
      const errorCount = errorCounts[id] || 0;
      const sizeMultiplier = Math.max(1, Math.sqrt(errorCount / 3)); // Scale size based on error count
      const symbolSize = Math.min(baseSize * sizeMultiplier, 120); // Cap at 120
      
      // Color based on error severity
      let color = '#2ca02c'; // Green for low errors
      if (errorCount > 15) color = '#d62728'; // Red for high errors
      else if (errorCount > 8) color = '#ff7f0e'; // Orange for medium errors
      if (errorCount === 0) color = '#7f7f7f'; // Gray for no errors

      return {
        id,
        name: `${name}\n${instance}\n(${errorCount} errors)`,
        symbolSize,
        category,
        itemStyle: { color },
        label: { show: true, fontSize: 9 },
        x,
        y,
        fixed: true,
        symbol
      };
    };

    // Create request flow topology optimized for side-by-side layout
    const nodes: Node[] = [
      // Layer 1: User Request (Far Left)
      createNode('user-request', 'User Request', 0, 'Client App', 'search query', 80, 250, 40, 'circle'),
      
      // Layer 2: Load Balancer (Left)
      createNode('load-balancer', 'Load Balancer', 1, 'ALB/ELB', 'lb-opensearch', 220, 250, 50, 'rect'),
      
      // Layer 3: Coordinating Nodes (Center-Left)
      createNode('coordinating-node-1', 'Coordinating Node', 2, 'c5.large', 'i-coord-1', 360, 200, 45, 'circle'),
      createNode('coordinating-node-2', 'Coordinating Node', 2, 'c5.large', 'i-coord-2', 360, 300, 45, 'circle'),
      
      // Layer 4: Master Nodes (Center)
      createNode('master-node-1', 'Master Node', 3, 'm5.large', 'i-master-1', 480, 170, 30, 'circle'),
      createNode('master-node-2', 'Master Node', 3, 'm5.large', 'i-master-2', 480, 250, 30, 'circle'),
      createNode('master-node-3', 'Master Node', 3, 'm5.large', 'i-master-3', 480, 330, 30, 'circle'),
      
      // Layer 5: Data Nodes (Right)
      createNode('data-node-1', 'Data Node', 4, 'r5.2xlarge', 'i-data-1', 600, 140, 50, 'circle'),
      createNode('data-node-2', 'Data Node', 4, 'r5.2xlarge', 'i-data-2', 600, 220, 50, 'circle'),
      createNode('data-node-3', 'Data Node', 4, 'r5.2xlarge', 'i-data-3', 600, 300, 50, 'circle'),
      createNode('data-node-4', 'Data Node', 4, 'r5.xlarge', 'i-data-4', 600, 380, 45, 'circle'),
      createNode('data-node-5', 'Data Node', 4, 'r5.xlarge', 'i-data-5', 720, 250, 45, 'circle'),
    ];

    // Define request flow connections - left to right following actual OpenSearch request path
    const links: Link[] = [
      // 1. User to Load Balancer
      { source: 'user-request', target: 'load-balancer', lineStyle: { color: '#9467bd', width: 3 } },
      
      // 2. Load Balancer to Coordinating Nodes
      { source: 'load-balancer', target: 'coordinating-node-1', lineStyle: { color: '#8c564b', width: 3 } },
      { source: 'load-balancer', target: 'coordinating-node-2', lineStyle: { color: '#8c564b', width: 3 } },
      
      // 3. Coordinating Nodes to Master Nodes (for cluster state if needed)
      { source: 'coordinating-node-1', target: 'master-node-1', lineStyle: { color: '#d62728', width: 2, type: 'dashed' } },
      { source: 'coordinating-node-2', target: 'master-node-2', lineStyle: { color: '#d62728', width: 2, type: 'dashed' } },
      
      // 4. Coordinating Nodes to Data Nodes (main query execution path)
      { source: 'coordinating-node-1', target: 'data-node-1', lineStyle: { color: '#d62728', width: 3 } },
      { source: 'coordinating-node-1', target: 'data-node-2', lineStyle: { color: '#d62728', width: 3 } },
      { source: 'coordinating-node-1', target: 'data-node-3', lineStyle: { color: '#d62728', width: 3 } },
      { source: 'coordinating-node-2', target: 'data-node-3', lineStyle: { color: '#d62728', width: 3 } },
      { source: 'coordinating-node-2', target: 'data-node-4', lineStyle: { color: '#d62728', width: 3 } },
      { source: 'coordinating-node-2', target: 'data-node-5', lineStyle: { color: '#d62728', width: 3 } },
      
      // 5. Data node inter-communication for shard replication
      { source: 'data-node-1', target: 'data-node-2', lineStyle: { color: '#ff7f0e', width: 1, type: 'dotted' } },
      { source: 'data-node-2', target: 'data-node-3', lineStyle: { color: '#ff7f0e', width: 1, type: 'dotted' } },
      { source: 'data-node-3', target: 'data-node-4', lineStyle: { color: '#ff7f0e', width: 1, type: 'dotted' } },
      { source: 'data-node-4', target: 'data-node-5', lineStyle: { color: '#ff7f0e', width: 1, type: 'dotted' } },
      
      // 6. Master node cluster communication (background process)
      { source: 'master-node-1', target: 'master-node-2', lineStyle: { color: '#1f77b4', width: 1, type: 'dotted' } },
      { source: 'master-node-2', target: 'master-node-3', lineStyle: { color: '#1f77b4', width: 1, type: 'dotted' } },
    ];

    return { nodes, links, categories };
  };

  const getOption = () => {
    const { nodes, links, categories } = generateGraphData(error);

    return {
      title: {
        text: 'Service Dependency Graph',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        formatter: function(params: any) {
          if (params.dataType === 'node') {
            const lines = params.data.name.split('\n');
            const nodeType = lines[0];
            const instanceId = lines[1];
            const errorCount = lines[2].match(/\((\d+) errors\)/)?.[1] || '0';
            const categoryNames = ['Master Node', 'Data Node', 'Ingest Node', 'Coordinating Node'];
            const categoryName = categoryNames[params.data.category] || 'Unknown';
            
            let status = 'Healthy';
            if (parseInt(errorCount) > 15) status = 'Critical';
            else if (parseInt(errorCount) > 8) status = 'Warning';
            else if (parseInt(errorCount) > 0) status = 'Minor Issues';
            
            return `<strong>${nodeType}</strong><br/>` +
                   `Instance: ${instanceId}<br/>` +
                   `Type: ${categoryName}<br/>` +
                   `Error Count: ${errorCount}<br/>` +
                   `Status: ${status}`;
          }
          return '';
        }
      },
      series: [{
        type: 'graph',
        layout: 'none',
        data: nodes,
        links: links,
        categories: categories,
        roam: true,
        focusNodeAdjacency: true,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
        },
        lineStyle: {
          opacity: 0.8,
          curveness: 0.1
        },
        emphasis: {
          lineStyle: {
            width: 4
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        label: {
          show: true,
          fontSize: 10,
          fontWeight: 'bold'
        }
      }]
    };
  };

  return (
    <EuiPanel paddingSize="l" style={{ height: '100%' }}>
      <EuiTitle size="m">
        <h3>Cluster Node Error Distribution</h3>
      </EuiTitle>
      <EuiSpacer />
      
      <EuiText size="s">
        <p>Request flow showing error distribution: User → Load Balancer → Coordinating Nodes → Master Nodes → Data Nodes</p>
      </EuiText>
      
      <EuiSpacer />
      
      <EuiFlexGroup gutterSize="s" wrap>
        <EuiFlexItem grow={false}>
          <EuiBadge color="#2ca02c">0-8 errors</EuiBadge>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiBadge color="#ff7f0e">9-15 errors</EuiBadge>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiBadge color="#d62728">16+ errors</EuiBadge>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer />

      <div style={{ width: '100%', height: '500px', border: '1px solid #d3d3d3', borderRadius: '4px' }}>
        <ReactECharts 
          option={getOption()} 
          style={{ height: '500px', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </EuiPanel>
  );
};