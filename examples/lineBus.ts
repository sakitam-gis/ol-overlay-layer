// @ts-ignore
import Map from 'ol/Map';
// @ts-ignore
import View from 'ol/View';
// @ts-ignore
import TileLayer from 'ol/layer/Tile';
// @ts-ignore
import { fromLonLat } from 'ol/proj';
// @ts-ignore
import OSM from 'ol/source/OSM';

// @ts-ignore
import echarts from 'echarts';

// @ts-ignore
import EChartsLayer from './echarts';
import { getJSON } from './utils';

function initMap(id: string) {
  const layer = new TileLayer({
    source: new OSM({
      url: 'https://cartodb-basemaps-{a-d}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    }),
  });

  const map2 = new Map({
    layers: [layer],
    target: id,
    view: new View({
      center: fromLonLat([113.53450137499999, 34.44104525]),
      zoom: 2,
    }),
  });

  getJSON('./mock-data/lines-bus.json', (rawData: any) => {
    if (rawData) {
      const hStep = 300 / (rawData.length - 1);
      const busLines = [].concat.apply([], rawData.map((busLine: any, idx: any) => {
        let prevPt;
        const points = [];
        for (let i = 0; i < busLine.length; i += 2) {
          let pt = [busLine[i], busLine[i + 1]];
          if (i > 0) {
            // @ts-ignore
            pt = [prevPt[0] + pt[0], prevPt[1] + pt[1]];
          }
          prevPt = pt;

          points.push([pt[0] / 1e4, pt[1] / 1e4]);
        }
        return {
          coords: points,
          lineStyle: {
            normal: {
              color: echarts.color.modifyHSL('#5A94DF', Math.round(hStep * idx)),
            },
          },
        };
      }));

      const option = {
        series: [
          {
            type: 'lines',
            polyline: true,
            data: busLines,
            lineStyle: {
              normal: {
                width: 0,
              },
            },
            effect: {
              constantSpeed: 20,
              show: true,
              trailLength: 0.5,
              symbolSize: 1.5,
            },
            zlevel: 1,
          },
        ],
      };

      const echartslayer2 = new EChartsLayer(option, {
        id: '2',
      });

      map2.addOverlay(echartslayer2);

      console.log(echartslayer2);
      // echartslayer2.appendTo(map2);
    }
  });
}

if (document.getElementById('map-line-bus')) {
  initMap('map-line-bus');
}
