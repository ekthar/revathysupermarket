/// Application environment configuration.
///
/// Defines the available environments and their respective settings
/// for the MSM Mobile application.
enum AppEnvironment {
  dev,
  prod,
}

/// Holds environment-specific configuration values.
class EnvironmentConfig {
  const EnvironmentConfig({
    required this.environment,
    required this.baseUrl,
    required this.appName,
  });

  final AppEnvironment environment;
  final String baseUrl;
  final String appName;

  bool get isDev => environment == AppEnvironment.dev;
  bool get isProd => environment == AppEnvironment.prod;

  static const dev = EnvironmentConfig(
    environment: AppEnvironment.dev,
    baseUrl: 'https://revathysupermarket.vercel.app/api/mobile/v1',
    appName: 'MSM Mobile (Dev)',
  );

  static const prod = EnvironmentConfig(
    environment: AppEnvironment.prod,
    baseUrl: 'https://msmsupermarket.com/api/mobile/v1',
    appName: 'MSM Mobile',
  );
}
