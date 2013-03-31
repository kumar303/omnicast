# OmniCast

A web app for [Firefox OS](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS)
that lets you share data between devices.

Until [copy/paste](https://github.com/mozilla-b2g/gaia/issues/2844)
lands in Firefox OS all this does is synchronize URLs.
For example, you could type an [app-loader](http://app-loader.appspot.com/)
URL on your desktop then click on
the link from your Firefox OS device to install an app.

## Run it

Install the [manifest](http://kumar303.github.com/omnicast/manifest.webapp)
or [launch it](http://kumar303.github.com/omnicast/)
from Git Hub Pages.
Here is a [shortcut](http://app-loader.appspot.com/44338)
to install the app from Git Hub pages.

## Hack on it

To simulate serving static content from Git Hub pages
you can run a simple NodeJS server:

    npm install
    npm start

Install the [manifest](http://0.0.0.0:3000/omnicast/manifest.webapp)
or [launch it](http://0.0.0.0:3000/omnicast/) from your local web server.
