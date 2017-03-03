This was my attempt to create a scraper that would download all your
pictures from snapfish, since they make it a pain.

I ended up using a semi-manual hack that wasn't too difficult.  Log in
via your browser, select the photos you want to download, and then
execute $("#bulkDownload").click(); in the javascript console.  You'll
magically start downloading .zip files of your images.

As for why my scraper doesn't work, I'm not sure.  I would start by
seeing if this.download is actually executing in:

https://prd-static-default.sf-cdn.com/library/assets/library_application-28ad28e4f59c1002f5667a4c652d1712.js

If not, find out what is blocking the javascript.