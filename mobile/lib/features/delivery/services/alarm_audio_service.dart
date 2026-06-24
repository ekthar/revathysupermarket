import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/widgets.dart';

/// Function type for creating AudioPlayer instances.
/// Used for dependency injection in tests.
typedef AudioPlayerFactory = AudioPlayer Function();

/// Service that manages alarm audio for delivery assignment alerts.
///
/// Plays a looping alarm sound every 3 seconds until explicitly stopped.
/// Only one alarm can be active at a time. Manages audio focus and
/// lifecycle correctly (pauses on background, resumes on foreground).
class AlarmAudioService with WidgetsBindingObserver {
  AlarmAudioService({AudioPlayerFactory? playerFactory})
      : _playerFactory = playerFactory ?? (() => AudioPlayer());

  final AudioPlayerFactory _playerFactory;
  AudioPlayer? _player;
  Timer? _loopTimer;
  bool _isPlaying = false;
  bool _isPaused = false;

  /// Whether an alarm is currently playing.
  bool get isPlaying => _isPlaying;

  /// Start the alarm audio loop.
  ///
  /// Plays alarm sound immediately, then repeats every 3 seconds.
  /// If already playing, this is a no-op (prevents duplicate alarms).
  Future<void> startAlarm() async {
    if (_isPlaying) return;

    _isPlaying = true;
    _isPaused = false;

    WidgetsBinding.instance.addObserver(this);

    try {
      _player = _playerFactory();
    } catch (e) {
      debugPrint('AlarmAudioService: Failed to create player: $e');
      // Continue without audio - state management still works
    }

    // Play the alarm sound immediately
    await _playAlarmOnce();

    // Loop every 3 seconds
    _loopTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (!_isPaused && _isPlaying) {
        _playAlarmOnce();
      }
    });
  }

  /// Play the alarm sound once.
  Future<void> _playAlarmOnce() async {
    try {
      await _player?.stop();
      // Use a bundled audio asset. In production, provide delivery_alarm.mp3
      // in assets/audio/. Falls back gracefully if file is missing.
      await _player?.play(
        AssetSource('audio/delivery_alarm.mp3'),
        volume: 1.0,
      );
    } catch (e) {
      debugPrint('AlarmAudioService: Failed to play alarm: $e');
    }
  }

  /// Stop the alarm audio and release resources.
  Future<void> stopAlarm() async {
    if (!_isPlaying) return;

    _isPlaying = false;
    _isPaused = false;

    _loopTimer?.cancel();
    _loopTimer = null;

    try {
      await _player?.stop();
      await _player?.dispose();
    } catch (_) {
      // Ignore disposal errors
    }
    _player = null;

    WidgetsBinding.instance.removeObserver(this);
  }

  /// Lifecycle observer: pause audio when app goes to background.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
        if (_isPlaying) {
          _isPaused = true;
          _player?.pause();
        }
        break;
      case AppLifecycleState.resumed:
        if (_isPlaying && _isPaused) {
          _isPaused = false;
          _playAlarmOnce();
        }
        break;
      default:
        break;
    }
  }

  /// Dispose the service. Must be called when no longer needed.
  Future<void> dispose() async {
    await stopAlarm();
  }
}
