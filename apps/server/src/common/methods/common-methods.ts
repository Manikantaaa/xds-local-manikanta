import { TRIAL_PERIOD, USER_TYPE } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import * as crypto from 'crypto';
import base64url from 'base64url';

export const formatDate = (date: Date): string => {
  const dateObject = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const formattedDate = dateObject.toLocaleDateString("en-US", options);
  return formattedDate;
};

export const getRoleString = (role: string, type = 0): string => {
  if (role == "admin") {
    return "Admin";
  } else if (role == "service_provider") {
    if (type == 1) {
      return "SP";
    }
    return "Service Provider";
  } else if (role == "buyer") {
    return "Buyer";
  } else {
    return "";
  }
};

export const generateRandomPassword = (): string => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialCharacters = '!@#$%^&*()_+[]{}|<>?';

  function getRandomCharacter(characters: string) {
    return characters.charAt(Math.floor(Math.random() * characters.length));
  }

  const randomLetter = getRandomCharacter(letters);
  const randomNumber = getRandomCharacter(numbers);
  const randomSpecialCharacter = getRandomCharacter(specialCharacters);

  let password = randomLetter + randomNumber + randomSpecialCharacter;

  const allCharacters = letters + numbers + specialCharacters;
  for (let i = password.length; i < 8; i++) {
    password += getRandomCharacter(allCharacters);
  }
  password.split('').sort(() => 0.5 - Math.random()).join('');
  return password;
};

const YOUTUBE = 'YOUTUBE';
const VIMEO = 'VIMEO';
export const getThumbnails = async (url: string, type: "YOUTUBE" | "VIMEO" = VIMEO) => {
  const embeddedUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|live\/|watch\?v=|v\/|watch\?.+&v=)([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})|vimeo\.com\/(?:channels\/[A-Za-z0-9]+\/)?(?:videos?\/)?(\d+))/;
  let thumbnailUrl: string = '';
  const isValidEmbeddedUrl = embeddedUrlRegex.test(url);
  if (isValidEmbeddedUrl) {
    const matches = url.match(embeddedUrlRegex);
    if (matches && (matches[1] || matches[2]) || (matches && matches[3])) {
      let videoId = matches[1] || matches[2];
      if (type == VIMEO) {
        videoId = matches[1] || matches[2] || matches[3];
        const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
        const videoData = await response.json();
        thumbnailUrl = videoData[0].thumbnail_medium;
      } else if (type === YOUTUBE) {
        const youtubeThumbnailUrl = `https://img.youtube.com/vi/${videoId}/hq720.jpg`;
        thumbnailUrl = youtubeThumbnailUrl;
      }
      return thumbnailUrl;
    }
  }
}

export const getUserTypeString = (item: USER_TYPE, trialDuration: TRIAL_PERIOD, page: string = ""): string => {
  if (item == 'free') {
    return "Foundational";
  } else if (item == 'paid') {
    return "Premium";
  } else if (item == 'trial') {
    if (trialDuration == "monthly") {
      return "30d Trial";
    } else if (trialDuration == "yearly") {
      return "1y Membership";
    } else if (trialDuration == 'eightWeeks') {
      return "8w Trial";
    } else if (trialDuration == 'sixMonths') {
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
}

export const getTypeString = (type: USER_TYPE) => {
  if (type == "free") {
    return "Foundational"
  }
  return "Premium";
}

export const getTheExpiryDetails = (accessExpirationDate: Date | null): string => {
  if (accessExpirationDate) {
    if (new Date(accessExpirationDate) > new Date()) {
      const theDate = formatDate(accessExpirationDate);
      return theDate;
    } else {
      return "Expired";
    }
  } else {
    return "-";
  }

}

export const getFirstDayOfCurrentWeek = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  let startOfWeekString = formatDateIntoString(startOfWeek);
  return new Date(startOfWeekString);
}

export const getFirstDayOfCurrentMonth = (): Date => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let startOfMonthString = formatDateIntoString(firstDayOfMonth);
  return new Date(startOfMonthString);
}

export const getFirstDayOfCurrentYear = (): Date => {
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  let startOfMonthYear = formatDateIntoString(firstDayOfYear);
  return new Date(startOfMonthYear);
}

