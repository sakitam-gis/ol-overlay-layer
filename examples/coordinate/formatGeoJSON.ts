/**
 * form https://github.com/ecomfe/echarts/blob/master/src/coord/geo/parseGeoJson.js
 */
// @ts-ignore
import * as echarts from 'echarts';
/**
 * check is decoded
 * @param json
 * @returns {boolean}
 */
const checkDecoded = (json: { UTF8Encoding: any; }) => {
  if (json.UTF8Encoding) {
    return false;
  }
  return true;
};

/**
 * decode json
 * @param json
 * @returns {*}
 */
const decode = (json: { UTF8Encoding: any; UTF8Scale?: any; features?: any; }) => {
  if (checkDecoded(json)) {
    return json;
  }
  let encodeScale = json.UTF8Scale;
  if (encodeScale == null) {
    encodeScale = 1024;
  }
  const features = json.features;
  for (let f = 0; f < features.length; f++) {
    const feature = features[f];
    const geometry = feature.geometry;
    const [coordinates, encodeOffsets] = [geometry.coordinates, geometry.encodeOffsets];
    for (let c = 0; c < coordinates.length; c++) {
      const coordinate = coordinates[c];
      if (geometry.type === 'Polygon') {
        coordinates[c] = decodePolygon(coordinate, encodeOffsets[c], encodeScale);
      } else if (geometry.type === 'MultiPolygon') {
        for (let c2 = 0; c2 < coordinate.length; c2++) {
          const polygon = coordinate[c2];
          coordinate[c2] = decodePolygon(polygon, encodeOffsets[c][c2], encodeScale);
        }
      }
    }
  }
  // Has been decoded
  json.UTF8Encoding = false;
  return json;
};

/**
 * decode polygon
 * @param coordinate
 * @param encodeOffsets
 * @param encodeScale
 * @returns {null}
 */
const decodePolygon = (
  coordinate: { length: number; charCodeAt: { (arg0: number): number; (arg0: number): number; }; },
  encodeOffsets: any[], encodeScale: number) => {
  const result = [];
  let [prevX, prevY] = [encodeOffsets[0], encodeOffsets[1]];
  for (let i = 0; i < coordinate.length; i += 2) {
    let x = coordinate.charCodeAt(i) - 64;
    let y = coordinate.charCodeAt(i + 1) - 64;
    // ZigZag decoding
    x = (x >> 1) ^ -(x & 1);
    y = (y >> 1) ^ -(y & 1);
    // Delta deocding
    x += prevX;
    y += prevY;
    prevX = x;
    prevY = y;
    // @ts-ignore
    result.push([x / encodeScale, y / encodeScale]);
  }
  return result;
};

/**
 * decode geoJson
 * @param json
 */
export default function (json: { UTF8Encoding: any; UTF8Scale?: any; features?: any; }) {
  const geoJson = decode(json);
  const _features = echarts.util.map(
    echarts.util.filter(geoJson.features,
      (featureObj: { geometry: { coordinates: { length: number; }; }; properties: any; }) => {
        // Output of mapshaper may have geometry null
        return featureObj.geometry && featureObj.properties && featureObj.geometry.coordinates.length > 0;
      }),
    (featureObj: { properties: any; geometry: any; }) => {
      const properties = featureObj.properties;
      const geo = featureObj.geometry;
      const coordinates = geo.coordinates;
      const geometries = [];
      if (geo.type === 'Polygon') {
        geometries.push(coordinates[0]);
      }
      if (geo.type === 'MultiPolygon') {
        echarts.util.each(coordinates, (item: any[]) => {
          if (item[0]) {
            geometries.push(item[0]);
          }
        });
      }
      return {
        properties,
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: geometries,
        },
      };
    },
  );
  return {
    type: 'FeatureCollection',
    crs: {},
    features: _features,
  };
}
