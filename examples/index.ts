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

const layer = new TileLayer({
  source: new OSM({
    url: 'https://cartodb-basemaps-{a-d}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
  }),
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

function getJSON(url: string, callback: any) {
  const xhr = new XMLHttpRequest();
  xhr.responseType = 'json';
  xhr.open('get', url, true);
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      callback(xhr.response);
    } else {
      throw new Error(xhr.statusText);
    }
  };
  xhr.send();
}

getJSON('./scatter.json', (res: any) => {
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
    const echartslayer = new EChartsLayer(option, {
      hideOnMoving: false,
      hideOnZooming: false,
      forcedPrecomposeRerender: true,
    });
    echartslayer.appendTo(map);
  }
});
