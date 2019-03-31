/**
 * Created by FDD on 2017/5/30.
 * @desc 坐标系统
 */

// @ts-ignore
import * as echarts from 'echarts';
// @ts-ignore
import { transform } from 'ol/proj';
import { bind } from '../helper';

const getCoordinateSystem = function (
  map: any,
  options?: object) {

  class RegisterCoordinateSystem {
    public _mapOffset: number[];
    public dimensions: string[];
    public projCode: string;

    static dimensions = RegisterCoordinateSystem.prototype.dimensions || ['lng', 'lat'];

    static create (echartModel: any) {
      echartModel.eachSeries((seriesModel: any) => {
        if (seriesModel.get('coordinateSystem') === 'openlayers') {
          seriesModel.coordinateSystem = new RegisterCoordinateSystem();
        }
      });
    }

    static dataToCoordSize (dataSize: number[], dataItem: number[] = [0, 0]) {
      return echarts.util.map([0, 1], (dimIdx: number) => {
        const val = dataItem[dimIdx];
        const p1: number[] = [];
        const p2: number[] = [];
        const halfSize = dataSize[dimIdx] / 2;
        p1[dimIdx] = val - halfSize;
        p2[dimIdx] = val + halfSize;
        p1[1 - dimIdx] = p2[1 - dimIdx] = dataItem[1 - dimIdx];
        // @ts-ignore
        const offset: number = this.dataToPoint(p1)[dimIdx] - this.dataToPoint(p2)[dimIdx];
        return Math.abs(offset);
      },
        this,
      );
    }

    /**
     * 获取地图视图投影
     * @returns {string}
     * @private
     */
    static getProjectionCode (): string {
      let code: string = '';
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

    constructor() {
      this._mapOffset = [0, 0];
      this.dimensions = ['lng', 'lat'];
      this.projCode = RegisterCoordinateSystem.getProjectionCode();
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
     * @param data
     * @returns {}
     */
    dataToPoint (data: []): number[] {
      let coords;
      if (data && Array.isArray(data) && data.length > 0) {
        coords = data.map((item: string | number): number => {
          let res: number = 0;
          if (typeof item === 'string') {
            res = Number(item);
          }
          return res;
        });
      }
      const source = options && options['source'] || 'EPSG:4326';
      const destination = options && options['destination'] || this.projCode;
      const pixel = map.getPixelFromCoordinate(transform(coords, source, destination));
      const mapOffset = this._mapOffset;
      return [pixel[0] - mapOffset[0], pixel[1] - mapOffset[1]];
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
  // const RegisterCoordinateSystem = function () {
  //   this._mapOffset = [0, 0];
  //   this.dimensions = ['lng', 'lat'];
  //   this.projCode = RegisterCoordinateSystem.getProjectionCode();
  // };

  return RegisterCoordinateSystem;
};

export default getCoordinateSystem;
