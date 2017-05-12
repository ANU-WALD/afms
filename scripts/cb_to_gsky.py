#!/bin/env python

# Convert colorbrewer.org colour palette to GSKY configuration format.
#
#
# Usage:
#
# cb_to_gsky.py <palette> <n>
#
#
import sys
import json
from collections import OrderedDict

def show_usage():
  print('Usage:')
  print('\t%s <palette> <n> [-r] [-<m>]'%sys.argv[0])
  print()

def group_by(nested,key):
  result = {}
  for k,v in nested.items():
    cat = v[key]

    if not cat in result:
      result[cat] = {}
    result[cat][k] = v
  return result

def summarise_options(all_palettes):
  by_cat = group_by(all_palettes,'type')

  for cat,palettes in by_cat.items():
    print('\n%s\n--------'%cat)
    summarise_palettes(palettes)

def summarise_palettes(palettes):
  for pal,options in palettes.items():
    keys = [int(o) for o in options.keys() if not o=='type']
    min_colours = min(keys)
    max_colours = max(keys)
    print('%s [%d-%d]'%(pal,min_colours,max_colours))

def process_args(palettes):
  lower_keys = {k.lower():k for k in palettes.keys()}
  rev=False
  repeat=1
  try:
    pal = sys.argv[1]
    n = int(sys.argv[2])
    other_options = sys.argv[3:]
    for opt in other_options:
      if opt=='-r':
        rev=True
      else:
        repeat = int(opt[1:])

    if (pal.lower() in lower_keys) and (str(n) in palettes[lower_keys[pal.lower()]]):
      return lower_keys[pal.lower()],n,rev,repeat
  except:pass
  return '',0,False,0

def col_to_gsky(rgb_string):
  stripped = rgb_string[4:-1]
  vals = [int(val) for val in stripped.split(',')]
  result = OrderedDict()
  result['R']=vals[0]
  result['G']=vals[1]
  result['B']=vals[2]
  result['A']=255
  return result

def gsky_palette(palette,reverse=False,repeat=1):
  if reverse:
    palette = palette[::-1]

  # replication factor (to reduce interpolation)
  result = []
  for col in palette:
    result += [col_to_gsky(col)]*repeat

#  result = {'palette':result}
  print(json.dumps(result,indent=2))

if __name__ == '__main__':
  palettes = json.load(open('colorbrewer.json'))
  pal, n, reverse, repeat = process_args(palettes)

  if n:
    gsky_palette(palettes[pal][str(n)],reverse,repeat)
  else:
    show_usage()
    summarise_options(palettes)

