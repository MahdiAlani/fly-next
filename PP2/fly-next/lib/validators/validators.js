/**
 * Checks if the input is not null and that it corresponds to the given type.
 * No need to pass a desiredType if there is no desired type.
 * Examples of desired types include "string", "number"
 * @param {*} input 
 * @param {string} desiredType 
 */
export function isValidInput(input, desiredType = null, optional = false) {

    // If optional but a desiredType is passed, verify the desiredType is correct only if the input is passed
    if (optional && desiredType && input && typeof input === desiredType) {
        return true;
    }
    else if (optional && desiredType && input) {
        return false;
    }

    // If optional, input can be null or undefined
    if (optional && (input === undefined || input === null)) {
        return true;
    }

    // If no desired type is specified, just check if input is not null
    if (!desiredType && input) {
        return true;
    }

    // If desired type if specified, check if input is not null and the type corresponds to the desired type
    if (input && typeof input === desiredType) {
        return true;
    }

    return false;
}

/**
 * Checks if the passed email follows a valid email format
 * @param {string} email 
 * @returns 
 */
export function isValidEmail(email) {

    if (email.length == 0) {
        return false;
    }

    // Regex to test if email follows valid format (Generated by ChatGPT)
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zAZ0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
}

/**
 * Checks if the passed phone number follows a valid phone number format
 * @param {string} phoneNumber 
 * @returns 
 */
export function isValidPhoneNumber(phoneNumber) {

    if (phoneNumber.length == 0) {
        return false;
    }

    // Regex to test if phone number follows valid format (Generated by ChatGPT)
    const phonePattern = /^\d{3}-\d{3}-\d{4}$/;

    return phonePattern.test(phoneNumber);
}

/**
 * Checks if the passed date is a valid date
 * @param {string} date 
 */
export function isValidDate(date) {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
}

export function getDates(startDateStr, endDateStr) {
    const startDate = startDateStr ? new Date(startDateStr) : new Date(0);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    return { startDate, endDate };
  }
  