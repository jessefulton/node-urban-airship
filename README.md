node-urban-airship
==================

Fork of [https://github.com/cojohn/node-urban-airship](https://github.com/cojohn/node-urban-airship). See their readme for more details.

This fork adds a [`feedback` API call](https://docs.urbanairship.com/display/DOCS/Server:+iOS+Push+API#ServeriOSPushAPI-FeedbackService) to retrieve a list of inactive devices. This is useful to clear out a local cache of device tokens which are no longer valid.


Usage
-----
Update your project's `package.json` dependencies like so:

	"dependencies": {
		"urban-airship": "https://github.com/jessefulton/node-urban-airship/tarball/master",
		...
	}


To Do:
-------

* Clean up unit tests
    * Implement a more elegant way to inject UA keys
* Get rid of that nastay try/catch block inside of the `_transport` method
