import unittest

from lib.chai import rdfstore, db

class TestRDFStore(unittest.TestCase):
	def setUp(self):
		db.begin()

	def tearDown(self):
		db.rollback()
		
	def test_insert(self):
		a = rdfstore.insert(name='o1', type='t1', somekey='someval')
		self.assertEquals(a['message'], 'ok')

	def test_get(self):
		self.test_insert()		
		b = rdfstore.get(name='o1')
		self.assertEquals(b['somekey'], 'someval')
	
	def test_delete(self):
		self.test_get()
		rdfstore.delete(name='o1')
		self.assertFalse(db.sql("select * from rdf_triple where subject=%s", 'o1'))
	
if __name__=='__main__':
	import sys
	unittest.main()