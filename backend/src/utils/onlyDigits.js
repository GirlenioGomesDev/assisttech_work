// Remove tudo que nao for numero.
const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

module.exports = onlyDigits;
