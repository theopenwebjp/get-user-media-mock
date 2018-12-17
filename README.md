# Description

Mock library for getUserMedia and related functions.

## Usage

The code below will automatically apply mocks to the following functions:

* navigator.getUserMedia
* navigator.mediaDevices.getUserMedia
* navigator.mediaDevices.enumerateDevices
* navigator.mediaDevices.getSupportedConstraints

```
window.getUserMediaMock = new GetUserMediaMock();
getUserMediaMock.mock();
```

The code below will only apply mock stream if getUserMedia function(navigator.getUserMedia OR navigator.mediaDevices.getUserMedia) results in an error.

```
window.getUserMediaMock = new GetUserMediaMock();
getUserMediaMock.fallbackMock();
```

For more advanced usage check [Functions].

## Functions

* setMediaUrl (url)
* setMockType (mockType)
* fallbackMock ()
* mock (options)
* restoreOldHandles ()
* getMockStreamFromConstraints
* getMockCanvasStream (constraints)
* getMockMediaElementStream (constraints)
* createStartedRandomCanvasDrawerInterval (canvas)
* getConstraintBestValue (constraints, type, key)
* getMockDevices ()

## Support

Polyfills and transpiling(Babel, etc.) should be done outside of this library.

* https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream
* https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/captureStream

## Dependencies

https://github.com/meenie/band.js MIT
http://freemusicarchive.org/music/Tequila_Moonrise/Best_Of__Pick_Your_Player/Tequila_Moonrise_-_Best_Of_-_Pick_Your_Player_-_09_Tequila_Moonrise Public Domain
https://videos.pexels.com/videos/video-of-people-walking-855564 CC0 License