import { Component, createMemo, createEffect, mergeProps } from 'solid-js';
import ApexCharts from 'apexcharts';
import { onMount, onCleanup } from 'solid-js';
import { unpackHistory } from './stores/stateStore';
import { ChartDataType } from './stores/historyStore';

export function RatingChart(incomingProps: { 
  data: ChartDataType<any>;
  onClick?: (index: number) => void;
  options?: {decimalPlaces?: number};
}) {
  let chartRef: HTMLDivElement | undefined;
  let chart: ApexCharts | undefined;

  const defaultProps = {
    options: {decimalPlaces: 2}
  };
  const props = mergeProps(defaultProps, incomingProps);

  const seriesData = createMemo(() => Object.entries(props.data.plots).map(([, plotData]) => {
    return {
      name: plotData.name,
      data: plotData.data.map((v, i) => ({
        x: props.data.timestamps[i]!,
        y: v,
      })),
    };
  }));

  const annotations = createMemo(() => {
    const xaxis: any[] = [];

    const { helpers } = unpackHistory();
    
    let lastIndex = 0;
    let lastFillColor = undefined;
    for (let i = 1; i < props.data.timestamps.length; i++) {
      const isLast = (i == props.data.timestamps.length-1);

      const version = props.data.version[i]!;
      let fillColor = helpers.getVersion(version).plotBackgroundColor;
      
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

  let mouseDownTime: number;

  onMount(() => {
    chartRef?.addEventListener('mousedown', () => {
      mouseDownTime = new Date().getTime();
    })
  })

  const chartOptions = createMemo(() => ({
    chart: {
      type: 'line',
      height: '100%',
      animations: {
        enabled: false,
      },
      events: {
        click: function(event, chartContext, config) {
          const mouseUpTime = new Date().getTime();
          if (mouseUpTime - mouseDownTime >= 200) { 
            console.log("Detected drag instead of click, ignoring chart click event");
            return;
          } 

          // The index is null if clicking on the zoom buttons
          if (config.dataPointIndex === null) {
            return;
          }
          if (props.onClick) {
            console.log("Chart - seeking to point id", config.dataPointIndex);
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
