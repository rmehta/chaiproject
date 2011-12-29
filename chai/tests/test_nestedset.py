import unittest
from lib.chai import db, objstore
from lib.chai.util.nestedset import rebuild


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

if __name__=='__main__':
	unittest.main()