#!/usr/bin/python

"""file upload manager"""

import os
from lib.chai import whitelist, filespath, max_file_size

@whitelist()
def post(**args):
	"""save files in uploads folder"""
	import json
	from lib.chai import req
	
	out = {'message':'start'}
	
	try:
		if 'filedata' in req.params:
			# read the content
			fdata = req.params['filedata']
			fname, content = scrub(fdata.filename), fdata.file.read()
		
			# check size
			if len(content) > max_file_size:
				out = {"error":"file exceeds limit %sMB" % (int(max_file_size / 1024**3))}
			else:
				save(fname, content)
				out = {"message":"ok", "fname":fname}
	except Exception, e:
		out = {'error': str(e)}

	return out

def save(fname, content):
	"""save the file"""
	f = open(os.path.join(filespath(), fname), 'w+')
	f.write(content)
	f.close()

def scrub(fname):
	"""get scrubbed filename"""
	# some browsers return the full path
	if '\\' in fname:
		return fname.split('\\')[-1]
	if '/' in fname:
		return fname.split('/')[-1]
	return fname

@whitelist()
def filelist(**args):
	"""retun list of files"""
	ret = []
	import os
	import datetime
	
	for wt in os.walk(filespath()):
		for fn in wt[2]:
			fpath = os.path.join(wt[0], fn)
			ret.append([fpath, \
				str(datetime.datetime.fromtimestamp(os.stat(fpath).st_mtime)), \
				os.stat(fpath).st_size])

	return {'files':ret}

@whitelist()
def delete(**args):
	"""delete file (user must be logged in)"""
	from lib.chai import req, sess	
	import os
	os.remove(os.path.join(args['name']))
	return {"message":"ok"}
	