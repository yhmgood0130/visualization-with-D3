var gender = "both";
var sumOfCountry = 0;
var lengthOfCountry = 0;
var isSameCountry = true;
var nameOfCountry = "";
var colors = [];
const IHME_CSV = "https://raw.githubusercontent.com/yhmgood0130/visualization-with-D3/master/assets/data/IHME_GBD_2013_OBESITY_PREVALENCE_1990_2013_Y2014M10D08.CSV";

$(document).ready(function(){
  d3.csv(IHME_CSV, function(err, data) {
    var config = {"data0":"location_name","data1":"mean",
                "label0":"label 0","label1":"label 1","color0":"#a7faad","color1":"#0d6613",
                "width":1024,"height":1024}

    var width = config.width,
        height = config.height;

    var COLOR_COUNTS = 9;

    function Interpolate(start, end, steps, count) {
        var s = start,
            e = end,
            final = s + (((e - s) / steps) * count);
        return Math.floor(final);
    }

    mapColor();

    var MAP_KEY = config.data0;
    var MAP_VALUE = config.data1;

    var projection = d3.geo.mercator()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / 2])
        .precision(.1);

    var path = d3.geo.path()
        .projection(projection);

    var graticule = d3.geo.graticule();

    var svg = d3.select("#canvas-svg").append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);

    var valueHash = {};

    function log10(val) {
      return Math.log(val);
    }

    loadingData();

    var quantize = d3.scale.quantize()
        .domain([0, 1.0])
        .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));

    getMap();

    d3.select(self.frameElement).style("height", (height * 2.3 / 3) + "px");

    function selectGenderOption(){
      $('#gender-change').on('change', function() {
        gender = this.value;
        loadingData();
        mapColor();
        colorChange();
      })
    }
    function loadingData(){
      data.forEach(function(d,i) {
        let sum = 0;
        i == 0 ? nameOfCountry = d[MAP_KEY] : null;
          if(nameOfCountry != d[MAP_KEY] || i == data.length - 1){
            sum = sumOfCountry / lengthOfCountry * 100;
            valueHash[nameOfCountry] = sum.toFixed(1);
            nameOfCountry = d[MAP_KEY];
            lengthOfCountry = 1;
            if(d.metric === "obese"){
              sumOfCountry = parseFloat(d[MAP_VALUE]);
            } else {
              sumOfCountry = 0;
            }
          }
          else if (d.sex === gender && d.metric === "obese"){
            lengthOfCountry++;
            sumOfCountry += parseFloat(d[MAP_VALUE]);
          }
      });
    }
    function mapColor(){
      var COLOR_FIRST, COLOR_LAST;
      switch(gender){
        case "both":
          COLOR_FIRST = "#cfffbd",
          COLOR_LAST = "#145725"
          break;
        case "male":
          COLOR_FIRST = "#bdd9ff",
          COLOR_LAST = "#141d57"
          break;
        case 'female':
          COLOR_FIRST = "#ffbdf7",
          COLOR_LAST = "#4e0a4f"
          break;
      }
      function Color(_r, _g, _b) {
          var r, g, b;
          var setColors = function(_r, _g, _b) {
              r = _r;
              g = _g;
              b = _b;
          };

          setColors(_r, _g, _b);
          this.getColors = function() {
              var colors = {
                  r: r,
                  g: g,
                  b: b
              };
              return colors;
          };
      }

      function hexToRgb(hex) {
          var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
          } : null;
      }

      var rgb = hexToRgb(COLOR_FIRST);

      var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);

      rgb = hexToRgb(COLOR_LAST);
      var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);

      var startColors = COLOR_START.getColors(),
          endColors = COLOR_END.getColors();

      colors = [];

      for (var i = 0; i < COLOR_COUNTS; i++) {
        var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
        var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
        var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
        colors.push(new Color(r, g, b));
      }
    }
    function colorChange(){
      d3.selectAll(".country").style("fill", function(d) {
            if (valueHash[d.properties.name]) {
              var c = quantize((valueHash[d.properties.name]));
              var color = colors[c].getColors();
              return "rgb(" + color.r + "," + color.g +
                  "," + color.b + ")";
            } else {
              return "#ccc";
            }
          })
    }
    function getMap(){
      quantize.domain([d3.min(data, function(d){
          return (+d[MAP_VALUE] * 100) }),
        d3.max(data, function(d){
          return (+d[MAP_VALUE] * 100) })]);
      d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/world-topo-min.json", function(error, world) {
        var countries = topojson.feature(world, world.objects.countries).features;
        countries.map((country,index) => {
          switch(country.properties.name){
            case "Russian Federation":
              countries[index].properties.name = "Russia"
              break;
            case "Bolivia, Plurinational State of":
              countries[index].properties.name = "Bolivia"
              break;
            case "Democratic Republic of Congo":
              countries[index].properties.name = "Democratic Republic of the Congo"
              break;
            case "Côte d'Ivoire":
              countries[index].properties.name = "Cote d'Ivoire"
              break;
            case "Viet Nam":
              countries[index].properties.name = "Vietnam"
              break;
            case "Lao People's Democratic Republic":
              countries[index].properties.name = "Laos"
              break;
            case "Syrian Arab Republic":
              countries[index].properties.name = "Syria"
              break;
            case "Viet Nam":
              countries[index].properties.name = "Vietnam"
              break;
          }
        })

        svg.append("path")
           .datum(graticule)
           .attr("class", "choropleth")
           .attr("d", path);

        var g = svg.append("g");

        g.append("path")
         .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
         .attr("class", "equator")
         .attr("d", path);

        var country = g.selectAll(".country").data(countries);

        country.enter().insert("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("id", function(d,i) { return d.id; })
            .attr("title", function(d) { return d.properties.name; })
            .style("fill", function(d) {
              if (valueHash[d.properties.name]) {
                var c = quantize((valueHash[d.properties.name]));
                var color = colors[c].getColors();
                return "rgb(" + color.r + "," + color.g +
                    "," + color.b + ")";
              } else {
                return "#ccc";
              }
            })
            .on("mousemove", function(d) {
                var html = "";

                html += "<div class=\"tooltip_kv\">";
                html += "<span class=\"tooltip_key\">";
                html += d.properties.name;
                html += "</span>";
                html += "<span class=\"tooltip_value\">";
                html += (valueHash[d.properties.name] ? valueHash[d.properties.name] + "%" : "");
                html += "";
                html += "</span>";
                html += "</div>";

                $("#tooltip-container").html(html);
                $(this).attr("fill-opacity", "0.8");
                $("#tooltip-container").show();

                var coordinates = d3.mouse(this);

                var map_width = $('.choropleth')[0].getBoundingClientRect().width;

                if (d3.event.pageX < map_width / 2) {
                  d3.select("#tooltip-container")
                    .style("top", (d3.event.layerY + 15) + "px")
                    .style("left", (d3.event.layerX + 15) + "px");
                } else {
                  var tooltip_width = $("#tooltip-container").width();
                  d3.select("#tooltip-container")
                    .style("top", (d3.event.layerY + 15) + "px")
                    .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
                }
            })
            .on("mouseout", function() {
                    $(this).attr("fill-opacity", "1.0");
                    $("#tooltip-container").hide();
                });

        g.append("path")
            .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
            .attr("class", "boundary")
            .attr("d", path);

            var zoom = d3.behavior.zoom()
                .scaleExtent([1, 50])
                .on("zoom", function() {
                  var e = d3.event,

                  tx = Math.min(0, Math.max(e.translate[0], width - width * e.scale)),
                  ty = Math.min(0, Math.max(e.translate[1], height - height * e.scale));

                  zoom.translate([tx, ty]);
                  g.attr("transform", [
                    "translate(" + [tx, ty] + ")",
                    "scale(" + e.scale + ")"
                  ].join(" "));
            });

        svg.call(zoom)

        svg.attr("height", config.height * 2.2 / 3);
      });
    }
    selectGenderOption();
  });

})
