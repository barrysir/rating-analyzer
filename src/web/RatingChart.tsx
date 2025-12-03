import { Component, createMemo, createEffect, mergeProps } from 'solid-js';
import ApexCharts from 'apexcharts';
import { onMount, onCleanup } from 'solid-js';
import { historyGetVersion } from './stores/historyStore';

export function RatingChart(incomingProps: { 
  data: { timestamps: number[]; overallRating: number[], naiveRating: number[], version: number[], maxRating: number[] };
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
    },
    {
      name: 'Max Rating',
      data: props.data.timestamps.map((timestamp, i) => ({
        x: timestamp,
        y: props.data.maxRating[i]
      }))
    },
  ]);

  const annotations = createMemo(() => {
    const xaxis: any[] = [];
    
    let lastIndex = 0;
    let lastFillColor = undefined;
    for (let i = 1; i < props.data.timestamps.length; i++) {
      const isLast = (i == props.data.timestamps.length-1);

      const version = props.data.version[i]!;
      let fillColor = historyGetVersion(version).plotBackgroundColor;
      
      if (isLast || fillColor !== lastFillColor) {
        xaxis.push({
          x: props.data.timestamps[lastIndex],
          x2: props.data.timestamps[i],
          fillColor: lastFillColor,
          opacity: 0.2,
        });
        lastIndex = i;
        lastFillColor = fillColor;
      }
    }
    
    return { xaxis };
  });

  const chartOptions = createMemo(() => ({
    chart: {
      type: 'line',
      height: '100%',
      animations: {
        enabled: false,
      },
      events: {
        click: function(event, chartContext, config) {
          console.log(config.dataPointIndex);
          // The index is null if clicking on the zoom buttons
          if (config.dataPointIndex === null) {
            return;
          }
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
      align: 'center',
    },
    xaxis: {
      type: 'datetime',
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
      curve: 'stepline',
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
    },
    annotations: annotations()
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

  createEffect(() => {
    const opts = chartOptions();
    if (chart) {
      chart.updateOptions(opts, false, true);
    }
  });

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
}
