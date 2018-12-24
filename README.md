This was my attempt to create a scraper that would download all your
pictures from snapfish, since they make it a pain.

I used casperjs with slimerjs.  You can't use phantomjs because it
doesn't support file downloads.

Install casperjs and slimerjs first:

```npm install -g casperjs slimerjs```

Run using:

```casperjs --engine=slimerjs ./scrape.js --email=your@snapfish.login --password=yoursnapfishpassword```