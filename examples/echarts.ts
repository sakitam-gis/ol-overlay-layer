// @ts-ignore
import { Map } from 'ol';
// @ts-ignore
import * as echarts from 'echarts';
import { merge, isObject, arrayAdd } from './helper';
import formatGeoJSON from './coordinate/formatGeoJSON';
import getCoordinateSystem from './coordinate/RegisterCoordinateSystem';
import * as charts from './charts/index';
const _options = {
  forcedRerender: false, // Force re-rendering
  forcedPrecomposeRerender: false, // force pre re-render
  hideOnZooming: false, // when zooming hide chart
  hideOnMoving: false, // when moving hide chart
  hideOnRotating: false, // // when Rotating hide chart
  convertTypes: ['pie', 'line', 'bar'],
};

import OverlayLayer from '../';

class EChartsLayer extends OverlayLayer{
  static formatGeoJSON = formatGeoJSON;
  private readonly $options: object;
  private $chartOptions: object | undefined | null;
  private $chart: null | any;
  private _isRegistered: boolean;
  private _incremental: any[];
  private _coordinateSystem: null | any;
  constructor (chartOptions?: object, options: object = {}, map?: any) {
    super(options);
    /**
     * layer options
     * @type {{}}
     */
    this.$options = merge(_options, options);

    /**
     * chart options
     */
    this.$chartOptions = chartOptions;

    /**
     * chart instance
     * @type {null}
     */
    this.$chart = null;

    /**
     * Whether the relevant configuration has been registered
     * @type {boolean}
     * @private
     */
    this._isRegistered = false;

    /**
     * 增量数据存放
     * @type {Array}
     * @private
     */
    this._incremental = [];

    /**
     * coordinate system
     * @type {null}
     * @private
     */
    this._coordinateSystem = null;

    if (map) this.appendTo(map);
  }

  /**
   * append layer to map
   * @param map
   */
  appendTo (map: any) {
    if (map && map instanceof Map) {
      map.addOverlay(this);
    } else {
      throw new Error('not map object');
    }
  }

  /**
   * get echarts options
   */
  getChartOptions (): object | undefined | null {
    return this.$chartOptions;
  }

  /**
   * set echarts options and reRender
   * @param options
   * @returns {EChartsLayer}
   */
  setChartOptions (options: undefined | null | object = {}) {
    this.$chartOptions = options;
    return this;
  }

  /**
   * append data
   * @param data
   * @param save
   * @returns {EChartsLayer}
   */
  appendData (data: any, save: boolean | undefined | null = true) {
    if (data) {
      if (save) {
        this._incremental = arrayAdd(this._incremental, {
          data: data.data,
          seriesIndex: data.seriesIndex,
        });
      }
      // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/copyWithin
      this.$chart.appendData({
        data: data.data.copyWithin(),
        seriesIndex: data.seriesIndex,
      });
    }
    return this;
  }

  /**
   * clear layer
   */
  clear () {
    this._incremental = [];
    this.$chart.clear();
  }

  /**
   * is visible
   * @returns {Element|*|boolean}
   * @private
   */
  isVisible (): boolean {
    // @ts-ignore
    return this.rendered.visible;
  }

  /**
   * show layer
   */
  show () {
    super.setVisible(true);
  }

  /**
   * hide layer
   */
  hide () {
    super.setVisible(false);
  }

  /**
   * remove layer
   */
  remove () {
    this.$chart.clear();
    this.$chart.dispose();
    this._incremental = [];
    delete this.$chart;
  }

  /**
   * show loading bar
   */
  showLoading () {
    if (this.$chart) {
      this.$chart.showLoading();
    }
  }

  /**
   * hide loading bar
   */
  hideLoading () {
    if (this.$chart) {
      this.$chart.hideLoading();
    }
  }

  /**
   * render
   */
  render () {
    super.render();
    if (!this.$chart) {
      // @ts-ignore
      const element = this.getElement();
      this.$chart = echarts.init(element);
      if (this.$chartOptions) {
        this.registerMap();
        this.$chart.setOption(this.reConverData(this.$chartOptions), false);
      }
    } else if (this.isVisible()) {
      this.$chart.resize();
      this.reRender();
    }
  }

  /**
   * clear chart and redraw
   * @private
   */
  private clearAndRedraw () {
    if (!this.$chart || this.isVisible()) {
      return;
    }
    this.dispatchEvent({
      type: 'redraw',
      source: this,
    });
    // @ts-ignore
    if (this.$options.forcedRerender) {
      this.$chart.clear();
    }
    this.$chart.resize();
    if (this.$chartOptions) {
      this.registerMap();
      this.$chart.setOption(this.reConverData(this.$chartOptions), false);
      if (this._incremental && this._incremental.length > 0) {
        for (let i = 0; i < this._incremental.length; i++) {
          this.appendData(this._incremental[i], false);
        }
      }
    }
  }

  /**
   * register map coordinate system
   * @private
   */
  private registerMap () {
    if (!this._isRegistered) {
      echarts.registerCoordinateSystem('openlayers', getCoordinateSystem(this.getMap(), this.$options));
      this._isRegistered = true;
    }
    // @ts-ignore
    const series = this.$chartOptions && this.$chartOptions.series;
    if (series && isObject(series)) {
      // @ts-ignore
      const convertTypes = this.$options && this.$options.convertTypes;
      for (let i = series.length - 1; i >= 0; i--) {
        if (!(convertTypes.indexOf(series[i]['type']) > -1)) {
          series[i]['coordinateSystem'] = 'openlayers';
        }
        series[i]['animation'] = false;
      }
    }
  }

  /**
   * 重新处理数据
   * @param options
   * @returns {*}
   */
  private reConverData (options: object) {
    const series = options['series'];
    if (series && series.length > 0) {
      if (!this._coordinateSystem) {
        const _cs = getCoordinateSystem(this.getMap(), this.$options);
        this._coordinateSystem = new _cs();
      }
      if (series && isObject(series)) {
        // @ts-ignore
        const convertTypes = this.$options && this.$options.convertTypes;
        for (let i = series.length - 1; i >= 0; i--) {
          if (convertTypes.indexOf(series[i]['type']) > -1) {
            if (series[i] && series[i].hasOwnProperty('coordinates')) {
              series[i] = charts[series[i]['type']](options, series[i], this._coordinateSystem);
            }
          }
        }
      }
    }
    return options;
  }

  /**
   * re-render
   */
  private reRender () {
    this.clearAndRedraw();
  }
}

export default EChartsLayer;
