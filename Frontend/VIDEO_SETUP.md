# Video Setup Guide

## How to Add Your Demo Video

The landing page now supports video instead of static images! Here's how to configure it:

### Configuration Location
File: `Frontend/src/components/DashboardPreview.tsx`

Look for the `videoConfig` object:

```typescript
const videoConfig = {
  type: 'local', // Options: 'local', 'youtube', 'image'
  localSrc: '/demo-video.mp4',
  youtubeSrc: 'https://www.youtube.com/embed/YOUR_VIDEO_ID',
  posterImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=675&fit=crop',
};
```

## Option 1: Local Video File (Recommended for Best Performance)

1. **Prepare your video:**
   - Format: MP4 (H.264 codec for best browser compatibility)
   - Resolution: 1920x1080 (Full HD) recommended
   - File size: Keep under 10MB for fast loading
   - Aspect ratio: 16:9

2. **Add video to project:**
   ```
   Frontend/
   └── public/
       └── demo-video.mp4  ← Place your video here
   ```

3. **Update configuration:**
   ```typescript
   const videoConfig = {
     type: 'local',
     localSrc: '/demo-video.mp4', // Your video filename
     posterImage: '/demo-poster.jpg', // Optional poster image
   };
   ```

4. **Video will:**
   - ✅ Autoplay on page load
   - ✅ Loop continuously
   - ✅ Be muted (required for autoplay)
   - ✅ Show controls for user interaction
   - ✅ Display poster image while loading

## Option 2: YouTube Video Embed

1. **Get your YouTube video:**
   - Upload video to YouTube
   - Copy the video ID from URL: `youtube.com/watch?v=VIDEO_ID`
   - Or use the embed link

2. **Update configuration:**
   ```typescript
   const videoConfig = {
     type: 'youtube',
     youtubeSrc: 'https://www.youtube.com/embed/YOUR_VIDEO_ID',
   };
   ```

3. **YouTube parameters (optional):**
   ```typescript
   youtubeSrc: 'https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1&mute=1&loop=1',
   ```
   - `autoplay=1` - Auto start
   - `mute=1` - Muted
   - `loop=1` - Loop video
   - `controls=0` - Hide controls

## Option 3: Use Static Image (Fallback)

```typescript
const videoConfig = {
  type: 'image',
  posterImage: 'https://your-image-url.com/image.jpg',
};
```

## Best Practices

### Video Content Suggestions:
- **Screen recording** of your dashboard in action
- **Feature walkthrough** showing key functionality
- **Client testimonial** video (with permission)
- **Quick demo** (30-60 seconds ideal)
- **Professional production** with voiceover (optional)

### Video Optimization:
```bash
# Compress video using ffmpeg (optional)
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 2M output.mp4
```

### Technical Tips:
- **File size:** Aim for 5-10MB for quick loading
- **Resolution:** 1920x1080 (1080p) or 1280x720 (720p)
- **Format:** MP4 with H.264 codec
- **Audio:** Include audio but video will auto-mute for autoplay
- **Length:** 30-90 seconds keeps attention
- **Poster:** Always provide a poster image for slow connections

## Example Videos You Can Use

### Free Stock Videos:
- [Pexels Videos](https://www.pexels.com/videos/)
- [Pixabay Videos](https://pixabay.com/videos/)
- [Coverr](https://coverr.co/)

### Screen Recording Tools:
- **Windows:** Xbox Game Bar (Win + G) or OBS Studio
- **Mac:** QuickTime Player or ScreenFlow
- **Cross-platform:** OBS Studio, Loom, or ShareX

## Current Setup

The video is currently configured to use:
- **Type:** Local video
- **Source:** `/demo-video.mp4`
- **Features:** Autoplay, Loop, Muted, With Controls
- **Fallback:** Poster image from Unsplash

## Need Help?

Place your video file in `Frontend/public/demo-video.mp4` and it will automatically work! 🎥✨
