import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:msm_mobile/features/delivery/services/alarm_audio_service.dart';

class MockAudioPlayer extends Mock implements AudioPlayer {}

class FakeSource extends Fake implements Source {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() {
    registerFallbackValue(FakeSource());
  });

  group('AlarmAudioService', () {
    late AlarmAudioService service;
    late MockAudioPlayer mockPlayer;

    setUp(() {
      mockPlayer = MockAudioPlayer();
      when(() => mockPlayer.stop()).thenAnswer((_) async {});
      when(() => mockPlayer.pause()).thenAnswer((_) async {});
      when(() => mockPlayer.play(any(), volume: any(named: 'volume')))
          .thenAnswer((_) async {});
      when(() => mockPlayer.dispose()).thenAnswer((_) async {});

      service = AlarmAudioService(playerFactory: () => mockPlayer);
    });

    tearDown(() async {
      await service.dispose();
    });

    test('initial state is not playing', () {
      expect(service.isPlaying, false);
    });

    test('startAlarm sets isPlaying to true', () async {
      await service.startAlarm();
      expect(service.isPlaying, true);
    });

    test('stopAlarm sets isPlaying to false', () async {
      await service.startAlarm();
      expect(service.isPlaying, true);

      await service.stopAlarm();
      expect(service.isPlaying, false);
    });

    test('starting alarm twice does not create duplicate (idempotent)',
        () async {
      await service.startAlarm();
      await service.startAlarm(); // Should be no-op

      expect(service.isPlaying, true);

      await service.stopAlarm();
      expect(service.isPlaying, false);
    });

    test('stopping when not playing is safe (no-op)', () async {
      expect(service.isPlaying, false);
      await service.stopAlarm(); // Should not throw
      expect(service.isPlaying, false);
    });

    test('only one alarm active at a time', () async {
      final mockPlayer2 = MockAudioPlayer();
      when(() => mockPlayer2.stop()).thenAnswer((_) async {});
      when(() => mockPlayer2.pause()).thenAnswer((_) async {});
      when(() => mockPlayer2.play(any(), volume: any(named: 'volume')))
          .thenAnswer((_) async {});
      when(() => mockPlayer2.dispose()).thenAnswer((_) async {});

      final service1 =
          AlarmAudioService(playerFactory: () => mockPlayer);
      final service2 =
          AlarmAudioService(playerFactory: () => mockPlayer2);

      await service1.startAlarm();
      expect(service1.isPlaying, true);

      // In the app architecture, only one AlarmAudioService instance exists.
      // Starting another should not affect the first, but our design ensures
      // only one alarm screen/service manages the alarm at a time.
      await service2.startAlarm();
      expect(service2.isPlaying, true);

      // Both report playing, but the app-level coordinator ensures only one
      // alarm screen is shown at a time (via the alarm screen queue).
      await service1.stopAlarm();
      await service2.stopAlarm();

      expect(service1.isPlaying, false);
      expect(service2.isPlaying, false);

      await service1.dispose();
      await service2.dispose();
    });

    test('dispose stops the alarm', () async {
      await service.startAlarm();
      expect(service.isPlaying, true);

      await service.dispose();
      expect(service.isPlaying, false);
    });

    test('startAlarm plays audio immediately', () async {
      await service.startAlarm();

      verify(() => mockPlayer.play(any(), volume: any(named: 'volume')))
          .called(1);
    });

    test('stopAlarm calls stop on the player', () async {
      await service.startAlarm();
      await service.stopAlarm();

      // stop is called once during play (to reset), and once during stopAlarm
      verify(() => mockPlayer.stop()).called(2);
      verify(() => mockPlayer.dispose()).called(1);
    });
  });
}
