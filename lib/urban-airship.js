var https = require("https"),
    moment = require("moment");

/*
 * Node-urban-airship is a simple wrapper for the Urban Airship API.
 *
 *      _..--=--..._
 *   .-'            '-.  .-.
 *  /.'              '.\/  /
 * |=-                -=| (
 *  \'.              .'/\  \
 *   '-.,_____ _____.-'  '-'
 * jgs    [_____]=8
 *
 * @params
 *	key - Your API key
 *	secret - Your secret key
 */
var UrbanAirship = module.exports = function(key, secret, master) {
	this._key = key;
	this._secret = secret;
	this._master = master;
}


/**
 * Gets the number of devices tokens authenticated with the application.
 *
 * @params callback(error, total, active)
 */
UrbanAirship.prototype.getDeviceTokenCounts = function(callback) {
	this._auth = new Buffer(this._key + ":" + this._master, "utf8").toString("base64");
	
	this._transport("/api/device_tokens/count/", "GET", function(error, response_data) {
		callback(error, response_data.device_tokens_count || 0, response_data.active_device_tokens_count || 0);
	});
}


/*
 * Push a notification to a registered device.
 *
 * @params
 *	path of the push Notification.
 *	payload the object being sent to Urban Airship as specified http://urbanairship.com/docs/push.html
 *	callback
 */
UrbanAirship.prototype.pushNotification = function(path, payload, callback) {
	this._auth = new Buffer(this._key + ":" + this._master, "utf8").toString("base64");
	this._transport(path, "POST", payload, callback);
}


/*
 * Register a new device.
 *
 * @params
 *	device_id - The device identifier
 *	data - The JSON payload (optional)
 *	callback
 */
UrbanAirship.prototype.registerDevice = function(device_id, data, callback) {
	this._auth = new Buffer(this._key + ":" + this._secret, "utf8").toString("base64");
		
	var path = "/api/device_tokens/" + device_id;
	
	if (data) {
		// Registration with optional data
		this._transport(path, "PUT", data, callback);
	}
	else {
		// Simple registration with no additional data
		this._transport(path, "PUT", callback);
	}
}

/*
 * Unregister a device.
 *
 * @params
 *	device_id - The device identifier
 *	callback
 */
UrbanAirship.prototype.unregisterDevice = function(device_id, callback) {
	this._auth = new Buffer(this._key + ":" + this._secret, "utf8").toString("base64");
	this._transport("/api/device_tokens/" + device_id, "DELETE", callback);
}



/*
 * Query feedback service to see what device tokens are now invalid.
 *
 * @params
 *	sinceWhen - A Date to search from
 *	callback
 */
UrbanAirship.prototype.feedback = function(sinceWhen, callback) {
	this._auth = new Buffer(this._key + ":" + this._master, "utf8").toString("base64");
    var since = moment(sinceWhen).format("YYYY-MM-DDTHH:mm:ssZ");
    this._transport("/api/device_tokens/feedback/?since=" + since, "GET", function(err, response) {
        callback(err, response);
    });
};


/*
 * Send things to UA!
 *
 * @params
 *	path - API route
 *	method - The HTTPS method to employ
 *	request_data - The JSON data we are sending (optional)
 *	callback
 */
UrbanAirship.prototype._transport = function(path, method, request_data, callback) {
	var self = this,
		rd = "",
		response_data = "",
		https_opts = {
			"host": "go.urbanairship.com",
			"port": 443,
			"path": path,
			"method": method,
			"headers": {
				"Authorization": "Basic " + this._auth,
				"User-Agent": "node-urban-airship/0.2"
			}
		};
	
	// We don't necessarily send data
	if (request_data instanceof Function) {
		callback = request_data;
		request_data = null;
	}
	
	// Set a Content-Type and Content-Length header if we are sending data
	if (request_data) {
		rd = JSON.stringify(request_data);
		
		https_opts.headers["Content-Type"] = "application/json";
		https_opts.headers["Content-Length"] = Buffer.byteLength(rd, "utf8");
	}
	else {
		https_opts.headers["Content-Length"] = 0;
	}
	
	var request = https.request(https_opts, function(response) {
		response.setEncoding("utf8");
		
		response.on("data", function(chunk) {
			response_data += chunk;
		});
		
		response.on("end", function() {
			// You probably forget the trailing '/'
			if ((response.statusCode == 301 || response.statusCode == 302) && response.headers && response.headers.location) {
				var url = require("url"),
					parsed_url = url.parse(response.headers.location);
					
				self._transport(parsed_url.pathname + (parsed_url.search || ""), method, request_data, callback);
			}
			// Success on 200 or 204, 201 on new device registration
			else if ([200,201,204].indexOf(response.statusCode) >= 0) {
				try {
					if ( /application\/json/.test(response.headers["content-type"]) ) {
						response_data = JSON.parse(response_data);
					}
				}
				catch (ex) {
					callback(ex);
				}
				callback(null, response_data);
    		}
			else {
				callback(new Error(response_data));
			}
		});
		
		response.on("error", function(error) {
			callback(error);
		});
	});
	
	request.on("error", function(error) {
		callback(error);
	});
	
	if (request_data) {
		request.write(rd);
	}
	
	request.end();
}
