var casper = require("casper").create({
    viewportSize: {
	width: 1920,
	height: 1080
    }
});

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

casper.on('resource.received', function(resource) {
    if (resource.stage !== "end") {
    	return;
    }
    casper.echo(resource.url);
});

function downloadImage(image) {
    casper.echo("Downloading image " + image);
    casper.then(function() {
	this.click("div[id='" + image + "'] div.magnifying-icon");
    });
    casper.then(function() {
	this.wait(10000, function() {
	    this.capture("pic.png");
	    // this.page.onFileDownload = function(status) { console.log('onfiledownload ' + status); };
	    casper.echo("Clicking now...");
	    this.click("li.download span");
	});
    });
    casper.then(function() {
	this.wait(10000, function() {
	    casper.echo("hopefully it is here! " + this.getCurrentUrl());
	    this.capture("download.png");
	});
    });
};

function processAlbum(caption) {
    casper.echo("Processing " + caption);
    casper.then(function() {
	this.click("p[o_caption='" + caption + "']");
	this.wait(10000, function() {
	    this.capture("test.png");
	    var pics = this.getElementsInfo("div.selectable-asset").map(function(x) {
		return x.attributes.id;
	    });
	    require('utils').dump(pics);
	    downloadImage(pics[0]);
	});
    });
};

casper.then(function() {
    this.wait(10000, function() {

	var albums = this.getElementsInfo("p.storyCaption").map(function(x) {
	    return x.attributes.o_caption;
	});
	require('utils').dump(albums);

	processAlbum(albums[0]);
	// click the first one
	
	// this.click("p[o_caption=Winter]");
	
    });
});


// casper.then(function() {
//     this.wait(10000, function() {
// 	this.capture("test.png");
//     });
// });

casper.run(function() {
    this.echo('message sent').exit();
});
