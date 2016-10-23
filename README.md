# dokku-github-updater

This kit allows auto deployment of Dokku app from GitHub repository.

Supported Dokku version: Maybe any; We tested with v0.4.x.

## Getting Started

### Initial Setup

On the Terminal of Your local computer:

	$ git clone https://github.com/odentools/dokku-github-updater.git
	$ cd dokku-github-updater/

	$ git remote add dokku dokku@YOUR-DOKKU-HOST:dokku-github-updater
	$ git push dokku master

On the Dokku server:

	$ sudo su
	$ ssh-keygen -f tmp-key -t rsa -N ""
	$ cat tmp-key.pub | sshcommand acl-add dokku 'ssh-key-for-dokku-github-updater'

	$ dokku config:set dokku-github-updater DOKKU_SSH_KEY="$(base64 -w 0 tmp-key)"

	$ dokku config:set dokku-github-updater WEBHOOK_SECRET="$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 20 | head -n 1)"
	$ dokku config:get dokku-github-updater WEBHOOK_SECRET

Please keep the **secret string** of 20 characters that displayed.
It will needed in the after step.

### Configuration for the Each Apps

After the Initial Setup step, please see http://dokku-github-updater.YOUR-DOKKU-HOST/ using web browser.

NOTE: You must use the **secret string** that has been kept.

## License

```
The MIT License (MIT).
Copyright (c) 2016 OdenTools Project.
```
