import { Component, createMemo } from 'solid-js';
import ApexCharts from 'apexcharts';
import { onMount, onCleanup } from 'solid-js';

export function RatingChart(props: { 
  data: { timestamps: number[]; overallRating: number[], naiveRating: number[] };
  onClick?: (index: number) => void;
}) {
  let chartRef: HTMLDivElement | undefined;
  let chart: ApexCharts | undefined;

  const chartOptions = createMemo(() => ({
    chart: {
      type: 'line' as const,
      height: '100%',
      animations: {
        enabled: false,
      },
      events: {
        dataPointSelection: (_event: any, _chartContext: any, config: any) => {
          if (props.onClick) {
            props.onClick(config.dataPointIndex);
          }
        }
      },
      zoom: {
        autoScaleYaxis: true,
      },
    },
    title: {
      text: 'Rating',
      align: 'center' as const,
    },
    xaxis: {
      type: 'datetime' as const,
      title: {
        text: 'Date'
      }
    },
    yaxis: {
      title: {
        text: 'Rating'
      }
    },
    series: [
      {
        name: 'Overall Rating',
        data: props.data.timestamps.map((timestamp, i) => ({
          x: timestamp,
          y: props.data.overallRating[i]
        }))
      },
      {
        name: 'Naive Rating',
        data: props.data.timestamps.map((timestamp, i) => ({
          x: timestamp,
          y: props.data.naiveRating[i]
        }))
      }
    ],
    stroke: {
      curve: 'smooth' as const,
      width: 2
    },
    markers: {
      size: 0
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        format: 'dd MMM yyyy'
      }
    }
  }));

  onMount(() => {
    if (chartRef) {
      chart = new ApexCharts(chartRef, chartOptions());
      chart.render();
    }
  });

  onCleanup(() => {
    chart?.destroy();
  });

  createMemo(() => {
    if (chart) {
      chart.updateOptions(chartOptions());
    }
  });

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
}
