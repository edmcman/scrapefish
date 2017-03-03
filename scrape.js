var casper = require("casper").create({
    viewportSize: {
	width: 1920,
	height: 1080
    },
    onError: function(msg, backtrace) {
        this.capture('error.png');
        throw new ErrorFunc("fatal", "error", "filename", backtrace, msg);
    }
});

var email = casper.cli.get("email")
var password = casper.cli.get("password")

casper.start('https://www.snapfish.com/photo-gift/loginto', function() {
    this.fill('form#form1', {
        'EmailAddress':    email,
	'Password': password
    }, true);
    this.page.onFileDownload = function(status) {
	console.log("onFileDownload " + status);
	return "test.zip";
    };
    this.page.onNavigationRequested = function(a, b, c, d) {
	console.log("navigation requested to " +a+b+c+d);
    };
    this.page.onResourceRequested = function(a, b) {
	console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData));
    };
    this.page.onPageCreated = function(newPage) {
	console.log("A new child page was created, yay!");
    };
});

//casper.thenOpen("https://github.com/edmcman/covize/archive/master.zip");

casper.wait(10000);

casper.then(function() {
    this.echo("Logged in.  Clicking on my photos button now.");
    this.click("a#myPhotosBtn");
});

//casper.then(function() {});

function downloadImage(image) {
    casper.echo("Downloading image " + image);
    casper.then(function() {
	this.click("div[id='" + image + "'] div.magnifying-icon");
    });
    casper.wait(10000);
    casper.then(function() {
	this.capture("pic.png");
	this.page.onFileDownload = function(status) { console.log('onfiledownload ' + status); };
	casper.echo("Clicking now...");
	this.click("li.download.detail-download");
	casper.echo("Clicking now... a");
	this.click("li.download.detail-download a");
	casper.echo("Clicking now... b");
	this.click("li.download.detail-download span");
	casper.echo("Clicking now... c");
	//this.click("li.download.detail-download bullshit");
	//casper.echo("Clicking now... d");
	//this.click("waaaaaat");
	//casper.echo("Clicking now... e");
	this.wait(10000);
    });
    casper.then(function() {
	this.capture("debug.png");
	this.echo("done...");
    });
};

function processAlbum(caption) {
    casper.echo("Processing " + caption);
    casper.then(function() {
	this.click("p[o_caption='" + caption + "']");
	this.wait(10000, function() {
	    //this.capture("test.png");
	    var pics = this.getElementsInfo("div.selectable-asset").map(function(x) {
		return x.attributes.id;
	    });
	    require('utils').dump(pics);
	    downloadImage(pics[0]);
	});
    });
};

casper.wait(10000);

casper.then(function() {

	casper.echo("Looking at my photos.");
	var albums = this.getElementsInfo("p.storyCaption").map(function(x) {
	    return x.attributes.o_caption;
	});
	require('utils').dump(albums);

	processAlbum(albums[0]);
	// click the first one
	
	// this.click("p[o_caption=Winter]");
	
    });


// casper.then(function() {
//     this.wait(10000, function() {
// 	this.capture("test.png");
//     });
// });

casper.run(function() {
    console.log("cool");
    this.exit();
});
