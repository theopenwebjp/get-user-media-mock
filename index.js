/**
 * Class for creating mock of getUserMedia for navigator.getUserMedia and navigator.mediaDevice.getUserMedia.
 * Usage: const m = new GetUserMediaMock(); m.setup();
 */
class GetUserMediaMock {

    constructor() {
        this.VIDEO_URL = './media/708213662.mp4';
        this.AUDIO_URL = './media/Tequila_Moonrise_-_09_-_Tequila_Moonrise.mp3';
        this.settings = {
            mockType: 'canvas', //canvas, mediaElement, audioContext
            constraints: {
                video: {
                    aspectRatio: false, //Upon testing in Chrome, width and height hold priority over aspectRatio.
                    facingMode: false,
                    frameRate: false,
                    height: false,
                    width: false
                },

                audio: {
                    autoGainControl: false,
                    channelCount: false,
                    echoCancellation: false,
                    latency: false,
                    noiseSuppression: false,
                    sampleRate: false,
                    sampleSize: false,
                    volume: false
                },

                image: {
                    whiteBalanceMode: false,
                    exposureMode: false,
                    focusMode: false,
                    pointsOfInterest: false,
                    exposureCompensation: false,
                    colorTemperature: false,
                    iso: false,
                    brightness: false,
                    contrast: false,
                    saturation: false,
                    sharpness: false,
                    focusDistance: false,
                    zoom: false,
                    torch: false
                }
            }
        };
        this.state = {
            prepared: false
        };
    }

    _storeOldHandles() {
        navigator._getUserMedia = navigator.getUserMedia
        if (!navigator.mediaDevices) { //Fallback. May have some issues.
            navigator.mediaDevices = {};
        }
        const m = navigator.mediaDevices;
        m._enumerateDevices = m.enumerateDevices;
        m._getSupportedConstraints = m.getSupportedConstraints;
        m._getUserMedia = m.getUserMedia;

        this.state.prepared = true;
    }

    /**
     * Dynamically update constraints. Applied on next call of getUserMedia, etc.
     * @param {String} type any key in this.settings.constraints
     * @param {Object} updates Data to apply to constraints
     * @param {Boolean} overwrite Whether to fully overwrite original.
     */
    updateConstraints(type = 'video', updates = {}, overwrite = false) {
        const c = this.settings.constraints;
        if (!c[type]) {
            return false;
        }
        if (overwrite) {
            c[type] = {};
        }
        for (let key in updates) {
            c[type][key] = updates[key];
        }
        return this;
    }

    /**
     * Applies mock to enviroment ONLY IF getUserMedia constraints fail.
     * @return this.
     */
    fallbackMock() {

        if (!this.state.prepared) {
            this._storeOldHandles();
        }

        const getSuccessHandle = (handle) => {
            return (stream) => {
                console.log('fallback NOT implemented');
                handle(stream);
            };
        }

        const handleFallback = (err, constraints) => {
            return this.getMockStreamFromConstraints(constraints)
                .then((stream) => {
                    console.warn('fallbackMock implemented', err);
                    return stream;
                });
        }

        //navigator.getUserMedia
        navigator.getUserMedia = (constraints, onSuccess, onError) => {
            navigator._getUserMedia(constraints, getSuccessHandle(onSuccess), (err) => {
                return handleFallback(err, constraints)
                    .then(onSuccess);
            });
        }

        //navigator.mediaDevices.getUserMedia
        navigator.mediaDevices.getUserMedia = (constraints) => {
            return new Promise((resolve, reject) => {
                navigator.mediaDevices._getUserMedia(constraints)
                    .then(getSuccessHandle(resolve))
                    .catch((err) => {
                        return handleFallback(err, constraints)
                            .then(resolve)
                            .catch(reject);
                    });
            });
        }

        return this;
    }

    /**
     * Applies mock to environment.
     * Generally should be applied before other scripts once.
     * @param {Object} options Way to only mock certain features. Mocks all by default.
     * @return this
     */
    mock(options) {
        if (typeof options !== 'object') {
            options = {
                getUserMedia: true,
                mediaDevices: {
                    getUserMedia: true,
                    getSupportedConstraints: true,
                    enumerateDevices: true
                }
            };
        }

        if (!this.state.prepared) {
            this._storeOldHandles();
        }

        //navigator.getUserMedia
        if (options.getUserMedia) {
            navigator.getUserMedia = (constraints, onSuccess, onError) => {
                return this.getMockStreamFromConstraints(constraints)
                    .then(onSuccess)
                    .catch(onError);
            }
        }

        if (options.mediaDevices) {

            //navigator.mediaDevices.getUserMedia
            if (options.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia = (constraints) => {
                    return this.getMockStreamFromConstraints(constraints);
                }
            }

            //navigator.mediaDevices.getSupportedConstraints
            if (options.mediaDevices.getSupportedConstraints) {
                navigator.mediaDevices.getSupportedConstraints = () => {
                    return this.settings.constraints;
                }
            }

            //navigator.mediaDevices.enumerateDevices
            if (options.mediaDevices.enumerateDevices) {
                navigator.mediaDevices.enumerateDevices = () => {
                    return this.getMockDevices();
                }
            }
        }

        return this;
    }

    /**
     * Restores actually native handles if mock handles already applied.
     */
    restoreOldHandles() {
        if (navigator._getUserMedia) {
            navigator.getUserMedia = navigator._getUserMedia;
            navigator._getUserMedia = null;
        }
        if (navigator.mediaDevices && navigator.mediaDevices._getUserMedia) {
            navigator.mediaDevices.enumerateDevices = navigator.mediaDevices._enumerateDevices;
            navigator.mediaDevices.getSupportedConstraints = navigator.mediaDevices._getSupportedConstraints;
            navigator.mediaDevices.getUserMedia = navigator.mediaDevices._getUserMedia;
        }

        this.state.prepared = false;
    }

