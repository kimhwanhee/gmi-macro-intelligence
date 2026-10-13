"""Two constitutionally defined executive/state offices, never inferred political ranks."""
import json, time
from pathlib import Path
import research_api
BASE=json.loads((Path(__file__).parent/'leadership-snapshots.json').read_text(encoding='utf8'))

def leadership(country):
    saved=BASE.get(country)
    if saved:
        # Pre-vetted official public rosters return immediately; no Wikidata round trip.
        return {'country':country,'people':saved['people'][:2],
                'verified_as_of':saved['verified_as_of'],'source':'Official state or government publication', 'loading':False}
    fallback=research_api.leader(country)
    people=[];seen=set()
    for p in fallback.get('people',[]):
        if not p.get('name') or p.get('name') in seen:continue
        seen.add(p['name'])
        people.append(p)
    return {'country':country,'people':people[:2],
            'verified_as_of':fallback.get('verified_as_of'),
            'source':fallback.get('source','Wikidata'),
            'loading':fallback.get('loading',False),
            'partial':len(people)<2}
