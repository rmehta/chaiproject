"""
Generate Sitemap

Usage:
------

get()
"""

max_items = 1000

from lib.chai import db
import conf

frame_xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">%s
</urlset>"""

link_xml = """\n<url><loc>%s</loc><lastmod>%s</lastmod></url>"""

def get():
	import urllib

	site_map = ''
	if getattr(conf, 'app_url', None):
		# list of all Guest pages (static content)
		for r in db.sql("""select name, _updated 
			from page where published=1 and name!='index'
			order by _updated desc"""):
			
			page_url = conf.app_url + '?page=' + urllib.quote(r['name'])
			site_map += link_xml % (page_url, r['_updated'].strftime('%Y-%m-%d'))

	return frame_xml % site_map

if __name__=='__main__':
	print get()