    /**
     * Gets a media stream with motion and color.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints
     * @param {Object} constraints 
     * @return {Promise}
     */
    getMockStreamFromConstraints(constraints) {
        /*
        Ways to create stream:
        https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream
        https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/captureStream
        https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaStreamDestination
        */

        let stream = null;
        const mockType = this.settings.mockType;
        if (mockType === 'canvas') {
            stream = this.getMockCanvasStream(constraints);
        } else if (mockType === 'mediaElement') {
            stream = this.getMockMediaElementStream(constraints);
        } else if (mockType === 'audioContext') {
            stream = this.getMockAudioContextStream(constraints);
        }

        return Promise.resolve(stream);
    }

    /**
     * Returns stream that is internally generated using canvas and random data.
     * @param {MediaTrackContraints} constraints 
     * @return {MediaStream}
     */
    getMockCanvasStream(constraints) {
        const canvas = document.createElement('canvas');
        canvas.width = this.getConstraintBestValue(constraints, 'video', 'width');
        canvas.height = this.getConstraintBestValue(constraints, 'video', 'height');
        const interval = this.createRandomCanvasDrawerInterval(canvas);
        const stream = canvas.captureStream(this.getConstraintBestValue(constraints, 'video', 'frameRate'));
        stream.stop = () => {
            window.clearInterval(interval);
            if (stream._stop) {
                stream._stop();
            } //??
        };
        return stream;
    }

    /**
     * Returns stream with media used as source.
     * @param {MediaTrackContraints} constraints 
     * @return {MediaStream}
     */
    getMockMediaElementStream(constraints) {
        const video = document.createElement('video');
        video.autoplay = true;
        video.loop = true;

        video.src = (!!constraints.video) ? this.VIDEO_URL : this.AUDIO_URL;

        const stream = video.captureStream();
        return stream;
    }

    /**
     * Returns stream with audio
     * @param {MediaTrackContraints} constraints 
     * @return {MediaStream}
     */
    getMockAudioContextStream(constraints) {
        var conductor = new BandJS();
        conductor.setTimeSignature(4, 4);
        conductor.setTempo(120);
        var piano = conductor.createInstrument('square');

        piano.note('quarter', 'C4');
        piano.note('quarter', 'D4');
        piano.note('quarter', 'E4');
        piano.note('quarter', 'F4');

        var player = conductor.finish();
        player.loop(true);

        player.play();

        const streamDestination = conductor.audioContext.createMediaStreamDestination();
        const stream = streamDestination.stream;

        return stream;
    }

    /**
     * Creates and starts an interval that paints randomly to a canvas.
     * @param {DOMCanvas} canvas 
     * @return {Number} interval that can be cleared with window.clearInterval
     */
    createRandomCanvasDrawerInterval(canvas) {
        const FPS = 2;
        const ms = 1000 / FPS;
        const getRandom = (max) => {
            return Math.floor(Math.random() * max);
        };
        const interval = window.setInterval(() => {
            const ctx = canvas.getContext('2d');

            const x = 0;
            const y = 0;
            const width = getRandom(canvas.width);
            const height = getRandom(canvas.height);

            const r = getRandom(255);
            const g = getRandom(255);
            const b = getRandom(255);

            ctx.fillStyle = `rgb(${r},${g},${b})`;

            ctx.fillRect(x, y, width, height);
        }, ms);

        return interval;
    }

    /**
     * Gets constraint best value by necessary identifiers.
     * Returns appropriate defaults where important.
     * THIS IS FOR VALUES NOT ACTUAL SET CONTRAINTS.
     * USED FOR settings, etc. in UI.
     * @param {MediaTrackConstraints} constraints 
     * @param {String} type 
     * @param {String} key 
     * @return {*}
     */
    getConstraintBestValue(constraints, type, key) {
        const subConstraints = (typeof constraints[type] === 'object') ? constraints[type] : {};
        const cVal = subConstraints[key];

        let value
        if (typeof cVal !== 'object') {
            value = cVal
        } else if (cVal) {
            for (let key in cVal) {
                if (key === 'ideal') {
                    value = cVal[key]
                    break
                } else {
                    value = cVal[key]
                }
            }
        }

        //Defaults
        if (key === 'width' && !value) {
            value = 640;
        }
        if (key === 'height' && !value) {
            value = 480;
        }
        if (key === 'frameRate' && !value) {
            value = 15;
        }

        return value;
    }

    /**
     * Returns a set of mock devices using similar format.
     * @return {Promise} resolves array
     */
    getMockDevices() {
        const devices = [{
                kind: 'audioinput',
                label: '(4- BUFFALO BSW32KM03 USB PC Camera)'
            },
            {
                kind: 'audiooutput',
                label: 'Bluetooth Hands-free Audio'
            },
            {
                kind: 'videooutput',
                label: 'BUFFALO BSW32KM03 USB PC Camera'
            }
        ];
        return new Promise((resolve) => {
            devices.forEach((device, index) => {
                device.deviceId = String(index);
                device.groupId = String(index);
            });
            return resolve(devices);
        });
    }
}

if (typeof window === 'object') {
    window.GetUserMediaMock = GetUserMediaMock;
}
if (typeof module === 'object') {
    module.exports = GetUserMediaMock;
}
