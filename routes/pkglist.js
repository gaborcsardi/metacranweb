import express from 'express';
var router = express.Router();
import ky from 'ky';
import urls from '../lib/urls.js';
import clean_package from '../lib/clean_package.js';

var re_full = new RegExp('^/([\\w\\.]+)?$')

router.get(re_full, function(req, res, next) {
    var from = req.params[0];
    do_query(res, next, from, req.query);
})

function do_query(res, next, from, query) {
    var startkey = query.startkey || from || '';
    var url = urls.crandb + '/-/latest?limit=100&startkey="' +
	startkey + '"';
    request(url, function(error, response, body) {
	if (error || response.statusCode != 200) {
	    return next(error || response.statusCode);
	}
        try {
	    var pkgs = JSON.parse(body);
	    for (p in pkgs) { pkgs[p] = clean_package(pkgs[p]); }
	    res.render('pkglist', { 'pkgs': pkgs,
				    'title': 'All packages',
				    'paging': true,
				    'number': false
			          });
        } catch(err) {
            return next(err);
        }
    })
}

export default router;
