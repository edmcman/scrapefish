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

var fs = require('fs');
var utils = require('utils');

var email = casper.cli.get("email")
var password = casper.cli.get("password")

var downloaded = false;

 
casper.start('https://www.snapfish.com/photo-gift/loginto', function() {
    this.fill('form#form1', {
        'EmailAddress':    email,
	'Password': password
    }, true);
    // this.page.onPageCreated = function(newPage) {
    // 	console.log('New page!!! ' + newPage);
    // };
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
    // this.page.onNavigationRequested = function(a, b, c, d) {
    // 	console.log("navigation requested to " +a+b+c+d);
    // };
    // this.page.onResourceRequested = function(a, b) {
    // 	console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData));
    // };
    // this.page.onPageCreated = function(newPage) {
    // 	console.log("A new child page was created, yay!");
    // };
});

// casper.options.onResourceReceived = function(C, response) {
//     if (response.stage != "end" || !response.bodySize) return;

//     if (response.isFileDownloading) {
// 	console.log("OMGOMGOMG" + fname);
// 	utils.dump(response);
// 	fs.write("test.zip", response.body, 'b');
//     }
    
// };

casper.on("remote.message", function(msg) {
    this.echo("remote: " + msg);
});

// casper.on("popup.created", function() {
//     this.echo("url popup created!");
// });

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

function processYear(year) {
    this.echo("Downloading year " + year);
    //var months = this.evaluate(function(year) { return $('div.monthbar div.left h2 small'); });
    var months = this.evaluate(function(year) { return $('div.monthbar div.left h2 small:contains(' + year + ')').parent().map(function() {return $(this).text()}).toArray(); }, year);
    utils.dump(months);
}

function sleep( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}


for (var i = 0; i < /*10*/1; i++) {
    casper.wait(10000);
    casper.then(function() {
     	casper.echo("Scrolling...");
    	//	casper.evaluate(function() { $("div#right-well").scrollTop($("div#right-well").scrollTop()+400); });
    	casper.evaluate(function() { $("div#right-well").scrollTop(10000); });
    	casper.echo("Waiting for loading bar to go away...");
    	casper.evaluate(function() { console.log("loading bar? " + $("bottomLoadingBar").isOnScreen()); });
    });

    if (false)
	// Ugh. Why doesn't htis work?  IT returns undefined!
	casper.waitFor(function() {
     	    this.evaluate(function() { ! $("#bottomLoadingBar").isOnScreen(); });
	}, null, null, 20000);
    else casper.wait(20000);

}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

casper.then(function() {    
    casper.echo("Looking at my photos.");
    var years = this.getElementsInfo("div.monthbar div.left h2 small").map(function(x) x.text ).filter(onlyUnique);

    // I only care about years between 2002 and 2006
    //years = years.filter(function(x) x >= 2002 && x <= 2006);
    utils.dump(years);

    years.forEach(processYear, this);

    //var monthsrequire('utils').dump(this.getElementsInfo("div.monthbar div.left h2").map(function(x) { x.text }));


    // var albums = this.getElementsInfo("p.storyCaption").map(function(x) {
    // 	return x.attributes.o_caption;
    // });
    // require('utils').dump(albums);

    // processAlbum(albums[0]);
	
});


// casper.then(function() {
//     this.wait(10000, function() {
// 	this.capture("test.png");
//     });
// });

casper.run(function() {
    console.log("Exiting");
    this.exit();
});
