"""
Basic utilities for testing

1. Register a test user
2. Login a test user
3. De-register (cleanup)
"""

url = 'http://localhost:8080/server/'
cookies = None
userobj = None

import unittest
last_response = None

def xcall(method, args, method_type='get'):
	"""make a server call"""
	import requests
	global cookies, last_response

	params = {"_method":method}
	params.update(args)
	res = getattr(requests, method_type)(url, params = params, cookies = cookies)
	last_response = res
	
	#print res.content
	
	import json
	rjson = json.loads(res.content)
	
	if res.cookies:
		cookies = res.cookies
	
	if 'error' in rjson:
		print rjson
		raise Exception
		
	return rjson
	
def register(user='testuser', password='testpass'):
	"""register a new user"""
	resp = xcall('lib.py.objstore.post', {
		"type":"user",
		"name":user,
		"password":password }, 'post')

def login(user='testuser', password='testpass'):
	resp = xcall('lib.py.session.login', {"user":user, "password":password});
	if resp.get('message') == 'ok':
		global userobj
		userobj = resp.get('userobj')
	else:
		raise Exception, 'bad login'

def cleanup():
	"""logout testuser and cleanup"""
	from lib.py import database
	db = database.get()
	db.begin()
	db.sql("""delete from session where user=%s""", userobj['name'])
	db.sql("""delete from user where name=%s""", userobj['name'])
	db.commit()

class TestUtils(unittest.TestCase):
	def tearDown(self):
		"""cleanup, de-register testuser"""
		cleanup()
		
	def test_all(self):
		register()
		login()
		self.assertTrue(userobj['name']=='testuser')
	
if __name__=='__main__':
	unittest.main()