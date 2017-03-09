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

var MAXALBUMS = 30;

var fs = require('fs');
var utils = require('utils');

var email = casper.cli.get("email")
var password = casper.cli.get("password")

if (!(email && password)) {
    throw "Define an email and password";
}

var downloaded = false;

 
casper.start('https://www.snapfish.com/photo-gift/loginto', function() {
    this.fill('form#form1', {
        'EmailAddress':    email,
	'Password': password
    }, true);
    this.page.onConsoleMessage = function(msg, lineNum, sourceId) {
	console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
    };
    this.page.onFileDownloadError = function(err) {
	console.log("File download error: " + err);
    };
    this.page.onFileDownload = function(url, responseData) {
	utils.dump(responseData);
	console.log('YEAH downloading');
	downloaded = true;
	return responseData.filename;
    };
});

casper.on("remote.message", function(msg) {
    this.echo("remote: " + msg);
});

casper.waitForSelector("a#myPhotosBtn", null, null, 10000).then(function() {
    this.echo("Logged in.  Clicking on my photos button now.");
    this.click("a#myPhotosBtn");
});

function downloadImage(image) {
    casper.echo("Downloading image " + image);
    casper.then(function() {
	this.click("div[id='" + image + "'] div.magnifying-icon");
    });
    casper.waitForSelector("li.download.detail-download", null, null, 10000).then(function() {
	//this.page.captureContent = [ /.*/ ]; // not sure
	casper.echo("Clicking now...\n\n");
	this.click("li.download.detail-download");
    });
    casper.waitFor(function() { return downloaded; },
		   function() { this.echo("Image downloaded!"); },
		   function() { this.echo("Image failed to download"); },
		   10000);
    casper.then(function() {
	this.click("li.close.single");
    });
};

function processAlbum(month, year, caption) {
    casper.echo("Processing album " + caption);
    this.click('div[presentmonth="' + year + '-' + month + '"] p.storyCaption[o_caption="' + caption + '"]');
    this.wait(10000, function() {

	var pics = this.getElementsInfo("div.selectable-asset").map(function(x) {
	    return x.attributes.id;
	});
	require('utils').dump(pics);

	this.click("a#globalHeaderMyPhotos");
	loadMyPhotos();
    });

};

function processMonth(month, year) {
    this.echo("Downloading month " + month + " of year " + year);

    var albums;
    try {
	albums = this.getElementsInfo('div[presentmonth="' + year + '-' + month + '"] p.storyCaption');
    } catch(err) {
	albums = [];
    }

    utils.dump(albums);

};

function processYear(year) {
    this.echo("Downloading year " + year);

    var r = [];
    
    [1,2,3,4,5,6,7,8,9,10,11,12].forEach(function (month) {

	this.echo("Downloading month " + month + " of year " + year);

	var albums;
	try {
	    albums = this.getElementsInfo('div[presentmonth="' + year + '-' + month + '"] p.storyCaption').map(function(x) { return x.attributes.o_caption; });
	} catch(err) {
	    albums = [];
	}

	albums.forEach(function(album) { r = r.concat([[month, year, album]]); });
	
    }, this);

    return r;
}

function sleep( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

function loadMyPhotos() {
    casper.then(function() {
	for (var i = 0; i < /*10*/1; i++) {
	    this.wait(10000, function() {
     		this.echo("Scrolling...");
    	    //	casper.evaluate(function() { $("div#right-well").scrollTop($("div#right-well").scrollTop()+400); });
    		this.evaluate(function() { $("div#right-well").scrollTop(10000); });
    		this.echo("Waiting for loading bar to go away...");
    		this.evaluate(function() { console.log("loading bar? " + $("bottomLoadingBar").isOnScreen()); });
	    });

	    if (false)
		// Ugh. Why doesn't htis work?  IT returns undefined!
		this.waitFor(function() {
     		    this.evaluate(function() { ! $("#bottomLoadingBar").isOnScreen(); });
		}, null, null, 20000);
	    else this.wait(20000);
	
	}
    });
};
loadMyPhotos();

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

var albums = [];

casper.then(function() {    
    casper.echo("Looking at my photos.");
    var years = this.getElementsInfo("div.monthbar div.left h2 small").map(function(x) x.text ).filter(onlyUnique);

    // I only care about years between 2002 and 2006
    //years = years.filter(function(x) x >= 2002 && x <= 2006);
    //utils.dump(years);

    albums = [].concat.apply([], years.map(processYear, this));

    utils.dump(albums);
	
});

var i = -1;
casper.repeat(MAXALBUMS, function() {
    if (i++ < albums.length) {
	processAlbum.call(this, albums[i][0], albums[i][1], albums[i][2]);
    }
});


casper.run(function() {
    console.log("Exiting");
    this.exit();
});
