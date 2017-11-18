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
MIN_TIME_DIFF = 20

def process_gpx(gpx_file, writer, downsample, index=0):
    """Parse a gpx file into a flat format of [lat, lon, time, elapsed, n]

    Writes parsed gpx file to the provided writer.

    Args:
        gpx_file (str): XML file with 'http://www.topografix.com/GPX/1/1' schema
        writer (class '_csv.writer'): initialized csv writer
        index (int): numerical indentifier

    """

    tree = ET.parse(gpx_file)
    trksegs = tree.getroot()[1][1].findall('{http://www.topografix.com/GPX/1/1}trkpt')

    last_written = -9999

    for i, trkpt in enumerate(trksegs):
        lat = trkpt.attrib['lat']
        lon = trkpt.attrib['lon']

        time = trkpt.find('{http://www.topografix.com/GPX/1/1}time').text
        datetime = parser.parse(time)

        if i == 0:
            intial_time = datetime
        elapsed = datetime - intial_time

        if elapsed.seconds - last_written > downsample:
            writer.writerow([lat, lon, time, elapsed.seconds, index])
            last_written = elapsed.seconds
        else:
            pass

def batch_process_gpx(data_dir, out_file, min_time_diff):
    """Process all .gpx files in data_dir to a .csv named out_file

    """

    with open(out_file, "w") as open_file:
        writer = csv.writer(open_file)
        writer.writerow(['lat', 'lon', 'time', 'elapsed', 'index'])

        gpx_files = glob.glob(join(data_dir, "*.gpx"))
        for i, gpx_file in enumerate(gpx_files):
            process_gpx(gpx_file, writer, min_time_diff, i)

if __name__ == "__main__":
    batch_process_gpx(DATA_DIR, OUT_FILE, MIN_TIME_DIFF)