export const formatDateIntoString = (date: Date): string => {
  const expiryDate = new Date(date);
  let year = expiryDate.getFullYear();
  let month = String(expiryDate.getMonth() + 1).padStart(2, '0');
  let day = String(expiryDate.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

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

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const getMinutesBetweenTwoDates = (date1: Date | null | undefined, date2: Date): number => {
  const oneMinuteInMilliseconds = 60 * 1000; // Seconds * milliseconds
  let differenceInMilliseconds = Math.abs(date2.getTime() - new Date().getTime());
  if (date1) {
    differenceInMilliseconds = Math.abs(date2.getTime() - date1.getTime());
  }
  return Math.floor(differenceInMilliseconds / oneMinuteInMilliseconds);
}

export const getLastDayOfCurrentWeek = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));
  let endOfWeekString = formatDateIntoString(endOfWeek);
  return new Date(endOfWeekString);
}

export const getLastDayOfCurrentMonth = (): Date => {
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  let lastOfMonthString = formatDateIntoString(lastDayOfMonth);
  return new Date(lastOfMonthString);
}

export const getLastDayOfCurrentYear = (): Date => {
  const today = new Date();
  const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
  let lastDayOfYearString = formatDateIntoString(lastDayOfYear);
  return new Date(lastDayOfYearString);
}

export const getNextDayDate = (startDate: Date): Date => {
  const theDate = new Date(startDate);
  theDate.setDate(theDate.getDate() + 1);
  return theDate;
}

export const decodeEmail = (encoded: string, key: string | undefined): string => {
  const binaryString = atob(encoded);

  const encodedBytes = new Uint8Array(binaryString.split("").map(char => char.charCodeAt(0)));

  const keyBytes = new TextEncoder().encode(key);

  const decodedBytes = encodedBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]);

  return new TextDecoder().decode(decodedBytes);
}

export const encryptString = (data: string, key: string | undefined): string => {
  const dataBytes = new TextEncoder().encode(data);
  const keyBytes = new TextEncoder().encode(key);
  const encodedBytes = dataBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]);
  return btoa(String.fromCharCode(...encodedBytes));
}

