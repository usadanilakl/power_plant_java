import { Component, computed, ElementRef, input, OnDestroy, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent, LegendComponent, TooltipComponent, DataZoomComponent,
  ToolboxComponent, TitleComponent, MarkLineComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { TrendSeries } from '../../models/trend/trend-series.model';

// Register only the modules we need (smaller bundle)
echarts.use([
  LineChart, GridComponent, LegendComponent, TooltipComponent,
  DataZoomComponent, ToolboxComponent, TitleComponent, MarkLineComponent,
  CanvasRenderer
]);

const PALETTE = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
  '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#5470c6'
];

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #chartContainer class="chart-container"></div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .chart-container { width: 100%; height: 100%; min-height: 300px; }
  `]
})
export class TrendChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

  series = input<TrendSeries[]>([]);
  title = input<string>('');
  showLegend = input<boolean>(true);
  showZoom = input<boolean>(true);

  private chart: echarts.ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      // Re-render when series change
      this.series();
      this.title();
      if (this.chart) {
        this.renderChart();
      }
    });
  }

  ngAfterViewInit(): void {
    this.chart = echarts.init(this.chartContainer.nativeElement);
    this.renderChart();

    // Auto-resize on container change
    this.resizeObserver = new ResizeObserver(() => {
      this.chart?.resize();
    });
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
    this.chart = null;
  }

  private renderChart(): void {
    if (!this.chart) return;

    const seriesList = this.series();
    if (!seriesList.length) {
      this.chart.clear();
      this.chart.setOption({
        title: {
          text: 'No data',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 14, fontWeight: 'normal' }
        }
      }, true);
      return;
    }

    // Group series by unit → assign Y axes (max 4)
    const unitToAxis = new Map<string, number>();
    let axisIndex = 0;
    for (const s of seriesList) {
      const unit = s.unit || '';
      if (!unitToAxis.has(unit) && axisIndex < 4) {
        unitToAxis.set(unit, axisIndex++);
      }
    }

    const yAxes = Array.from(unitToAxis.entries()).map(([unit, idx]) => ({
      type: 'value' as const,
      name: unit || 'Value',
      position: idx === 0 ? ('left' as const) : ('right' as const),
      offset: idx > 1 ? (idx - 1) * 60 : 0,
      nameTextStyle: { color: '#666' },
      axisLine: { lineStyle: { color: PALETTE[idx % PALETTE.length] } },
      splitLine: { show: idx === 0 }
    }));

    const echartSeries = seriesList.map((s, i) => {
      const axisIdx = unitToAxis.get(s.unit || '') ?? 0;
      return {
        name: s.label,
        type: 'line' as const,
        yAxisIndex: axisIdx,
        showSymbol: false,
        smooth: false,
        sampling: 'lttb' as const, // downsampling for performance
        lineStyle: { width: 1.5 },
        itemStyle: { color: s.color || PALETTE[i % PALETTE.length] },
        data: s.points.map(p => [
          typeof p.timestamp === 'string' ? new Date(p.timestamp).getTime() : p.timestamp.getTime(),
          p.value
        ])
      };
    });

    const option: any = {
      title: this.title() ? {
        text: this.title(),
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'normal' }
      } : undefined,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any[]) => {
          if (!params || !params.length) return '';
          const time = new Date(params[0].value[0]).toLocaleString();
          let html = `<div style="font-weight:600;margin-bottom:4px">${time}</div>`;
          for (const p of params) {
            const series = seriesList.find(s => s.label === p.seriesName);
            const unit = series?.unit ? ` ${series.unit}` : '';
            const value = p.value[1] != null ? p.value[1].toFixed(2) : 'N/A';
            html += `<div style="display:flex;justify-content:space-between;gap:12px">
              <span>${p.marker}${p.seriesName}</span>
              <span style="font-weight:600">${value}${unit}</span>
            </div>`;
          }
          return html;
        }
      },
      legend: this.showLegend() ? {
        data: seriesList.map(s => s.label),
        bottom: 0,
        type: 'scroll'
      } : undefined,
      grid: {
        left: 60,
        right: yAxes.length > 1 ? 60 + (yAxes.length - 2) * 60 : 30,
        top: this.title() ? 50 : 20,
        bottom: this.showLegend() ? 60 : 30
      },
      xAxis: {
        type: 'time',
        boundaryGap: false
      },
      yAxis: yAxes,
      dataZoom: this.showZoom() ? [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', start: 0, end: 100, height: 20, bottom: this.showLegend() ? 30 : 0 }
      ] : undefined,
      series: echartSeries
    };

    this.chart.setOption(option, true);
  }
}
