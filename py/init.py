"""
start a new app, new projects db
call python lib/py/init.py admin admin123

creates a new user and index page

"""

content = '''
<h1>%(app_name)s</h1>
<p>To edit this page:</p>
<ol>
	<li>Login
	<li>Admin -> Edit
</ol>
'''

if __name__=='__main__':
	import os, sys
	
	import objstore, conf
	
	
	# user
	objstore.post(type="user", name=sys.argv[1], password=sys.argv[2], is_admin=1)
	
	# index page
	objstore.post(type="page", html=(content % {"app_name":conf.app_name}), name="index", label=conf.app_name)

	# close
	objstore.db.close(commit=True)

	# copy style template
	import shutil
	if not os.path.exists('css'):
		os.mkdir('css')
	shutil.copyfile('lib/css/style_template.css', 'css/style.css')
	
	# copy index_template.html
	index_content = file('lib/html/index_template.html','r').read()
	index = open('index_template.html', 'w')
	index.write(index_content % {"app_name":conf.app_name})
	index.close()

	# create index.html
	import pages
	pages.make()