#!/usr/bin/python

"""
Objectstore add, update and remove objects from the db

Methods:


get
---
returns a full object with children as dict

usage:
get(type=[str], name=[str])

post
----
insert/replace an object in the database

usage:
post(type=, name=, property1= ...)
post(obj=[dict])
post(obj=[json])

notes:
If a new object is to be created, a temp property "_new" must be set on the object. If this
property is present, "INSERT" will be used and an exception will be thrown on duplicate key

delete
------
"""
from lib.py import whitelist
import MySQLdb
import MySQLdb.constants.ER as ER

@whitelist
def get(**args):
	"""get an object"""
	from lib.py import model, database
	db = database.get()
	
	obj = {"type":args['type'], "name":args['name']}
	try:
		obj = db.sql("select * from `%s` where name=%s" % (args['type'], '%s'), 
			(args['name'],), as_dict=1)
		if obj:
			obj = obj[0]
		else:
			return {}
		get_children(obj, args['type'], args['name'])
		
	except MySQLdb.Error, e:
		if e.args[0]==ER.NO_SUCH_TABLE:
			pass
		else:
			raise e
			
	obj['type'] = args['type']

	modelobj = model.get(obj) or None
	modelobj and modelobj.check_allow('get')
	modelobj and modelobj.before_get()

	return obj
	
def get_children(obj, ttype, name):
	"""get children rows"""
	from lib.py import database
	db = database.get()
	
	for child_tab in db.sql("select child from _parent_child where parent=%s", 
		(ttype,)):
		childtype = child_tab['child']
		obj_list = db.sql("""select * from `%s` where parent=%s and parent_type=%s 
			order by idx asc""" % (childtype,'%s','%s'), (name, ttype))
		obj[childtype] = []
		for child in obj_list:
			del child['parent']
			del child['parent_type']
			del child['idx']

			if len(child.keys())==1 and 'value' in child:
				obj[childtype].append(child['value'])
			else:
				obj[childtype].append(child)

def get_single(obj):
	"""filter vector properties"""
	s = {}
	is_vector = False
	for k in obj:
		if type(obj[k]) not in (list, tuple, dict):
			s[k] = obj[k]
		else:
			is_vector = True
	return s, is_vector

def get_obj_from_args(args):
	"""extract obj from args either passed as object or json string"""
	if 'obj' in args:
		if type(args['obj']==str):
			import json
			return json.loads(obj)
		else:
			return args['obj']
	elif 'type' in args:
		if '_method' in args:
			del args['_method']
		return args
	else:
		raise Exception, 'Badly formed object'
			
			
@whitelist
def post(**args):
	"""post a vector object, the property name is the type. see test case for example"""
	from lib.py import model, database

	obj = get_obj_from_args(args)

	modelobj = (not obj.get('parent_type')) and model.get(obj) or None
	modelobj and modelobj.before_post()
	modelobj and modelobj.validate()
				
	obj_single, is_vector = get_single(obj)
	# save the parent
	post_single(obj_single)

	if is_vector:	
		for k in obj:
			d = {"type":k, "parent":obj["name"], "parent_type":obj["type"]}
			# dict, one child only
			if type(obj[k]) is dict:
				obj[k].update(d)
				post(obj[k])
			
			# multiple children
			if type(obj[k]) in (list, tuple):
				idx = 0
				for child in obj[k]:
					d['idx'] = idx
					idx += 1
					
					# child is a dict
					if type(child) is dict:
						child.update(d)
						post(child)
						
					# child is literal (only names)
					elif type(child) in (str, int, float):
						c = {"value":child}
						c.update(d)
						post_single(c)
					else:
						raise Exception, "child %s must be dict or literal" % str(child)	
	modelobj and modelobj.after_post()
	return {"message":"ok"}

def exists(obj):
	"""check exists by name"""
	from lib.py import database

	db = database.get()
	
	if obj.get('name') and obj.get('type'):
		return db.sql("select name from `%s` where name=%s" % \
		 	(obj['type'],'%s'), obj['name'])

def post_action(obj):
	"""identify post action"""
	if obj.get('_new'):
		return 'insert'
	elif obj.get('_replace'):
		return 'replace'
	elif not obj.get('name'):
		return 'replace'
	elif not exists(obj):
		return 'replace'
	else:
		return 'update'

def post_single(obj):
	"""post an object in db, ignore extra columns"""
	import MySQLdb
	from lib.py import database

	db = database.get()
	
	obj_copy = {}
	
	columns = db.columns(obj['type'])
	# copy valid columns
	for c in columns:
		if obj.get(c):
			obj_copy[c] = obj.get(c)

	parts = {
		'tab': obj['type'],
		'cmd': post_action(obj)
	}

	if parts['cmd'] in ('insert', 'replace'):
		parts['cols'] = '`, `'.join(obj_copy.keys())
		parts['vals'] = ('%s,'*len(obj_copy))[:-1]
		query = """%(cmd)s into `%(tab)s`(`%(cols)s`) 
			values (%(vals)s)""" % parts
	else:
		parts['set'] = ', '.join(['`%s`=%s' % (key, '%s') for key in obj_copy.keys()])
		parts['name'] = obj['name'].replace("'", "\'")
		query = """update `%(tab)s` set %(set)s where name='%(name)s'""" % parts
	
	db.sql(query, tuple(obj_copy.values()))

@whitelist	
def delete(**args):
	"""delete an object and its children"""
	db = database.get()
	from lib.py import model, database
	
	try:
		model.get(args).check_allow('delete')
		db.sql("""delete from `%s` where name=%s""" % (args['type'], '%s'), args['name'])

		# delete children
		for child_tab in db.sql("select child from _parent_child where parent=%s", (args['type'],)):
			db.sql("""delete from `%s` where parent=%s and parent_type=%s""" \
				% (child_tab['child'],'%s','%s'), (args['name'], args['type']))
	except MySQLdb.Error, e:
		if e.args[0] == ER.NO_SUCH_TABLE:
			return
		else:
			raise e
