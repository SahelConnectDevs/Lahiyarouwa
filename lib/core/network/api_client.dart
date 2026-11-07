import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/api_constants.dart';
import '../errors/app_exception.dart';

/// Client HTTP unique de l'app, construit sur Dio.
///
/// Instancié une seule fois (voir main.dart) et injecté dans chaque
/// repository — jamais utilisé directement depuis l'UI. Gère
/// automatiquement l'ajout du token d'auth et la conversion des erreurs
/// Dio en [AppException] typées.
class ApiClient {
  ApiClient({FlutterSecureStorage? secureStorage})
    : _secureStorage = secureStorage ?? const FlutterSecureStorage(),
      _dio = Dio(
        BaseOptions(
          baseUrl: ApiConstants.baseUrl,
          connectTimeout: ApiConstants.connectTimeout,
          receiveTimeout: ApiConstants.receiveTimeout,
        ),
      ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _secureStorage.read(key: _tokenKey);
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            onUnauthorized?.call();
          }
          handler.next(error);
        },
      ),
    );
  }

  static const _tokenKey = 'auth_token';

  final Dio _dio;
  final FlutterSecureStorage _secureStorage;

  /// Appelé quand le backend renvoie 401 (token expiré/invalide) sur
  /// n'importe quel appel. Câblé sur AuthProvider.forceLogout dans main.dart.
  void Function()? onUnauthorized;

  Future<void> saveToken(String token) =>
      _secureStorage.write(key: _tokenKey, value: token);

  Future<void> clearToken() => _secureStorage.delete(key: _tokenKey);

  Future<String?> readToken() => _secureStorage.read(key: _tokenKey);

  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) => _request(() => _dio.get(path, queryParameters: queryParameters));

  Future<Response<dynamic>> post(String path, {dynamic data}) =>
      _request(() => _dio.post(path, data: data));

  Future<Response<dynamic>> put(String path, {dynamic data}) =>
      _request(() => _dio.put(path, data: data));

  Future<Response<dynamic>> patch(String path, {dynamic data}) =>
      _request(() => _dio.patch(path, data: data));

  Future<Response<dynamic>> delete(String path) =>
      _request(() => _dio.delete(path));

  Future<Response<dynamic>> _request(
    Future<Response<dynamic>> Function() call,
  ) async {
    try {
      return await call();
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  AppException _mapDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.connectionError:
        return const NetworkException();
      default:
        break;
    }

    final statusCode = e.response?.statusCode;
    final data = e.response?.data;

    if (statusCode == 401 || statusCode == 403) {
      return UnauthorizedException(
        _extractMessage(data) ?? 'Session expirée, reconnecte-toi.',
      );
    }

    if (statusCode == 422 || statusCode == 400) {
      final fieldErrors = _extractFieldErrors(data);
      if (fieldErrors.isNotEmpty) {
        return ValidationException(
          _extractMessage(data) ?? 'Données invalides.',
          fieldErrors,
        );
      }
    }

    return ServerException(
      _extractMessage(data) ??
          'Une erreur est survenue (${statusCode ?? 'inconnue'}).',
      statusCode: statusCode,
    );
  }

  String? _extractMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      final message = data['message'] ?? data['error'];
      if (message is String) return message;
    }
    return null;
  }

  Map<String, String> _extractFieldErrors(dynamic data) {
    if (data is Map<String, dynamic> && data['errors'] is Map) {
      return (data['errors'] as Map).map(
        (key, value) => MapEntry(key.toString(), value.toString()),
      );
    }
    return const {};
  }
}
