class Database:
	def __init__(self):
		"""connect to db"""
		import sqlite3
		import conf
		import os

		db_path = os.path.join(os.path.dirname(__file__), '../..', conf.db_path)
		
		self.conn = sqlite3.connect(db_path)
		self.cur = self.conn.cursor()		
		
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
		
	def commit(self):
		self.conn.commit()
		
	def close(self, commit=False):
		"""close connection"""
		if commit:
			self.commit()
		self.conn.close()