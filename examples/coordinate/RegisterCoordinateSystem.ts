/**
 * Created by FDD on 2017/5/30.
 * @desc 坐标系统
 */

// @ts-ignore
import * as echarts from 'echarts';
// @ts-ignore
import * as ol from 'openlayers';
import { map as $map, bind } from '../helper';

const getCoordinateSystem = function (
  map: any,
  options?: object) {

  class RegisterCoordinateSystem {
    public _mapOffset: number[];
    public dimensions: string[];
    public projCode: string;

    static dimensions = RegisterCoordinateSystem.prototype.dimensions || ['lng', 'lat'];

    static create = function (echartModel, api) {
      echartModel.eachSeries(function (seriesModel) {
        if (seriesModel.get('coordinateSystem') === 'openlayers') {
          seriesModel.coordinateSystem = new RegisterCoordinateSystem();
        }
      });
    };

    static dataToCoordSize = function (dataSize, dataItem) {
      dataItem = dataItem || [0, 0];
      // @ts-ignore
      return $map(
        [0, 1],
        function (dimIdx) {
          let val = dataItem[dimIdx];
          let halfSize = dataSize[dimIdx] / 2;
          let [p1, p2] = [[], []];
          p1[dimIdx] = val - halfSize;
          p2[dimIdx] = val + halfSize;
          p1[1 - dimIdx] = p2[1 - dimIdx] = dataItem[1 - dimIdx];
          return Math.abs(this.dataToPoint(p1)[dimIdx] - this.dataToPoint(p2)[dimIdx]);
        },
        this,
      );
    };

    constructor() {
      this._mapOffset = [0, 0];
      this.dimensions = ['lng', 'lat'];
      this.projCode = this.getProjectionCode();
    }

    /**
     * get zoom
     * @returns {number}
     */
    getZoom (): number {
      return map.getView().getZoom();
    }

    /**
     * set zoom
     * @param zoom
     */
    setZoom (zoom: number): void {
      return map.getView().setZoom(zoom);
    }

    getViewRectAfterRoam () {
      return this.getViewRect().clone();
    }

    /**
     * 设置地图窗口的偏移
     * @param mapOffset
     */
    setMapOffset (mapOffset: number[]): void {
      this._mapOffset = mapOffset;
    }

    /**
     * 跟据坐标转换成屏幕像素
     * @param coords
     * @returns {}
     */
    dataToPoint (coords: []): number[] {
      if (coords && Array.isArray(coords) && coords.length > 0) {
        coords = coords.map((item) => {
          if (typeof item === 'string') {
            item = Number(item);
          }
          return item;
        });
      }
      const source = options['source'] || 'EPSG:4326';
      const destination = options['destination'] || this.projCode_;
      const pixel = map.getPixelFromCoordinate(ol.proj.transform(coords, source, destination));
      const mapOffset = this._mapOffset;
      return [pixel[0] - mapOffset[0], pixel[1] - mapOffset[1]];
    }

    /**
     * 获取地图视图投影
     * @returns {string}
     * @private
     */
    getProjectionCode (): string {
      let code = '';
      if (map) {
        code =
          map.getView() &&
          map
            .getView()
            .getProjection()
            .getCode();
      } else {
        code = 'EPSG:3857';
      }
      return code;
    }

    /**
     * 跟据屏幕像素转换成坐标
     * @param pixel
     * @returns {}
     */
    pointToData (pixel: number[]): number[] {
      const mapOffset: number[] = this._mapOffset;
      return map.getCoordinateFromPixel([pixel[0] + mapOffset[0], pixel[1] + mapOffset[1]]);
    }

    /**
     * 获取视图矩形范围
     * @returns {*}
     */
    getViewRect () {
      const size = map.getSize();
      return new echarts.graphic.BoundingRect(0, 0, size[0], size[1]);
    }

    /**
     * create matrix
     */
    getRoamTransform () {
      return echarts.matrix.create();
    }

    /**
     * 处理自定义图表类型
     * @returns {{coordSys: {type: string, x, y, width, height}, api: {coord, size}}}
     */
    prepareCustoms () {
      const rect = this.getViewRect();
      return {
        coordSys: {
          // The name exposed to user is always 'cartesian2d' but not 'grid'.
          type: 'openlayers',
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        api: {
          coord: bind(this.dataToPoint, this),
          size: bind(RegisterCoordinateSystem.dataToCoordSize, this),
        },
      };
    }
  }

  return RegisterCoordinateSystem;
};

// @ts-ignore
export default getCoordinateSystem;
