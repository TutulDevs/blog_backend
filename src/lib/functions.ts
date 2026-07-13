export const generateRandomNumber = (length = 6): number => {
  if (length <= 0) return 0;

  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return Math.floor(Math.random() * (max - min + 1)) + min;
};
