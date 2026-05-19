// Conexao reutilizavel com o MongoDB.
const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function conectarDB() {
  // Aceita os dois nomes para facilitar deploy local e cloud.
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGO_URI nao configurada nas variaveis de ambiente');
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    // Guarda a promessa para evitar duas conexoes ao mesmo tempo.
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB conectado com sucesso');
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('Erro ao conectar no MongoDB:', error.message);
    throw error;
  }
}

module.exports = conectarDB;
