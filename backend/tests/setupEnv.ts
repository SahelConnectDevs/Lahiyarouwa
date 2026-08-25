// Valeurs bidon suffisantes pour que src/config/env.ts ne lève pas au chargement.
// MONGODB_URI est ensuite remplacé par l'URI réelle de mongodb-memory-server
// dans beforeAll() de chaque fichier de test (voir auth.test.ts).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/lahiyarouwa-test-placeholder';
process.env.CORS_ORIGIN = '*';
