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

std_concat = """
concat = {
	'all.js': [
		'lib/js/json2.js',
		'lib/js/jquery/jquery.min.js',
		'lib/js/history.min.js',
		'lib/chaijs/core/core.js'
	],
	'all.css': [
		'lib/css/bootstrap.css',
		'lib/css/style.css',
	]
}"""

def newapp():
	print "Setting up new app..."
	app_name = raw_input('Enter name of the new app (all lowercase letters):')
	
	import os
	if not os.path.exists(app_name):
		os.mkdir(app_name)
	
	os.chdir(app_name)
	make_dirs()
	dbinfo = setup_db()

	print "Next steps..."
	print "Please update your settings in conf/__init__.py"
	print "Run `chai --update all` to create database tables"
	
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
	import os
	
	if not os.path.exists('__init__.py'):
		with open('__init__.py', 'w') as f:
			f.write(std_concat)
	
	if not os.path.exists('models'):
		os.mkdir('models')
		os.system('touch models/__init__.py')

	if not os.path.exists('controllers'):
		os.mkdir('controllers')
		os.system('touch controllers/__init__.py')
	
	if not os.path.exists('tests'):
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
	from lib.chai import db, site
	from lib.models import core_models
	import conf
	db.get().sync_tables(core_models)
	if 'models' in conf.sites[site]:
		db.get().sync_tables(conf.sites[site]['models'])

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

def concat():
	"""concat files from [site]/__init__.py"""
	from lib.chai import site
	import conf, os, imp, lib
	
	sitepath = conf.sites[site]['path'].strip('/')
	
	# the site folder must have an __init__.py
	moduleobj = imp.load_source(sitepath, os.path.join(sitepath, '__init__.py'))
	concat = getattr(moduleobj, 'concat', {})

	def do(concat, startpath):
		for out in concat:
			outfile = startpath and os.path.join(startpath, out) or out
			with open(outfile, 'w') as outfile:
				outstr = ''
				for part in concat[out]:
					with open(part, 'r') as infile:
						outstr += '\n' + infile.read()

				outfile.write(outstr)
				print 'wrote %s [%.1fk]' % (out, float(len(outstr)) / 1024)

	do(lib.concat, None)
	do(concat, sitepath)
	

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
	parser.add_option('-r', '--replace', help="Replace string in extenstion", nargs=3)
	parser.add_option('-c', '--concat', help="concat files from [site]/__init__.py", nargs=0)
	return parser

def main():
	"""call action based on options"""
	import os, sys, conf
	(options, args) = getparser().parse_args()
	
	import lib.chai
	lib.chai.site = options.site or conf.default_site

	from lib.chai import db

	if options.newapp is not None:
		newapp()
	
	elif options.setup is not None:
		setup_db()

	elif options.update is not None:
		if options.update=='all':
			sync_tables()
		else:
			from lib.chai import db
			db.get().sync_table(options.update)
	
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

	elif options.replace is not None:
		from lib.chai.util import replacer
		# in code
		replacer.replace(conf.sites[lib.chai.site]['path'], options.replace[0], \
			options.replace[1], options.replace[2])

		# replace in framework
		replacer.replace('lib', options.replace[0], options.replace[1], options.replace[2])

	elif options.concat is not None:
		concat()

	db.close()

if __name__=='__main__':
	import sys
	sys.path.append('.')
	main()
		
		

