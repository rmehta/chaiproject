"""
project utils
"""

usage_string = """
Usage:
chai setup [dbroot] [dbroot password]- create new db, setup templates and user
chai update [type] - update table schema
chai pages - write page html files
chai adduser [username] [password]
"""

def create_user_and_index():
	"""create first user and index page"""
	import objstore, database
	
	content = '''
	<h1>%(app_name)s</h1>
	<p>To edit this page:</p>
	<ol>
		<li>Login
		<li>Admin -> Edit
	</ol>
	'''
	database.get()
	database.conn.sync_tables()

	database.conn.begin()

	# user
	objstore.post(type="user", name=conf.dbuser, password=conf.dbpassword, \
		is_admin=1)
	
	# index page
	objstore.post(type="page", html=(content % {"app_name":conf.app_name}), \
		name="index", label=conf.app_name)

	database.conn.commit()
	print "dbuser and index created"

def make_style_css():
	"""make css/style.css if not exists"""
	# copy style template
	if not os.path.exists('css/style.css'):
		import shutil
		if not os.path.exists('css'):
			os.mkdir('css')
		shutil.copyfile('lib/css/style_template.css', 'css/style.css')
		print "css/style.css made"

def make_index_html():
	"""make template.html if not exists"""
	if not os.path.exists('template.html'):
		index_content = file('lib/html/template.html','r').read()
		index = open('template.html', 'w')
		index.write(index_content % {"app_name":conf.app_name})
		index.close()
		print "template.html made"

def make_folders():
	"""make models, files folders if not exists"""
	if not os.path.exists('models'):
		os.mkdir('models')
		os.system('touch models/__init__.py')
	if not os.path.exists(conf.files_path):
		os.mkdir(conf.files_path)

def make_pages():
	"""write pages from db"""
	import pages
	pages.make()
	print "pages made"

def create_db(rootuser, rootpass):
	"""create a new db"""
	import MySQLdb
	import MySQLdb.constants.ER as ER
	
	conn = MySQLdb.connect('localhost', rootuser, rootpass)
	cur = conn.cursor()
	cur.execute("create database if not exists `%s`;" % conf.dbname)
	try:
		cur.execute("create user %s@'localhost' identified by %s", (conf.dbuser, conf.dbpassword))
	except MySQLdb.Error, e:
		if e.args[0]!=ER.CANNOT_USER:
			raise e
	cur.execute("grant all privileges on `%s`.* to '%s'" % (conf.dbname, conf.dbuser))
	cur.execute("flush privileges")


if __name__=='__main__':
	import os, sys
	import objstore, conf, database
	
	if len(sys.argv) > 1:
		cmd = sys.argv[1]
		if cmd == 'setup':
			create_db(sys.argv[2], sys.argv[3])
			print "database %s created" % conf.dbname

			make_folders()
			make_style_css()
			make_index_html()	
			create_user_and_index()
			make_pages()
		
		elif cmd == 'update':
			table = None
			if len(sys.argv) > 1:
				table = sys.argv[1]
			
			database.get().sync_tables(table)
		
		elif cmd == 'pages':
			make_pages()
			
		elif cmd == 'adduser':
			objstore.post(type="user", name=sys.argv[2], password=sys.argv[3])
			
		else:
			print usage_string
	else:
		print usage_string
		
	database.get().sync_tables()

