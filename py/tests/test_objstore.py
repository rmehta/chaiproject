import unittest, os, sys

from lib.py import objstore, session, database

class TestObjstore(unittest.TestCase):
	def setUp(self):
		self.db = database.get()
		self.db.begin()
		
	def tearDown(self):
		self.db.rollback()
		self.db.close()
		
	def test_post(self):
		objstore.post(type="user", name="testuser", email="testmail")
		obj = self.db.sql("""select * from user where name='testuser'""")[0]
		self.assertTrue(obj['email'] == 'testmail')

	def test_get(self):
		obj = dict(type="user", name="testuser", email="testmail", fullname="Test User")
		objstore.post(**obj)
		obj1 = objstore.get(type="user", name="testuser")
		# clear nulls
		del obj1['_updated']
		for key in obj1.keys():
			if not obj1[key]: 
				del obj1[key]
		self.assertEquals(obj, obj1)
		
	def test_vector(self):
		obj = dict(type="user", name="testuser", email="testmail", fullname="Test User")
		objstore.post(type="user", name="testuser", userrole=['Admin', 'Manager'])
		obj1 = objstore.get(type="user", name="testuser")
		self.assertTrue('Admin' in obj1['userrole'])
		self.assertTrue('Manager' in obj1['userrole'])

if __name__=='__main__':
	unittest.main()
