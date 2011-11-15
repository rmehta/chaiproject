"""handle http request"""

import cgi, cgitb
cgitb.enable()

class Request:
	def __init__(self):
		"""set vars"""
		import os
		import database

		self.out = {}
		self.out_text = '' # if not json
		self.form = {}
		self.method = None
		self.db = database.get()
		
		if os.environ.get('REQUEST_METHOD'):
			self.load_env()
			self.load_form()
			self.load_cookies()
			
			# cleanup this so that request is loaded only once
			os.environ['REQUEST_METHOD'] = ''
			if not 'session.py' in self.script_name:
				self.start_session()

	def load_env(self):
		"""load env variables"""
		import os
		e = {}
		for k in os.environ:
			e[k.lower()] = os.environ[k]
		self.__dict__.update(e)
		
		self.method = self.request_method.lower()
	
	def load_form(self):
		"""load form data"""
		f = cgi.FieldStorage()
		self.formdata = f
		if f:
			for k in f:
				self.form[k] = f.getvalue(k)
			
		if 'json' in self.form:
			import json
			self.form['json'] = json.loads(self.form['json'])
			
	def load_cookies(self):
		"""load cookies"""
		import Cookie
		self.cookies = {}
		self.simple_cookie = Cookie.SimpleCookie()
		if 'http_cookie' in self.__dict__:
			self.simple_cookie.load(self.http_cookie)
			for c in self.simple_cookie.values():
				self.cookies[c.key] = c.value
	
	def print_cookies(self):
		"""print cookies"""
		self.simple_cookie['sid']=self.session.name
		self.simple_cookie['user']=self.session.user
		print self.simple_cookie.output()
		
	def start_session(self):
		"""create/load session"""
		from session import Session
		self.session = Session(self)
		self.session.load()
	
	def type_handler(self, obj):
		if hasattr(obj, 'strftime'):
			return str(obj)
					
	def close(self):
		"""print json"""
		self.db.conn.commit()
		self.db.close()
		
		if not self.method:
			return
		
		ctype = self.out_text and 'text/html' or 'application/json'

		import json
		self.print_cookies()
		print "Content-Type: " + ctype
		print
		print self.out_text or json.dumps(self.out, default = self.type_handler)

def get_traceback():
	import sys, traceback, string
	type, value, tb = sys.exc_info()
	
	body = "Traceback (innermost last):\n"
	list = traceback.format_tb(tb, None) + traceback.format_exception_only(type, value)
	return body + "%-20s %s" % (string.join(list[:-1], ""), list[-1])

req = None
def main(module='__main__'):
	"""run methods on main class"""
	global req
	req = Request()
	
	import database
	if req.method in ('post', 'delete'):
		req.db.begin()
	
	if isinstance(module, basestring):
		moduleobj = __import__(module)
		if hasattr(moduleobj, req.method):
			try:
				ret = getattr(moduleobj, req.method)(**req.form)
				if ret:
					req.out.update(ret)
			except Exception, e:
				req.out['traceback'] = get_traceback()
				req.out['error'] = str(e.args[0])

	if req.method in ('post', 'delete'):
		req.db.commit()
		
	req.close()