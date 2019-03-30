// @ts-ignore
import * as echarts from 'echarts';
import { getTarget, merge, isObject, map, bind, arrayAdd } from './helper';
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
  static getTarget = getTarget;
  static merge = merge;
  static map = map;
  static bind = bind;
  static formatGeoJSON = formatGeoJSON;
  constructor (chartOptions, options = {}, map) {
    super();
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
     * map
     * @type {null}
     */
    this.$Map = null;

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
  appendTo (map) {
    if (map && map instanceof Map) {
      this.$Map = map;
      this.$Map.once('postrender', (event) => {
        this.render();
      });
      this.$Map.renderSync();
      this._unRegisterEvents();
      this._registerEvents();
    } else {
      throw new Error('not map object');
    }
  }

  /**
   * get echarts options
   * @returns {*}
   */
  getChartOptions () {
    return this.$chartOptions;
  }

  /**
   * set echarts options and reRender
   * @param options
   * @returns {ol3Echarts}
   */
  setChartOptions (options = {}) {
    this.$chartOptions = options;
    this.$Map.once('postrender', (event) => {
      this.render();
    });
    this.$Map.renderSync();
    return this;
  }

  /**
   * append data
   * @param data
   * @param save
   * @returns {EChartsLayer}
   */
  appendData (data, save = true) {
    if (data) {
      if (save) {
        this._incremental = arrayAdd(this._incremental, {
          data: data.data,
          seriesIndex: data.seriesIndex
        });
      }
      // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/copyWithin
      this.$chart.appendData({
        data: data.data.copyWithin(),
        seriesIndex: data.seriesIndex
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
   * get map
   * @returns {null}
   */
  getMap () {
    return this.$Map;
  }

  /**
   * is visible
   * @returns {Element|*|boolean}
   * @private
   */
  _isVisible () {
    return this.$container && this.$container.style.display === '';
  }

  /**
   * show layer
   */
  show () {
    if (this.$container) {
      this.$container.style.display = '';
    }
  }

  /**
   * hide layer
   */
  hide () {
    if (this.$container) {
      this.$container.style.display = 'none';
    }
  }

  /**
   * remove layer
   */
  remove () {
    this.$chart.clear();
    this.$chart.dispose();
    this._unRegisterEvents();
    this._incremental = [];
    delete this.$chart;
    delete this.$Map;
    this.$container.parentNode.removeChild(this.$container);
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
   * creat eclayer container
   * @param map
   * @param options
   * @private
   */
  _createLayerContainer (map, options) {
    const viewPort = map.getViewport()
    const container = (this.$container = document.createElement('div'));
    container.style.position = 'absolute';
    container.style.top = '0px';
    container.style.left = '0px';
    container.style.right = '0px';
    container.style.bottom = '0px';
    let _target = getTarget(options['target'], viewPort);
    if (_target && _target[0] && _target[0] instanceof Element) {
      _target[0].appendChild(container);
    } else {
      let _target = getTarget('.ol-overlaycontainer', viewPort);
      if (_target && _target[0] && _target[0] instanceof Element) {
        _target[0].appendChild(container);
      } else {
        viewPort.appendChild(container);
      }
    }
  }

  /**
   * Reset the container size
   * @private
   */
  _resizeContainer () {
    const size = this.getMap().getSize();
    this.$container.style.height = size[1] + 'px';
    this.$container.style.width = size[0] + 'px';
  }

  /**
   * clear chart and redraw
   * @private
   */
  _clearAndRedraw () {
    if (!this.$chart || (this.$container && this.$container.style.display === 'none')) {
      return;
    }
    this.dispatchEvent({
      type: 'redraw',
      source: this
    });
    if (this.$options.forcedRerender) {
      this.$chart.clear();
    }
    this.$chart.resize();
    if (this.$chartOptions) {
      this._registerMap();
      this.$chart.setOption(this.reConverData(this.$chartOptions), false);
      if (this._incremental && this._incremental.length > 0) {
        for (let i = 0; i < this._incremental.length; i++) {
          this.appendData(this._incremental[i], false);
        }
      }
    }
  }

  /**
   * handle map resize
   */
  onResize () {
    this._resizeContainer();
    this._clearAndRedraw();
    this.dispatchEvent({
      type: 'change:size',
      source: this
    });
  }

  /**
   * handle zoom end events
   */
  onZoomEnd () {
    this.$options['hideOnZooming'] && this.show();
    this._clearAndRedraw();
    this.dispatchEvent({
      type: 'zoomend',
      source: this
    });
  }

  /**
   * handle rotate end events
   */
  onDragRotateEnd () {
    this.$options['hideOnRotating'] && this.show();
    this._clearAndRedraw();
    this.dispatchEvent({
      type: 'change:rotation',
      source: this
    });
  }

  /**
   * handle move start events
   */
  onMoveStart () {
    this.$options['hideOnMoving'] && this.hide();
    this.dispatchEvent({
      type: 'movestart',
      source: this
    });
  }

  /**
   * handle move end events
   */
  onMoveEnd () {
    this.$options['hideOnMoving'] && this.show();
    this._clearAndRedraw();
    this.dispatchEvent({
      type: 'moveend',
      source: this
    });
  }

  /**
   * handle center change
   * @param event
   */
  onCenterChange (event) {
    this._clearAndRedraw();
    this.dispatchEvent({
      type: 'change:center',
      source: this
    });
  }

  /**
   * register events
   * @private
   */
  _registerEvents () {
    // https://github.com/openlayers/openlayers/issues/7284
    const Map = this.$Map;
    const view = Map.getView();
    if (this.$options.forcedPrecomposeRerender) {
      this.precomposeListener_ = Map.on('precompose', this.reRender.bind(this));
    }
    this.sizeChangeListener_ = Map.on('change:size', this.onResize.bind(this));
    this.resolutionListener_ = view.on('change:resolution', this.onZoomEnd.bind(this));
    this.centerChangeListener_ = view.on('change:center', this.onCenterChange.bind(this));
    this.rotationListener_ = view.on('change:rotation', this.onDragRotateEnd.bind(this));
    this.movestartListener_ = Map.on('movestart', this.onMoveStart.bind(this));
    this.moveendListener_ = Map.on('moveend', this.onMoveEnd.bind(this));
  }

  /**
   * un register events
   * @private
   */
  _unRegisterEvents () {
    // const Map = this.$Map;
    // const view = Map.getView();
    unByKey(this.sizeChangeListener_);
    // Map.un('change:size', this.onResize.bind(this));
    if (this.$options.forcedPrecomposeRerender) {
      unByKey(this.precomposeListener_);
      // Map.un('precompose', this.reRender.bind(this));
    }
    unByKey(this.resolutionListener_);
    unByKey(this.centerChangeListener_);
    unByKey(this.rotationListener_);
    unByKey(this.movestartListener_);
    unByKey(this.moveendListener_);
    this.sizeChangeListener_ = null;
    this.precomposeListener_ = null;
    this.sizeChangeListener_ = null;
    this.resolutionListener_ = null;
    this.centerChangeListener_ = null;
    this.rotationListener_ = null;
    this.movestartListener_ = null;
    this.moveendListener_ = null;
    // view.un('change:resolution', this.onZoomEnd.bind(this));
    // view.un('change:center', this.onCenterChange.bind(this));
    // view.un('change:rotation', this.onDragRotateEnd.bind(this));
    // Map.un('movestart', this.onMoveStart.bind(this));
    // Map.un('moveend', this.onMoveEnd.bind(this));
  }

  /**
   * register map coordinate system
   * @private
   */
  _registerMap () {
    if (!this._isRegistered) {
      echarts.registerCoordinateSystem('openlayers', _getCoordinateSystem(this.getMap(), this.$options));
      this._isRegistered = true;
    }
    const series = this.$chartOptions.series;
    if (series && isObject(series)) {
      for (let i = series.length - 1; i >= 0; i--) {
        if (!(this.$options.convertTypes.indexOf(series[i]['type']) > -1)) {
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
  reConverData (options) {
    let series = options['series'];
    if (series && series.length > 0) {
      if (!this._coordinateSystem) {
        let _cs = _getCoordinateSystem(this.getMap(), this.$options);
        this._coordinateSystem = new _cs();
      }
      if (series && isObject(series)) {
        for (let i = series.length - 1; i >= 0; i--) {
          if (this.$options.convertTypes.indexOf(series[i]['type']) > -1) {
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
   * render
   */
  render () {
    if (!this.$container) {
      this._createLayerContainer(this.$Map, this.$options);
      this._resizeContainer();
    }
    if (!this.$chart) {
      this.$chart = echarts.init(this.$container);
      if (this.$chartOptions) {
        this._registerMap();
        this.$chart.setOption(this.reConverData(this.$chartOptions), false);
      }
    } else if (this._isVisible()) {
      this.$chart.resize();
      this.reRender();
    }
  }

  /**
   * re-render
   */
  reRender () {
    this._clearAndRedraw();
  }
}
