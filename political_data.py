"""GMI governance coverage: official rosters where available, transparent dated data.
No invented officeholders or political rankings. All network jobs run asynchronously.
"""
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from urllib.parse import quote
from urllib.request import Request, urlopen
from pathlib import Path
import datetime, json, re, threading, time, unicodedata

ROOT=Path(__file__).resolve().parent
CAT={row['iso']:row for row in json.loads((ROOT/'country-catalog.json').read_text(encoding='utf-8'))}
SNAP=json.loads((ROOT/'political-snapshots.json').read_text(encoding='utf-8'))
POOL=ThreadPoolExecutor(max_workers=6,thread_name_prefix='political-info')
LOCK=threading.RLock(); CACHE={}; RUNNING=set(); TTL=7*86400

# Parliamentary governance is not the same as formal precedence. These metadata are
# descriptive institutional categories, not a subjective ordering of politicians.
GOVERNMENT={
 'GBR':'parliamentary_monarchy','CAN':'parliamentary_monarchy','AUS':'parliamentary_monarchy','NZL':'parliamentary_monarchy',
 'JPN':'parliamentary_monarchy','ESP':'parliamentary_monarchy','SWE':'parliamentary_monarchy','NOR':'parliamentary_monarchy',
 'DNK':'parliamentary_monarchy','NLD':'parliamentary_monarchy','BEL':'parliamentary_monarchy','LUX':'parliamentary_monarchy',
 'DEU':'parliamentary_republic','ITA':'parliamentary_republic','AUT':'parliamentary_republic','IRL':'parliamentary_republic',
 'GRC':'parliamentary_republic','CZE':'parliamentary_republic','SVK':'parliamentary_republic','HUN':'parliamentary_republic',
 'FIN':'parliamentary_republic','EST':'parliamentary_republic','LVA':'parliamentary_republic','ISL':'parliamentary_republic',
 'POL':'parliamentary_republic','PRT':'semi_presidential','ROU':'semi_presidential','FRA':'semi_presidential',
 'UKR':'semi_presidential','LTU':'semi_presidential',
 'USA':'presidential','MEX':'presidential','BRA':'presidential','ARG':'presidential','CHL':'presidential','COL':'presidential','PER':'presidential',
 'URY':'presidential','ECU':'presidential','BOL':'presidential','PRY':'presidential','GTM':'presidential','HND':'presidential',
 'CRI':'presidential','PAN':'presidential','DOM':'presidential','SLV':'presidential',
 'CHN':'one_party','CUB':'one_party','VNM':'one_party','LAO':'one_party',
 'CHE':'collegial','BIH':'collegial',
}
# Requested first two profiles: by clearly identified offices, never 'number one/two'.
OFFICE_PRIORITIES={
 'parliamentary_monarchy':['prime_minister','monarch','governor_general','president','speaker'],
 'parliamentary_republic':['prime_minister','chancellor','president','vice_president'],
 'semi_presidential':['president','prime_minister','speaker'],
 'presidential':['president','vice_president','prime_minister','speaker','interior_minister'],
 'one_party':['president','general_secretary','prime_minister','premier','speaker'],
 'collegial':['president','prime_minister'],
 'unknown':['president','prime_minister','monarch','chancellor','governor_general','vice_president'],
}
# CIA names sometimes differ from ISO official names. Override just the path.
SLUG={'GBR':'united-kingdom','USA':'united-states','KOR':'korea-south','PRK':'korea-north',
      'RUS':'russia','CZE':'czechia','TUR':'turkey','NLD':'netherlands','COD':'congo-democratic-republic-of-the',
      'COG':'congo-republic-of-the','CIV':'cote-divoire','BOL':'bolivia','VEN':'venezuela','TWN':'taiwan',
      'VAT':'holy-see-vatican-city','PSE':'west-bank-and-gaza','SWZ':'eswatini','MMR':'burma', 'MEX':'mexico',
      'CPV':'cabo-verde','TLS':'timor-leste','MKD':'north-macedonia'}

