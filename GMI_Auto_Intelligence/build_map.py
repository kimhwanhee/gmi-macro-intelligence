from pathlib import Path
import geopandas as gpd
from shapely.geometry import Polygon, MultiPolygon, GeometryCollection
from html import escape
p=Path(__file__).parent
source='/opt/pyvenv/lib/python3.13/site-packages/pyogrio/tests/fixtures/naturalearth_lowres/naturalearth_lowres.shp'
gdf=gpd.read_file(source)
W,H=1800,900
YMAX,YMIN=83,-60

def project(point):
 x,y=point
 return (round((x+180)/360*W,2),round((YMAX-max(YMIN,min(YMAX,y)))/(YMAX-YMIN)*H,2))

def polygon_path(poly):
 shapes=[]
 for ring in [poly.exterior,*poly.interiors]:
  coords=list(ring.coords)
  if not coords: continue
  projected=[project(pt) for pt in coords]
  shapes.append('M'+'L'.join(f'{x},{y}' for x,y in projected)+'Z')
 return ''.join(shapes)

parts=[]
for _,entry in gdf.iterrows():
 if str(entry['name'])=='Antarctica': continue
 geom=entry.geometry.simplify(.18,preserve_topology=True)
 if geom.is_empty: continue
 polygons=[geom] if isinstance(geom,Polygon) else list(geom.geoms) if isinstance(geom,MultiPolygon) else []
 path=''.join(polygon_path(poly) for poly in polygons)
 iso_code=str(entry['iso_a3'])
 if iso_code=='-99': iso_code={'Norway':'NOR','France':'FRA','Kosovo':'XKX','N. Cyprus':'CYP','Somaliland':'SOM'}.get(str(entry['name']),iso_code)
 iso=escape(iso_code)
 name=escape(str(entry['name']))
 parts.append(f'<path class="country-path" data-iso="{iso}" data-name="{name}" d="{path}"/>')
result='\n'.join(parts)
(p/'world-paths.html').write_text(result,encoding='utf8')
print('map geometry:',len(parts),'countries',round(len(result)/1024),'KB')
