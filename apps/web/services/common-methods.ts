import { APPROVAL_STATUS } from "@/constants/approvalStatus";
import { Company, USER_TYPE, Users } from "@/types/user.type";
import { number } from "yup";
import moment from 'moment';
import * as crypto from 'crypto';

export const getRoleString = (role: string, from: number = 1): string => {
  if (role == "admin") {
    return "Admin";
  } else if (role == "service_provider") {
    if (from == 0) {
      return "SP";
    }
    return "Service Provider";
  } else if (role == "buyer") {
    return "Buyer";
  } else {
    return "";
  }
};

export const formatDate = (date: Date | undefined | null): string => {
  if (date) {
    const dateObject = new Date(date);
    const options: any = { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" };
    const UTCDATE = dateObject.toUTCString()
    const formattedDate = dateObject.toLocaleDateString("en-US", options);
    return formattedDate;
  }
  return "";
};

export const getUTCDateFormatEndTime = (inputDate: Date) => {
  return Date.UTC(
    new Date(inputDate).getUTCFullYear(),
    new Date(inputDate).getUTCMonth(),
    new Date(inputDate).getUTCDate(),
    23, 59, 59, 999
  )
}

export const getUTCDateFormatStartTime = (inputDate: Date) => {
  return Date.UTC(
    new Date(inputDate).getUTCFullYear(),
    new Date(inputDate).getUTCMonth(),
    new Date(inputDate).getUTCDate(),
    0, 0, 0, 0
  )
}

export function formatDateToYYYYMMDD(date: Date) {
  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
  let day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export const getStatusString = (status: string): string => {
  if (status == APPROVAL_STATUS.approved || status == APPROVAL_STATUS.pwdCreated || status == APPROVAL_STATUS.completed) {
    return "Approved";
  } else if (status == APPROVAL_STATUS.pending) {
    return "Needs Review";
  } else if (status == APPROVAL_STATUS.rejected) {
    return "Rejected";
  } else if (status == APPROVAL_STATUS.underReview) {
    return "Under Review";
  } else {
    return "";
  }
};

export const getUserTypeString = (item: Users, page: string = ""): string => {
  if (item.userType == 'free') {
    return "Foundational";
  } else if (item.userType == 'paid') {
    return "Premium";
  } else if (item.userType == 'trial') {
    if (item.trialDuration == "monthly") {
      return "30d Trial";
    } else if (item.trialDuration == "yearly") {
      return "1y Membership";
    } else if (item.trialDuration == "eightWeeks") {
      return "8w Trial";
    } else if (item.trialDuration == "sixMonths") {
      return "6m Trial";
    } else {
      return "-";
    }
  } else {
    if(page == "register") {
      return "Premium";
    } else {
      return "-";
    }
  }
};

export const getUserType = (item: { userType: String, trialDuration: string }) => {
  if (item.userType == 'free') {
    return "Foundational";
  } else if (item.userType == 'paid') {
    return "Premium";
  } else if (item.userType == 'trial') {
    if (item.trialDuration == "monthly") {
      return "30d Trial";
    } else if (item.trialDuration == "yearly") {
      return "1y Membership";
    } else if (item.trialDuration == "eightWeeks") {
      return "8w Trial";
    } else {
      return "-";
    }
  } else {
    return "-";
  }
};

export const getMonthsAndDaysBetweenTwoDates = (startDateO: Date, endDateO: Date): string => {
  const startDate = new Date(startDateO);
  const endDate = new Date(endDateO);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Invalid date format");
  }

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const startDay = startDate.getDate();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();
  const endDay = endDate.getDate();

  let monthsDifference = (endYear - startYear) * 12 + (endMonth - startMonth);
  let daysDifference = endDay - startDay;

  // If the end day is before the start day, adjust the days difference
  if (daysDifference < 0) {
    // Move to the previous month
    const lastDayOfPreviousMonth = new Date(endYear, endMonth, 0).getDate();
    daysDifference += lastDayOfPreviousMonth;
    monthsDifference -= 1;
  }

  return `${monthsDifference}m ${daysDifference}d`;
}

export const getDaysBetweenTwoDates = (date1: Date, date2: Date): number => {
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // Hours * minutes * seconds * milliseconds
  const differenceInMilliseconds = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(differenceInMilliseconds / oneDayInMilliseconds);
}

export const getMemberTypeString = (type: string): string => {
  if (type == "year") {
    return "Yearly";
  } else if (type == "month") {
    return "Monthly";
  }
  return "";
}

export const formatDateRange = (startDate: Date | undefined, endDate: Date | undefined): string => {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startOptions: any = { month: 'short', day: 'numeric', timeZone: 'UTC' };
    const endOptions: any = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' };

    const startFormatted = start.toLocaleDateString('en-US', startOptions);
    const endFormatted = end.toLocaleDateString('en-US', endOptions);

    const startMonth = start.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

    return `${startMonth} ${startFormatted.split(' ')[1]}-${endFormatted}`;
  }
  return '';
};

