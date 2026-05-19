// Remove tudo que nao for numero.
export const onlyDigits = (value: string) => value.replace(/\D/g, '');

export const formatCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};
