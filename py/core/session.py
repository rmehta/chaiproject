import model

class Session(model.Model):
	_name = 'session'
	_create_table = """
	create table `session` (
		name varchar(240) not null primary key,
		user varchar(240) not null,
		_updated timestamp
	) engine=InnoDB
	"""