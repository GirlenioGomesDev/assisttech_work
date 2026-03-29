const gerarCodigo = (prefixo, numero) => `${prefixo}-${String(numero).padStart(4, '0')}`;
module.exports = gerarCodigo;
