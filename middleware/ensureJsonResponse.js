module.exports = function ensureJsonResponse(req, res, next) {
	// ...existing code...
	const origSend = res.send.bind(res);
	res.send = (body) => {
		try {
			// If body is an object or array - send as JSON
			if (typeof body === 'object' && body !== null) {
				res.type('application/json');
				return origSend(JSON.stringify(body));
			}

			// If already a string - test if it's valid JSON
			if (typeof body === 'string') {
				JSON.parse(body);
				res.type('application/json');
				return origSend(body);
			}

			// Buffer / other types -> convert and test
			const str = Buffer.isBuffer(body) ? body.toString('utf8') : String(body);
			JSON.parse(str);
			res.type('application/json');
			return origSend(str);
		} catch (e) {
			// Not valid JSON — wrap it so frontend can always parse
			res.type('application/json');
			const wrapped = { raw: (typeof body === 'string' ? body : String(body)) };
			// Short log to help debugging chatllama non-replies
			if (!res.headersSent) {
				console.warn(`[ensureJsonResponse] Wrapped non-JSON response for ${req.method} ${req.originalUrl}`);
			}
			return origSend(JSON.stringify(wrapped));
		}
	};
	next();
};