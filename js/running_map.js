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

    svg.selectAll("image")
        .data(tiles)
        .enter().append("image")
        .attr("xlink:href", function(d) { return "http://" + "abc"[d[1] % 3] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
        .attr("x", function(d) { return (d[0] + tiles.translate[0]) * tiles.scale; })
        .attr("y", function(d) { return (d[1] + tiles.translate[1]) * tiles.scale; })
        .attr("width", tiles.scale)
        .attr("height", tiles.scale);

    var line = d3.line()
        .x(function(d) {return projection([d.lon, d.lat])[0];})
        .y(function(d) {return projection([d.lon, d.lat])[1];});

    var dataByIndex = d3.nest()
        .key(function(d) {return d.index;});

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
        .attr("stroke", "black")
        .attr("fill", "none")
        .attr("r", 2);

    svg.append("rect")
        .attr("x", 350)
        .attr("y", 525)
        .attr("width", 140)
        .attr("height", 70)
        .attr("fill", "#fff")
        .attr("stroke", "#555")
        .attr("stroke-width", 0.25);

    svg.append("text")
        .attr("x", 360)
        .attr("y", 540)
        .attr("class", "legend")
        .text("Elapsed - 00:00:00");

    var wait = 30, lastUpdate = -1000;
    d3.timer(function(elapsed) {
        if(elapsed - lastUpdate > wait) {
            update(elapsed, dataByIndex);
            lastUpdate = elapsed;
        }
    });

    function update(elapsed, dataByIndex){

        var elapsedFilter = data.filter(function(d) {return d.elapsed < elapsed / 10;}),
            nested = dataByIndex.entries(elapsedFilter),
            currentPoints = nested.map(function(d) {return d.values[d.values.length - 1];});

        var date = new Date(null);
        date.setSeconds(elapsed / 10);

        svg.select("text")
            .text("Elapsed " + date.toISOString().substr(11, 8));

        svg.selectAll("path")
            .data(nested)
            .attr("d", function(d) {return line(d.values);});

        svg.selectAll("circle")
            .data(currentPoints)
            .attr("cx", function(d) {return projection([d.lon, d.lat])[0];})
            .attr("cy", function(d) {return projection([d.lon, d.lat])[1];});
    }

});
