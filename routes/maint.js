import express from 'express';
var router = express.Router();
import ky from 'ky';
import async from 'async';
import urls from '../lib/urls.js';
import pkg_link from '../lib/pkg_link.js';
import get_packages_by from '../lib/get_packages_by.js';
import get_photo_url from '../lib/get_photo_url.js';
import get_gh_username from '../lib/get_gh_username.js';

router.get('/', function(req, res, next) {
    var startkey = req.query.startkey || '';
    var url = urls.crandb +
	'/-/maintainernames?group_level=2&limit=100&startkey=["' +
	encodeURI(startkey) + '"]';
    request(url, function(error, response, body) {
	if (error || response.statusCode != 200) {
	    return next(error || response.statusCode);
	}
        try {
	    var pp = JSON.parse(body)
	        .map(function(x) { return { 'name': x[0][0],
					    'email': x[0][1],
					    'num_pkgs': x[1] }; });
	    var keys = pp.map(function(x) {
	        return '"' + encodeURIComponent(x.email) + '"'; }).join(',');
	    var url2 = urls.crandb + '/-/maintainer?keys=[' + keys + ']';

	    request(url2, function(error, response, body) {
	        if (error || response.statusCode != 200) {
		    return next(error || response.statusCode);
	        }
                try {
	            var packages = {};
	            JSON.parse(body).map(function(x) {
		        var email = x[0];
		        var pkg = x[1];
		        if (!packages[email]) { packages[email] = []; }
		        if (packages[email].indexOf(pkg) < 0) {
		            packages[email].push(pkg);
		        }
	            })
	            res.render('maint', { 'people': pp,
				          'packages': packages,
				          'pkg_link': pkg_link,
				          'pagetitle': 'METACRAN maintainers' });
                } catch(err) {
                    return next(err);
                }
	    })
        } catch(err) {
            return next(err);
        }
    });
})

const re_full = new RegExp("^/(.+)$");
router.get(re_full, function(req, res, next) {

    var maint = req.params[0];

    async.parallel(
	{
	    'pkgs': function(cb) {
		get_packages_by(maint, function(e, r) { cb(e, r)}) },
	    'photo': function(cb) {
		get_photo_url(maint, function(e, r) { cb(e, r)}) },
	    'ghuser': function(cb) {
		get_gh_username(maint, function(e, r) { cb(e, r)}) }
	},
	function(err, results) {

            if (err || results.pkgs === undefined) {
                var err = new Error('Not Found');
                err.status = 404;
                return next(err);
            }
            try {
	        results.email = maint;
	        results.title = 'Packages by ' +
		    results.pkgs[0].Maintainer.replace(/^'(.*)'$/, '$1');
	        results.paging = false;
	        results.number = false;
	        results.pagetitle = 'METACRAN maintainers';
	        results.npr = 3;
	        results.cw = "col-md-4";

	        res.render('maint1', results);
            } catch(err) {
                return next(err);
            }
	}
    )
})

export default router;
