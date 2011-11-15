class Database:
	def __init__(self):
		"""connect to db"""
		import MySQLdb
		import conf
		import os
		
		self.conn = MySQLdb.connect(localhost, conf.dbuser, conf.dbpassword)
		self.cur = self.conn.cursor()
		self.cur.execute("use %s" % conf.dbname)
		
	def sql(self, query, values=(), as_dict=None, debug=None):
		"""like webnotes.db.sql"""
		if debug:
			print query.replace('?', '%s') % values
		
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
	def close(self):
		"""close connection"""
		self.conn.close()
	
conn = None	
def get():
	"""return a new connection"""
	global conn
	if not conn:
		conn = Database()
	return conn
	