export function formatDateUz(dateInput: string | number | Date, includeTime = false): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let res = `${day}.${month}.${year}`;

  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    res += ` ${hours}:${mins}`;
  }

  return res;
}

export function formatDateUzText(dateInput: string | number | Date): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const uzMonths = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ];
  const uzDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Paysh', 'Juma', 'Shan'];

  const day = d.getDate();
  const monthName = uzMonths[d.getMonth()];
  const year = d.getFullYear();
  const dayName = uzDays[d.getDay()];

  return `${day}-${monthName}, ${year} (${dayName})`;
}
