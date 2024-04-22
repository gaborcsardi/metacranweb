import ky from 'ky';
import cache from '../lib/cache.js';
import urls from '../lib/urls.js';
import comma_numbers from 'comma-numbers';
const comma = comma_numbers();

function cleanup(x) { return comma(JSON.parse(x)); }

function num_updates(callback) {

    try {
        cache('index:num-updates', callback, cleanup, function(key, cb) {
            try {
	        var tmpd = new Date();
	        tmpd.setDate(tmpd.getDate() - 7);
	        var weekago = tmpd.toISOString();
	        var url = urls.crandb + '/-/numpkgreleases?start_key="' + weekago + '"';
	        request(url, function(error, response, body) {
	            if (error) { return cb(error); }
	            cb(null, body);
	        });
            } catch(err) {
                return cb(err);
            }
        });
    } catch(err) {
        return callback(err);
    }
}

export default num_updates;