export const encryptString = (data: string, key: string | undefined): string => {
  const dataBytes = new TextEncoder().encode(data);
  const keyBytes = new TextEncoder().encode(key);
  const encodedBytes = dataBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]);
  return btoa(String.fromCharCode(...encodedBytes));
}

export const decodedString = (encryptedString: string, key: string | undefined): string => {
  const binaryString = atob(encryptedString);
  const encodedBytes = new Uint8Array(binaryString.split("").map(char => char.charCodeAt(0)));
  const keyBytes = new TextEncoder().encode(key);
  const decodedBytes = encodedBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]);
  return new TextDecoder().decode(decodedBytes);
}

export const isValidDate = (dateString: string) => {
  const date: any = new Date(dateString.slice(0, 20));
  return date instanceof Date && !isNaN(date.getTime());
}

export const formatNumberIndianWithRegex = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

export const extractNumber = (input: string): number => {
  const cleanedInput = input.replace(/,/g, '');
  const numberMatch = cleanedInput.match(/[\d.]+/g)?.join('');
  const result = numberMatch ? parseFloat(numberMatch) : 0;
  return result;
};

export const getFormattedDateForNotifications = (pastDate: any) => {
  const currentDate = moment(); // current date-time
  const past = moment(pastDate, 'YYYY-MM-DD hh:mm:ss A'); // parse the input

  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
  const time = past.toDate().toLocaleTimeString([], timeOptions).toLowerCase();

  if (past.isSame(currentDate, 'day')) {
    return `Today, ${time}`;
  } else if (past.isSame(currentDate.clone().subtract(1, 'day'), 'day')) {
    return `Yesterday, ${time}`;
  } else {
    const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const date = past.toDate().toLocaleDateString([], dateOptions);
    return `${date}, ${time}`;
  }
};

export const fallbackCopyToClipboard = (text: string) => {
  // Create a temporary textarea element
  const textArea = document.createElement("textarea");
  textArea.value = text;

  // Position it off-screen to avoid any visual disturbance
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  textArea.style.top = "0";

  // Append to the document
  document.body.appendChild(textArea);

  // Select the text
  textArea.focus();
  textArea.select();

  try {
    // Execute the copy command
    const successful = document.execCommand("copy");
    console.log(successful ? "Text copied!" : "Failed to copy text.");
  } catch (err) {
    console.error("Error copying text: ", err);
  }

  // Clean up by removing the textarea
  document.body.removeChild(textArea);
}

