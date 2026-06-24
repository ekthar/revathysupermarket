# Audio Assets

This directory contains audio files used by the app.

## Required Files

- `delivery_alarm.mp3` - Alarm sound played when a new delivery assignment arrives.
  Must be a short (3-5 second), attention-grabbing tone suitable for looping.
  The `AlarmAudioService` loops this file until the partner acknowledges the assignment.

## Setup

1. Add your `delivery_alarm.mp3` file to this directory.
2. The file is referenced in `pubspec.yaml` under `flutter.assets`.
3. Without this file, the alarm screen will display but play no sound.

## Notes

- Do NOT commit large audio files to git without using Git LFS.
- Recommended format: MP3, 128kbps, mono, 44.1kHz sample rate.
- Keep file size under 200KB for fast app loading.
