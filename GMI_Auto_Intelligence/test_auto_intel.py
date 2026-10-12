"""Run: python test_auto_intel.py (offline fixture verification)."""
import tempfile
from pathlib import Path
import auto_intel as a

RSS = b'''<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>South Korea and Japan foreign ministers hold bilateral summit talks</title>
<link>https://example.org/news/test-one</link>
<description>South Korea and Japan held diplomatic meetings.</description>
<pubDate>Mon, 12 Oct 2026 04:00:00 GMT</pubDate></item></channel></rss>'''

def run():
    records=a.parse_feed(RSS,'Offline fixture','aggregator')
    assert len(records)==1
    assert records[0]['date']=='2026-10-12'
    result=a.classify_rules(records[0])
    assert result['kind']=='diplomacy'
    assert result['countries']==['KOR','JPN']
    old=a.DB_PATH
    try:
        with tempfile.TemporaryDirectory() as directory:
            a.DB_PATH=Path(directory)/'test.sqlite3'
            a.init_db()
            assert a.process_articles(records)[0]==1
            assert a.process_articles(records)[0]==0
            events=a.list_events()
            assert len(events)==1
            assert events[0]['countries']==['KOR','JPN']
            assert a.status()['saved_count']==1
    finally:
        a.DB_PATH=old
    print('PASS: parser, topic detection, country relationships, SQLite auto-register and deduplication')

if __name__=='__main__':run()
