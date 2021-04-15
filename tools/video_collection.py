import time
import os
from expscontrol.cmd_exec import RemoteNode,RemoteCommand,Command
from expscontrol.nstreamer import Streamer
import argparse
from http.server import BaseHTTPRequestHandler, HTTPServer
import threading
import random
import hashlib

# Default port used by the extension to 
server_port = 19282

#path to folder containing a Chrome Profile
profile = ""
#path to selenium chromedriver
driver = ""
#name of user to tag the collected data with
user = 'test_user'
#net interface
netif = "eth0"

netflix_pool = [
  'https://www.netflix.com/watch/70298735',
  'https://www.netflix.com/watch/70075479',
  'https://www.netflix.com/watch/70178621',
  'https://www.netflix.com/watch/70259171',
  'https://www.netflix.com/watch/70134402',
  'https://www.netflix.com/watch/70262639',
  'https://www.netflix.com/watch/70140907',
  'https://www.netflix.com/watch/80125409',
  'https://www.netflix.com/watch/70143824',
  'https://www.netflix.com/watch/80083977',
  'https://www.netflix.com/watch/70269488',
  'https://www.netflix.com/watch/60011153',
  'https://www.netflix.com/watch/70143824',
  'https://www.netflix.com/watch/70153404',
  'https://www.netflix.com/watch/70071613',
  'https://www.netflix.com/watch/70213514',
  'https://www.netflix.com/watch/70267241',
  'https://www.netflix.com/watch/693960',
  'https://www.netflix.com/watch/80057281',
  'https://www.netflix.com/watch/20557937',
  'https://www.netflix.com/watch/70178621',
  'https://www.netflix.com/watch/70124805',
  'https://www.netflix.com/watch/80119234',
  'https://www.netflix.com/watch/70108777',
  'https://www.netflix.com/watch/70117305',
  'https://www.netflix.com/watch/70178621'
]

youtube_pool = [
        'https://youtu.be/2h7Dy7O2brs?t=1s',
        'https://www.youtube.com/watch?v=IRfqvsgWBMw?t=1s',
        'https://www.youtube.com/watch?v=uhBBpfk2DWk?t=1s',
        'https://www.youtube.com/watch?v=pM_tOd3fiYA?t=1s',
        'https://www.youtube.com/watch?v=q6VeuE1vDck?t=1s',
        'https://www.youtube.com/watch?v=0wPRrKBNSxY?t=1s',
        'https://www.youtube.com/watch?v=ayklt07vFP8?t=1s',
        'https://www.youtube.com/watch?v=erFK-8FJVnU?t=1s',
        'https://www.youtube.com/watch?v=Dtw2vfKihXA?t=1s',
        'https://www.youtube.com/watch?v=LY1X-_9mamg?t=1s',
        'https://www.youtube.com/watch?v=ZdqSv5_m_Wk?t=1s',
        'https://www.youtube.com/watch?v=R3AKlscrjmQ?t=1s',
        'https://www.youtube.com/watch?v=ICFQS_jpzFY?t=1s',
        'https://www.youtube.com/watch?v=SPLFzEHvqd4?t=1s',
        'https://www.youtube.com/watch?v=Nzbq35hAXRQ?t=1s',
        'https://www.youtube.com/watch?v=wzLaksTl_M0?t=1s',
        'https://www.youtube.com/watch?v=pOPxhBo5Yz0?t=1s',
        'https://www.youtube.com/watch?v=G_XyRZFkFJM?t=1s',
        'https://www.youtube.com/watch?v=ZSoVkaUtTA4?t=1s',
]

twitch_pool = [
    'https://twitch.tv'
]

amazon_eu_pool = [
    'https://www.primevideo.com/gp/video/detail/0GQGTTMJCM1PDHQWANMLX1WCPS/ref=atv_dp_pb_core?autoplay=1&t=7'
]

