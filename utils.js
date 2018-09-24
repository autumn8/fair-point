function __(promise) {
	return promise
		.then(data => ({ error: null, data }))
		.catch(error => ({ error, data: null }));
}

export { __ };
