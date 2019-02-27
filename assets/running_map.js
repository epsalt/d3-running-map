/*global d3, window */

var config = {
    "scale": 98304,
    "lat": 51.0375,
    "lon": -114.09,
    "fps": 15,
    "resampleInterval": 30
};

var canvasPoints = document.querySelector("canvas#points"),
    contextPoints = canvasPoints.getContext("2d"),
    contextTracks = document.querySelector("canvas#tracks").getContext("2d"),
    detachedContainer = document.createElement("custom"),
    dataContainer = d3.select(detachedContainer),
    width = canvasPoints.width,
    height = canvasPoints.height;

var projection = d3.geoMercator()
    .scale((config.scale) / 2 * Math.PI)
    .translate([width / 2, height / 2])
    .center([config.lon, config.lat])
    .precision(0);

var path = d3.geoPath()
    .projection(projection)
    .pointRadius(3.5)
    .context(contextTracks);

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

    var maxElapsed = Math.max.apply(Math, (data.map(function (d) { return d[3]; })));

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

    var interval = 1000 / config.fps,
        t = 0,
        going = true,
        pct,
        time;

    function drawCanvas(t) {
        contextTracks.strokeStyle = "rgba(74,20,134,0.2)";
        contextTracks.lineWidth = 3;

        tracks.each(function () {
            var node = d3.select(this),
                trackData = node.data()[0].values;

            if (t > 0 && t < trackData.length) {
                contextTracks.beginPath();
                path({type: "LineString", coordinates: [trackData[t-1], trackData[t]]});
                contextTracks.stroke();
            }
        });

        contextPoints.clearRect(0, 0, width, height);
        contextPoints.lineWidth = 1;
        contextPoints.strokeStyle = "black";
        contextPoints.beginPath();

        runners.each(function () {
            var node = d3.select(this);
            contextPoints.moveTo(parseFloat(node.attr("x")) + parseFloat(node.attr("radius")), node.attr("y"));
            contextPoints.arc(node.attr("x")+ node.attr("radius"), node.attr("y"), node.attr("radius"), 0, 2 * Math.PI);
        });

            contextPoints.stroke();

    }

    var coord_slicer = function (d, t) {
        return projection(d.values[Math.min(t, d.values[0][3] - 1)]);
    };

    function step(t) {

        runners
            .attr("x", function (d) { return coord_slicer(d, t)[0]; })
            .attr("y", function (d) { return coord_slicer(d, t)[1]; });

        time = new Date(null);
        time.setSeconds(t * config.resampleInterval);
        time = time.toISOString().substr(11, 5);
        pct = (t / maxElapsed * 100).toFixed(0);
        if (pct.length === 1) { pct = "0" + pct; }

        timer.text("Elapsed: " + time + "/" + pct + "%");

        drawCanvas(t);
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
        contextTracks.clearRect(0, 0, width, height);
        t = 0;
        step(t);
    }

    playButton.on("click", pauseResume);
    restartButton.on("click", restart);

});
