var casper = require("casper").create({
    verbose: true,
    logLevel: 'debug',
    silentErrors: false,
    viewportSize: {
	width: 1280,
	height: 700
    },
    onError: function(msg, backtrace) {
	console.log("ERROR: " + msg + backtrace);
        this.capture('error.png');
        //throw new ErrorFunc("fatal", "error", "filename", backtrace, msg);
    }
});

var MAXALBUMS = 30;
var MAXSCROLLS = 500;
var MAXPIX = 500;
var LONGWAIT = 5*60*1000;

var fs = require('fs');
var utils = require('utils');

var email = casper.cli.get("email")
var password = casper.cli.get("password")

if (!(email && password)) {
    throw "Define an email and password";
}

var downloadsleft = 42;
var downloadingurls = [];
var dir = "";
 
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
	downloadingurls.push(url);
	utils.dump(responseData);
	console.log('YEAH downloading ' + url);
	console.log(downloadingurls);
	downloadsleft--;
	if (downloadsleft == 0) {
	    // Uh, this is a terrible hack for casperjs...
	    casper.navigationRequested = false;
	}
	return dir + responseData.filename;
    };
});

casper.on("remote.message", function(msg) {
    this.echo("remote: " + msg);
});

casper.on("step.created", function(step) {
    this.echo("STEP CREATED");
});

casper.on("step.start", function(step) {
    this.echo("STEP START");
});

casper.on("step.error", function(step) {
    this.echo("STEP ERROR");
});

var imageurl = null;
var imagesuccess = false;
var numresourcespending = 0;
casper.on("resource.requested", function(resource, request) {
    numresourcespending++;
});
casper.on("resource.timeout", function(resource) {
    //numresourcespending--;
    this.echo("resource timeout! " + resource.url);
});
casper.on("resource.received", function(resource) {
    if (resource.stage == "end") {
	numresourcespending--;
	this.echo("numresourcespending = " + numresourcespending);	
    }
});
casper.on("resource.received", function(resource) {
    //this.echo("imageurl = " + imageurl + " resource.url = " + resource.url);
    //utils.dump(resource);
    if (resource.stage == "end" && resource.url == imageurl) {
	// They are redirecting us.  Record the new imageurl
	if (resource.status == 302) {
	    imageurl = resource.redirectURL;
	}
	imagesuccess = resource.status == 200;
	// this.echo("imagesuccess = " + imagesuccess);
    }
});
casper.on("resource.received", function(resource) {
    if (resource.stage == "end" && downloadingurls.includes(resource.url)) {
	this.echo("A file finished downloading! " + resource.url);
	var i = downloadingurls.indexOf(resource.url);
	this.echo("The index is " + i);
	downloadingurls.splice(i, 1);
	this.echo("downloadingurls.length = " + downloadingurls.length);
	this.echo("downloadingurls = " + downloadingurls.toString());
    }
});


// function downloadImage(image) {
//     casper.echo("Downloading image " + image);
//     casper.then(function() {
// 	this.click("div[id='" + image + "'] div.magnifying-icon");
//     });
//     casper.waitForSelector("li.download.detail-download", null, null, 10000).then(function() {
// 	//this.page.captureContent = [ /.*/ ]; // not sure
// 	casper.echo("Clicking now...\n\n");
// 	this.click("li.download.detail-download");
//     });
//     casper.waitFor(function() { return downloaded; },
// 		   function() { this.echo("Image started to download!"); },
// 		   function() { this.echo("Image failed to download"); },
// 		   10000);
//     // Let the download happen
//     casper.wait(60000, function() {
// 	this.echo("Done waiting for download. Hopefully it's done!");
// 	this.click("li.close.single");
//     });
// };

function scrollToBottomOfSelector(selector, wait_ms=30000, max_scrolls=MAXSCROLLS, ensurebottom=true, waitfunc=function() {}) {
    var atBottom = false;
    casper.then(function() {
	this.echo("I am executing scrollToBottom here!");
    });
    casper.repeat(max_scrolls, function() {
	this.waitFor(
	    function check() {
		return atBottom;
	    },
	    function thenf() {
		this.echo("Not scrolling because we are at bottom");
	    },
	    function timeoutf() {
		this.echo("Scrolling");
		atBottom = this.evaluate(function(selector) {
		    var orig = $(selector).scrollTop();
		    $(selector).scrollTop(100000);
		    //waitfunc.call(this);
		    var newy = $(selector).scrollTop();
		    console.log("scrolling old: " + orig + " new: " + newy);
		    return orig === newy;
		}, selector);
	    },
	    wait_ms);
    });
    casper.then(function() {
	if (ensurebottom && !atBottom) {
	    this.die("Failed to reach bottom of " + selector);
	}
    });
}

