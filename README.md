# rating-analyzer


## Bookmarklet instructions

To use this program you will have to download your scores from Kamaitachi. I've written a bookmarklet which will download all your scores into a JSON file / update the JSON file with new scores.

```js
javascript:(function(d){if(location.origin=="https://kamai.tachi.ac"){var s=d.createElement("script");s.src="https://raw.githack.com/barrysir/rating-analyzer/main/public/bookmarklet/main.js";s.onload=function(){};d.body.append(s);}else{alert("Please run this bookmarklet on https://kamai.tachi.ac!");}})(document)
```

1. Save the above code as a bookmark and run it on any Kamaitachi page.
2. A file picker will pop up to select your existing score file. If you don't have an existing file, cancel the dialog to create a new database.
3. Wait for the script to finish processing. If the script looks like it's frozen, look in the browser Dev Tools for the console output of the script.
4. Once finished it will send the updated file as a download.

## Dev Documentation

* Install dependencies: `npm install`
* Start the server: `npm run dev`
  * Server runs at [http://localhost:3000](http://localhost:3000)
* Build server: `npm run build`
* Build bookmarklet: `npm run bookmarklet`

### Bookmarklet

Here's a developer version of the bookmarklet which points to `localhost`:

```js
javascript:(function(d){if(location.origin=="https://kamai.tachi.ac"){var s=d.createElement("script");s.src="http://localhost:3000/bookmarklet/main.js";s.onload=function(){};d.body.append(s);}else{alert("Please run this bookmarklet on https://kamai.tachi.ac!");}})(document)
```

After modifying the bookmarlet source code, compile the bookmarklet to js with `npm run bookmarklet`. Changes will be reflected immediately when you run the bookmarklet again in browser.
