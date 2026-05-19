// Gera codigos curtos com prefixo, como USR-0001.
const gerarCodigo = (prefixo, numero) => `${prefixo}-${String(numero).padStart(4, '0')}`;
module.exports = gerarCodigo;
