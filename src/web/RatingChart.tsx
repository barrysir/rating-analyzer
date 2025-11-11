import { Component, createMemo, createEffect, mergeProps } from 'solid-js';
import ApexCharts from 'apexcharts';
import { onMount, onCleanup } from 'solid-js';

export function RatingChart(incomingProps: { 
  data: { timestamps: number[]; overallRating: number[], naiveRating: number[] };
  onClick?: (index: number) => void;
  options?: {decimalPlaces?: number};
}) {
  let chartRef: HTMLDivElement | undefined;
  let chart: ApexCharts | undefined;

  const defaultProps = {
    options: {decimalPlaces: 2}
  };
  const props = mergeProps(defaultProps, incomingProps);

  const seriesData = createMemo(() => [
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
  ]);

  const chartOptions = createMemo(() => ({
    chart: {
      type: 'line' as const,
      height: '100%',
      animations: {
        enabled: false,
      },
      events: {
        click: function(event, chartContext, config) {
          console.log(config.dataPointIndex);
          if (props.onClick) {
            props.onClick(config.dataPointIndex);
          }
        },
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
      },
      labels: {
        formatter: function(val) {
          return val.toFixed(props.options.decimalPlaces);
        }
      },
    },
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
      chart = new ApexCharts(chartRef, { ...chartOptions(), series: seriesData() });
      chart.render();
    }
  });

  onCleanup(() => {
    chart?.destroy();
  });

  createEffect(() => {
    const series = seriesData();
    if (chart) {
      chart.updateSeries(series, true);
    }
  });

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
}