export const formatDateIntoString = (date: Date): string => {
  const expiryDate = new Date(date);
  let year = expiryDate.getFullYear();
  let month = String(expiryDate.getMonth() + 1).padStart(2, '0');
  let day = String(expiryDate.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

// export const setCrousalAgain = (
//   items: { id: number, adImagePath: string, mobileAdImagePath: string, adURL: string, adPage: string }[],
//   val: string
// ) => {
//   if (items.length === 0) return [];
//   const stringAdIds = localStorage.getItem(val);
//   if (stringAdIds) {
//     const adIds = JSON.parse(stringAdIds);
//     if (adIds && adIds.length > 0) {
//       const firstAd = adIds.shift();
//       adIds.push(firstAd);
//       localStorage.setItem(val, JSON.stringify(adIds));
//       const sortedItems = items.sort((a, b) => {
//         return adIds.indexOf(a.id) - adIds.indexOf(b.id);
//       });
//       console.log(sortedItems);
//       return sortedItems;
//     }
//   }
//   const shuffledItems = shuffleArray(items);
//   const adIds = shuffledItems.map(item => item.id);
//   localStorage.setItem(val, JSON.stringify(adIds));
//   const sortedItems = items.sort((a, b) => {
//     return adIds.indexOf(a.id) - adIds.indexOf(b.id);
//   });
//   return sortedItems;
// }

export const setCrousalAgain = (
  items: { id: number, adImagePath: string, mobileAdImagePath: string, adURL: string, adPage: string }[],
  val: string
) => {
  if (items.length === 0) return [];
  const stringAdIds = localStorage.getItem(val);
  let currentAdIds: number[] = [];
  const itemIds = items.map(item => item.id);
  if (!stringAdIds) {
    const shuffledItems = shuffleArray(items);
    currentAdIds = shuffledItems.map(item => item.id);
    localStorage.setItem(val, JSON.stringify(currentAdIds));
    return shuffledItems;
  }
  try {
    currentAdIds = JSON.parse(stringAdIds) || [];
  } catch {
    currentAdIds = [];
  }

  const newIds = itemIds.filter(id => !currentAdIds.includes(id));
  currentAdIds.push(...newIds);
  currentAdIds = currentAdIds.filter(id => itemIds.includes(id));
  if(newIds.length > 0) {
    currentAdIds = shuffleArray(currentAdIds);
  }
  const firstAd = currentAdIds.shift();
  if (firstAd !== undefined) {
    currentAdIds.push(firstAd);
  }
  localStorage.setItem(val, JSON.stringify(currentAdIds));
  const sortedItems = [...items].sort((a, b) => {
    return currentAdIds.indexOf(a.id) - currentAdIds.indexOf(b.id);
  });

  return sortedItems;
};

export function shuffleArray(array: any[]): any[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const checkSubscriptionChange = (isCancelled: boolean | undefined, isChanged: boolean | undefined, type: string): string => {
  if(isCancelled && !isChanged) {
    return "Returning";
  }
  if(!isCancelled && isChanged) {
    if(type === "year") {
      return "To Annual";
    } else if(type === "month") {
      return "To Monthly";
    }
    return "Changed";
  }
  if(isCancelled && isChanged) {
    if(type === "year") {
      return "Returning(To Annual)";
    } else if(type === "month") {
      return "Returning(To Monthly)";
    }
    return "Changed";
  }
  return "-";
};

export const decodeMailcheckResponse = (encryptedValue: string) => {
  const secretKey = process.env.NEXT_PUBLIC_XDS_EMAIL_SECRET_KEY || '';
  const parts = encryptedValue.split(':');
  if (parts.length !== 2) return false;
  const [cipher, timestamp] = parts;

  // Try both possible values for isMail: "true" and "false"
  for (const isMail of ['true', 'false']) {
    const data = `${isMail}:${timestamp}`;
    const expectedCipher = crypto.createHmac('sha256', secretKey).update(data).digest('hex');
    if (cipher === expectedCipher) {
      return isMail === 'true';
    }
  }
  return false;
}

export const remeberMecheckedToken = (isChecked: string, email: string) => {
  const timestamp = Date.now(); // current time in milliseconds
  const data = `${isChecked}----${email}----${timestamp}`;
  const secretKey = process.env.NEXT_PUBLIC_XDS_EMAIL_SECRET_KEY || '';
  const dataBytes = new TextEncoder().encode(data);
  const keyBytes = new TextEncoder().encode(secretKey);
  const encodedBytes = dataBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]);
  return btoa(String.fromCharCode(...encodedBytes));
};

