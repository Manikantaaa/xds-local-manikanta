export interface faqQuestions {
    id: number,
    eventName: string,
    isArchieve: boolean,
    orderById: number,
    eventDescription: string,
    eventUrl: string,
    eventLocation: string,
    eventLogo: string,
    eventStartDate: string,
    eventEndDate: string,
    signedUrl: string,
    EventAttendees: {
        id: number,
        meetToMatchLink: string,
        Companies: {
            id: number,
            name: string,
        }
    }[]
  }
export interface eventTypes {
    id: number,
    eventName: string,
    isArchieve: boolean,
    orderById: number,
    eventDescription: string,
    eventUrl: string,
    eventLocation: string,
    eventLogo: string,
    eventStartDate: string,
    eventEndDate: string,
    signedUrl: string,
    EventAttendees?: {
            companyId: number,
    }[]
  }