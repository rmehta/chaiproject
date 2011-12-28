#!/usr/bin/env python
"""
Chai.py
=======

Set of command line utilities to manage the app

1. Start a new app
2. Setup database
3. Update schema
4. Write html, sitemap.xml, rss files
5. Add user

"""


conf_content = """
# db settings
dbuser = '%(dbuser)s'
dbpassword = '%(dbpassword)s'
dbname = '%(dbname)s'
"""

def newapp():
	print "Setting up new app..."
	os.chdir(lib.chai.sitepath())
	make_dirs()
	dbinfo = setup_db()
	create_index()
	
def make_dirs():
	"""make dirs
	css/
	conf/
		__init__.py
	controllers/
		__init__.py
	files/
	model/
		__init__.py
	tests/
		__init__.py
	views/
	"""
	from lib.chai import sitepath
		
	if not os.path.exists('models'):
		os.mkdir('models')
		os.system('touch models/__init__.py')

	if not os.path.exists('controllers'):
		os.mkdir('controllers')
		os.system('touch controllers/__init__.py')

	if not os.path.exists('conf'):
		os.mkdir('conf')
		os.system('touch conf/__init__.py')
	
	if not os.path.exsists('tests'):
		os.mkdir('tests')
		os.system('touch tests/__init__.py')
	
	if not os.path.exists('views'):
		os.mkdir('views')

	if not os.path.exists('css'):
		os.mkdir('css')
		
	if not os.path.exists('files'):
		os.mkdir('files')
		
	print "Directory structure created."

def setup_db():
	"""setup db with core models"""
	rootuser = raw_input('Root database user:')
	rootpass = raw_input('Root database password:')
	dbname = raw_input("New database name:")
	dbuser = raw_input("New database user:")
	dbpassword = raw_input("New database password:")

	import MySQLdb
	import MySQLdb.constants.ER as ER
	
	conn = MySQLdb.connect('localhost', rootuser, rootpass)
	cur = conn.cursor()
	cur.execute("create database if not exists `%s`;" % dbname)
	print "Database created"
	create_user(cur, dbname, dbuser, dbpassword)
	print "Please update your settings in conf/__init__.py"
	sync_tables()

def create_user(cur, dbname, dbuser, dbpassword):
	"""
	create a new user and grant all privileges
	to this user
	"""
	import MySQLdb
	import MySQLdb.constants.ER as ER
	try:
		cur.execute("drop user %s@'localhost'" % dbuser)
	except: pass
	cur.execute("create user %s@'localhost' identified by %s", (dbuser, dbpassword))
	cur.execute("grant all privileges on `%s`.* to '%s'" % (dbname, dbuser))
	cur.execute("flush privileges")
	print "User created"

def sync_tables():
	"""sync all core tables, beginning with _parent_child"""
	from lib.chai import db, core_models, site
	import conf
	db.get().sync_tables(core_models)
	db.get().sync_tables(conf.sites[lib.chai.site]['models'])

def create_index():
	"""create index page"""
	from lib.chai import objstore, db
	
	content = '''
	<h1>[Default Index]</h1>
	<p>To edit this page:</p>
	<ol>
		<li>Login
		<li>Admin -> Edit
	</ol>
	'''
	db.begin()
	# index page
	objstore.insert(type="page", html=content, name="index", label=conf.app_name)
	db.commit()
	print "index created"

def publish():
	"""write pages etc."""
	from lib.chai.cms.publish import publish
	publish()

def getparser():
	"""setup option parser"""
	from optparse import OptionParser
	
	parser = OptionParser()
	parser.add_option('-s', '--site', dest='site', help='Site on which the action is to be performed')
	parser.add_option('--newapp', help='Setup new app, make dirs, setup database', nargs=0)
	parser.add_option('--setup', help='Setup database', nargs=0)
	parser.add_option('-u', '--update', dest='update', help='Update model')
	parser.add_option('--publish', help='Rebuild page tree, write toc', nargs=0)
	parser.add_option('--adduser', help='Add user', nargs=2)
	parser.add_option('--uwsgi', help='start/stop/reload uwsgi')
	parser.add_option('-r', help="Replace string in extenstion", dest='replace', nargs=3)
	return parser

def main():
	"""call action based on options"""
	import os, sys, conf
	(options, args) = getparser().parse_args()
	
	import lib.chai
	lib.chai.site = options.site or conf.default_site

	if options.newapp is not None:
		newapp()
	
	elif options.setup is not None:
		setup_db()

	elif options.update is not None:
		if options.update:
			db.get().sync_table(options.update)
		else:
			sync_tables()
	
	elif options.publish is not None:
		publish()
			
	elif options.adduser:
		from lib.chai import db, objstore
		db.begin()
		objstore.insert(type="user", name=options.adduser[0], password=options.adduser[1])
		db.commit()
		
	elif options.uwsgi is not None:
		from lib.chai.util import uwsgi_manager
		m = uwsgi_manager.manager('conf/uwsgi.xml')
		getattr(m, options.uwsgi)(1)

	elif options.replace:
		from lib.chai.util import replacer
		replacer.replace(conf.sites[lib.chai.site]['path'], options.replace[0], \
			options.replace[1], options.replace[2])

if __name__=='__main__':
	import sys
	sys.path.append('.')
	main()
		
		