export function toLocalISOString(dateString: string) {
  // Create a Date object from the input date string
  let date = new Date(dateString);

  // Ensure the date is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  // Format the date manually to ISO string without time
  let isoDateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}T00:00:00.000Z`;

  // Return the ISO date string
  return isoDateString;
}

export const getMemberTypeString = (type: string): string => {
  if (type == "year") {
    return "Annual";
  } else if (type == "month") {
    return "Monthly";
  }
  return "";
}

export const generateToken = (): string => {
  return uuidv4();
}

export const getDaysBetweenTwoDates = (date1: Date, date2: Date): number => {
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // Hours * minutes * seconds * milliseconds
  const differenceInMilliseconds = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(differenceInMilliseconds / oneDayInMilliseconds);
}

export const getThubnailUrl = (url: string | null | undefined): string => {
  if (url) {
    let fileName = url;
    if (url.startsWith("http")) {
      const urlObj = new URL(url);
      const pathname = decodeURIComponent(urlObj.pathname);
      fileName = pathname.split('/').slice(2).join('/');
    }
    return fileName;
  }
  return "";
}

export const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
};

export const generateUniqueString = () => {
  const now = Date.now();
  const highResTime = performance.now();
  const uniqueTime = now + Math.floor(highResTime);
  return uniqueTime.toString(36);
}

export const getCountryName = (countryCode: string) => {
  const isoToCountry: any = {
    AF: { name: "Afghanistan", region: "Asia" },
    AL: { name: "Albania", region: "Europe" },
    DZ: { name: "Algeria", region: "Other" },
    AD: { name: "Andorra", region: "Europe" },
    AO: { name: "Angola", region: "Other" },
    AG: { name: "Antigua and Barbuda", region: "North America" },
    AR: { name: "Argentina", region: "South America" },
    AM: { name: "Armenia", region: "Europe" },
    AU: { name: "Australia", region: "Australia/New Zealand" },
    AT: { name: "Austria", region: "Europe" },
    AZ: { name: "Azerbaijan", region: "Europe" },
    BS: { name: "Bahamas", region: "North America" },
    BH: { name: "Bahrain", region: "Asia" },
    BD: { name: "Bangladesh", region: "Asia" },
    BB: { name: "Barbados", region: "North America" },
    BY: { name: "Belarus", region: "Europe" },
    BE: { name: "Belgium", region: "Europe" },
    BZ: { name: "Belize", region: "North America" },
    BJ: { name: "Benin", region: "Other" },
    BT: { name: "Bhutan", region: "Asia" },
    BO: { name: "Bolivia", region: "South America" },
    BA: { name: "Bosnia and Herzegovina", region: "Europe" },
    BW: { name: "Botswana", region: "Other" },
    BR: { name: "Brazil", region: "South America" },
    BN: { name: "Brunei Darussalam", region: "Asia" },
    BG: { name: "Bulgaria", region: "Europe" },
    BF: { name: "Burkina Faso", region: "Other" },
    BI: { name: "Burundi", region: "Other" },
    CV: { name: "Cabo Verde", region: "Other" },
    KH: { name: "Cambodia", region: "Asia" },
    CM: { name: "Cameroon", region: "Other" },
    CA: { name: "Canada", region: "North America" },
    CF: { name: "Central African Republic", region: "Other" },
    TD: { name: "Chad", region: "Other" },
    CL: { name: "Chile", region: "South America" },
    CN: { name: "China", region: "Asia" },
    CO: { name: "Colombia", region: "South America" },
    KM: { name: "Comoros", region: "Other" },
    CG: { name: "Congo (Congo-Brazzaville)", region: "Other" },
    CD: { name: "Congo (Democratic Republic of the)", region: "Other" },
    CR: { name: "Costa Rica", region: "North America" },
    HR: { name: "Croatia", region: "Europe" },
    CU: { name: "Cuba", region: "North America" },
    CY: { name: "Cyprus", region: "Europe" },
    CZ: { name: "Czechia (Czech Republic)", region: "Europe" },
    DK: { name: "Denmark", region: "Europe" },
    DJ: { name: "Djibouti", region: "Other" },
    DM: { name: "Dominica", region: "North America" },
    DO: { name: "Dominican Republic", region: "North America" },
    EC: { name: "Ecuador", region: "South America" },
    EG: { name: "Egypt", region: "Other" },
    SV: { name: "El Salvador", region: "North America" },
    GQ: { name: "Equatorial Guinea", region: "Other" },
    ER: { name: "Eritrea", region: "Other" },
    EE: { name: "Estonia", region: "Europe" },
    SZ: { name: "Eswatini", region: "Other" },
    ET: { name: "Ethiopia", region: "Other" },
    FJ: { name: "Fiji", region: "Australia/New Zealand" },
    FI: { name: "Finland", region: "Europe" },
    FR: { name: "France", region: "Europe" },
    GA: { name: "Gabon", region: "Other" },
    GM: { name: "Gambia", region: "Other" },
    GE: { name: "Georgia", region: "Europe" },
    DE: { name: "Germany", region: "Europe" },
    GH: { name: "Ghana", region: "Other" },
    GR: { name: "Greece", region: "Europe" },
    GD: { name: "Grenada", region: "North America" },
    GT: { name: "Guatemala", region: "North America" },
    GN: { name: "Guinea", region: "Other" },
    GW: { name: "Guinea-Bissau", region: "Other" },
    GY: { name: "Guyana", region: "South America" },
    HT: { name: "Haiti", region: "North America" },
    HN: { name: "Honduras", region: "North America" },
    HU: { name: "Hungary", region: "Europe" },
    IS: { name: "Iceland", region: "Europe" },
    IN: { name: "India", region: "Asia" },
    ID: { name: "Indonesia", region: "Asia" },
    IR: { name: "Iran", region: "Asia" },
    IQ: { name: "Iraq", region: "Asia" },
    IE: { name: "Ireland", region: "Europe" },
    IL: { name: "Israel", region: "Asia" },
    IT: { name: "Italy", region: "Europe" },
    JM: { name: "Jamaica", region: "North America" },
    JP: { name: "Japan", region: "Asia" },
    JO: { name: "Jordan", region: "Asia" },
    KZ: { name: "Kazakhstan", region: "Europe" },
    KE: { name: "Kenya", region: "Other" },
    KI: { name: "Kiribati", region: "Australia/New Zealand" },
    KW: { name: "Kuwait", region: "Asia" },
    KG: { name: "Kyrgyzstan", region: "Asia" },
    LA: { name: "Laos", region: "Asia" },
    LV: { name: "Latvia", region: "Europe" },
    LB: { name: "Lebanon", region: "Asia" },
    LS: { name: "Lesotho", region: "Other" },
    LR: { name: "Liberia", region: "Other" },
    LY: { name: "Libya", region: "Other" },
    LI: { name: "Liechtenstein", region: "Europe" },
    LT: { name: "Lithuania", region: "Europe" },
    LU: { name: "Luxembourg", region: "Europe" },
    MG: { name: "Madagascar", region: "Other" },
    MW: { name: "Malawi", region: "Other" },
    MY: { name: "Malaysia", region: "Asia" },
    MV: { name: "Maldives", region: "Asia" },
    ML: { name: "Mali", region: "Other" },
    MT: { name: "Malta", region: "Europe" },
    MH: { name: "Marshall Islands", region: "Australia/New Zealand" },
    MR: { name: "Mauritania", region: "Other" },
    MU: { name: "Mauritius", region: "Other" },
    MX: { name: "Mexico", region: "North America" },
    FM: { name: "Micronesia", region: "Australia/New Zealand" },
    MD: { name: "Moldova", region: "Europe" },
    MC: { name: "Monaco", region: "Europe" },
    MN: { name: "Mongolia", region: "Asia" },
    ME: { name: "Montenegro", region: "Europe" },
    MA: { name: "Morocco", region: "Other" },
    MZ: { name: "Mozambique", region: "Other" },
    MM: { name: "Myanmar (Burma)", region: "Asia" },
    NA: { name: "Namibia", region: "Other" },
    NR: { name: "Nauru", region: "Australia/New Zealand" },
    NP: { name: "Nepal", region: "Asia" },
    NL: { name: "Netherlands", region: "Europe" },
    NZ: { name: "New Zealand", region: "Australia/New Zealand" },
    NI: { name: "Nicaragua", region: "North America" },
    NE: { name: "Niger", region: "Other" },
    NG: { name: "Nigeria", region: "Other" },
    KP: { name: "North Korea", region: "Asia" },
    MK: { name: "North Macedonia", region: "Europe" },
    NO: { name: "Norway", region: "Europe" },
    OM: { name: "Oman", region: "Asia" },
    PK: { name: "Pakistan", region: "Asia" },
    PW: { name: "Palau", region: "Australia/New Zealand" },
    PS: { name: "Palestine State", region: "Asia" },
    PA: { name: "Panama", region: "North America" },
    PG: { name: "Papua New Guinea", region: "Australia/New Zealand" },
    PY: { name: "Paraguay", region: "South America" },
    PE: { name: "Peru", region: "South America" },
    PH: { name: "Philippines", region: "Asia" },
    PL: { name: "Poland", region: "Europe" },
    PT: { name: "Portugal", region: "Europe" },
    QA: { name: "Qatar", region: "Asia" },
    RO: { name: "Romania", region: "Europe" },
    RU: { name: "Russia", region: "Europe" },
    RW: { name: "Rwanda", region: "Other" },
    KN: { name: "Saint Kitts and Nevis", region: "North America" },
    LC: { name: "Saint Lucia", region: "North America" },
    VC: { name: "Saint Vincent and the Grenadines", region: "North America" },
    WS: { name: "Samoa", region: "Australia/New Zealand" },
    SM: { name: "San Marino", region: "Europe" },
    ST: { name: "Sao Tome and Principe", region: "Other" },
    SA: { name: "Saudi Arabia", region: "Asia" },
    SN: { name: "Senegal", region: "Other" },
    RS: { name: "Serbia", region: "Europe" },
    SC: { name: "Seychelles", region: "Other" },
    SL: { name: "Sierra Leone", region: "Other" },
    SG: { name: "Singapore", region: "Asia" },
    SK: { name: "Slovakia", region: "Europe" },
    SI: { name: "Slovenia", region: "Europe" },
    SB: { name: "Solomon Islands", region: "Australia/New Zealand" },
    SO: { name: "Somalia", region: "Other" },
    ZA: { name: "South Africa", region: "Other" },
    KR: { name: "South Korea", region: "Asia" },
    SS: { name: "South Sudan", region: "Other" },
    ES: { name: "Spain", region: "Europe" },
    LK: { name: "Sri Lanka", region: "Asia" },
    SD: { name: "Sudan", region: "Other" },
    SR: { name: "Suriname", region: "South America" },
    SE: { name: "Sweden", region: "Europe" },
    CH: { name: "Switzerland", region: "Europe" },
    SY: { name: "Syria", region: "Asia" },
    TW: { name: "Taiwan", region: "Asia" },
    TJ: { name: "Tajikistan", region: "Asia" },
    TZ: { name: "Tanzania", region: "Other" },
    TH: { name: "Thailand", region: "Asia" },
    TL: { name: "Timor-Leste", region: "Asia" },
    TG: { name: "Togo", region: "Other" },
    TO: { name: "Tonga", region: "Australia/New Zealand" },
    TT: { name: "Trinidad and Tobago", region: "North America" },
    TN: { name: "Tunisia", region: "Other" },
    TR: { name: "Turkey", region: "Asia" },
    TM: { name: "Turkmenistan", region: "Asia" },
    TV: { name: "Tuvalu", region: "Australia/New Zealand" },
    UG: { name: "Uganda", region: "Other" },
    UA: { name: "Ukraine", region: "Europe" },
    AE: { name: "United Arab Emirates", region: "Asia" },
    GB: { name: "United Kingdom", region: "UK" },
    US: { name: "United States of America", region: "North America" },
    UY: { name: "Uruguay", region: "South America" },
    UZ: { name: "Uzbekistan", region: "Asia" },
    VU: { name: "Vanuatu", region: "Australia/New Zealand" },
    VA: { name: "Vatican City (Holy See)", region: "Europe" },
    VE: { name: "Venezuela", region: "South America" },
    VN: { name: "Vietnam", region: "Asia" },
    YE: { name: "Yemen", region: "Asia" },
    ZM: { name: "Zambia", region: "Other" },
    ZW: { name: "Zimbabwe", region: "Other" },
  };
  if (isoToCountry[countryCode]) {
    return isoToCountry[countryCode]; // Convert ISO code to country name
  }
  return countryCode;
}
export const getRegionName = (countryCode: string) => {
  const regionFromCountry: any = {
    "Afghanistan": "Asia",
    "Albania": "Europe",
    "Algeria": "Other",
    "Andorra": "Europe",
    "Angola": "Other",
    "Antigua and Barbuda": "North America",
    "Argentina": "South America",
    "Armenia": "Europe",
    "Australia": "Australia/New Zealand",
    "Austria": "Europe",
    "Azerbaijan": "Europe",
    "Bahamas": "North America",
    "Bahrain": "Asia",
    "Bangladesh": "Asia",
    "Barbados": "North America",
    "Belarus": "Europe",
    "Belgium": "Europe",
    "Belize": "North America",
    "Benin": "Other",
    "Bhutan": "Asia",
    "Bolivia": "South America",
    "Bosnia and Herzegovina": "Europe",
    "Botswana": "Other",
    "Brazil": "South America",
    "Brunei Darussalam": "Asia",
    "Bulgaria": "Europe",
    "Burkina Faso": "Other",
    "Burundi": "Other",
    "Cabo Verde": "Other",
    "Cambodia": "Asia",
    "Cameroon": "Other",
    "Canada": "North America",
    "Central African Republic": "Other",
    "Chad": "Other",
    "Chile": "South America",
    "China": "Asia",
    "Colombia": "South America",
    "Comoros": "Other",
    "Congo (Congo-Brazzaville)": "Other",
    "Congo (Democratic Republic of the)": "Other",
    "Costa Rica": "North America",
    "Croatia": "Europe",
    "Cuba": "North America",
    "Cyprus": "Europe",
    "Czechia (Czech Republic)": "Europe",
    "Denmark": "Europe",
    "Djibouti": "Other",
    "Dominica": "North America",
    "Dominican Republic": "North America",
    "Ecuador": "South America",
    "Egypt": "Other",
    "El Salvador": "North America",
    "Equatorial Guinea": "Other",
    "Eritrea": "Other",
    "Estonia": "Europe",
    "Eswatini": "Other",
    "Ethiopia": "Other",
    "Fiji": "Australia/New Zealand",
    "Finland": "Europe",
    "France": "Europe",
    "Gabon": "Other",
    "Gambia": "Other",
    "Georgia": "Europe",
    "Germany": "Europe",
    "Ghana": "Other",
    "Greece": "Europe",
    "Grenada": "North America",
    "Guatemala": "North America",
    "Guinea": "Other",
    "Guinea-Bissau": "Other",
    "Guyana": "South America",
    "Haiti": "North America",
    "Honduras": "North America",
    "Hungary": "Europe",
    "Iceland": "Europe",
    "India": "Asia",
    "Indonesia": "Asia",
    "Iran": "Asia",
    "Iraq": "Asia",
    "Ireland": "Europe",
    "Israel": "Asia",
    "Italy": "Europe",
    "Jamaica": "North America",
    "Japan": "Asia",
    "Jordan": "Asia",
    "Kazakhstan": "Europe",
    "Kenya": "Other",
    "Kiribati": "Australia/New Zealand",
    "Kuwait": "Asia",
    "Kyrgyzstan": "Asia",
    "Laos": "Asia",
    "Latvia": "Europe",
    "Lebanon": "Asia",
    "Lesotho": "Other",
    "Liberia": "Other",
    "Libya": "Other",
    "Liechtenstein": "Europe",
    "Lithuania": "Europe",
    "Luxembourg": "Europe",
    "Madagascar": "Other",
    "Malawi": "Other",
    "Malaysia": "Asia",
    "Maldives": "Asia",
    "Mali": "Other",
    "Malta": "Europe",
    "Marshall Islands": "Australia/New Zealand",
    "Mauritania": "Other",
    "Mauritius": "Other",
    "Mexico": "North America",
    "Micronesia": "Australia/New Zealand",
    "Moldova": "Europe",
    "Monaco": "Europe",
    "Mongolia": "Asia",
    "Montenegro": "Europe",
    "Morocco": "Other",
    "Mozambique": "Other",
    "Myanmar (Burma)": "Asia",
    "Namibia": "Other",
    "Nauru": "Australia/New Zealand",
    "Nepal": "Asia",
    "Netherlands": "Europe",
    "New Zealand": "Australia/New Zealand",
    "Nicaragua": "North America",
    "Niger": "Other",
    "Nigeria": "Other",
    "North Korea": "Asia",
    "North Macedonia": "Europe",
    "Norway": "Europe",
    "Oman": "Asia",
    "Pakistan": "Asia",
    "Palau": "Australia/New Zealand",
    "Palestine State": "Asia",
    "Panama": "North America",
    "Papua New Guinea": "Australia/New Zealand",
    "Paraguay": "South America",
    "Peru": "South America",
    "Philippines": "Asia",
    "Poland": "Europe",
    "Portugal": "Europe",
    "Qatar": "Asia",
    "Romania": "Europe",
    "Russia": "Europe",
    "Rwanda": "Other",
    "Saint Kitts and Nevis": "North America",
    "Saint Lucia": "North America",
    "Saint Vincent and the Grenadines": "North America",
    "Samoa": "Australia/New Zealand",
    "San Marino": "Europe",
    "Sao Tome and Principe": "Other",
    "Saudi Arabia": "Asia",
    "Senegal": "Other",
    "Serbia": "Europe",
    "Seychelles": "Other",
    "Sierra Leone": "Other",
    "Singapore": "Asia",
    "Slovakia": "Europe",
    "Slovenia": "Europe",
    "Solomon Islands": "Australia/New Zealand",
    "Somalia": "Other",
    "South Africa": "Other",
    "South Korea": "Asia",
    "South Sudan": "Other",
    "Spain": "Europe",
    "Sri Lanka": "Asia",
    "Sudan": "Other",
    "Suriname": "South America",
    "Sweden": "Europe",
    "Switzerland": "Europe",
    "Syria": "Asia",
    "Taiwan": "Asia",
    "Tajikistan": "Asia",
    "Tanzania": "Other",
    "Thailand": "Asia",
    "Timor-Leste": "Asia",
    "Togo": "Other",
    "Tonga": "Australia/New Zealand",
    "Trinidad and Tobago": "North America",
    "Tunisia": "Other",
    "Turkey": "Asia",
    "Turkmenistan": "Asia",
    "Tuvalu": "Australia/New Zealand",
    "Uganda": "Other",
    "Ukraine": "Europe",
    "United Arab Emirates": "Asia",
    "United Kingdom": "UK",
    "United States of America": "North America",
    "Uruguay": "South America",
    "Uzbekistan": "Asia",
    "Vanuatu": "Australia/New Zealand",
    "Vatican City (Holy See)": "Europe",
    "Venezuela": "South America",
    "Vietnam": "Asia",
    "Yemen": "Asia",
    "Zambia": "Other",
    "Zimbabwe": "Other",
  };
  if (regionFromCountry[countryCode]) {
    return regionFromCountry[countryCode];
  }
  return countryCode;
}

export function generateCsrfToken(secret: string, sessionId: string): string {
  return crypto.createHmac('sha256', secret)
    .update(sessionId)
    .digest('hex');
}

function base64urlEncode(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')  // Replace + with -
    .replace(/\//g, '_')  // Replace / with _
    .replace(/=+$/, '');  // Remove trailing =
}

export function verifyAuthenticationJwtToken(jwt: string): string | false {
  if (!jwt) {
    return false;
  }

  const tokenParts = jwt.split('.');
  const header = Buffer.from(tokenParts[0], 'base64').toString('utf8');
  const payload = Buffer.from(tokenParts[1], 'base64').toString('utf8');
  const signatureProvided = tokenParts[2];
  const expiration = JSON.parse(payload).exp;
  const isTokenExpired = (expiration - Math.floor(Date.now() / 1000)) < 0;
  const base64UrlHeader = base64url(Buffer.from(header));
  const base64UrlPayload = base64url(Buffer.from(payload));
  const securetoken = process.env.XDS_CSRF_SECRET_KEY || '';
  const signature = crypto
    .createHmac('sha256', securetoken)
    .update(`${base64UrlHeader}.${base64UrlPayload}`)
    .digest('base64');
  const base64UrlSignature = base64urlEncode(signature);
  const isSignatureValid = base64UrlSignature === signatureProvided;
  if (isTokenExpired || !isSignatureValid) {
    return 'Expired';
  } else {
    return 'Not Expired';
  }
}

export const stripeCancelOpts: any = {
  switched_service: "I found an alternative",
  too_expensive: "It's too expensive",
  unused: "I no longer need it",
  other: "Other reason"
}

export function capitalizeFirstLetter(sentence: string | null): string | null {
  if (!sentence || sentence == null) return sentence;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

export function extractOriginalEmail(email: string): string {
  const match = email.match(/^(?:deleted(?:-\d+)?-)(.+)$/);
  return match ? match[1] : email;
};

export function  decodeHtmlEntities(text: string): string {
  return text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
             .replace(/&quot;/g, '"')
             .replace(/&apos;/g, "'")
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>');
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

export const encodeMailcheckResponse = (isMail: boolean) => {
  const secretKey = process.env.EMAIL_SECRET_KEY || '';
  const timestamp = Date.now().toString();
  const data = `${isMail}:${timestamp}`;
  const cipher = crypto.createHmac('sha256', secretKey).update(data).digest('hex');
  return `${cipher}:${timestamp}`;
}

export const decodedString = (encryptedString: string, key: string | undefined): string => {
  const binaryString = atob(encryptedString);
  const encodedBytes = new Uint8Array(binaryString.split("").map(char => char.charCodeAt(0)));
  const keyBytes = new TextEncoder().encode(key);
  const decodedBytes = encodedBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]);
  return new TextDecoder().decode(decodedBytes);
}

export const isValidJsonString = (str: string) => {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null;
  } catch (e) {
    return false;
  }
}

export const allowedColumnIds = [
  "checkboxsp",
  "logo",
  "name",
  "partner_status",
  "performance_ratings",
  "core_services",
  "contact_info",
  "tier",
  "company_size",
  "country",
  "game_engines",
  "website"
];

export const decryptRememberMeToken = (token: string) => {
  const secretKey = process.env.EMAIL_SECRET_KEY || '';
  const keyBytes = new TextEncoder().encode(secretKey);

  const encodedStr = atob(token);
  const encodedBytes = Uint8Array.from(encodedStr, c => c.charCodeAt(0));
  const decryptedBytes = encodedBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]);

  const decryptedData = new TextDecoder().decode(decryptedBytes);
  const [isChecked, email] = decryptedData.split('----');

  return { isChecked, email };
};

