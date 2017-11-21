/*global d3*/

var pi = Math.PI,
    tau = 2 * pi;

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var projection = d3.geoMercator()
    .scale((1 << 20) / tau)
    .translate([width / 2, height / 2])
    .center([-114.09, 51.0375]);

var path = d3.geoPath()
    .projection(projection);

var tiles = d3.tile()
    .size([width, height])
    .scale(projection.scale() * tau)
    .translate(projection([0, 0]))
();

d3.csv("data/gpx_rollup.csv", function(data) {

    // OSM Map Tiles
    svg.selectAll("image")
        .data(tiles)
        .enter().append("image")
        .attr("xlink:href", function(d) { return "http://" + "abc"[d[1] % 3] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
        .attr("x", function(d) { return (d[0] + tiles.translate[0]) * tiles.scale; })
        .attr("y", function(d) { return (d[1] + tiles.translate[1]) * tiles.scale; })
        .attr("width", tiles.scale)
        .attr("height", tiles.scale);

    // Helper Functions
    var line = d3.line()
        .x(function(d) {return projection([d.lon, d.lat])[0];})
        .y(function(d) {return projection([d.lon, d.lat])[1];});

    var dataByIndex = d3.nest()
        .key(function(d) {return d.index;});

    // Visualization Elements
    svg.selectAll("path")
        .data(dataByIndex.entries(data))
        .enter().append("path")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.2)
        .attr("fill", "none");

    svg.selectAll("circle")
        .data(dataByIndex.entries(data))
        .enter().append("circle")
        .attr("class", "runner")
        .attr("stroke", "black")
        .attr("fill", "none")
        .attr("r", 2);

    // Legend Elements
    svg.append("rect")
        .attr("x", 345)
        .attr("y", 520)
        .attr("width", 140)
        .attr("height", 75)
        .attr("fill", "#fff")
        .attr("stroke", "#555")
        .attr("stroke-width", 0.25);

    svg.append("text")
        .attr("x", 355)
        .attr("y", 540)
        .attr("class", "legend")
        .text("Elapsed - 00:00:00");

    var maxElapsed = Math.max.apply(Math,(data.map(function(d) {return d.elapsed;})));

    var x = d3.scaleLinear()
        .domain([0, maxElapsed])
        .range([0,107]);

    svg.append("rect")
        .attr("x", 357.5)
        .attr("y", 550)
        .attr("height", 5)
        .attr("width", 112)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 1);

    svg.append("circle")
        .attr("class", "progress")
        .attr("cy", 552.5)
        .attr("transform", "translate(360, 0)")
        .attr("r", 2)
        .attr("fill", "red");

    var elapsed = null, reqID, speed = 10, going = true;
    function step() {
        if (!elapsed) elapsed = 0;
        if (elapsed < maxElapsed) {
            draw(elapsed);
        } else {
            elapsed = null;
        }
        reqID = window.requestAnimationFrame(step);
        elapsed = elapsed + (1 * speed);
    }
    reqID = window.requestAnimationFrame(step);


    function draw(elapsed){

        var elapsedFilter = data.filter(function(d) {return d.elapsed < elapsed;}),
            nested = dataByIndex.entries(elapsedFilter),
            currentPoints = nested.map(function(d) {return d.values[d.values.length - 1];});

        var date = new Date(null);
        date.setSeconds(elapsed);

        svg.select("text")
            .text("Elapsed " + date.toISOString().substr(11, 8));

        svg.selectAll("path")
            .data(nested)
            .attr("d", function(d) {return line(d.values);});

        svg.selectAll(".runner")
            .data(currentPoints)
            .attr("cx", function(d) {return projection([d.lon, d.lat])[0];})
            .attr("cy", function(d) {return projection([d.lon, d.lat])[1];});

        svg.select(".progress")
            .attr("cx", x(elapsed));
    }

});