def slug(iso):
 if iso in SLUG:return SLUG[iso]
 s=CAT[iso]['english'].lower(); s=unicodedata.normalize('NFKD',s)
 s=''.join(c for c in s if not unicodedata.combining(c))
 return re.sub('-+','-',re.sub('[^a-z0-9]+','-',s)).strip('-')

def _fetch(url,timeout=9):
 req=Request(url,headers={'User-Agent':'GMI-PoliticalReference/1.0 (public institutional metadata)','Accept':'text/html,application/json'})
 with urlopen(req,timeout=timeout) as r:return r.read(1_400_000).decode('utf-8','replace')

class CabinetParser(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.depth=0;self.office=None;self.buf=[];self.members=[];self.h4=False;self.ended=False;self.seen_start=False
 def handle_starttag(self,tag,attrs):
  if self.ended:return
  if tag=='h4':
   self._flush();self.h4=True;self.office='';self.buf=[];self.seen_start=True
  if tag=='h2' and self.seen_start:self.ended=True;self._flush()
 def handle_data(self,data):
  if self.ended or self.office is None:return
  if self.h4:self.office+=data
  else:self.buf.append(data)
 def handle_endtag(self,tag):
  if tag=='h4':self.h4=False
 def _flush(self):
  if self.office is not None:
   office=re.sub(r'\s+',' ',self.office).strip();name=re.sub(r'\s+',' ',' '.join(self.buf)).strip()
   if office and name and len(name)<180 and 'Explore Foreign' not in name:
    self.members.append({'title':office,'name':name})
  self.office=None;self.buf=[]
 def finish(self):self._flush();return self.members

ROLE_HINTS=[
 ('vice_president',r'\b(vice|dep\.?|deputy)\s+(pres\.?|president)\b'),
 ('governor_general',r'governor[ -]gen\.'),
 ('chancellor',r'^chancellor\b|\bfederal chancellor\b'),
 ('prime_minister',r'\bprime\s+min\.?|\bprime minister\b|\bpremier\b|\bprime cabinet secretary\b'),
 ('president',r'^pres\.|^president\b'),
 ('monarch',r'^king\b|^queen\b|^sultan\b|^emperor\b|^grand duke\b'),
 ('foreign_minister',r'foreign\s+(affairs|relations|and diaspora)|external\s+relations|\bintl\.?\s+relations|international\s+relations|\bforeign\s+minister\b'),
 ('defense_minister',r'\bdefen[sc]e\b|national\s+defen[sc]e|military veterans'),
 ('finance_minister',r'\bfinance\b|\btreasury\b|fiscal policy'),
 ('trade_minister',r'\bcommerce\b|\btrade\b|\bindustry\b|\beconom(y|ic)\b|\binvestments\b'),
 ('interior_minister',r'\binterior\b|\bhome affairs\b'),
 ('speaker',r'^speaker\b|^senate president\b|^pres\. of (the )?(national )?assembly\b')]
def role(title):
 if re.search(r'central bank|reserve bank|bank governor|supreme court|ambassador|permanent representative',title,re.I):return 'other_official'
 if re.search(r'senate president|speaker|assembly president',title,re.I):return 'speaker'
 for key,regex in ROLE_HINTS:
  if re.search(regex,title,re.I):return key
 return 'minister'

def cabinet_groups(records):
 out={'foreign_minister':[],'defense_minister':[],'trade_minister':[],'finance_minister':[]}
 for row in records:
  role_id=row.get('office','')
  if role_id in out and row.get('name'):
   if all(z['name'].casefold()!=row['name'].casefold() for z in out[role_id]):out[role_id].append(row)
 return out

def cia(iso):
 url=('https://www.cia.gov/resources/government/mexico/' if iso=='MEX' else 'https://www.cia.gov/resources/world-leaders/foreign-governments/'+slug(iso)+'/')
 text=_fetch(url);parser=CabinetParser();parser.feed(text);people=parser.finish()
 updated=re.search(r'Last Updated:\s*(\d{1,2}/\d{1,2}/\d{4})',re.sub(r'<[^>]+>',' ',text))
 since=None
 if updated:
  try:since=datetime.datetime.strptime(updated.group(1),'%m/%d/%Y').date().isoformat()
  except ValueError:pass
 return {'members':[{'name':p['name'],'office':role(p['title']),'title':p['title'],'source':url} for p in people],
         'source':url,'source_updated':since}

CHAMBERS={
'USA':['House of Representatives','Senate'],'GBR':['House of Commons','House of Lords'],
'CAN':['House of Commons','Senate'],'MEX':['Cámara de Diputados','Senado de la República'],
'BRA':['Câmara dos Deputados','Senado Federal'],'ARG':['Cámara de Diputados','Senado'],
'COL':['Cámara de Representantes','Senado'],'CHL':['Cámara de Diputadas y Diputados','Senado'],
'PER':['Congreso de la República'],'FRA':['Assemblée nationale','Sénat'],
'DEU':['Bundestag','Bundesrat'],'ITA':['Camera dei deputati','Senato della Repubblica'],
'ESP':['Congreso de los Diputados','Senado'],'POL':['Sejm','Senat'],
'AUT':['Nationalrat','Bundesrat'],'NLD':['Tweede Kamer','Eerste Kamer'],
'BEL':['Chambre des représentants','Sénat'],'DNK':['Folketing'],
'SWE':['Riksdag'],'NOR':['Storting'],'FIN':['Eduskunta'],'ISL':['Alþingi'],
'IRL':['Dáil Éireann','Seanad Éireann'],'PRT':['Assembleia da República'],
'GRC':['Hellenic Parliament'],'CZE':['Poslanecká sněmovna','Senát'],
'SVK':['Národná rada'],'HUN':['Országgyűlés'],'ROU':['Camera Deputaților','Senat'],
'BGR':['Narodno sabranie'],'HRV':['Hrvatski sabor'],'SVN':['Državni zbor','Državni svet'],
'EST':['Riigikogu'],'LVA':['Saeima'],'LTU':['Seimas'],'LUX':['Chambre des députés'],
'MLT':['Kamra tad-Deputati'],'CYP':['House of Representatives'],
'AUS':['House of Representatives','Senate'],'JPN':['House of Representatives','House of Councillors'],
'KOR':['National Assembly'],'CHN':['National People’s Congress'],
'URY':['Cámara de Representantes','Cámara de Senadores'],
'PRY':['Cámara de Diputados','Senado'],'ECU':['Asamblea Nacional'],
'BOL':['Cámara de Diputados','Cámara de Senadores'],
'CRI':['Asamblea Legislativa'],'PAN':['Asamblea Nacional'],
'GTM':['Congreso de la República'],'VEN':['Asamblea Nacional'],
'CHE':['Nationalrat','Ständerat']
}

def _ipu_records(iso):
 # IPU Parline country_code is ISO alpha-2 and only independent parliamentary states have records.
 code=CAT[iso].get('iso2')
 if not code:return {'status':'unavailable','source':'https://data.ipu.org/'}
 url='https://api.data.ipu.org/v1/countries/'+quote(code)
 raw=_fetch(url,timeout=8)
 data=json.loads(raw)
 obj=data.get('data') if isinstance(data,dict) else None
 if isinstance(obj,list):obj=obj[0] if obj else {}
 attrs=obj.get('attributes',{}) if isinstance(obj,dict) else {}
 # Data formats change. Display only fields actually present.
 def find_val(d,needles):
  for k,v in d.items():
   if any(n in k.lower().replace('-','_') for n in needles) and isinstance(v,(str,int,float)):
    return str(v)
  return ''
 system=find_val(attrs,['political_system'])
 pcode=iso
 chamber_url='https://api.data.ipu.org/v1/countries/'+quote(code)+'/chambers'
 chambers=[]
 try:
  cdata=json.loads(_fetch(chamber_url,timeout=8))
  for item in (cdata.get('data',[]) if isinstance(cdata,dict) else []):
   a=item.get('attributes',{}) or {}
   n=find_val(a,['name_translated','chamber_name','name'])
   if n and n not in chambers:chambers.append(n[:150])
 except Exception:pass
 return {'status':'available','political_system':system[:120], 'chambers':chambers[:3], 'source':'https://data.ipu.org/', 'raw_source':url}

def _gov_kind(iso,ipu):
 return GOVERNMENT.get(iso,'unknown')

def _select(iso,records):
 kind=GOVERNMENT.get(iso,'unknown');order=OFFICE_PRIORITIES[kind];sel=[];names=set()
 for office in order:
  for p in records:
   if p['office']!=office or p['name'].lower() in names:continue
   names.add(p['name'].lower());sel.append(p)
   break
  if len(sel)>=3:break
 return sel[:3]

def _work(iso):
 with ThreadPoolExecutor(max_workers=2) as local_pool:
  fr=local_pool.submit(cia,iso);fi=local_pool.submit(_ipu_records,iso)
  try:roster=fr.result()
  except Exception:roster={'members':[],'source':'https://www.cia.gov/resources/world-leaders/','source_updated':None}
  try:ipu=fi.result()
  except Exception:ipu={'status':'unavailable','source':'https://data.ipu.org/'}
 result={'country':iso,'kind':_gov_kind(iso,ipu),'cabinet':roster['members'], 'people':_select(iso,roster['members']),
         'cabinet_source':roster['source'],'cabinet_as_of':roster['source_updated'], 'parliament':ipu,
         'updated_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 with LOCK:CACHE[iso]=(time.time(),result);RUNNING.discard(iso)
 try:
  from auto_intel import DB_PATH
  import sqlite3
  with sqlite3.connect(str(DB_PATH),timeout=5) as db:
   db.execute('CREATE TABLE IF NOT EXISTS political_reference(iso TEXT PRIMARY KEY,ts REAL,body TEXT)')
   db.execute('INSERT OR REPLACE INTO political_reference VALUES (?,?,?)',(iso,time.time(),json.dumps(result,ensure_ascii=False)))
 except Exception:pass

def _stored(iso):
 with LOCK:
  value=CACHE.get(iso)
  if value:return value
 try:
  from auto_intel import DB_PATH
  import sqlite3
  with sqlite3.connect(str(DB_PATH),timeout=4) as db:
   row=db.execute('SELECT ts,body FROM political_reference WHERE iso=?',(iso,)).fetchone()
   if row:
    value=(row[0],json.loads(row[1]))
    with LOCK:CACHE[iso]=value
    return value
 except Exception:pass
 return None

def get(iso):
 saved=_stored(iso);now=time.time()
 with LOCK:
  if (not saved or now-saved[0]>(900 if not saved[1].get('cabinet') and saved[1].get('parliament',{}).get('status')!='available' else TTL)) and iso not in RUNNING:
   RUNNING.add(iso);POOL.submit(_work,iso)
  loading=iso in RUNNING
 seed=SNAP.get(iso,{});record=saved[1] if saved else {}
 cabinet=record.get('cabinet',[])
 if not cabinet and seed.get('cabinet'):cabinet=seed['cabinet']
 people=record.get('people',[])
 if seed.get('people'):
  seeds=seed['people']; newer=bool(record.get('cabinet_as_of') and record['cabinet_as_of']>=seed.get('verified_as_of','9999'))
  if not newer or not people:people=(seeds+[p for p in people if p['name'].casefold() not in {v['name'].casefold() for v in seeds}])[:3]
 return {'country':iso,'kind':record.get('kind',GOVERNMENT.get(iso,'unknown')),
  'people':people,'cabinet':cabinet[:50],'cabinet_groups':cabinet_groups(cabinet),'parliament': {**{'chambers':CHAMBERS.get(iso,[]),'source':'https://data.ipu.org/'},**record.get('parliament',{}), **({'chambers':CHAMBERS[iso]} if iso in CHAMBERS and not record.get('parliament',{}).get('chambers') else {})},
  'verified_as_of':seed.get('verified_as_of') or record.get('cabinet_as_of'),
  'cabinet_as_of':record.get('cabinet_as_of') or seed.get('cabinet_as_of'),'cabinet_source':record.get('cabinet_source') or seed.get('source'),
  'seed_source':seed.get('source'),'loading':loading,'stale':bool(saved and now-saved[0]>TTL),
  'coverage':len(people),'source_note':'CIA cabinet entries reflect publication date, not guaranteed live appointments.'}
