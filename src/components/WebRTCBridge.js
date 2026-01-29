import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

// HTML Content for the WebView
// This handles the actual WebRTC logic (getUserMedia, RTCPeerConnection)
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
        body { margin: 0; background: #000; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; }
        video { width: 100%; height: 100%; object-fit: cover; }
        #localVideo { position: absolute; top: 20px; right: 20px; width: 100px; height: 140px; border-radius: 10px; z-index: 2; object-fit: cover; border: 2px solid #fff; }
    </style>
</head>
<body>
    <video id="remoteVideo" autoplay playsinline></video>
    <video id="localVideo" autoplay playsinline muted></video>

    <script>
        let pc;
        let localStream;
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        function sendMessage(type, payload) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
        }

        async function setupMedia(isVoiceOnly) {
            try {
                const constraints = {
                    audio: true,
                    video: !isVoiceOnly ? { facingMode: 'user' } : false
                };
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                // Show local video if available
                if (!isVoiceOnly) {
                    const localVideo = document.getElementById('localVideo');
                    localVideo.srcObject = localStream;
                } else {
                    document.getElementById('localVideo').style.display = 'none';
                    document.getElementById('remoteVideo').style.display = 'none'; // Hide video containers for voice
                }

                sendMessage('MEDIA_READY', {});
            } catch (err) {
                sendMessage('ERROR', { message: 'Failed to access camera/mic: ' + err.message });
            }
        }

        async function createPeerConnection() {
            pc = new RTCPeerConnection(config);

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    sendMessage('ICE_CANDIDATE', event.candidate);
                }
            };

            pc.ontrack = (event) => {
                const remoteVideo = document.getElementById('remoteVideo');
                remoteVideo.srcObject = event.streams[0];
            };

            if (localStream) {
                localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            }
        }

        async function createOffer() {
            if (!pc) await createPeerConnection();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendMessage('OFFER_CREATED', offer);
        }

        async function handleOffer(offer) {
            if (!pc) await createPeerConnection();
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendMessage('ANSWER_CREATED', answer);
        }

        async function handleAnswer(answer) {
            if (!pc) await createPeerConnection(); // Should exist
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }

        async function handleCandidate(candidate) {
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        }

        // Handle Messages from React Native
        document.addEventListener('message', async (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'INIT':
                    await setupMedia(message.payload.isVoiceOnly);
                    break;
                case 'CREATE_OFFER':
                    await createOffer();
                    break;
                case 'HANDLE_OFFER':
                    await handleOffer(message.payload);
                    break;
                case 'HANDLE_ANSWER':
                    await handleAnswer(message.payload);
                    break;
                case 'HANDLE_CANDIDATE':
                    await handleCandidate(message.payload);
                    break;
                case 'END_CALL':
                    if (pc) pc.close();
                    if (localStream) localStream.getTracks().forEach(t => t.stop());
                    pc = null;
                    localStream = null;
                    break;
            }
        });
        
        // Also support window.addEventListener for iOS sometimes
        window.addEventListener('message', async (event) => {
             // same logic if needed, usually document 'message' covers RN WebView
        });
    </script>
</body>
</html>
`;

class WebRTCBridge extends Component {
    webViewRef = null;

    sendMessageToWebView = (type, payload) => {
        const script = `
            var event = new MessageEvent('message', { data: JSON.stringify({ type: "${type}", payload: ${JSON.stringify(payload)} }) });
            document.dispatchEvent(event);
        `;
        this.webViewRef?.injectJavaScript(script);
    };

    render() {
        const { onMessage } = this.props;

        return (
            <View style={styles.container}>
                <WebView
                    ref={ref => this.webViewRef = ref}
                    source={{ html: htmlContent }}
                    style={styles.webview}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    onMessage={(event) => {
                        try {
                            const data = JSON.parse(event.nativeEvent.data);
                            onMessage(data);
                        } catch (e) {
                            console.error('Bridge Message Parse Error', e);
                        }
                    }}
                    originWhitelist={['*']}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Ensure black background
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    }
});

export default WebRTCBridge;
