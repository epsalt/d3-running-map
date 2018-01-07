/*global
  d3, window
*/

var pi = Math.PI,
    tau = 2 * pi;

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var projection = d3.geoMercator()
    .scale((1 << 20) / tau)
    .translate([width / 2, height / 2])
    .center([-114.09, 51.0375])
    .precision(0);

var path = d3.geoPath()
    .projection(projection)
    .pointRadius(3.5);

var tiles = d3.tile()
    .size([width, height])
    .scale(projection.scale() * tau)
    .translate(projection([0, 0]))();

d3.csv("activity_data.csv", function (error, data) {
    if (error) { throw error; }

    data = data.map(function (d) { return [+d.lon, +d.lat, +d.index, +d.len]; });

    var nested = d3.nest()
        .key(function (d) { return d[2]; })
        .entries(data);

    var maxElapsed = Math.max.apply(Math, (data.map(function (d) { return d[3]; })));

    var x = d3.scaleLinear()
        .domain([0, maxElapsed])
        .range([0, 95]);

    var interval = 50,
        t = 0,
        going = true,
        date;

    function draw(t) {
        tracks.attr("d", function (d) { return path({type: "LineString", coordinates: d.values.slice(0, t)}); });
        runners.attr("transform", function (d) { return "translate(" + projection(d.values[Math.min(t, d.values[0][3] - 1)]) + ")"; });

        svg.select(".progress")
            .attr("cx", x(t));

        date = new Date(null);
        date.setSeconds(t * 30);

        svg.select("#elapsed")
            .text("Elapsed: " + date.toISOString().substr(11, 5));
    }

    d3.interval(function() {
        if (t > maxElapsed) t = 0;
        if (going) {
            draw(t);
            t++;
        }
    }, interval);

    function pauseResume() {
        if (going) {
            svg.select("#pause-resume")
                .text("Resume");
            going = false;
        } else {
            svg.select("#pause-resume")
                .text("Pause");
            going = true;
        }
    }

    function restart() {
        t = 0;
        draw(t);
    }

    // OSM Map Tiles
    svg.selectAll("image")
        .data(tiles)
        .enter().append("image")
        .attr("xlink:href", function (d) { return "http://" + "abc"[d[1] % 3] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
        .attr("x", function (d) { return (d[0] + tiles.translate[0]) * tiles.scale; })
        .attr("y", function (d) { return (d[1] + tiles.translate[1]) * tiles.scale; })
        .attr("width", tiles.scale)
        .attr("height", tiles.scale);

    var tracks = svg.selectAll("path")
        .data(nested)
        .enter().append("path");

    var runners = svg.selectAll(".runner")
        .data(nested)
        .enter().append("g")
        .attr("class", "runner");

    runners.append("circle")
        .attr("r", 2);

    // Legend Elements
    svg.append("rect")
        .attr("x", width - 130)
        .attr("y", height - 65)
        .attr("width", 120)
        .attr("height", 60)
        .attr("class", "legend-outline");

    svg.append("text")
        .attr("x", width - 122.5)
        .attr("y", height - 47.5)
        .attr("class", "legend")
        .attr("id", "elapsed")
        .text("Elapsed: 00:00");

    svg.append("rect")
        .attr("x", width - 122.5)
        .attr("y", height - 37.5)
        .attr("height", 5)
        .attr("width", 100)
        .attr("class", "progress-bar");

    svg.append("circle")
        .attr("class", "progress")
        .attr("cy", height - 35)
        .attr("transform", "translate(" + (width - 120) + " , 0)")
        .attr("r", 2)
        .attr("fill", "red");

    svg.append("text")
        .attr("x", width - 122.5)
        .attr("y", height - 15)
        .attr("class", "legend")
        .attr("id", "pause-resume")
        .text("Pause")
        .on("click", function () { pauseResume(); });

    svg.append("text")
        .attr("x", width - 70)
        .attr("y", height - 15)
        .attr("class", "legend")
        .text("Restart")
        .on("click", function () { restart(); });
});