amazon_us_pool = [
    'https://www.amazon.com/gp/video/detail/B00WKZYQGM/ref=atv_dp_pb_core?autoplay=1&t=0',
    'https://www.amazon.com/gp/video/detail/B01J78CZ3U/ref=atv_dp_pb_core?autoplay=1&t=0',
    'https://www.amazon.com/gp/video/detail/B077VYZSRX/ref=atv_dp_pb_core?autoplay=1&t=0',
    'https://www.amazon.com/gp/video/detail/B07495F265/ref=atv_dp_pb_core?autoplay=1&t=0',
    'https://www.amazon.com/gp/video/detail/B076HD7XQY/ref=atv_dp_pb_core?autoplay=1&t=0',
    'https://www.amazon.com/gp/video/detail/B0748NJY1B/ref=atv_dp_pb_core?autoplay=1&t=0',
    'https://www.amazon.com/gp/video/detail/B076C5DGMM/ref=atv_dp_pb_core?autoplay=1&t=0',
    'https://www.amazon.com/gp/video/detail/B0754YY2JJ/ref=atv_dp_pb_core?autoplay=1&t=0',
    'https://www.amazon.com/gp/video/detail/B001FD5KJM/ref=atv_dp_pb_core?autoplay=1&t=0',
]

hbo_pool = [
    "https://play.hbonow.com/feature/urn:hbo:feature:GXF31RgX3asPDwgEAAAB2",
    "https://play.hbonow.com/feature/urn:hbo:feature:GXEHvowxX_G2-gAEAAAC8",
    "https://play.hbonow.com/feature/urn:hbo:feature:GXBlS7wP7XIa1vAEAAARW",
    "https://play.hbonow.com/feature/urn:hbo:feature:GW_LxDAsW_6rCXQEAAAAa",
    "https://play.hbonow.com/feature/urn:hbo:feature:GWl5jogS8ZMLDfQEAAAEK",
    "https://play.hbonow.com/feature/urn:hbo:feature:GWiV6dAsFbY6VPAEAAAA2",
    "https://play.hbonow.com/feature/urn:hbo:feature:GW6PBZwt26MPDSgEAAACM",
    "https://play.hbonow.com/feature/urn:hbo:feature:GXHHXcwwSL47DwwEAAAD7",
    "https://play.hbonow.com/feature/urn:hbo:feature:GWqvS2wgL6KaHhAEAAADv",
    "https://play.hbonow.com/feature/urn:hbo:feature:GXBPEvwLFwUS7iQEAAAGI",
    "https://play.hbonow.com/episode/urn:hbo:episode:GVU2sBQdoq47DwvwIAVHH",
    "https://play.hbonow.com/episode/urn:hbo:episode:GVU2g_ALfJ4NJjhsJAUHK",
    "https://play.hbonow.com/episode/urn:hbo:episode:GWoS0GgurxU7DKwEAAAIC",
    "https://play.hbonow.com/episode/urn:hbo:episode:GVU4N8QVPx4NJjhsJAbkd",
    "https://play.hbonow.com/episode/urn:hbo:episode:GWi8EAgKjXqWNwgEAAAFW"
]

hulu_pool = [
    "https://www.hulu.com/watch/77332ba2-89d1-4fe0-a191-c4a49bcaea30",
    "https://www.hulu.com/watch/46acfada-540f-4e0c-b4c9-ee6a7fb1c201",
    "https://www.hulu.com/watch/2ce6365a-46e7-43d9-8d77-5b84753a663c",
    "https://www.hulu.com/watch/ce4caede-64c2-4c95-a013-4e2584d431bc",
    "https://www.hulu.com/watch/85c5529d-c053-4fa4-9957-4906eb5aedc6",
    "https://www.hulu.com/watch/bd00754c-12d1-44fe-b0f6-89754bc338ec",
    "https://www.hulu.com/watch/a2624615-0d08-4922-a1bf-167c0c0e3e8f",
    "https://www.hulu.com/watch/002049f3-3fa9-4989-8205-c5bc88b8baa6",
    "https://www.hulu.com/watch/c3728d56-fbfc-4509-a16d-19857f8b1daa",
    "https://www.hulu.com/watch/d87ca2c9-8dae-4b95-9ff8-cb7f24c08297"
]

exp_catergories = []
runs = []

run_netflix = True
run_amazon = False
run_youtube = False
run_twitch = False
run_hulu = False
##### To generate without loss or anything
for k in range(1,2):
  ts = str(int(time.time()))
  if run_youtube:
    runs.append({'expname': user+'_'+str(k)+'_youtube.run'+ts, 'url': youtube_pool[k%len(youtube_pool)], 'netem': None, 'length': 12 * 60})
  if run_netflix:
    runs.append({'expname': user+'_'+str(k)+'_netflix.run'+ts, 'url': netflix_pool[k%len(netflix_pool)], 'netem': None, 'length': 10 * 60})
  if run_amazon:
    runs.append({'expname': user+'_'+str(k)+'_amazon.run'+ts, 'url': amazon_us_pool[k%len(amazon_us_pool)], 'netem': None, 'length': 10 * 60})
  if run_twitch:
    runs.append({'expname': user+'_'+str(k)+'_twitch.run'+ts, 'url': twitch_pool[k%len(twitch_pool)], 'netem': None, 'length': 10 * 60})
  if run_hulu:
    runs.append({'expname': user+'_'+str(k)+'_hulu.run'+ts, 'url': hulu_pool[k%len(hulu_pool)], 'netem': None, 'length': 10 * 60})


