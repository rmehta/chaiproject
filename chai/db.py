"""
db.py
=====

Database functions

- Maintain database connections for each site
- Database helpers

Usage:
------

Helpers:

	get(site) - get database obj for the given site (or default site)
	sql(query, args, as_dict, as_list)
	begin
	commit
	getvalue(type, name, key)
	setvalue(type, name, key, value)
	close - close all db objects

Schema updation:

	get().sync_table - match table columns to model 

(warning data may be lost if columns are dropped)
"""

import MySQLdb
import MySQLdb.constants.ER as ER

conn = None	

class Database:
	_columns = {}

	def __init__(self, settings={}):
		"""connect to db"""
		self.connect(settings)

	def clear_cache(self):
		"""clear all cached info about schema, done before request starts"""
		self._columns = {}

	def connect(self, settings):
		"""connect to mysql db"""
		self.conn = MySQLdb.connect('localhost', settings['user'], settings['password'])
		self.conn.converter[246]=float
		self.conn.set_character_set('utf8')

		self.cur = self.conn.cursor()
		self.cur.execute("use %s" % settings['database'])


	def sql(self, query, values=(), as_dict=True, debug=False):
		"""like webnotes.db.sql"""
		if not self.conn:
			self.connect()
			
		if debug:
			from lib.chai import out
			out['log'] = query % values
		
		self.cur.execute(query, values)
		res = self.cur.fetchall()

		if as_dict:
			out = []
			for row in res:
				d = {}
				for idx, col in enumerate(self.cur.description):
					d[col[0]] = row[idx]
				out.append(d)
			return out

		return res

	def setvalue(self, type, name, key, value, commit=False):
		"""
		set a value
		
		If commit=True, begin transaction and commit
		[WARNING - does not call after_update]
		"""
		if commit: self.begin()
		self.sql("""update `%s` set `%s`=%s where name=%s""" % (type, key, '%s', '%s'), \
			(value, name))
		if commit: self.commit()

	def getvalue(self, type, name, key):
		"""get a value"""
		ret = self.sql("""select `%s` from `%s` where name=%s""" % (key, type, '%s'), 
			name)
		return ret and ret[0][key] or None

	def begin(self):
		self.sql("start transaction");

	def rollback(self):
		self.sql("rollback");
		
	def commit(self):
		self.sql("commit");

	def close(self, commit=False):
		"""close connection"""
		if commit:
			self.commit()
		if self.conn:
			self.conn.close()
			self.conn = None
		
	def repair_table(self, ttype, create_table):
		"""create a new table and copy records"""
		from lib.chai import objstore
		import os
		
		addrecords = self.sql("select * from `%s`" % (ttype))
		# write in a file, incase there is a crash
		tmp = open('repair.tmp', 'w')
		tmp.write(str(addrecords))
		tmp.close()
		
		self.sql('drop table `%s`' % ttype);
		self.sql(create_table)

		self.begin()
		for obj in addrecords:
			obj['type'] = ttype
			objstore.post_single(obj)
		self.commit()
		
		os.remove('repair.tmp')
				
	def table_list(self):
		"""get list of tables"""
		return [d[0] for d in self.sql("show tables", as_dict=False)]

	def columns(self, table):
		"""get columns of"""
		from lib.chai import database
		if not self._columns.get(table):
			self._columns[table] = [c[0] for c in \
				database.get().sql("desc `%s`" % table, as_dict=False)]
		return self._columns[table]

	def sync_tables(self, lst):
		"""sync list of tables"""
		for table in lst:
			self.sync_table(table)

	def sync_table(self, table=None):
		"""make / update tables from models"""
		from lib.chai import model, objstore

		self.sql("set foreign_key_checks=0")
		tables = self.table_list()
		m = model.get({'type':table})
		
		if not m._name in tables:
			self.sql(m._create_table)
		else:
			self.repair_table(m._name, m._create_table)
				
		# update parent-child map
		if hasattr(m, '_parent'):
			self.begin()
			objstore.insert(type="_parent_child", parent=m._parent, child=m._name)
			self.commit()

		self.sql("set foreign_key_checks=1")


class ConnectionPool(object):
	"""database connection pool based on site"""
	pool = {}
	def get(self, site=None):
		"""get connection"""
		if not site:
			import lib.chai
			site = lib.chai.site
		
		if not self.pool.get(site):
			self.connect(site)
		
		return self.pool[site]

	def connect(self, site):
		"""connect to a site db"""
		import conf
		settings = conf.sites[site]['db']
		
		self.pool[site] = Database(settings)
		
	def close(self):
		"""close all"""
		for site in self.pool:
			self.pool[site].close()


pool = ConnectionPool()
def get():
	"""return a new connection"""
	return pool.get()
	
def sql(query, values=(), as_dict=True, debug=False):
	"""execute a query in the current site db"""
	return pool.get().sql(query, values, as_dict, debug)

def begin():
	sql("start transaction")
	
def commit():
	sql("commit")
	
def getvalue(type, name, key):
	return pool.get().getvalue(type, name, key)
	
def setvalue(type, name, key, value):
	return pool.get().getvalue(type, name, key, value)