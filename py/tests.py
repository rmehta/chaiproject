path = 'http://localhost/rmehta/erpnext.org/lib/py/'

import requests, json
import objstore
import unittest
import conf

# test path
conf.db_path = 'test.db'

class TestObjStore(unittest.TestCase):
	def tearDown(self):
		"""clear the db"""
		import os, conf
		if os.path.exists(conf.db_path):
			os.remove(conf.db_path)
				
	def test_objstore(self):
		obs = objstore.ObjStore()
		obs.post({"type":"user", "name":"test"})
		obs.post({"type":"user", "name":"test", "email":"test2"})
				
		obj = obs.get("user","test")
		self.assertTrue(obj['name']=='test' and obj['email']=='test2')
	
	def test_parent_child_created(self):
		obs = objstore.ObjStore()
		obs.post({"type":"user", "name":"test", "user_role":["admin", "guest"]})
		r = obs.sql("select * from _parent_child", as_dict=1)[0]
		self.assertTrue(r['parent']=="user" and r['child']=="user_role")

		r = obs.get("user", "test")
		self.assertTrue("admin" in r["user_role"])

	
	def test_vector_variations(self):
		obs = objstore.ObjStore()

		obs.post({"type":"user", "name":"test", "user_comment":[
			{"text":"hello", "on":"2011-11-11"}]})
		r = obs.sql("select * from user_comment", as_dict=1)[0]
		self.assertTrue(r["text"]=="hello")
		
		r = obs.get("user", "test")
		self.assertTrue(r["user_comment"][0]["text"] == "hello")

		obs.post({"type":"user", "name":"test", "user_family":{
			"father":"test_father", "mother":"test_mother"
		}})
		r = obs.sql("select * from user_family", as_dict=1)[0]
		self.assertTrue(r["mother"]=="test_mother")

		r = obs.get("user", "test")
		self.assertTrue(r["user_family"][0]["father"] == "test_father")

	def test_post(self):	
		# first post
		login = requests.get(path + 'session.py', params = {"user":"test", "password":"p1"})

		r = requests.post(path + 'objstore.py', 
			params = {"json": json.dumps({"type":"user","name":"test"})}, cookies = login.cookies)
		r = json.loads(r.content)
		self.assertTrue(r['message'] == 'ok')
		
		# then get
		r = requests.get(path + 'objstore.py', 
			params = {"type":"user", "name":"test"}, cookies = login.cookies)
		r = json.loads(r.content)
		self.assertTrue(r['name'] == 'test')
		
	def test_add_column(self):
		login = requests.get(path + 'session.py', params = {"user":"test", "password":"p1"})

		r = requests.post(path + 'objstore.py', 
			params = {"json": json.dumps({"type":"user","name":"test"})}, cookies = login.cookies)
		r = json.loads(r.content)
		self.assertTrue(r['message'] == 'ok')

		r = requests.post(path + 'objstore.py', 
			params = {"json": json.dumps({"type":"user","name":"test",
			"email":"test3"})}, cookies = login.cookies)
		r = json.loads(r.content)
		self.assertTrue(r['message'] == 'ok')

		# then get
		r = requests.get(path + 'objstore.py', 
			params = {"type":"user", "name":"test"})
		r = json.loads(r.content)
		self.assertTrue(r['email'] == 'test3')

	def test_query(self):
		r = requests.get(path + 'query.py', 
			params = {"json": json.dumps({
				"type":"page", 
				"columns":"name, label, _updated",
				"order_by":"label asc"})})
		#print r.content
		
	def test_filelist(self):
		r = requests.get(path + 'files.py')
		#print r.content

if __name__=='__main__':
	unittest.main()