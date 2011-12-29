import unittest, os, sys

from lib.chai import objstore, session, db

class TestObjstore(unittest.TestCase):
	def setUp(self):
		db.begin()
		import lib.chai
		lib.chai.blank()
		
	def tearDown(self):
		db.rollback()
		db.close()
		
	def test_insert(self):
		objstore.insert(type="user", name="testuser", email="testmail")
		obj = db.sql("""select * from user where name='testuser'""")[0]
		self.assertTrue(obj['email'] == 'testmail')

	def test_update(self):
		self.test_insert()
		objstore.update(type="user", name="testuser", email="testmail2")
		objstore.get(type="user", name="testuser")['email']=='testmail2'
	
	def test_delete(self):
		self.test_insert()
		objstore.delete(type="user", name="testuser")
		self.assertFalse(db.sql("""select * from user where name='testuser'"""))

	def test_update_with_children(self):
		objstore.insert(type="user", name="testuser", userrole=['Admin', 'Manager'])
		objstore.update(type="user", name="testuser", userrole=['Admin', 'MX'])
		obj = objstore.get(type="user", name="testuser")
		self.assertTrue('Admin' in obj['userrole'])
		self.assertFalse('Manager' in obj['userrole'])
		self.assertTrue('MX' in obj['userrole'])

	def test_get(self):
		obj = dict(type="user", name="testuser", email="testmail", fullname="Test User")
		objstore.insert(**obj)
		obj1 = objstore.get(type="user", name="testuser")
		# clear nulls
		del obj1['_updated']
		for key in obj1.keys():
			if not obj1[key]: 
				del obj1[key]
		self.assertEquals(obj, obj1)
		
	def test_vector(self):
		obj = dict(type="user", name="testuser", email="testmail", fullname="Test User")
		objstore.insert(type="user", name="testuser", userrole=['Admin', 'Manager'])
		obj1 = objstore.get(type="user", name="testuser")
		self.assertTrue('Admin' in obj1['userrole'])
		self.assertTrue('Manager' in obj1['userrole'])

if __name__=='__main__':
	unittest.main()
