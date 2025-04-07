// gpt assisted regex
export const isValidCardNumber = (cardNumber) => {
    const regex = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/;
    return regex.test(cardNumber.replace(/\D/g, ''));
  };
  
  export const isValidExpiry = (expiry) => {
    const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    if (!regex.test(expiry)) return false;
  
    const [month, year] = expiry.split('/').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
  
    return year > currentYear || (year === currentYear && month >= currentMonth);
  };
  
  export const isValidCVV = (cvv) => /^[0-9]{3,4}$/.test(cvv);