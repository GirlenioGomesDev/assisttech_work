const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

module.exports = onlyDigits;
