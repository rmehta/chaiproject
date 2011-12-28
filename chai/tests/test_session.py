"""
test session setup, login, logout
"""

import unittest

from lib.chai import db, objstore, session

class TestSession(unittest.TestCase):
	def setUp(self):
		import lib.chai
		lib.chai.blank()
		db.begin()
		
	def test_guest(self):
		sess = session.load()
		self.assertTrue(sess['user']=='guest')
		self.assertTrue(sess['name']=='guest')

	def test_login(self):
		# make a user
		from webob import Request, Response
		import lib.chai

		objstore.insert(type='user', name='test',password='pass')
		lib.chai.req = Request.blank('server/?_method=lib.chai.session.login&user=test&password=pass')
		lib.chai.res = Response()

		# login
		ret = session.login(**lib.chai.req.params)
		
		self.sid = lib.chai.res.headers.get('Set-Cookie').split(';')[0].split('=')[1]
		self.assertTrue(ret['userobj']['name']=='test')
		self.assertTrue(ret['message']=='ok')
		self.assertTrue(db.sql("""select * from session where user='test'""")[0]['user']=='test')

	def test_bad_login(self):
		from webob import Request, Response
		import lib.chai

		objstore.insert(type='user', name='test',password='pass')
		lib.chai.req = Request.blank('server/?_method=lib.chai.session.login&user=test&password=111')
		lib.chai.res = Response()

		# login
		ret = session.login(**lib.chai.req.params)
		self.assertTrue(ret['error']=='Invalid Login')
		self.assertTrue('message' not in ret)

	def test_logout(self):
		from webob import Request
		import lib.chai

		self.test_login()
		lib.chai.req = Request.blank('server/?_method=lib.chai.session.logout', \
			headers=[('Cookie','sid='+self.sid+';')])
		session.logout()
		self.assertFalse(db.sql("""select * from session where user='test'"""))
		
	def tearDown(self):
		# cleanup
		objstore.delete(type='user', name='test')
		db.sql("""delete from session where user='test'""")

		db.rollback()
		
if __name__=='__main__':
	unittest.main()
