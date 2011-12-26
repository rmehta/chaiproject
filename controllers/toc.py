"""
generate toc from pages

Usage
-----
make()

Discussion
----------

Will create a TOC html page with toc template as the base
based on "subpage" list in a page
"""

import os
from lib.py import database, objstore

db = database.get()
moduledir = os.path.dirname(__file__)

all_nodes = ['index']
level = 0

def make():
	"""write pages/toc.html"""
	index = db.sql("select name, label from page where name='index'")[0]

	db.begin()
	objstore.delete_obj('page', 'toc')
	objstore.insert(type='page', name='toc', label='Contents', html=template(nodehtml(index)))
	db.commit()
	
def template(content):
	"""get toc from template or simple"""
	
	t = """<h1>Table of Contents</h1>\n<div>\n%s\n</div>"""
	path = os.path.join(moduledir, '../../conf/toc_template.html')
	
	if os.path.exists(path):
		with open(path, 'r') as f:
			t = f.read()
	
	return t % content
	
def nodehtml(node):
	"""return html of a particular node"""
	global level
	
	children = getchildren(node['name'])
	out = '<a href="pages/%(name)s.html">%(label)s</a>' % node
	if children:
		out += children
		
	return out
	
def getchildren(node):
	"""get children <ol>"""
	global all_nodes, level
	
	cl = db.sql("""select name, label from page
		where parent = %s order by idx""", node)

	if not cl:
		return None

	level += 1

	out = '\n' + ('\t'*level) + '<ol>'
	for node in cl:
		if node['name'] in all_nodes:
			raise Exception, 'Circular Page Reference'

		all_nodes.append(node['name'])
		out += '\n' + ('\t'*(level+1)) + '<li>'+nodehtml(node)+'</li>'
		
	out +='\n' + ('\t'*level) + '</ol>'
	
	level -= 1
	
	return out
	
if __name__=="__main__":
	make()