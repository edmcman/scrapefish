var casper = require("casper").create({
    verbose: true,
    logLevel: 'debug',
    viewportSize: {
	width: 1920,
	height: 1080
    },
    onError: function(msg, backtrace) {
        this.capture('error.png');
	console.log("ERROR: " + msg + backtrace);
        //throw new ErrorFunc("fatal", "error", "filename", backtrace, msg);
    }
});

var email = casper.cli.get("email")
var password = casper.cli.get("password")

casper.start('https://www.snapfish.com/photo-gift/loginto', function() {
    this.fill('form#form1', {
        'EmailAddress':    email,
	'Password': password
    }, true);
    this.page.onPageCreated = function(newPage) {
	console.log('New page!!! ' + newPage);
    };
    this.page.onConsoleMessage = function(msg, lineNum, sourceId) {
	console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
    };
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

var utils = require('utils');

casper.options.onResourceRequested = function(C, requestData, request) {
    utils.dump(requestData);
};
casper.options.onResourceReceived = function(C, response) {
    utils.dump(response);
};

casper.on("remote.message", function(msg) {
    this.echo("remote: " + msg);
});

casper.on("popup.created", function() {
    this.echo("url popup created!");
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
	casper.echo("Clicking now...\n\n");
	//this.click("li.download.detail-download", "50%", "50%");
	//this.click("li.download.detail-download a");
	//this.click("li.download.detail-download span", "50%", "50%");
	//this.click(x('//li[@class="download"]'));
    });
    casper.thenEvaluate(function() {
	$("li.download").click();
	console.log("This is an evaluation!\n\n\n\n");
	console.log(photoOrg);
	photoOrg.jsErrorLogger("oh noes");
    });
    casper.wait(10000);
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
