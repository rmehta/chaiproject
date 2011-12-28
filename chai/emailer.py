"""
Wrapper around the Python email lib

SMTP Settings:

conf/mailsettings.py

smtpsettings = {
	'server':'',
	'port': None,
	'ssl': False,
	'login': '',
	'password': '',
	'sender': '[default sender]'
}

Structure:
----------

- alternative
	- text
	- html

"""

MARKDOWN = 1
HTML = 2
TEXT = 3

def send(recipients, subject, message, sender=None, format=MARKDOWN):
	"""send an email as TEXT, MARKDOWN or HTML"""
	
	if type(recipients) in (list, tuple):
		recipients = ', '.join(recipients)
		
	from email.mime.text import MIMEText
	from email.mime.multipart import MIMEMultipart
	from conf.mailsettings import smtpsettings
	
	if format==TEXT:
		msg = MIMEText(message)
	else:
		msg = MIMEMultipart('alternative')
		
		if format==MARKDOWN:
			import markdown2
			msg.attach(MIMEText(message, 'plain'))
			msg.attach(MIMEText(markdown2.markdown(message), 'html'))
		elif format==HTML:
			import html2text
			msg.attach(MIMEText(html2text(message), 'plain'))
			msg.attach(MIMEText(message, 'html'))
	
	msg['Subject'] = subject
	msg['From'] = sender or smtpsettings.get('sender')
	msg['To'] = recipients
	
	smtp_send(msg)

def smtp_send(msg):
	"""send message via smtp"""
	import smtplib
	from conf.mailsettings import smtpsettings
	
	smtp_session = smtplib.SMTP(smtpsettings['server'], smtpsettings.get('port'))

	if smtpsettings.get('ssl'): 
		smtp_session.ehlo()
		smtp_session.starttls()
		smtp_session.ehlo()

	ret = smtp_session.login(smtpsettings['login'], smtpsettings['password'])	
	smtp_session.sendmail(msg['From'], msg['To'], msg.as_string())