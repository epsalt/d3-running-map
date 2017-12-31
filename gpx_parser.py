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

import pandas as pd
from dateutil import parser
from pandas import DataFrame

DATA_DIR = "./data"
OUT_FILE = "./data/gpx_rollup.csv"

def process_gpx(gpx_file):
    """Parse a gpx file into a flat format of [lat, lon, time, elapsed, n]

    Writes parsed gpx file to the provided writer.

    Args:
        gpx_file (str): XML file with 'http://www.topografix.com/GPX/1/1' schema
        writer (class '_csv.writer'): initialized csv writer
        index (int): numerical indentifier

    """

    tree = ET.parse(gpx_file)
    trksegs = tree.getroot()[1][1].findall('{http://www.topografix.com/GPX/1/1}trkpt')

    out = list()
    for i, trkpt in enumerate(trksegs):
        lat = trkpt.attrib['lat']
        lon = trkpt.attrib['lon']

        time = trkpt.find('{http://www.topografix.com/GPX/1/1}time').text
        datetime = parser.parse(time)

        out.append([lat, lon, datetime])

    return out

def resample(data):
    df = DataFrame(data, columns = ['lat', 'lon', 'datetime'])
    df = df[~df.index.duplicated(keep='first')]
    df['elapsed'] = df['datetime'] - min((df['datetime']))
    df = df.set_index('elapsed')
    resampled = df.resample("30S").pad().interpolate(method="linear")
    resampled = resampled.drop(['datetime'], axis=1)   
    return resampled

def batch_process_gpx(data_dir, out_file):
    """Process all .gpx files in data_dir to a .csv named out_file

    """

    with open(out_file, "w") as open_file:
        writer = csv.writer(open_file)
        writer.writerow(['elapsed', 'len', 'lat', 'lon', 'index'])

        gpx_files = glob.glob(join(data_dir, "*.gpx"))
        for i, gpx_file in enumerate(gpx_files):
            print(gpx_file)
            resampled = resample(process_gpx(gpx_file))
            resampled.insert(0, 'len', len(resampled))
            resampled['index'] = i
            resampled.to_csv(open_file, header=False)

if __name__ == "__main__":
    batch_process_gpx(DATA_DIR, OUT_FILE)
