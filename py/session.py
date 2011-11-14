#!/usr/bin/python
import http_request, json

user = None

class Session:
	def __init__(self, req):
		"""load session"""
		from objstore import ObjStore
		self.obs = ObjStore(req)
		self.req = req
		self.user = ''
		self.name = ''

	def load(self):
		"""resume session via cookie or start a new guest session"""
		global user
		if 'sid' in self.req.cookies:
			self.__dict__.update(self.obs.get("session", self.req.cookies['sid']))
		else:
			self.user = 'guest'
			self.new_sid()
			self.obs.post({"type":"session", "user":self.user, "name":self.name})

			user = self.user
	
	def password_okay(self):
		"""check passwords"""
		import hashlib
		pwd = self.req.db.sql("select password from user where name=?", (self.req.form['user'],))
		if pwd: pwd = pwd[0][0]
		
		return pwd == hashlib.sha256(self.req.form.get("password")).hexdigest()
	
	def new(self):
		"""start a new session"""
		global user

		if not self.password_okay():
			self.req.form = {}
			self.req.method = 'error'
			self.user = 'guest'
			self.req.out["error"] = "Incorrect login"
		else:
			self.req.out["message"] = "ok"	
			self.new_sid()
			self.user = self.req.form['user']
			self.obs.post({"type":"session", "user":self.user, "name":self.name})
			user = self.user

	def new_sid(self):
		"""set new sid"""
		import hashlib, time
		self.name = hashlib.sha224(str(time.time())).hexdigest()

	def logout(self):
		"""logout sessions"""
		if 'user' in self.req.cookies:
			self.req.db.sql("delete from session where user=?", (self.req.cookies['user'],))
			self.name = ''
			self.user = 'guest'

def get(**args):
	"""start a new session"""
	req = http_request.req
	req.session = Session(req)
	if req.form.get('user'):
		req.session.new()
	else:
		req.session.load()
	return {
		"user":req.session.user, 
		"sid":req.session.name, 
		"userobj":req.session.obs.get('user',req.session.user)
	}

def delete(**args):
	"""logout"""
	req = http_request.req
	req.session = Session(req)
	req.session.logout()
		
# request handling
if __name__=='__main__':
	http_request.main()