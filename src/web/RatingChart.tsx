import * as echarts from 'echarts';
import { format } from 'date-fns';
import { ECharts, EChartsAutoSize } from 'echarts-solid';

function unixTimeToDate(t: number): Date {
    return new Date(t * 1000);
}

export function RatingChart(props: {data: {timestamps: number[]; overallRating: number[]}}) {
  const options: echarts.EChartsOption = {
    dataset: [
      {
        id: 'dataset',
        source: props.data,
      },
    ],
    tooltip: {
      trigger: 'axis'
    },
    title: {
      text: "Rating",
      left: 'center',
    },
    legend: {
      type: 'plain',
    },
    xAxis: {
      type: 'time',
      name: 'Date',
    },
    yAxis: {
        type: 'value',
        name: 'Rating',
    },
    series: [
        {
            name: 'Overall Rating',
            type: 'line',
            datasetId: 'dataset',
            smooth: true,
            showSymbol: false,
            encode: {
                x: 'timestamps',
                y: 'overallRating',
            }
        },
        {
            name: 'Naive Rating',
            type: 'line',
            datasetId: 'dataset',
            smooth: true,
            showSymbol: false,
            encode: {
                x: 'timestamps',
                y: 'naiveRating',
            }
        },
    ]
  };
  return <EChartsAutoSize option={options} />;
}
