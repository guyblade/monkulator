var small_bar_grapher = (function() {

  let default_args = {
    "width": 120,
    "height": 120,
    "bar_spacing": 3,
    "max_y": null,
    "bar_color": "blueviolet",
    "text_color": "black"
  };

  let combine_args = function(data, args) {
    let ret = {};
    Object.keys(default_args).forEach(function(key) {
      if (key in args) {
        ret[key] = args[key];
      } else {
        ret[key] = default_args[key];
      }
    });
    if (ret.max_y == null) {
      Object.keys(data).forEach(function(key) {
        if (ret.max_y == null) {
          ret.max_y = data[key];
        }
        if (ret.max_y < data[key]) {
          ret.max_y = data[key];
        }
      });
    }
    return ret;
  }

  let max_text_height = function(data, context) {
    let max = 0;
    Object.keys(data).forEach(function(key) {
      let h = context.measureText("" + key);
      h = h.fontBoundingBoxDescent + h.fontBoundingBoxAscent;
      if (h > max) {
        max = h;
      }
    });
    return max;
  }

  let is_numeric_string = (function() {
    let numeric = /^\d+$/;
    return function(t) {
      return t.match(numeric);
    };
  })();

  let key_sorter = function(a, b) {
    if (typeof a == typeof b) {
      if (typeof a == "number") {
        return a - b;
      }
      if (typeof a == "string") {
        if (is_numeric_string(a) && is_numeric_string(b)) {
          return parseInt(a) - parseInt(b);
        }
        if (is_numeric_string(a)) {
          return -1;
        }
        if (is_numeric_string(b)) {
          return 1;
        }
        return a.localeCompare(b);
      }
      return 0;
    }
    if (typeof a == "number") {
      return -1;
    }
    return 1;
  };

  let draw_bar_graph = function(data, args) {
    args = combine_args(data, args);
    console.log(args);
    let ret = $("<canvas width='" + args.width + "' height='" + args.height + "'></canvas>")
    let ctx = ret[0].getContext('2d');
    let text_start = args.height - 2 - max_text_height(data, ctx);
    let text_baseline = text_start + max_text_height(data, ctx);
    let bar_max_top = 2;
    let bar_bottom = text_start + 2;
    let bars = Object.keys(data);
    bars.sort(key_sorter);
    let usable_width = args.width
                       - 10 /* left axis label */
                       - (bars.length - 1) * args.bar_spacing; 
    let bar_width = usable_width / bars.length;
    for(let i = 0; i < bars.length; ++i) {
      let k = bars[i];
      let left = 10 + i * args.bar_spacing + i * bar_width;
      let bar_height = (bar_bottom - bar_max_top) * data[k] / args.max_y;
      ctx.fillStyle = args.bar_color;
      //console.log(data[i], args.max_y);
      //console.log(left, bar_bottom, bar_width, -bar_height);
      ctx.fillRect(left, bar_bottom, bar_width, -bar_height);
      ctx.fillStyle = args.text_color;
      // Center the text, maybe
      let text_left = left + bar_width / 2 - ctx.measureText(k).width / 2;
      ctx.fillText(k, Math.max(left, text_left), text_baseline, bar_width);
    }

    return ret;
  };

  let ret = {
    'draw_bar_graph': draw_bar_graph
  };
  return ret;
})();
