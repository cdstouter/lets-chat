'use strict';

var mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

let self;

function Local(options, core) {
    this.options = options;
    this.key = 'local';
    this.core = core;
    self = this;
}

Local.key = 'local';

Local.prototype.setup = function() {
    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    }, function(identifier, password, done) {
        var User = mongoose.model('User');
        User.authenticate(identifier, password, function(err, user) {
            if (err) {
                return done(null, false, {
                    message: 'Some fields did not validate.'
                });
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, null, {
                    message: 'Incorrect login credentials.'
                });
            }
        });
    }));
};

let usernameTest = /^[\w-]+$/;

Local.prototype.authenticate = function(req, cb) {
    let User = mongoose.model('User');
    // verify that the username is allowable
    if (!usernameTest.test(req.body.username)) {
	console.log('local - username is not okay');
        // return with an error
        return cb(null, false, null);
    }
    // obtain or create the user
    User.findByIdentifier(req.body.username, function (err, user) {
        if (err) {
            console.log('local - error pulling up user', err);
            return cb(err);
        }
        if (user) {
            // user already exists
            console.log('local - user already exists!');
            return cb(null, user, null);
        } else {
            // user does not exist yet, create them
            var data = {
                provider: 'local',
                username: req.body.username,
                email: req.body.username + '@nowhere.com',
                password: 'abcd1234',
                firstName: req.body.username,
                lastName: 'User',
                displayName: req.body.username
            };

            console.log('local - creating user', data);
            self.core.account.create('local', data, function(err) {
                if (err) {
                    console.log('local - error creating user', err);
                    return cb(err);
                }

		User.findByIdentifier(req.body.username, function (err, user) {
                    if (err) {
                        console.log('local - error pulling up user 2', err);
                        return cb(err);
                    }
                    if (user) {
                        console.log('local - got user after creation!');
                        return cb(null, user, null);
                    } else {
                        return cb("Error creating user");
                    }
		});
            });
        }
    });
    //passport.authenticate('local', cb)(req);
};

module.exports = Local;
