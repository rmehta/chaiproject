import unittest, os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
import objstore, session, database

class TestSession(unittest.TestCase):
	def setUp(self):
		pass
		
	def test_login(self):
		import requests
		session.get