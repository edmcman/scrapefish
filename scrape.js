var casper = require("casper").create();

var email = casper.cli.get("email")
var password = casper.cli.get("password")

casper.start('https://www.snapfish.com/photo-gift/loginto', function() {
    this.fill('form#form1', {
        'EmailAddress':    email,
	'Password': password
    }, true);
});

casper.then(function() {
    this.wait(10000, function() {
	this.click("a#myPhotosBtn");
    });
});

casper.then(function() {});

casper.then(function() {
    this.wait(10000, function() {

	var albums = this.getElementsInfo("p.storyCaption").map(function(x) {
	    return x.attributes.o_caption;
	});
	require('utils').dump(albums);

	// click the first one
	// todo

    });
});


casper.run(function() {
    this.echo('message sent').exit();
});
