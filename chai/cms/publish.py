"""
publish 

write pages, sitemap, rss
rebuild nested set
"""
from lib.chai.cms import pages, toc
from lib.chai.util import nestedset
from lib.chai import db

def publish():
	db.begin()
	
	nestedset.rebuild('page')
	toc.make()
	#pages.make()

	db.commit()
	
if __name__=='__main__':
	publish()