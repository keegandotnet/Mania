from pathlib import Path
p=Path(__file__).with_name('build.py')
s=p.read_text(encoding='utf-8')
s=s.replace("<p class=\"small muted\">Waiting for the album instead? Show the round and a refresh action; no review form.</p>","<div class=\"row small\"><u>Results</u><u>Group details</u></div>")
s=s.replace("<p class=\"small\">On the final round:","<div class=\"callout\"><b>Before the pick · Other players</b><br>Round 2 of 4 · Waiting for the album<br>The picker hasn’t submitted an album yet. <u>Refresh</u></div><p class=\"small\">On the final round:")
s=s.replace(".album.inline>.art{width:93px;margin:0}",".album.inline>.art{width:145px;margin:0}")
s=s.replace(".cols{display:grid;gap:30px}",".cols{display:grid;gap:30px}.cols>*{min-width:0}")
s=s.replace(".missing{height:55px", ".missing{height:100px")
# Public homepage has no selected group or authenticated navigation.
s=s.replace("css=r'''", "pages[4]=pages[4].replace('mania / Sunday Records','mania').replace('<span>Sunday Records ▾</span><span>Play　 Results　 Group　 Account</span>','<span>How it works</span><span>Log in</span>').replace('<span>Sunday Records ▾</span><span>•••</span>','<span>Log in</span>')\n\ncss=r'''")
p.write_text(s,encoding='utf-8')
