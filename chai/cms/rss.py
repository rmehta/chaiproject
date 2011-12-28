"""
RSS Generator
"""

import datetime
import lib.chai.cms.rss_generator as rssgen

from lib.chai import db
import conf
import urllib

def get():
	"""generate"""
	items = []
	if getattr(conf, 'app_url', None):
		# list of all Guest pages (static content)
		for r in db.sql("""select name, label, _updated
		from page where published=1 and name!='index'
		order by _updated desc"""):
			link = conf.app_url + '?page=' + urllib.quote(r['name'])
			items.append(rssgen.RSS2(
				title = r['label'],
				link = link,
				description = r.get('description', ''),
				pubDate = r['_updated']
			))

		rss = rssgen.RSS2(
			title=conf.app_title,
			link=conf.app_url,
			description = getattr(conf, 'description', ''),
			lastBuildDate = datetime.datetime.utcnow(),
			items = items)		
		
		return rss.to_xml()

if __name__=='__main__':
	print get()