var pi = Math.PI,
    tau = 2 * pi;

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var projection = d3.geoMercator()
    .scale((1 << 21) / tau)
    .translate([width / 2, height / 2])
    .center([-114.07, 51.05]);

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
        .attr("id", function(d) {return d.key;})
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    var wait = 5, lastUpdate = -1000;
    d3.timer(function(elapsed) {
        if(elapsed - lastUpdate > wait) {
            update(elapsed, dataByIndex);
            lastUpdate = elapsed;
            console.log("UPDATE!");
        }
    });

    function update(elapsed, dataByIndex){

        var dataFiltered = dataByIndex.entries(data.filter(function(d) {return d.elapsed < elapsed / 10;}));

        svg.selectAll("path")
            .data(dataFiltered)
            .attr("d", function(d) {return line(d.values);});
    }

});