class S(BaseHTTPRequestHandler):

  def do_GET(self):
    if self.path == '/close':
      self.send_response(200)
    else:
      print ("Received unkown get request", self.path)
      self.send_response(404)

  def do_POST(self):
    if self.path.endswith('.json') or self.path.endswith('.pcap'):
      fname = self.path.split('/')[-1]
      length = self.headers['content-length']
      data = self.rfile.read(int(length))

      with open(self.server.folder+fname, 'w') as fh:
        fh.write(data.decode())

      self.send_response(200)
    else:
      self.send_response(400)

class POSTHTTPServer(HTTPServer):
  """
  Extend a normal python HTTP server. This will let us to manage various stuffs
  """
  def __init__(self, folder, *args):
    HTTPServer.__init__(self, *args)
    self.folder = folder
    self.stopped = False

  def serve_forever_with_stop(self):
    while not self.stopped:
      self.handle_request()

  def force_stop(self):
    self.stopped = True
    self.create_dummy_request()
    self.server_close()

  def create_dummy_request(self):
    print ("Creating dummy request:","http://127.0.0.1:"+str(server_port)+"/close")
    wget = Command()
    wget.setCmd("wget http://127.0.0.1:"+str(server_port)+"/close")
    wget.runSync()

  def update_folder(self, folder):
    self.folder = folder


def collect_video(folder, URL, length=30, netem=None, runTA=True, runServer=True, runPcap=True, ):
  #start tcpdump
  if runPcap:
    pcap = Command()
    pcap.setCmd("sudo tcpdump -i {} -s 200 -w {}dump.pcap".format(netif, folder))
    pcap.runAsync()

  #Start video stream
  streamer = Streamer()
  streamer.config(length=length, profile=profile, driverPath=driver, URL=URL)
  streamer.runAsync()

  t = length

  time.sleep(t)
  streamer.stopAsync()

  #Kill pcap
  if runPcap:
    pcap = Command()
    pcap.setCmd("killall -2 tcpdump")
    pcap.runSync()


def collect_all_videos(folder):
  print (runs)

  server_address = ('', server_port)
  httpd = POSTHTTPServer(folder, server_address, S)
  server_thread = threading.Thread(target=httpd.serve_forever_with_stop)
  server_thread.start()

  for run in runs:
    print ('Run experiment', run['expname'])
    m = hashlib.md5()
    m.update(run['expname'])
    n = m.hexdigest()
    # n = run['expname']
    if not os.path.exists(folder+"/"+n):
      os.makedirs(folder+"/"+n)
      text_file = open(folder+"/"+n+'/'+"exp.txt", "w")
      text_file.write(run['expname'])
      text_file.close()
    httpd.update_folder(folder+"/"+n+'/')
    collect_video(folder+"/"+n+'/', run['url'], length=run['length'], netem=run['netem'])

  httpd.force_stop()


def open_for_setup(opentime):
  streamer = Streamer()
  streamer.config(length=opentime, profile=profile, driverPath=driver)
  streamer.openWindow()

def start_server_only(folder):
  server_address = ('', server_port)
  httpd = POSTHTTPServer(folder, server_address, S)
  httpd.serve_forever_with_stop()


def main():
  """
  Run performance experiments for ta
  :return:
  """
  parser = argparse.ArgumentParser()
  parser.add_argument('-f', '--folder', type=str, required=True, default="", help="Folder where data is stored")
  parser.add_argument('-o', '--open', type=int, required=False, default=0, help="Open setup page")
  parser.add_argument('-s', '--server', action="store_true", required=False, help="Only start http server")
  args = vars(parser.parse_args())

  if args["open"] > 0:
    open_for_setup(args["open"])
  elif args["server"]:
    start_server_only(args["folder"])
  else:
    collect_all_videos(args["folder"])


if __name__ == "__main__":
  main()
