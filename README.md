# Animated D3 Running Map

Visualizing Strava data with D3.js. Full interactive version and blog
post coming soon.

![Running Map
GIF](https://raw.githubusercontent.com/epsalt/d3-running-map/master/running_map.gif)

Map tiles copyright [OpenStreetMap](http://www.openstreetmap.org/copyright) contributors.

This project was inspired by the [Strava Global
Heatmap](https://labs.strava.com/heatmap/) and the [America's Cup
Course](http://www.nytimes.com/interactive/2013/09/25/sports/americas-cup-course.html)
article by Mike Bostock and Shan Carter for the New York Times. Map
tiling code taken from [this
example](http://bl.ocks.org/mbostock/eb0c48375fcdcdc00c54a92724733d0d).

## Usage

You can run the visualization locally with your own activity
data.

First export your data from whatever tracking service you use in the
`GPX` file format.

- [Strava export](https://support.strava.com/hc/en-us/articles/216918437-Exporting-your-Data-and-Bulk-Export)
- [Runkeeper export](https://support.runkeeper.com/hc/en-us/articles/201109886-How-to-Export-your-Runkeeper-data)

Convert the data from `GPX` to a single `CSV` file using the
`gpx_parser.py` utility conveniently bundled with this repo. Where
`data` is a directory where your `GPX` files are located.

```
$ python3 gpx_parser.py ./data -o ./assets/activity_data.csv
```

Change the center and scale to match the your data in the
`running_map.js` file.

```javascript
var config = {
    "scale": 20, // Put your scale here
    "lat": 51.0375, // Put your latitude here
    "lon": -114.09 // Put your longitude here
};
```

Spin up a webserver with Python.

```
$ python3 -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

Lastly, point your brower of choice to http://localhost:8000 and the
visualization should appear.

## Requirements

The data cleaning step requires Python3 to be installed on your
machine and the following packages:

- pandas
- dateutil

## License

All code in this repo is licensed under the terms of the GPLv3 License
(see the file `LICENSE.md`).
