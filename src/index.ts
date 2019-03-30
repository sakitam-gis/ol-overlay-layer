// @ts-ignore
import Overlay from 'ol/Overlay';
import {
  Size,
  Pixel,
  Coordinate,
  OverlayPositioning,
} from './Overlay';

class OverlayLayer extends Overlay {
  constructor(options: object) {
    super(options);
  }

  panIntoView(){}

  /**
   * overwrite getPosition method: top-left;
   */
  getPosition(): Coordinate {
    const map = this.getMap();
    const size = map.getSize();
    const extent = map.getView().calculateExtent(size);
    return [extent[0], extent[3]];
  }

  getPositioning(): OverlayPositioning {
    return 'top-left';
  }

  updatePixelPosition(){
    const map = this.getMap();
    const position = this.getPosition();
    if (!map || !map.isRendered() || !position) {
      this.setVisible(false);
      return;
    }

    const pixel = map.getPixelFromCoordinate(position);
    const mapSize = map.getSize();
    this.updateRenderedPosition(pixel, mapSize);
  }

  // updateRenderedPosition (pixel, mapSize) {
  //   var style = this.element.style;
  //   var offset = this.getOffset();
  //
  //   var positioning = this.getPositioning();
  //
  //   this.setVisible(true);
  //
  //   var offsetX = offset[0];
  //   var offsetY = offset[1];
  //   if (positioning == OverlayPositioning.BOTTOM_RIGHT ||
  //     positioning == OverlayPositioning.CENTER_RIGHT ||
  //     positioning == OverlayPositioning.TOP_RIGHT) {
  //     if (this.rendered.left_ !== '') {
  //       this.rendered.left_ = style.left = '';
  //     }
  //     var right = Math.round(mapSize[0] - pixel[0] - offsetX) + 'px';
  //     if (this.rendered.right_ != right) {
  //       this.rendered.right_ = style.right = right;
  //     }
  //   } else {
  //     if (this.rendered.right_ !== '') {
  //       this.rendered.right_ = style.right = '';
  //     }
  //     if (positioning == OverlayPositioning.BOTTOM_CENTER ||
  //       positioning == OverlayPositioning.CENTER_CENTER ||
  //       positioning == OverlayPositioning.TOP_CENTER) {
  //       offsetX -= this.element.offsetWidth / 2;
  //     }
  //     var left = Math.round(pixel[0] + offsetX) + 'px';
  //     if (this.rendered.left_ != left) {
  //       this.rendered.left_ = style.left = left;
  //     }
  //   }
  //   if (positioning == OverlayPositioning.BOTTOM_LEFT ||
  //     positioning == OverlayPositioning.BOTTOM_CENTER ||
  //     positioning == OverlayPositioning.BOTTOM_RIGHT) {
  //     if (this.rendered.top_ !== '') {
  //       this.rendered.top_ = style.top = '';
  //     }
  //     var bottom = Math.round(mapSize[1] - pixel[1] - offsetY) + 'px';
  //     if (this.rendered.bottom_ != bottom) {
  //       this.rendered.bottom_ = style.bottom = bottom;
  //     }
  //   } else {
  //     if (this.rendered.bottom_ !== '') {
  //       this.rendered.bottom_ = style.bottom = '';
  //     }
  //     if (positioning == OverlayPositioning.CENTER_LEFT ||
  //       positioning == OverlayPositioning.CENTER_CENTER ||
  //       positioning == OverlayPositioning.CENTER_RIGHT) {
  //       offsetY -= this.element.offsetHeight / 2;
  //     }
  //     var top = Math.round(pixel[1] + offsetY) + 'px';
  //     if (this.rendered.top_ != top) {
  //       this.rendered.top_ = style.top = top;
  //     }
  //   }
  // };

  getMap() {
    return super.getMap();
  }

  setVisible(visible: Boolean): void {
    super.setVisible(visible);
  }

  updateRenderedPosition(pixel: Pixel, mapSize: Size): void {
    super.updateRenderedPosition(pixel, mapSize);
  }
}

export default OverlayLayer;
