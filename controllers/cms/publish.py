"""
publish 

write pages, sitemap, rss
rebuild nested set
"""
from lib.controllers.cms import pages, toc
from lib.py.util import nestedset
from lib.py import database

def publish():
	db = database.get()
	db.begin()
	
	nestedset.rebuild('page')
	toc.make()
	#pages.make()

	db.commit()
	
if __name__=='__main__':
	publish()