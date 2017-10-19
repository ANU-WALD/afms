#!/usr/bin/env python

import json
from cb_to_gsky import gsky_palette,cb_palette
from string import Template
from collections import OrderedDict

raw_template = open('../gsky/config_template.json').read()

template = Template(raw_template)

palettes = {
  'FMC_PALETTE':['RdYlBu',9,False,1,0],
  'FMC_UNCERTAINTY_PALETTE':['RdYlBu',11,True,1,0],
  'FLAMMABILITY_PALETTE':['RdYlBu',11,True,1,0]
}

generated_palettes = {k:gsky_palette(cb_palette(*v[:2]),*v[2:]) for k,v in palettes.items()}
substituted = template.substitute(generated_palettes)
as_json = json.loads(substituted,object_pairs_hook=OrderedDict)
pretty = json.dumps(as_json,indent=2)

print(pretty)
