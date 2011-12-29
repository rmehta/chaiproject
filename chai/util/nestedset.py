"""
Nested Set Model for hierarchies
"""

import datetime
from lib.chai import db

# to check circular references
all_nodes = []


def rebuild(type):
	"""
	rebuld lft, rgt in all elements
	needs columns `parent` and `idx`
	"""
	global all_nodes
	all_nodes = []
	db.sql("update `%s` set lft=0, rgt=0" % type)
	build(type)
	
def build(type, name=None):
	"""
	update lft, rgt in this node and all children
	adds the node at the right-most end of the parent
	take the rgt of parent and add it at rgt - 1
	
	if root, take the last rgt and add +1
	"""
	global all_nodes
		
	if not name:
		name, parent = '', ''
	else:
		parent = db.getvalue(type, name, 'parent')
		all_nodes.append(name)
	
	if parent:
		lft = db.getvalue(type, parent, 'rgt')
	else:
		lft = db.sql("select ifnull(max(rgt),0)+1 as lft from `%s`" % type)[0]['lft']
		
	now = datetime.datetime.now()
	
	# insert this node
	db.sql("update `%s` set rgt=rgt+2, _updated=%s where rgt >= %s" % (type, '%s', '%s'), (now, lft))
	db.sql("update `%s` set lft=lft+2, _updated=%s where lft >= %s" % (type, '%s', '%s'), (now, lft))
	db.sql("update `%s` set lft=%s, rgt=%s, _updated=%s where name=%s" % \
		(type, '%s', '%s', '%s', '%s'), \
		(lft, lft+1, now, name))
	
	for c in db.sql("""select name from `%s` where ifnull(parent,'')=%s""" % (type, '%s'), name):
		if c['name'] in all_nodes:
			raise Exception, '[nestedset] Circular Reference: %s' % c['name']
		build(type, c['name'])
