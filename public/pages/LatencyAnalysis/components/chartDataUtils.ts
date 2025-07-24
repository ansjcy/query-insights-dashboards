/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SpikePeriod {
  start: number;
  end: number;
  level: number;
  expectedRange: [number, number];
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  threshold_upper: number;
  threshold_lower: number;
  status: 'OK' | 'In alarm';
}

export const HIGH_USAGE_PERIODS: SpikePeriod[] = [
  { start: 17, end: 25, level: 40, expectedRange: [35, 45] },   // First sustained spike period
  { start: 37, end: 52, level: 45, expectedRange: [40, 50] },   // Second sustained spike period  
  { start: 67, end: 82, level: 35, expectedRange: [30, 40] },   // Third sustained spike period
  { start: 97, end: 112, level: 50, expectedRange: [45, 55] },  // Fourth sustained spike period
  { start: 127, end: 142, level: 42, expectedRange: [37, 47] }, // Fifth sustained spike period
  { start: 157, end: 167, level: 38, expectedRange: [33, 43] }  // Sixth sustained spike period
];

export interface MetricConfig {
  normalMin: number;
  normalMax: number;
  normalThreshold: number;
  spikeMultiplier: number;
  variation: number;
}

export const METRIC_CONFIGS = {
  cpu: {
    normalMin: 3,
    normalMax: 9,
    normalThreshold: 12,
    spikeMultiplier: 1,
    variation: 4
  },
  queryLatency: {
    normalMin: 50,
    normalMax: 150,
    normalThreshold: 200,
    spikeMultiplier: 10,
    variation: 100
  },
  jvmUsage: {
    normalMin: 25,
    normalMax: 45,
    normalThreshold: 50,
    spikeMultiplier: 1.5,
    variation: 8
  }
};

export function generateCorrelatedData(metricType: keyof typeof METRIC_CONFIGS): ChartDataPoint[] {
  const config = METRIC_CONFIGS[metricType];
  const now = new Date();
  const startTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
  
  const data: ChartDataPoint[] = [];
  
  // Add metric-specific variations to make charts look different
  const getMetricSpecificVariation = (metricType: string, i: number, baseValue: number) => {
    switch (metricType) {
      case 'cpu':
        // CPU has more frequent smaller fluctuations and occasional mini-spikes
        const cpuNoise = Math.sin(i * 0.1) * 2 + Math.random() * 3;
        const miniSpike = (i % 23 === 0) ? Math.random() * 8 : 0; // Random mini-spikes
        return cpuNoise + miniSpike;
        
      case 'jvmUsage':
        // JVM has more gradual changes and saw-tooth patterns from GC
        const gcCycle = Math.floor(i / 15) % 4; // 15-minute GC cycles
        const gcPattern = gcCycle < 3 ? gcCycle * 3 : -6; // Gradual rise, sharp drop
        const jvmDrift = Math.sin(i * 0.05) * 4; // Slower drift
        return gcPattern + jvmDrift + Math.random() * 2;
        
      default:
        return Math.random() * 2;
    }
  };
  
  for (let i = 0; i < 180; i++) { // 3 hours, 1-minute intervals
    const timestamp = new Date(startTime.getTime() + i * 60 * 1000);
    
    // Check if we're in a high usage period
    const highUsagePeriod = HIGH_USAGE_PERIODS.find(p => i >= p.start && i <= p.end);
    
    let value: number;
    let threshold_upper: number;
    let threshold_lower = 0;
    
    if (highUsagePeriod) {
      // Sustained high usage plateau with metric-specific variations
      let baseLevel: number;
      
      if (metricType === 'queryLatency') {
        baseLevel = highUsagePeriod.level * config.spikeMultiplier;
      } else if (metricType === 'cpu') {
        // CPU spikes vary more in intensity and timing
        const spikeVariation = 0.7 + Math.random() * 0.6; // 70-130% of expected spike
        baseLevel = highUsagePeriod.level * config.spikeMultiplier * spikeVariation;
      } else { // jvmUsage
        // JVM spikes are more delayed and gradual
        const progressInSpike = (i - highUsagePeriod.start) / (highUsagePeriod.end - highUsagePeriod.start);
        const delayedRamp = Math.min(1, Math.max(0, (progressInSpike - 0.2) * 1.5)); // Delay and ramp up
        baseLevel = config.normalMax + (highUsagePeriod.level * config.spikeMultiplier - config.normalMax) * delayedRamp;
      }
      
      value = baseLevel + Math.random() * config.variation - config.variation/2;
      
      // Expected range for spikes
      if (metricType === 'queryLatency') {
        threshold_upper = highUsagePeriod.expectedRange[1] * config.spikeMultiplier;
        threshold_lower = highUsagePeriod.expectedRange[0] * config.spikeMultiplier;
      } else {
        threshold_upper = highUsagePeriod.expectedRange[1] * config.spikeMultiplier;
        threshold_lower = highUsagePeriod.expectedRange[0] * config.spikeMultiplier;
      }
    } else {
      // Normal operation with metric-specific patterns
      let baseValue = config.normalMin + Math.random() * (config.normalMax - config.normalMin);
      
      // Add metric-specific baseline variations
      if (metricType === 'jvmUsage') {
        // JVM baseline slowly increases over time (memory pressure)
        baseValue += (i / 180) * 8; // Gradual increase over 3 hours
      }
      
      value = baseValue;
      threshold_upper = config.normalThreshold;
      threshold_lower = 0;
    }
    
    // Add metric-specific variations
    value += getMetricSpecificVariation(metricType, i, value);
    
    // Add small natural variation
    value += (Math.random() - 0.5) * 1;
    value = Math.max(0, value);
    
    // Determine alarm status - but make CPU and JVM alarms less perfectly aligned
    let status: 'OK' | 'In alarm' = 'OK';
    if (highUsagePeriod) {
      if (metricType === 'queryLatency') {
        status = 'In alarm';
      } else if (metricType === 'cpu') {
        // CPU alarm starts slightly after query latency spike and ends earlier
        const spikeProgress = (i - highUsagePeriod.start) / (highUsagePeriod.end - highUsagePeriod.start);
        status = (spikeProgress > 0.1 && spikeProgress < 0.9) ? 'In alarm' : 'OK';
      } else { // jvmUsage
        // JVM alarm is more delayed and lasts longer
        const spikeProgress = (i - highUsagePeriod.start) / (highUsagePeriod.end - highUsagePeriod.start);
        status = (spikeProgress > 0.3 && spikeProgress < 1.2) ? 'In alarm' : 'OK';
      }
    }
    
    data.push({
      timestamp: timestamp.toISOString(),
      value,
      threshold_upper,
      threshold_lower,
      status,
    });
  }
  
  return data;
}