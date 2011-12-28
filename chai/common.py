"""
common functions
"""

def directory_root():
	"""path to www (parent of parent of current directory)"""
	import os
	return os.path.join(os.path.dirname(__file__), '../..')

def update_path():
	"""add the directory_root to path"""
	import sys
	sys.path.append(directory_root())
	
def log(msg):
	"""log some info to publish in client console"""
	from lib.chai import req, out
	if not req: 
		return
		
	if not out.get('_log'):
		out['_log'] = []
	out['_log'].append(msg)
	
def traceback():
	"""Returns the traceback of the Exception"""
	import sys, traceback, string
	type, value, tb = sys.exc_info()
	
	body = "Traceback (innermost last):\n"
	list = traceback.format_tb(tb, None) + traceback.format_exception_only(type, value)
	body = body + "%-20s %s" % (string.join(list[:-1], ""), list[-1])
	
	return body
