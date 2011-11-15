"""
start a new app, new projects db


creates a new user and index page

Usage:
python lib/py/init.py dbroot dbrootpassword
"""

def create_objs():
	content = '''
	<h1>%(app_name)s</h1>
	<p>To edit this page:</p>
	<ol>
		<li>Login
		<li>Admin -> Edit
	</ol>
	'''
	# user
	objstore.post(type="user", name=conf.dbuser, password=conf.dbpassword, \
		is_admin=1)
	
	# index page
	objstore.post(type="page", html=(content % {"app_name":conf.app_name}), \
		name="index", label=conf.app_name)

	database.db.commit()

def make_style_css():
	# copy style template
	import shutil
	if not os.path.exists('css'):
		os.mkdir('css')
	shutil.copyfile('lib/css/style_template.css', 'css/style.css')

def make_index_html():
	# copy index_template.html
	index_content = file('lib/html/index_template.html','r').read()
	index = open('index_template.html', 'w')
	index.write(index_content % {"app_name":conf.app_name})
	index.close()

	import pages
	pages.make()
	
if __name__=='__main__':
	import os, sys
	import objstore, conf, database
	
	if len(sys.argv) > 1:
		database.create_db(sys.argv[1], sys.argv[2])
		print "database %s created" % conf.dbname
	
	database.get().sync_tables()

	#create_objs()
	#make_style_css()
	#make_index_html()