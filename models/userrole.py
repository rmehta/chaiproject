from lib.py import model

class UserRole(model.Model):
	_name = 'userrole'
	_parent = 'user'
	_create_table = """
	create table `userrole` (
		parent varchar(240) not null,
		parent_type varchar(240) not null,
		value varchar(240) not null,
		idx int(8),
		unique(parent, parent_type, idx)
	) engine=InnoDB
	"""