function processAlbum(month, year, caption) {
    this.echo("Processing album " + caption);

    dir = year + "/" + month + "/" + caption + "/";
    // slimerjs makeTree is broken. Work around it.
    fs.makeDirectory(year);
    fs.makeDirectory(year + "/" + month);
    fs.makeDirectory(year + "/" + month + "/" + caption);
    
    this.click('div[presentmonth="' + year + '-' + month + '"] p.storyCaption[o_caption="' + caption + '"]');

    var atBottom = false;
    var atEnd = false;

    this.echo("magnifying icon is here...");
    this.waitForSelector("div.magnifying-icon");
    this.thenClick('div.magnifying-icon');
    this.waitForSelector("img.detailedViewImg");

    for (var i = 0; i < MAXPIX; i++) {

	this.then(function() { this.echo("Waiting for new url..."); });
	this.waitFor(
	    function check() {
		if (atEnd) { return true; }
		var newurl = this.evaluate(function () { return $("img.detailedViewImg").attr("src"); });
		var ret = newurl != imageurl;
		imageurl = newurl;
		return ret;
	    }, null, null, LONGWAIT);
	this.then(function() { this.echo("Waiting for resources"); });
	this.waitFor(
	    function check() {
		return numresourcespending == 0 || atEnd;
	    }, null, null, LONGWAIT);
	this.then(function() {
	    if (atEnd) return;
	    this.echo("Image there? " + imagesuccess);
	    if (imagesuccess) {
		//this.click("figure.ib-checkmark");
		downloadsleft = 1;
		this.click("li.download.detail-download");
	    } else {
		var thumburl = this.evaluate(function() {
		    var t = $("li.bottom-thumbnail.selected").css("background-image");
		    // Get rid of the url() wrapper.
		    return t.replace('url(','').replace(')','').replace(/\"/gi, "");
		});
		var thumbfilename = dir + this.evaluate(function() {
		    return $("li.bottom-thumbnail.selected").attr("id") + ".jpg";
		});
		this.echo("Thumbnail url = " + thumburl + " filename = " + thumbfilename);
		this.download(thumburl, thumbfilename);
		this.echo("Download done!");
		downloadsleft = 0;
	    }
	    imageurl = null;
	    imagesuccess = false;
	});
	// Wait for the download to happen
	this.waitFor(function check() {
	    return (downloadsleft == 0 && numresourcespending == 0) || atEnd;
	}, null, null, LONGWAIT);

	// Are we at the end of the album?
	this.then(function() {
	    if (this.evaluate(function() {
		return $("figure.right-nav").is(":visible");
	    })) {
		this.echo("Right arrow is visible...");
		this.click("figure.right-nav");
	    } else {
		this.echo("At the end of the album!");
		atEnd = true;
	    }
	});
    }

    // Go back to albums
    this.thenClick("li.close.single");
    this.thenClick("a#globalHeaderMyPhotos");
    loadMyPhotos();

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
    // XXX: Scroll to bottom
    scrollToBottomOfSelector("div#right-well", 10000, MAXSCROLLS, false);
};

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

var albums = [];

casper.waitForSelector("a#myPhotosBtn", null, null, 10000).then(function() {
    this.echo("Logged in.  Clicking on my photos button now.");
    this.click("a#myPhotosBtn");
});
casper.wait(10000);
loadMyPhotos();
casper.then(function() {    
    casper.echo("Looking at my photos.");
    var years = this.getElementsInfo("div.monthbar div.left h2 small").map(function(x) x.text ).filter(onlyUnique);

    albums = [].concat.apply([], years.map(processYear, this));

    //albums = albums.filter(function(x) { return x[2] === "Bob%20Photo%20CD-1"; });

    // I only care about years between 2002 and 2006
    //albums = albums.filter(function(x) { return x[1] >= 2002 && x[1] <= 2006; });
    
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
