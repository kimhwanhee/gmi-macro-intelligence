"""Recreate server and portable standalone HTML from the current source files (stdlib only)."""
from pathlib import Path
p=Path(__file__).parent
html=p.joinpath('index.template.html').read_text(encoding='utf8')
html=html.replace('__WORLD_PATHS__',p.joinpath('world-paths.html').read_text(encoding='utf8')).replace('__COUNTRY_PINS__',p.joinpath('country-pins.html').read_text(encoding='utf8'))
p.joinpath('index.html').write_text(html,encoding='utf8')
html=html.replace('<link rel="stylesheet" href="./styles.css" />','<style>'+p.joinpath('styles.css').read_text(encoding='utf8')+'</style>')
html=html.replace('<script src="./country-catalog.js"></script>','<script>'+p.joinpath('country-catalog.js').read_text(encoding='utf8')+'</script>')
html=html.replace('<script src="./app.js"></script>','<script>'+p.joinpath('app.js').read_text(encoding='utf8')+'</script>')
p.joinpath('GMI_Standalone_Demo.html').write_text(html,encoding='utf8')
Path('/mnt/data/GMI_All_Countries_Standalone.html').write_text(html,encoding='utf8')
print('Reassembled HTML.')
