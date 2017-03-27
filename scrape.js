var MAXALBUMS = 30;
var MAXSCROLLS = 50;
var MAXPIX = 500;
var LONGWAIT = 5*60*1000;

var debug = true;

var casper = require("casper").create({
    verbose: true,
    logLevel: 'debug',
    silentErrors: false,
    stepTimeout: LONGWAIT,
    pageSettings: {
	resourceTimeout: 60*1000 // 1 min
    },
    viewportSize: {
	width: 1280,
	height: 800
    },
    onError: function(msg, backtrace) {
	console.log("ERROR: " + msg + backtrace);
        this.capture('error.png');
        throw new "fatal error";
    }
});

var fs = require('fs');
var utils = require('utils');

var email = casper.cli.get("email")
var password = casper.cli.get("password")

if (!(email && password)) {
    throw "Define an email and password";
}

var downloadsleft = null;
var downloadingurls = [];

// A number to append to downloads to make them have unique filenames
var downloadnum = null;

// Set by processAlbum
var dir = null;
 
casper.start('https://www.snapfish.com/photo-gift/loginto', function() {
    this.fill('form#form1', {
        'EmailAddress':    email,
	'Password': password
    }, true);
    this.page.onFileDownloadError = function(err) {
	console.log("File download error: " + err);
    };
    this.page.onFileDownload = function(url, responseData) {
	downloadingurls.push(url);
	if (debug) {
	    utils.dump(responseData);
	    console.log('Adding ' + url + ' to urllist:');
	    console.log(downloadingurls);
	}
	downloadsleft--;
	// if (downloadsleft == 0) {
	//     casper.echo("Setting navigation requested = false");
	//     casper.navigationRequested = false;
	//     casper.echo("pendingWait: " + casper.pendingWait + " loadInProgress: " + casper.page.loadInProgress + " init: " + casper.page.browserInitializing)
	// }
	var newname = dir + responseData.filename + downloadnum;
	return newname;
    };
});

if (debug) {
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

    casper.on("load.finished", function(step) {
	this.echo("LOAD FINISHED");
    });

    casper.on("load.started", function(step) {
	this.echo("LOAD STARTED");
    });
}

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

// Used to detect when there are no resources pending.
casper.on("resource.received", function(resource) {
    if (resource.stage == "end") {
	numresourcespending--;
	if (debug) {
	    this.echo("numresourcespending = " + numresourcespending);
	}
    }
});

// Used to detect when the detailed image view has its image url
// loaded, and whether it downloaded successfully or not.
casper.on("resource.received", function(resource) {
    if (debug) {
	this.echo("imageurl = " + imageurl + " resource.url = " + resource.url);
	//utils.dump(resource);
    }
    if (resource.stage == "end" && resource.url == imageurl) {
	// They are redirecting us.  Record the new imageurl
	if (resource.status == 302) {
	    imageurl = resource.redirectURL;
	}
	imagesuccess = resource.status == 200;
	if (debug) {
	    this.echo("imagesuccess = " + imagesuccess);
	}
    }
});

// Keep track of pending downloads.
casper.on("resource.received", function(resource) {
    if (resource.stage == "end" && downloadingurls.includes(resource.url)) {
	// Remove url from list
	var i = downloadingurls.indexOf(resource.url);
	downloadingurls.splice(i, 1);

	if (debug) {
	    this.echo("A file finished downloading! " + resource.url);
	    this.echo("downloadingurls.length = " + downloadingurls.length);
	    this.echo("downloadingurls = " + downloadingurls.toString());
	}

	if (downloadingurls.length == 0) {
	    casper.echo("Setting navigation requested = false");
	    casper.navigationRequested = false;
	    casper.page.loadInProgress = false;
	    casper.echo("pendingWait: " + casper.pendingWait + " loadInProgress: " + casper.page.loadInProgress + " init: " + casper.page.browserInitializing);
	}
    }
});


