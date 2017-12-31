# -*- coding: utf-8 -*-
"""gpx to csv parser

This python file parses a directory of gpx files (DATA_DIR) exported
from Strava to a single csv file (OUTFILE) using the xml module and
dateutil parser.

Data is resampled to a constant timestep using pandas and a supplied
interval (INTERVAL). For interval conventions see
http://pandas.pydata.org/pandas-docs/stable/timeseries.html#offset-aliases

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
INTERVAL = "30S"

def process_gpx(gpx_file):
    """Parse a gpx file into a list of lists [[lat, lon, datetime], ...]

    Args:
        gpx_file (str): file location

    Returns:
        out (list of lists)

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

def resample(data, interval):
    """Resample data to a constant time interval using Pandas

    Args:
        data (list of lists): output from `process_gpx`
        interval (str): see http://pandas.pydata.org/pandas-docs/stable/timeseries.html#offset-aliases

    Returns:
        resampled (pandas.DataFrame): data resampled to supplied interval

    """
    df = DataFrame(data, columns = ['lat', 'lon', 'datetime'])
    df['elapsed'] = df['datetime'] - min((df['datetime']))

    # Some gpx files in my dataset have duplicate timestamps. Need to
    # remove these to avoid resampling errors
    df = df.set_index('elapsed')
    df = df[~df.index.duplicated(keep='first')]

    resampled = df.resample(interval).pad().interpolate(method="linear")
    resampled = resampled.drop(['datetime'], axis=1)

    return resampled

def batch_process_gpx(data_dir, out_file, interval):
    """
    Process all .gpx files in data_dir to a .csv named out_file

    Args:
        data_dir (str): .gpx files are found with glob in this directory
        out_file (str): where to write produced .csv file
        interval (str): see http://pandas.pydata.org/pandas-docs/stable/timeseries.html#offset-aliases

    """

    with open(out_file, "w") as open_file:
        writer = csv.writer(open_file)
        writer.writerow(['elapsed', 'len', 'lat', 'lon', 'index'])

        gpx_files = glob.glob(join(data_dir, "*.gpx"))
        for i, gpx_file in enumerate(gpx_files):
            resampled = resample(process_gpx(gpx_file), interval)
            resampled.insert(0, 'len', len(resampled))
            resampled['index'] = i
            resampled.to_csv(open_file, header=False)

if __name__ == "__main__":
    batch_process_gpx(DATA_DIR, OUT_FILE, INTERVAL)
