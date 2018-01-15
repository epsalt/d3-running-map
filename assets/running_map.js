/*global
  d3, window
*/

var config = {
    "scale": 17,
    "lat": 51.0375,
    "lon": -114.09,
    "fps": 15,
    "resampleInterval": 30
};

var canvas = document.querySelector("canvas"),
    context = canvas.getContext("2d"),
    detachedContainer = document.createElement("custom"),
    dataContainer = d3.select(detachedContainer),
    width = canvas.width,
    height = canvas.height;

var projection = d3.geoMercator()
    .scale((1 << 17) / 2 * Math.PI)
    .translate([width / 2, height / 2])
    .center([config.lon, config.lat])
    .precision(0);

var path = d3.geoPath()
    .projection(projection)
    .pointRadius(3.5)
    .context(context);

var tiles = d3.tile()
    .size([width, height])
    .scale(projection.scale() * 2 * Math.PI)
    .translate(projection([0, 0]))();

var playButton = d3.select("#play-button"),
    restartButton = d3.select("#restart-button"),
    timer = d3.select("#timer");

d3.select("svg").selectAll("image")
    .data(tiles)
    .enter().append("image")
    .attr("xlink:href", function (d) { return "http://" + "abc"[d[1] % 3] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
    .attr("x", function (d) { return (d[0] + tiles.translate[0]) * tiles.scale; })
    .attr("y", function (d) { return (d[1] + tiles.translate[1]) * tiles.scale; })
    .attr("width", tiles.scale)
    .attr("height", tiles.scale);

d3.csv("assets/activity_data.csv", function (error, data) {
    if (error) { throw error; }

    data = data.map(function (d) { return [+d.lon, +d.lat, +d.index, +d.len]; });

    var nested = d3.nest()
        .key(function (d) { return d[2]; })
        .entries(data);

    var tracks = dataContainer.selectAll("custom.geoPath")
        .data(nested)
        .enter()
        .append("custom")
        .classed("geoPath", true)
        .attr("strokeStyle", "rgba(74,20,134,0.2)")
        .attr("lineWidth", 3);

    var runners = dataContainer.selectAll("custom.circle")
        .data(nested)
        .enter()
        .append("custom")
        .classed("circle", true)
        .attr("lineWidth", 1)
        .attr("radius", 2)
        .attr("strokeStyle", "black");

    var maxElapsed = Math.max.apply(Math, (data.map(function (d) { return d[3]; })));

    var interval = 1000 / config.fps,
        t = 0,
        going = true,
        pct,
        time;

    function drawCanvas() {
        context.clearRect(0, 0, width, height);

        tracks.each(function () {
            var node = d3.select(this);

            context.strokeStyle = node.attr("strokeStyle");
            context.lineWidth = node.attr("lineWidth");
            context.beginPath();
            path({type: "LineString", coordinates: node.data()[0].values.slice(0, node.attr("t"))});
            context.stroke();
        });

        runners.each(function () {
            var node = d3.select(this);

            context.lineWidth = node.attr("lineWidth");
            context.strokeStyle = node.attr("strokeStyle");
            context.beginPath();
            context.arc(node.attr("x"), node.attr("y"), node.attr("radius"), 0, 2 * Math.PI);
            context.stroke();

        });

    }

    var coord_slicer = function (d, t) {
        return projection(d.values[Math.min(t, d.values[0][3] - 1)]);
    };

    function step(t) {

        runners
            .attr("x", function (d) { return coord_slicer(d, t)[0]; })
            .attr("y", function (d) { return coord_slicer(d, t)[1]; });

        tracks
            .attr("t", t);

        time = new Date(null);
        time.setSeconds(t * config.resampleInterval);
        time = time.toISOString().substr(11, 5);
        pct = (t / maxElapsed * 100).toFixed(0);
        if (pct.length === 1) { pct = "0" + pct; }

        timer.text("Elapsed: " + time + "/" + pct + "%");

        drawCanvas();
    }

    d3.interval(function () {
        if (t > maxElapsed) { t = 0; }
        if (going) {
            step(t);
            t++;
        }
    }, interval);

    function pauseResume() {
        if (going) {
            playButton.text("Resume");
            going = false;
        } else {
            playButton.text("Pause");
            going = true;
        }
    }

    function restart() {
        t = 0;
        step(t);
    }

    playButton.on("click", pauseResume);
    restartButton.on("click", restart);

});
