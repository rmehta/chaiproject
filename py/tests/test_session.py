"""
test session setup, login, logout
"""

import unittest

from lib.py import database, objstore, session

class TestSession(unittest.TestCase):
	def setUp(self):
		import lib.py
		self.db = database.get()
		lib.py.blank()
		self.db.begin()
		
	def test_guest(self):
		sess = session.load()
		self.assertTrue(sess['user']=='guest')
		self.assertTrue(sess['name']=='guest')

	def test_login(self):
		# make a user
		from webob import Request, Response
		import lib.py

		objstore.insert(type='user', name='test',password='pass')
		lib.py.req = Request.blank('server/?_method=lib.py.session.login&user=test&password=pass')
		lib.py.res = Response()

		# login
		ret = session.login(**lib.py.req.params)
		
		self.sid = lib.py.res.headers.get('Set-Cookie').split(';')[0].split('=')[1]
		self.assertTrue(ret['userobj']['name']=='test')
		self.assertTrue(ret['message']=='ok')
		self.assertTrue(self.db.sql("""select * from session where user='test'""")[0]['user']=='test')

	def test_bad_login(self):
		from webob import Request, Response
		import lib.py

		objstore.insert(type='user', name='test',password='pass')
		lib.py.req = Request.blank('server/?_method=lib.py.session.login&user=test&password=111')
		lib.py.res = Response()

		# login
		ret = session.login(**lib.py.req.params)
		self.assertTrue(ret['error']=='Invalid Login')
		self.assertTrue('message' not in ret)

	def test_logout(self):
		from webob import Request
		import lib.py

		self.test_login()
		lib.py.req = Request.blank('server/?_method=lib.py.session.logout', \
			headers=[('Cookie','sid='+self.sid+';')])
		session.logout()
		self.assertFalse(self.db.sql("""select * from session where user='test'"""))
		
	def tearDown(self):
		# cleanup
		objstore.delete(type='user', name='test')
		self.db.sql("""delete from session where user='test'""")

		self.db.rollback()
		
if __name__=='__main__':
	unittest.main()
