const jwt = require('jsonwebtoken');
const SessaoUsuario = require('../models/SessaoUsuario');

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ erro: 'Token nao informado' });

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ erro: 'Token malformado' });
  if (!process.env.JWT_SECRET) return res.status(500).json({ erro: 'JWT_SECRET nao configurado' });

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    if (req.usuario.sid) {
      const sessao = await SessaoUsuario.findOne({ id_sessao: req.usuario.sid }).select('status expira_em').lean();
      if (!sessao || sessao.status !== 'ativa') return res.status(401).json({ erro: 'Sessao encerrada' });
      if (sessao.expira_em && new Date(sessao.expira_em).getTime() < Date.now()) {
        await SessaoUsuario.findOneAndUpdate({ id_sessao: req.usuario.sid }, { status: 'expirada' });
        return res.status(401).json({ erro: 'Sessao expirada' });
      }
      SessaoUsuario.updateOne({ id_sessao: req.usuario.sid }, { ultimo_acesso: new Date() }).catch(() => {});
    }
    next();
  } catch {
    return res.status(401).json({ erro: 'Token invalido' });
  }
}

function permit(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ erro: 'Nao autenticado' });
    const perfis = Array.isArray(req.usuario.perfis) && req.usuario.perfis.length ? req.usuario.perfis : [req.usuario.perfil];
    if (!perfis.some((perfil) => roles.includes(perfil))) {
      return res.status(403).json({ erro: 'Sem permissao para acessar este recurso' });
    }
    next();
  };
}

module.exports = auth;
module.exports.permit = permit;
