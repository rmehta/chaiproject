import unittest, os, sys

sys.path.append('..')
import objstore, session

class TestObjstore(unittest.TestCase):
	def setUp(self):
		session.start()
		
	def tearDown(self):
		session.end()
		
	def test_get_post(self):
		objstore.post(type="user", name="testuser", email="testmail")
		obj = session.db.sql("""select * from user where name='testuser'""")[0]
		self.assertTrue(obj['email'] = 'testmail')

if __name__=='__main__':
	unittest.main()