function scrollToBottomOfSelector(selector, wait_ms=30000, max_scrolls=MAXSCROLLS, ensurebottom=true, waitfunc=function() {}) {
    var atBottom = false;
    if (debug) {
	casper.then(function() {
	    this.echo("I am executing scrollToBottom here!");
	});
    }
    casper.repeat(max_scrolls, function() {
	this.waitFor(
	    function check() {
		return atBottom;
	    },
	    function thenf() {
		if (debug) {
		    this.echo("Not scrolling because we are at bottom");
		}
	    },
	    function timeoutf() {
		if (debug) {
		    this.echo("Scrolling");
		}
		atBottom = this.evaluate(function(selector) {
		    var orig = $(selector).scrollTop();
		    $(selector).scrollTop(100000);
		    var newy = $(selector).scrollTop();
		    //console.log("scrolling old: " + orig + " new: " + newy);
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

    downloadnum = 0;
    dir = year + "/" + month + "/" + caption + "/";

    if (fs.exists(dir)) {
	this.echo("Skipping album " + caption + " because it already exists.");
	return;
    }
    this.echo("Processing album " + caption);

    // slimerjs makeTree is broken. Work around it.
    fs.makeDirectory(year);
    fs.makeDirectory(year + "/" + month);
    fs.makeDirectory(year + "/" + month + "/" + caption);
    
    this.click('div[presentmonth="' + year + '-' + month + '"] p.storyCaption[o_caption="' + caption + '"]');

    var atBottom = false;
    var atEnd = false;

    this.waitForSelector("div.magnifying-icon");
    this.thenClick('div.magnifying-icon');
    this.waitForSelector("img.detailedViewImg");

    for (var i = 0; i < MAXPIX; i++) {

	if (debug) {
	    this.then(function() { this.echo("Waiting for new url..."); });
	}
	// Wait for the big image preview to load (or fail to load)
	this.waitFor(
	    function check() {
		if (atEnd) { return true; }
		var newurl = this.evaluate(function () { return $("img.detailedViewImg").attr("src"); });
		var ret = newurl != imageurl;
		imageurl = newurl;
		return ret;
	    }, null, null, LONGWAIT);
	if (debug) {
	    this.then(function() { this.echo("Waiting for resources"); });
	}
	this.waitFor(
	    function check() {
		return numresourcespending == 0 || atEnd;
	    }, null, null, LONGWAIT);
	this.then(function() {
	    if (atEnd) return;
	    if (debug) {
		this.echo("Image there? " + imagesuccess);
	    }
	    if (imagesuccess) {
		// Click the download button
		downloadsleft = 1;
		this.click("li.download.detail-download");
	    } else {
		// Download the thumbnail
		var thumburl = this.evaluate(function() {
		    var t = $("li.bottom-thumbnail.selected").css("background-image");
		    // Get rid of the url() wrapper.
		    return t.replace('url(','').replace(')','').replace(/\"/gi, "");
		});
		var thumbfilename = dir + this.evaluate(function() {
		    return $("li.bottom-thumbnail.selected").attr("id") + ".jpg";
		});
		if (debug) {
		    this.echo("Thumbnail url = " + thumburl + " filename = " + thumbfilename);
		}
		this.download(thumburl, thumbfilename);
		downloadsleft = 0;
	    }
	    imagesuccess = false;
	});
	// Wait for the download to finish
	this.waitFor(function check() {
	    return (downloadsleft == 0 && numresourcespending == 0) || atEnd;
	}, null, null, LONGWAIT);

	// Are we at the end of the album?
	this.then(function() {
	    imageurl = null;
	    if (this.evaluate(function() {
		return $("figure.right-nav").is(":visible");
	    })) {
		if (debug) {
		    this.echo("Right arrow is visible...");
		}
		this.click("figure.right-nav");
	    } else {
		if (debug) {
		    this.echo("At the end of the album!");
		}
		atEnd = true;
	    }
	});
    }

    // Go back to albums
    this.thenClick("li.close.single");
    this.thenClick("a#globalHeaderMyPhotos");
    loadMyPhotos();

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
