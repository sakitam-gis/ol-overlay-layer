/**
 * 判断是否为对象
 * @param value
 * @returns {boolean}
 */
const isObject = (value: any): boolean => {
  const type = typeof value;
  return value !== null && (type === 'object' || type === 'function');
};

/**
 * merge
 * @param a
 * @param b
 * @returns {*}
 */
const merge = (a: any, b: any): any => {
  for (const key in b) {
    if (isObject(b[key]) && isObject(a[key])) {
      merge(a[key], b[key]);
    } else {
      a[key] = b[key];
    }
  }
  return a;
};

/**
 * bind context
 * @param func
 * @param context
 */
const bind = function (func: Function, context: any): Function {
  const args = Array.prototype.slice.call(arguments, 2);
  return function () {
    return func.apply(context, args.concat(Array.prototype.slice.call(arguments)));
  };
};

/**
 * add own item
 * @param array
 * @param item
 */
const arrayAdd = function (array: any[], item: any): any[] {
  let i = 0;
  let index;
  const length = array.length;
  for (; i < length; i++) {
    if (array[i]['seriesIndex'] === item['seriesIndex']) {
      index = i;
    }
  }
  if (index === undefined) {
    array.push(item);
  } else {
    array[index] = item;
  }
  return array;
};

export { merge, isObject, bind, arrayAdd };
