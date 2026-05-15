const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ erro: 'Token não informado' });
  const [, token] = authHeader.split(' ');
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido' });
  }
}

function permit(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ erro: 'Não autenticado' });
    const perfis = Array.isArray(req.usuario.perfis) && req.usuario.perfis.length ? req.usuario.perfis : [req.usuario.perfil];
    if (!perfis.some((perfil) => roles.includes(perfil))) return res.status(403).json({ erro: 'Sem permissão para acessar este recurso' });
    next();
  };
}

module.exports = auth;
module.exports.permit = permit;
