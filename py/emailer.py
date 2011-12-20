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

"""

def sendtext(recipients, subject, message, sender=None):
	"""send a simple text email"""
	
	if type(recipients) in (list, tuple):
		recipients = ', '.join(recipients)
		
	from email.mime.text import MIMEText
	msg = MIMEText(message)
	
	msg['Subject'] = subject
	msg['From'] = sender
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
	smtp_session.sendmail(msg['From'] or smtpsettings['sender'], msg['To'], msg.as_string())
	