"""Read-only foreign minister summary for country header.
Use a dated official primary-source snapshot where independently verified;
otherwise use a dated government roster without claiming to verify current tenure.
"""
import political_data
import research_api

# Latest official foreign ministry landing page confirms Ahmat Kogri, Oct 2026.
# Incoming minister appointed on Sep 21 and installed on Sep 22 (2026).
CONFIRMED = {
 'TCD': {
  'office': 'foreign_minister',
  'name': 'Ahmat Kogri',
  'name_ko': '아흐마트 코그리',
  'name_zh': '阿赫马特·科格里',
  'title': "Ministre d'État, Ministre des Affaires étrangères, de l'Intégration africaine et des Tchadiens de l'étranger",
  'term_start': '2026-09-22',
  'source': 'https://diplomatie.td/',
  'verified_as_of': '2026-10-14',
 }
}

def get(iso):
    seed=CONFIRMED.get(iso)
    if seed:
        return {'country':iso, 'person':seed, 'loading':False,'source':'official_foreign_ministry', 'verified_as_of':seed['verified_as_of']}
    government=political_data.get(iso)
    records=government.get('cabinet_groups',{}).get('foreign_minister',[])
    if not records:
        # political_data supplies verified seed cabinet data for some countries;
        # a fresh remote cabinet collection may not have finished on first call.
        snapshot=political_data.SNAP.get(iso,{})
        records=[x for x in snapshot.get('cabinet',[]) if x.get('office')=='foreign_minister']
    if not records:
        old=research_api._OFFICIAL_SNAPSHOTS.get(iso,{})
        records=[x for x in old.get('people',[]) if x.get('office')=='foreign_minister']
    if records:
        p=dict(records[0]);p['office']='foreign_minister'
        return {'country':iso,'person':p,
                'verified_as_of':government.get('cabinet_as_of') or government.get('verified_as_of'),
                'loading':government.get('loading',False),'source':'dated_cabinet_roster'}
    return {'country':iso,'person':None,'loading':government.get('loading',False),'verified_as_of':government.get('cabinet_as_of'), 'source':'roster_not_available'}
