# -*- coding: utf-8 -*-
"""gpx to csv parser

This python file parses a directory of gpx files (DATA_DIR) exported
from Strava to a single csv file (OUTFILE) using the xml module and
dateutil parser.

"""

import csv
import glob
import xml.etree.ElementTree as ET
from os.path import join

from dateutil import parser

DATA_DIR = "./data"
OUT_FILE = "./data/gpx_rollup.csv"

def process_gpx(gpx_file, writer, index=0):
    """Parse a gpx file into a flat format of [lat, lon, time, elapsed, n]

    Writes parsed gpx file to the provided writer.

    Args:
        gpx_file (str): XML file with 'http://www.topografix.com/GPX/1/1' schema
        writer (class '_csv.writer'): initialized csv writer
        index (int): numerical indentifier

    """

    tree = ET.parse(gpx_file)
    trksegs = tree.getroot()[1][1].findall('{http://www.topografix.com/GPX/1/1}trkpt')
    out = []

    for i, trkpt in enumerate(trksegs):
        lat = trkpt.attrib['lat']
        lon = trkpt.attrib['lon']

        time = trkpt.find('{http://www.topografix.com/GPX/1/1}time').text
        datetime = parser.parse(time)

        if i == 0:
            intial_time = datetime
        time_diff = datetime - intial_time

        writer.writerow([lat, lon, time, time_diff.seconds, index])

    return out

def batch_process_gpx(data_dir, out_file):
    """Process all .gpx files in data_dir to a .csv named out_file"""

    with open(out_file, "w") as open_file:
        writer = csv.writer(open_file)
        writer.writerow(['lat', 'lon', 'time', 'elapsed', 'index'])

        gpx_files = glob.glob(join(data_dir, "*.gpx"))
        for i, gpx_file in enumerate(gpx_files):
            process_gpx(gpx_file, writer, i)

if __name__ == "__main__":
    batch_process_gpx(DATA_DIR, OUT_FILE)
