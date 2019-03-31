// @ts-ignore
import Overlay from 'ol/Overlay';
import {
  Size,
  Pixel,
  Coordinate,
  OverlayPositioning,
} from './Overlay';

class OverlayLayer extends Overlay {
  public element: HTMLElement | undefined;
  private _size: Size | undefined;
  constructor(options: object) {
    super(Object.assign(options, {
      stopEvent: false, // must be false
      offset: [0, 0],
    }));

    /**
     * size
     */
    this._size = undefined;
  }

  setMap (map: any): void {
    super.setMap(map);
  }

  /**
   * overwrite setOffset: must be [0, 0]
   * @param offset
   */
  setOffset(offset: number[] = [0, 0]) {
    super.setOffset(offset && [0, 0]);
  }

  /**
   * overwrite setPositioning: must be top-left
   * @param positioning
   */
  setPositioning(positioning: OverlayPositioning = 'top-left') {
    super.setPositioning(positioning && 'top-left');
  }

  panIntoView(){}

  /**
   * bind map update
   */
  render(): void {
    this.dispatchEvent({
      type: 'preupdate',
      value: this,
    });
    this.updatePixelPosition();
  }

  /**
   * overwrite getPosition method: top-left;
   */
  getPosition(): Coordinate | void {
    const map = this.getMap();
    if (!map) return;
    const size = map.getSize();
    const extent = map.getView().calculateExtent(size);
    return [extent[0], extent[3]];
  }

  /**
   * update view size
   * @param size
   */
  updateViewSize(size: Size): void {
    if (!this.element) return;
    this._size = size;
    this.element.style.width = `${size[0]}px`;
    this.element.style.height = `${size[1]}px`;
    this.element.setAttribute('width', String(size[0]));
    this.element.setAttribute('height', String(size[1]));
  }

  getPositioning(): OverlayPositioning {
    return 'top-left';
  }

  /**
   * update layer position, must be [0, 0]
   */
  updatePixelPosition(){
    const map = this.getMap();
    const position = this.getPosition();
    if (!map || !map.isRendered() || !position) {
      this.setVisible(false);
      return;
    }

    // const pixel = map.getPixelFromCoordinate(position);
    const mapSize = map.getSize();
    if (!this._size) {
      this.updateViewSize(mapSize);
    } else {
      const _update = this._size[0] === 0 || this._size[1] === 0
        || (this._size[0] !== mapSize[0] && this._size[1] !== mapSize[1]);
      _update && this.updateViewSize(mapSize);
    }
    this.updateRenderedPosition([0, 0], mapSize);
    this.dispatchEvent({
      type: 'updated',
      value: position,
    });
  }

  getMap() {
    return super.getMap();
  }

  setVisible(visible: Boolean): void {
    super.setVisible(visible);
    this.dispatchEvent({
      type: 'change:visible ',
      value: visible,
    });
  }

  // @ts-ignore
  dispatchEvent(...args) {
    super.dispatchEvent(...args);
  }

  updateRenderedPosition(pixel: Pixel, mapSize: Size): void {
    super.updateRenderedPosition(pixel, mapSize);
  }
}

export default OverlayLayer;
