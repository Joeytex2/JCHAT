# Voice and Video Call Features - Chat.html

## Overview
This document describes the comprehensive voice and video call features implemented in Chat.html using WebRTC technology.

## Features Implemented

### 1. Call Buttons
- **Voice Call Button**: Green phone icon in chat header
- **Video Call Button**: Blue video camera icon in chat header
- Buttons are disabled during active calls
- Visual feedback with hover effects and active states

### 2. Ringtone System
- **Primary**: Uses `ringtone.mp3` file (if available)
- **Fallback 1**: Uses `ne.mp3` file (existing in repository)
- **Fallback 2**: Generates musical ringtone using Tone.js
- Ringtone plays during incoming calls
- Automatically stops when call is answered, rejected, or ended

### 3. Call Interfaces

#### Video Call Interface
- **Local Video**: Shows your camera feed
- **Remote Video**: Shows partner's camera feed
- **Call Timer**: Displays call duration
- **Quality Indicator**: Shows connection quality bars
- **Controls**:
  - Mute/Unmute Audio
  - Toggle Video On/Off
  - Switch Camera (Front/Back)
  - Screen Share
  - Picture-in-Picture
  - Take Snapshot
  - Record Call
  - Device Settings
  - Fullscreen
  - End Call

#### Voice Call Interface
- **Partner Avatar**: Shows partner's profile picture
- **Partner Name**: Displays partner's username
- **Call Status**: Shows connection status
- **Controls**:
  - Mute/Unmute
  - Speaker Toggle
  - End Call

### 4. Pre-Join Flow
- **Device Selection**: Choose microphone, camera, and speaker
- **Preview**: See your camera feed before joining
- **Test Controls**: Mute/unmute and toggle video before joining
- **Join/Cancel**: Confirm or cancel the call setup

### 5. Call Management
- **Incoming Call Notifications**: Ringtone + visual overlay
- **Accept/Reject**: Easy call handling
- **Call Status Messages**: Automatic chat messages about call events
- **Connection Quality Monitoring**: Real-time quality indicators
- **Adaptive Encoding**: Adjusts video quality based on connection

### 6. Advanced Features
- **Screen Sharing**: Share your screen during video calls
- **Picture-in-Picture**: Watch remote video in PiP mode
- **Call Recording**: Record video calls locally
- **Snapshots**: Capture frames from video calls
- **Device Settings**: Change audio/video devices during calls
- **Keyboard Shortcuts**:
  - `M`: Mute/Unmute
  - `V`: Toggle Video
  - `S`: Screen Share
  - `F`: Fullscreen
  - `Q`: End Call

## Technical Implementation

### WebRTC Configuration
- **ICE Servers**: Multiple STUN servers for NAT traversal
- **Media Constraints**: Optimized for HD video (1280x720)
- **Audio Processing**: Echo cancellation, noise suppression, auto gain control

### Signaling
- **Firebase Firestore**: Real-time signaling for WebRTC
- **Call Status Tracking**: Persistent call state management
- **Notification System**: Real-time call notifications

### Audio/Video Processing
- **Tone.js Integration**: For ringtone generation and notifications
- **MediaRecorder API**: For call recording
- **Canvas API**: For video snapshots
- **Picture-in-Picture API**: For PiP functionality

## File Structure

### Required Files
```
Chat.html              # Main chat interface with call features
ringtone.mp3           # Custom ringtone (user-provided)
ne.mp3                 # Fallback ringtone (existing)
```

### Optional Files
```
CALL_FEATURES_README.md # This documentation file
```

## Setup Instructions

### 1. Ringtone Setup
1. Replace `ringtone.mp3` with your preferred ringtone
2. File should be in MP3 format
3. Place in the same directory as `Chat.html`
4. If not provided, system will use fallbacks

### 2. Browser Permissions
- **Microphone**: Required for voice calls
- **Camera**: Required for video calls
- **Notifications**: Recommended for call alerts

### 3. Network Requirements
- **HTTPS**: Required for WebRTC (except localhost)
- **STUN Servers**: Configured for NAT traversal
- **Firebase**: Required for signaling and notifications

## Usage Guide

### Starting a Call
1. Select a chat partner
2. Click voice call (📞) or video call (📹) button
3. Grant microphone/camera permissions
4. Configure devices in pre-join screen
5. Click "Join" to start the call

### During a Call
- **Mute**: Click microphone button or press `M`
- **Toggle Video**: Click video button or press `V`
- **Screen Share**: Click screen share button or press `S`
- **Fullscreen**: Click fullscreen button or press `F`
- **End Call**: Click red phone button or press `Q`

### Receiving a Call
1. Ringtone will play automatically
2. Call overlay will appear with partner info
3. Click "Accept" to join or "Reject" to decline
4. Grant permissions if prompted

## Browser Compatibility

### Supported Browsers
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11+)
- **Edge**: Full support

### Required APIs
- WebRTC (RTCPeerConnection)
- getUserMedia API
- MediaRecorder API
- Picture-in-Picture API
- Web Audio API (Tone.js)

## Troubleshooting

### Common Issues
1. **No Ringtone**: Check if `ringtone.mp3` exists, fallback will be used
2. **Permission Denied**: Grant microphone/camera permissions
3. **No Video**: Check camera permissions and device selection
4. **Poor Quality**: Check internet connection and device settings
5. **Call Won't Connect**: Check firewall settings and STUN server access

### Debug Information
- Open browser console for detailed logs
- Look for "JCHAT_DEBUG" and "JCHAT_ERROR" messages
- Check WebRTC stats for connection quality

## Security Considerations

### Privacy
- Calls are peer-to-peer (no server recording)
- Local recording only (user-initiated)
- Device permissions are required

### Data Protection
- No call content stored on servers
- Signaling data is temporary
- Call metadata is minimal

## Future Enhancements

### Planned Features
- Group video calls
- Call encryption
- Background blur
- Virtual backgrounds
- Call analytics
- Call scheduling

### Technical Improvements
- TURN server support
- Better error handling
- Performance optimization
- Mobile optimization

## Support

For issues or questions about the call features:
1. Check browser console for error messages
2. Verify file permissions and network access
3. Test with different browsers
4. Review this documentation

---

**Note**: This implementation provides a complete voice and video calling solution using modern web technologies. The system is designed to be robust with multiple fallbacks and comprehensive error handling.