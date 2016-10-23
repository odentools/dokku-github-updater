/**
 * dokku-github-updater
 * https://github.com/odentools/dokku-github-updater
 * (C) 2016 - OdenTools; Released under MIT License.
 */

'use strict';

var express = require('express');
var crypto = require('crypto'), fs = require('fs'),
	childProcess = require('child_process');

var app = express();

// Use application/json for Content-Type of POST request
app.use(require('body-parser').json({
	verify: function(req, res, buf, encoding) {

		// Keep the raw body data to req.rawBody
		req.rawBody = buf.toString();

	}
}));

// Routes - Description page
app.get('/', function (req, res) {

	if (process.env.DOKKU_SSH_KEY == null) return res.send(400).send('You must set the DOKKU_SSH_KEY using dokku config command');

	res.sendFile(__dirname + '/index.html', {}, function (err) {

		if (err) throw err;

	});

});

// Routes - WebHook receiver
app.post('/:appName', function (req, res) {

	var app_name = req.params.appName;

	// Check the signature with using secret
	if (process.env.WEBHOOK_SECRET) {
		var expected_signature = 'sha1=' + crypto.createHmac('sha1', process.env.WEBHOOK_SECRET).update(req.rawBody).digest('hex');
		if (req.headers['x-hub-signature'] != expected_signature) {
			return res.status(400).send('The signature was not matched with ' + expected_signature + '\n' + req.headers['x-hub-signature']);
		}
	}

	// Check the branch name
	if (!req.body.ref) {
		return res.status(400).send('The ref property was not found in the received JSON.\nPlease test by doing git-push actually.');
	}
	if (req.body.ref != 'refs/heads/master') {
		return res.status(400).send('Not target branch');
	}

	// Check the repository name
	var owner_name = req.body.repository.owner.name;
	var repository_name = req.body.repository.name;
	if (!owner_name.match(/^[a-zA-Z0-9_\-]+$/) || !repository_name.match(/^[a-zA-Z0-9_\-]+$/)) {
		return res.status(400).send('Invalid owner name or repository name');
	}
	var upstream_git_url = 'https://github.com/' + owner_name + '/' + repository_name + '.git'

	// Clone the repository
	var tmp_dir = 'tmp-' + new Date().getTime();
	childProcess.exec('git clone ' + upstream_git_url + ' ' + tmp_dir, function (err, stdout, stderr) {

		if (err || stderr) {
			return res.status(500).send({
				error: err || null,
				stderr: stderr || null
			});
		}

		// Make a timer for response to GitHub
		var timer = setTimeout(function () {
			res.send('Okay. Now deploying...');
		}, 2000);

		// Push to dokku
		var dokku_host_ip = '172.17.0.1';
		var dokku_uri = 'dokku@' + dokku_host_ip + ':' + app_name;
		childProcess.exec('git remote add dokku ' + dokku_uri + ' && git push dokku master --force', {
			cwd: __dirname + '/' + tmp_dir
		}, function (err, stdout, stderr) {

			if (err || stderr) {
				clearTimeout(timer);
				return res.status(500).send({
					error: err || null,
					stderr: stderr || null
				});
			}

		});

	});

});

// Save the ssh secret key for git-push to the dokku host
if (process.env.DOKKU_SSH_KEY != null) {

	var decode_key = new Buffer(process.env.DOKKU_SSH_KEY, 'base64').toString();
	fs.mkdirSync('/root/.ssh', 0o755);
	fs.writeFileSync('/root/.ssh/id_rsa', decode_key, {
		mode: 0o600
	});

	// Don't check the host key of the dokku host
	fs.writeFileSync('/root/.ssh/config', "Host 172.17.0.1\n\tStrictHostKeyChecking no\n", {
		mode: 0o600
	});
}

// Start the server
var server = app.listen(8080, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('The app listening on port %s:%s', host, port);
});
