"""
Nested Set Model for hierarchies
"""

import unittest, datetime
from lib.py import database, objstore, model

db = database.get()

# to check circular references
all_nodes = []

class TestNesetedSet(unittest.TestCase):
	def setUp(self):
		db.begin()
		# clear existing (temp)
		db.sql("set foreign_key_checks = 0")
		db.sql("delete from page")
		db.sql("set foreign_key_checks = 1")

	def tearDown(self):
		db.rollback()
	
	def test_insert(self):
		objstore.insert(type='page', name='r1')
		objstore.insert(type='page', parent='r1', name='p1', idx=0)
		objstore.insert(type='page', parent='r1', name='p2', idx=1)

		rebuild('page')

		r1 = objstore.get(type='page', name='r1')
		p1 = objstore.get(type='page', name='p1')
		p2 = objstore.get(type='page', name='p2')
	
		self.assertEquals(r1['lft'], 1)
		self.assertEquals(p1['lft'], 2)
		self.assertEquals(p1['rgt'], 3)
		self.assertEquals(p2['lft'], 4)
		self.assertEquals(p2['rgt'], 5)
		self.assertEquals(r1['rgt'], 6)
		
	def test_new(self):
		self.test_insert()
		objstore.insert(type='page', name='p11', parent='p1')

		rebuild('page')

		r1 = objstore.get(type='page', name='r1')
		p1 = objstore.get(type='page', name='p1')
		p2 = objstore.get(type='page', name='p2')
		p11 = objstore.get(type='page', name='p11')

		self.assertEquals(r1['lft'], 1)
		self.assertEquals(p1['lft'], 2)
		self.assertEquals(p11['lft'], 3)
		self.assertEquals(p11['rgt'], 4)
		self.assertEquals(p1['rgt'], 5)
		self.assertEquals(p2['lft'], 6)
		self.assertEquals(p2['rgt'], 7)
		self.assertEquals(r1['rgt'], 8)


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
	
if __name__=='__main__':
	unittest.main()