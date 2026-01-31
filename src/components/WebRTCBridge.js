import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

// HTML Content with Mesh Topology Support
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
        body { margin: 0; background: #000; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }
        
        /* Grid Layout */
        #video-grid {
            flex: 1;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 10px;
            padding: 10px;
        }

        .video-container {
            position: relative;
            background: #111;
            border-radius: 12px;
            overflow: hidden;
            width: 100%; /* Default 1-on-1 full width */
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* Adjust sizing based on count */
        .count-1 .video-container { width: 100%; height: 100%; }
        .count-2 .video-container { width: 100%; height: 48%; } /* Stacked vertically */
        .count-3 .video-container { width: 48%; height: 48%; } /* 2x2 grid */
        .count-4 .video-container { width: 48%; height: 48%; }

        video { width: 100%; height: 100%; object-fit: cover; }
        
        /* Local Video (Floating or in Grid?) 
           For WhatsApp style, Local is floating if 1-on-1, but part of grid if Group? 
           Let's keep it floating for now for simplicity, or make it draggable.
        */
        #localVideoContainer {
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 90px;
            height: 120px;
            border-radius: 10px;
            z-index: 10;
            overflow: hidden;
            border: 2px solid rgba(255,255,255,0.3);
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            transition: all 0.3s ease;
        }

        /* When in Group Mode (more than 1 remote), maybe move local to grid? 
           For now, stick to standard simplified WhatsApp style (floating).
        */
        
        #localVideo { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); } /* Mirror local */
    </style>
</head>
<body>
    <div id="video-grid" class="count-0">
        <!-- Remote Videos injected here -->
    </div>

    <div id="localVideoContainer">
        <video id="localVideo" autoplay playsinline muted></video>
    </div>

    <script>
        const peers = {}; // { [userId]: RTCPeerConnection }
        let localStream;
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        const grid = document.getElementById('video-grid');

        function sendMessage(type, payload) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
        }

        function updateGridClass() {
            const count = grid.children.length;
            grid.className = 'count-' + (count > 4 ? 4 : count);
        }

        async function setupMedia(isVoiceOnly) {
            try {
                const constraints = {
                    audio: true,
                    video: !isVoiceOnly ? { facingMode: 'user' } : false
                };
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                if (!isVoiceOnly) {
                    document.getElementById('localVideo').srcObject = localStream;
                    document.getElementById('localVideoContainer').style.display = 'block';
                } else {
                    document.getElementById('localVideoContainer').style.display = 'none';
                }

                sendMessage('MEDIA_READY', {});
            } catch (err) {
                sendMessage('ERROR', { message: 'Camera Error: ' + err.message });
            }
        }

        function createPeerConnection(userId) {
            if (peers[userId]) return peers[userId];

            const pc = new RTCPeerConnection(config);
            peers[userId] = pc;

            // Handle ICE Candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    sendMessage('ICE_CANDIDATE', { candidate: event.candidate, to: userId });
                }
            };

            // Handle Remote Stream
            pc.ontrack = (event) => {
                let vidContainer = document.getElementById('container-' + userId);
                if (!vidContainer) {
                    vidContainer = document.createElement('div');
                    vidContainer.id = 'container-' + userId;
                    vidContainer.className = 'video-container';
                    
                    const vid = document.createElement('video');
                    vid.autoplay = true;
                    vid.playsInline = true;
                    vid.srcObject = event.streams[0];
                    
                    vidContainer.appendChild(vid);
                    grid.appendChild(vidContainer);
                    updateGridClass();
                }
            };

            // Add Local Stream
            if (localStream) {
                localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            }

            return pc;
        }

        async function handleAddPeer(userId) {
            // Initiator logic: Create PC -> Create Offer -> Send
            const pc = createPeerConnection(userId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendMessage('OFFER_CREATED', { offer, to: userId });
        }

        async function handleOffer(offer, fromUserId) {
            const pc = createPeerConnection(fromUserId);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendMessage('ANSWER_CREATED', { answer, to: fromUserId });
        }

        async function handleAnswer(answer, fromUserId) {
            const pc = peers[fromUserId];
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        }

        async function handleCandidate(candidate, fromUserId) {
            const pc = peers[fromUserId];
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        }

        function handleRemovePeer(userId) {
            if (peers[userId]) {
                peers[userId].close();
                delete peers[userId];
            }
            const el = document.getElementById('container-' + userId);
            if (el) {
                el.remove();
                updateGridClass();
            }
        }

        // Message Handler
        document.addEventListener('message', async (event) => {
            const msg = JSON.parse(event.data);
            const { type, payload } = msg;

            switch (type) {
                case 'INIT':
                    await setupMedia(payload.isVoiceOnly);
                    break;
                case 'ADD_PEER': // Initiator calls this
                    await handleAddPeer(payload.userId);
                    break;
                case 'Handle_OFFER':
                    await handleOffer(payload.offer, payload.from);
                    break;
                case 'HANDLE_ANSWER':
                    await handleAnswer(payload.answer, payload.from);
                    break;
                case 'HANDLE_CANDIDATE':
                    await handleCandidate(payload.candidate, payload.from);
                    break;
                case 'REMOVE_PEER':
                    handleRemovePeer(payload.userId);
                    break;
                case 'END_CALL':
                    Object.keys(peers).forEach(id => handleRemovePeer(id));
                    if (localStream) localStream.getTracks().forEach(t => t.stop());
                    break;
            }
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
                    allowsInlineMediaPlayback={true} // Crucial for video
                    mediaPlaybackRequiresUserAction={false}
                    onMessage={(event) => {
                        try {
                            const data = JSON.parse(event.nativeEvent.data);
                            onMessage(data);
                        } catch (e) {
                            console.error('Bridge Error', e);
                        }
                    }}
                    originWhitelist={['*']}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    webview: { flex: 1, backgroundColor: 'transparent' }
});

export default WebRTCBridge;
