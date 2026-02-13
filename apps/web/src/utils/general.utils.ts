/**
 * Gets the integer or float value of a string
 */
export const customParseInt = (
  val: string | null | undefined,
  parseToFloat: boolean = false,
) => {
  if (!val) return null;
  return parseToFloat ? parseFloat(val) : parseInt(val);
};

export const customFormatDate = ({
  dateToFormat,
  day = "2-digit",
  month = "2-digit",
  year = "numeric",
}: {
  dateToFormat: Date | string;
  day: string;
  month: string;
  year: string;
}) => {
  const finalDate =
    dateToFormat instanceof Date ? dateToFormat : new Date(dateToFormat);

  const formatDateOptions: { day?: string; month?: string; year?: string } = {
    day,
    month,
    year,
  };

  if (day === "none") delete formatDateOptions.day;
  if (month === "none") delete formatDateOptions.month;
  if (year === "none") delete formatDateOptions.year;

  return new Intl.DateTimeFormat(
    "fr-FR",
    formatDateOptions as Intl.DateTimeFormatOptions,
  ).format(finalDate);
};
