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

usage_string = """
Usage:
chai newapp - create directories for new app and setup db
chai setup - create new db, setup templates and user
chai update [type] - update table schema
chai pages - write page html files
chai adduser [username] [password]
chai uwsgi-start - start uwsgi service (1)
chai uwsgi-restart - restart uwsgi service (1)
chai uwsgi-stop - restart uwsgi service (1)
"""

conf_content = """
# db settings
dbuser = '%(dbuser)s'
dbpassword = '%(dbpassword)s'
dbname = '%(dbname)s'
"""

def newapp():
	print "Setting up new app..."
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
	if not os.path.exists('model'):
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
	make_confpy(dbname=dbname, dbuser=dbuser, dbpassword=dbpassword)
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

def make_confpy(**dbinfo):
	"""setup conf.py"""		
	# write conf.py template
	dbinfo['app_name'] = raw_input('Name of your application (title case)')
	
	confpy = open('conf/dbsettings.py', 'w')
	confpy.write(conf_content % dbinfo)
	confpy.close()
	print "Wrote conf/dbsettings.py"

def sync_tables():
	"""sync all core tables, beginning with _parent_child"""
	from lib.py import database
	db = database.get()
	db.sync_core_tables()

def create_index():
	"""create index page"""
	from lib.py import objstore, database
	
	content = '''
	<h1>[Default Index]</h1>
	<p>To edit this page:</p>
	<ol>
		<li>Login
		<li>Admin -> Edit
	</ol>
	'''
	db = database.get()
	db.begin()
	# index page
	objstore.insert(type="page", html=content, name="index", label=conf.app_name)
	db.commit()
	print "index created"

def make_pages():
	"""write pages from db"""
	make_style_css()
	make_template_html()
	import pages
	pages.make()
	print "pages made"

def make_style_css():
	"""make css/style.css if not exists"""
	# copy style template
	if not os.path.exists('css/style.css'):
		import shutil
		shutil.copyfile('lib/css/style_template.css', 'css/style.css')
		print "css/style.css made"

def make_template_html():
	"""make template.html if not exists"""
	if not os.path.exists('template.html'):
		import shutil
		shutil.copyfile('lib/html/template.html', 'template.html')
		print "template.html made"


if __name__=='__main__':
	import os, sys
	sys.path.append('.')
		
	if len(sys.argv) > 1:
		cmd = sys.argv[1]
		if cmd == 'newapp':
			newapp()

		elif cmd == 'setup':
			setup_db()
			
		elif cmd == 'update':
			from lib.py import database
			table = None
			db = database.get()

			if len(sys.argv) > 2:
				table = sys.argv[2]
				db.sync_table(table)
			else:
				db.sync_tables(lib.py.core_models)
				db.sync_tables(conf.models)		

		elif cmd == 'pages':
			make_pages()
			
		elif cmd == 'adduser':
			from lib.py import database, objstore
			db = database.get()
			db.begin()
			objstore.insert(type="user", name=sys.argv[2], password=sys.argv[3])
			db.commit()
		elif cmd=='uwsgi-start':
			from lib.py.util import uwsgi_manager
			m = uwsgi_manager.manager('conf/uwsgi.xml')
			m.start(1)
		elif cmd=='uwsgi-reload':
			from lib.py.util import uwsgi_manager
			m = uwsgi_manager.manager('conf/uwsgi.xml')
			m.reload(1)
		elif cmd=='uwsgi-stop':
			from lib.py.util import uwsgi_manager
			m = uwsgi_manager.manager('conf/uwsgi.xml')
			m.stop(1)
		else:
			print usage_string
	else:
		print usage_string
		

