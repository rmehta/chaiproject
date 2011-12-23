"""
Module `objstore`
=================

Objectstore get, insert, update and delete objects from the db

Objects for insert and update can be passed in any of the following formats:

post(type=, name=, property1= ...)
post(obj=[dict])
post(obj=[json])

Vector objects
--------------

Objects can also be vectors and can have property values as lists or lists of dicts.
For example::

	obj = {"name":"test", "type":"user", "user_role":["admin", "manager"]}

Such objects are stored in two tables, `user` and `user_role`. The child table `user_role`
must have 3 columns `parent`, `parent_type`, `idx`. idx is to maintain the sequence of the
vector property.

If the child items have only one property, it is stored by default in a column by name `value`.
If the child is a dict, then each key becomes the table column. The child tables must have
their schema declared as models.

Callable Methods
----------------

4 methods are directly callable by client with a valid session

1. get
2. insert
3. update
4. delete

Update and child items
----------------------

All child items must be passed during update. Update will clear all child items and
insert them again.

"""

from lib.py import whitelist, model, database
import MySQLdb
import MySQLdb.constants.ER as ER

@whitelist(allow_guest=True)
def get(**args):
	"""get an object"""
	db = database.conn
	
	obj = _get_obj(type=args['type'], name=args['name'])
	if not obj:
		return {}
		
	# check permissions
	modelobj = model.get(obj) or None
	modelobj and modelobj.check_allow('get')
	modelobj and modelobj.before_get()

	return obj

def _get_obj(type, name):
	"""load an object without any events"""
	db = database.conn
	
	obj = db.sql("select * from `%s` where name=%s" % (type, '%s'), 
		name, as_dict=1)
	if not obj:
		return {}
	else:
		obj = obj[0]
		# add "type" property		
		obj['type'] = type

	load_children(obj, type, name)
		
	return obj
	
def load_children(obj, ttype, name):
	"""get children rows"""
	db = database.conn
	
	for childtype in children_types(ttype):
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
				
def children_types(parenttype):
	"""get children types for parent type from table `_parent_child`"""
	return [c['child'] for c in \
		database.conn.sql("select child from _parent_child where parent=%s", parenttype)]				

@whitelist()
def insert(**args):
	"""insert a new object"""
	return post(args, action='insert')

@whitelist()
def update(**args):
	"""update object (child items are cleared and rewritten)"""
	return post(args, action='update')

def post(args, action):
	"""Post a vector object, the property name is the type. See test case for example"""

	obj = get_obj_from_args(args)
	if action=='update':
		delete_children(obj['type'], obj['name'])

	modelobj = (not obj.get('parent_type')) and model.get(obj) or None
	modelobj and getattr(modelobj, 'before_' + action.lower())()
	modelobj and modelobj.validate()

	obj_single, is_vector = get_single(obj)
	# save the parent
	try:
		post_single(obj_single, action)
	except MySQLdb.IntegrityError, e:
		return {"error":"name exists"}

	if is_vector:
		post_children(obj)
		
	modelobj and getattr(modelobj, 'after_' + action.lower())()
	return {"message":"ok"}

def get_obj_from_args(args):
	"""extract obj from args either passed as object or json string"""
	if 'obj' in args:
		if type(args['obj']==str):
			import json
			return json.loads(args['obj'])
		else:
			return args['obj']
	elif 'type' in args:
		if '_method' in args:
			del args['_method']
		return args
	else:
		raise Exception, 'Badly formed object'

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

def post_single(obj, action='insert'):
	"""post an object in db, ignore extra columns"""
	import MySQLdb

	db = database.conn
	obj_copy = get_valid_obj(obj)

	if action=='insert':
		query = insert_query(obj, obj_copy)
	else:
		query = update_query(obj, obj_copy)

	db.sql(query, tuple(obj_copy.values()))

def post_children(obj):
	"""find out children from vector and post them"""
	for k in obj:
		d = {"type":k, "parent":obj["name"], "parent_type":obj["type"]}
		# dict, one child only
		if type(obj[k]) is dict:
			obj[k].update(d)
			post_single(obj[k])
		
		# multiple children
		if type(obj[k]) in (list, tuple):
			idx = 0
			for child in obj[k]:
				d['idx'] = idx
				# child is a dict
				if type(child) is dict:
					child.update(d)
					post_single(child)
					
				# child is literal (only names)
				elif type(child) in (str, int, float, unicode):
					c = {"value":child}
					c.update(d)
					post_single(c)
				else:
					raise Exception, "child %s(%s) must be dict or literal" % \
						(str(child), str(type(child)))

				idx += 1

def exists(obj):
	"""check exists by name"""
	db = database.conn
	
	if obj.get('name') and obj.get('type'):
		return db.sql("select name from `%s` where name=%s" % \
		 	(obj['type'],'%s'), obj['name'])

def get_valid_obj(obj):
	"""returns an object copy with only valid columns"""
	obj_copy = {}	
	columns = database.conn.columns(obj['type'])
	# copy valid columns
	for c in columns:
		if c in obj:
			obj_copy[c] = obj[c]
	return obj_copy

def insert_query(obj, obj_copy):
	"""returns the insert query"""
	parts = {}
	parts['tab'] = obj['type']
	parts['cols'] = '`, `'.join(obj_copy.keys())
	parts['vals'] = ('%s,'*len(obj_copy))[:-1]
	query = """insert into `%(tab)s`(`%(cols)s`) 
		values (%(vals)s)""" % parts
		
	return query

def update_query(obj, obj_copy):
	"""returns update query for the given object"""
	parts = {}
	parts['tab'] = obj['type']
	parts['set'] = ', '.join(['`%s`=%s' % (key, '%s') for key in obj_copy.keys()])
	parts['name'] = obj['name'].replace("'", "\'")
	query = """update `%(tab)s` set %(set)s where name='%(name)s'""" % parts
	return query

@whitelist()
def delete(**args):
	"""delete object and its children, if permitted"""
	from lib.py import model
	
	modelobj = model.get(_get_obj(args['type'], args['name']))
	modelobj.check_allow('delete')
	hasattr(modelobj, 'before_delete') and modelobj.before_delete()
	
	delete_obj(args['type'], args['name'])
	return {"message":"ok"}
	
def delete_obj(type, name):
	"""delete object and its children"""
	database.conn.sql("""delete from `%s` where name=%s""" % (type, '%s'), name)
	delete_children(type, name)

def delete_children(parenttype, parent):
	"""delete all children of the given object"""
	for child_tab in children_types(parenttype):
		database.conn.sql("""delete from `%s` where parent=%s and parent_type=%s""" \
			% (child_tab,'%s','%s'), (parent, parenttype))

