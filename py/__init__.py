"""
Package lib.py
==============

Server library:

Globals stored at this level:

req - webob.Request
res - webob.Response
sess - session dict
out - response dict
whitelisted - methods that can be called directly via http
files_path - where uploaded files go
max_files_size - max file size allowed
core_models - core models
"""

import os

req = None
res = None
sess = None
out = {}
whitelisted = []
files_path = os.path.join(os.path.dirname(__file__), '../../files')
max_file_size = 1024**3
core_models = ['_parent_child', 'page', 'subpage', 'user', 'session', 'userrole']

def whitelist(allow_guest=False):
	"""
	decorator for whitelisting a function
	
	Note: if the function is allowed to be accessed by a guest user,
	it must explicitly be marked as allow_guest=True
	"""
	if allow_guest==False and sess and sess['user'] == 'guest':
		raise Exception, 'Not allowed'
			
	def innerfn(fn):
		global whitelisted
		whitelisted.append(fn)

		return fn

	return innerfn
	
def blank():
	"""start an empty session for testing"""
	global sess, req
	from webob import Request
	req = Request.blank('server/')
	sess = {"user":"test"}