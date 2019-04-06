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
import EChartsLayer from './echarts';
import { getJSON } from './utils';

function initMap() {
  const layer = new TileLayer({
    source: new OSM({
      url: 'https://cartodb-basemaps-{a-d}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    }),
  });

  const map1 = new Map({
    layers: [layer],
    target: 'map1',
    view: new View({
      projection: 'EPSG:4326',
      center: [113.53450137499999, 34.44104525],
      zoom: 2,
    }),
  });

  const map2 = new Map({
    layers: [layer],
    target: 'map2',
    view: new View({
      center: fromLonLat([113.53450137499999, 34.44104525]),
      zoom: 2,
    }),
  });

  getJSON('./mock-data/scatter.json', (res: any) => {
    if (res) {
      const data = res.locations;
      const geoCoordMap = res.coordinates;
      const convertData = function (data: any[]) {
        const res = [];
        for (let i = 0; i < data.length; i++) {
          const geoCoord = geoCoordMap[data[i].name];
          if (geoCoord) {
            res.push({
              name: data[i].name,
              value: geoCoord.concat(data[i].value),
            });
          }
        }
        return res;
      };
      const option = {
        title: {
          text: '全国主要城市空气质量',
          subtext: 'data from PM25.in',
          sublink: 'http://www.pm25.in',
          left: 'center',
          textStyle: {
            color: '#fff',
          },
        },
        tooltip: {
          trigger: 'item',
        },
        openlayers: {},
        legend: {
          orient: 'vertical',
          y: 'top',
          x: 'right',
          data: ['pm2.5'],
          textStyle: {
            color: '#fff',
          },
        },
        series: [
          {
            name: 'pm2.5',
            type: 'scatter',
            data: convertData(data),
            symbolSize (val: any[]) {
              return val[2] / 10;
            },
            label: {
              normal: {
                formatter: '{b}',
                position: 'right',
                show: false,
              },
              emphasis: {
                show: true,
              },
            },
            itemStyle: {
              normal: {
                color: '#ddb926',
              },
            },
          },
          {
            name: 'Top 5',
            type: 'effectScatter',
            data: convertData(data.sort((a: {
              value: number;
            },                           b: {
              value: number;
            }) => {
              return b.value - a.value;
            }).slice(0, 6)),
            symbolSize (val: any[]) {
              return val[2] / 10;
            },
            showEffectOn: 'render',
            rippleEffect: {
              brushType: 'stroke',
            },
            hoverAnimation: true,
            label: {
              normal: {
                formatter: '{b}',
                position: 'right',
                show: true,
              },
            },
            itemStyle: {
              normal: {
                color: '#f4e925',
                shadowBlur: 10,
                shadowColor: '#333',
              },
            },
            zlevel: 1,
          }],
      };
      const echartslayer1 = new EChartsLayer(option, {
        id: '1',
        hideOnMoving: false,
        hideOnZooming: false,
        forcedPrecomposeRerender: true,
      });

      const echartslayer2 = new EChartsLayer(option, {
        id: '2',
        hideOnMoving: false,
        hideOnZooming: false,
        forcedPrecomposeRerender: true,
      });
      map1.addOverlay(echartslayer1);
      map2.addOverlay(echartslayer2);

      console.log(echartslayer1, echartslayer2);
      // echartslayer1.appendTo(map1);
      // echartslayer2.appendTo(map2);
    }
  });
}

if (document.getElementById('map1') && document.getElementById('map2')) {
  initMap();
}
