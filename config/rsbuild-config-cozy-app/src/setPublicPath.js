/*
Fix rsbuild HMR

In dev environment, our app is served by the cozy-stack and not by rsbuild dev server.

That's why we need to:
- set dev.writeToDisk so that's rsbuild always write updated files in the output folder so that the cozy-stack always serve updated files
- set dev.client to configure HMR websocket to go to the rsbuild dev server and not to the cozy-stack

However, HMR does not only rely on websocket but also on GET requests each time there is a change to a main.[hash].hot-update.js file.

These files are written by default in the output folder (build/) but the cozy-stack does not serve files in the build/ folder.

Even if I change the folder where hot-update.js files are written with output.hotUpdateChunkFilename and output.hotUpdateMainFilename to
a folder served by the cozy-stack like build/public/ it does not work. I did not understand why. Maybe a race condition where the .hot-update.js file
is asked to soon and the file is not already written on the disk and served by the cozy-stack ?

This is a dirty fix that allows to change only in development and only for HMR hot-update.js files the URL to load them: they will be loaded from the rsbuild dev server.
*/

// Set the rsbuild public path dynamically for HMR
// This tells rsbuild where to fetch hot-update files from
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line camelcase, no-undef
  __webpack_public_path__ = 'http://localhost:3000/'
}
