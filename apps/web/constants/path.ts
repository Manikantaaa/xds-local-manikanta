import path from "path";

export const PATH = {
  STATIC_PAGE: { path: "/", name: "Static Page" },
  HOME: { path: "/home", name: "Home" },

  MY_PROFILE: { path: "/my-profile/personal-settings", name: "My Profile" },
  PERSONAL_SETTINGS: {
    path: "/my-profile/personal-settings",
    name: "Personal Settings",
    name_show: "My Profile",
  },
  CHANGE_PASSWORD: {
    path: "/my-profile/change-password",
    name: "Change Password",
  },
  SUBSCRIPTION: {
    name: "Subscription",
    dropdownName: "Subscription Details",
    path: (customerEmail?: string) =>
      `${process.env.NEXT_PUBLIC_XDS_STRIPE_CUSTOMER_PORTAL_LINK}?prefilled_email=${customerEmail}`,
  },
  SUBSCRIPTION_IN_MY_PROFILE: {
    name: "Subscription Details",
    path: "/my-profile/subscriptions",
  },
  COMPANY_PROFILE: {
    path: "/company-profile/general-info",
    name: "Edit Profile"
  }, 
  GENERAL_INFO: { path: "/company-profile/general-info", name: "General Info" },
  OUR_WORK: { path: "/company-profile/our-works", name: "Our Work" },
  PROJECTS: { path: "/company-profile/our-works?goto=2", name: "Project Highlights" },
  ALBUMS: { path: "/company-profile/our-works?goto=1", name: "Portfolio" },
  SERVICES: { path: "/company-profile/services", name: "Services" },
  DUE_DILIGENCE: {
    path: "/company-profile/due-diligence",
    name: "Due Diligence",
  },
  ABOUT: { path: "/company-profile/about", name: "About" },
  CONTACT: { path: "/company-profile/contacts", name: "Contacts" },
  EVENTS: { path: "/company-profile/events", name: "Events" },
  REVIEW_PUBLISH: {
    path: "/company-profile/review-publish",
    name: "Review & Publish",
  },
  LOGIN: { path: "/login", name: "Login" },
  ADMIN: { path: "/admin", name: "Admin" },
  USERS: { path: "/admin/users", name: "Users" },
  COMPANY: { path: "/admin/company", name: "Companies" },
  REGISTRATIONS: { path: "/admin/registrations", name: "Registrations" },
  REPORTS: { path: "/admin/reports", name: "Reports" },
  DASHBOARD: { path: "/admin/dashboard", name: "Dashboard" },
  CONTENT: { path: "/admin/faq", name: "Content" },
  UPLOADACTIVE: { path: "/admin/latest-partners", name: "Upload Active Buyer Logos" },
  MYLISTS: { path: "/my-lists", name: "My Lists" },
  NEWLIST: { path: "/create-list", name: "New List" },
  ARCHIVEDLIST: { path: "/archived-list", name: "Archived List" },
  MYPROJECTS: { path: "/my-projects", name: "My Projects" },
  NEWPROJECT: { path: "/create-project", name: "New Project" },
  ARCHIVEDPROJECT: { path: "/archived-projects", name: "Archived Projects" },
  MYOPPERTUNITIES: { path: "/my-opportunities", name: "Post Opportunities" },
  NEWOPPERTUNITY: { path: "/create-opportunity", name: "New Opportunities" },
  UPDATEOPPERTUNITY: {
    path: "/update-opportunity",
    name: "Update Opportunity",
  },
  UPDATEMYLIST: {
    path: "/update-list",
    name: "Update List",
  },
  UPDATEMYPROJECTS: {
    path: "/update-project",
    name: "Update Project",
  },
  ARCHIVEDOPPERTUNITIES: {
    path: "/archived-opportunities",
    name: "Archived Opportunities",
  },
  SERVICEPROVIDER_DETAILS: {
    path: "/serviceproviders",
    name: "Browse Service Providers",
  },
  BILLINGPAYMENTS: { path: "/billing-payments", name: "Billing Payment" },
  OPPORTUNITIES: { path: "/opportunities", name: "Browse Opportunities" },
  BROWSESERVICEPROVIDERS: {
    path: "/serviceproviders",
    name: "Browse Service Providers",
  },
  OTHERS_HOME: { path: "/home", name: "Home" },
  TWO_FACTOR_AUTH: { path: "/multifactor-authentication", name: "Two Factor Auth" },
  SECURITY_SETTINGS: {  path: "/my-profile/security-settings", name: "Security Settings" },
  PASSWORD_CHANGE_FIRST: { path: "/password-change", name: "Password Change" },
  FAQ:{path:"/faq", name: "FAQ"},
  CONTACTUS:{path:"/contact-us", name: "Contact Us"},
  CREATE_ALBUM:{path:"/company-profile/our-works/create-album", name: "Create Album"},
  CREATE_PORTFOLIO_PROJECT:{path:"/company-profile/our-works/create-project", name: "Create Project"},
  UPDATEPROJECT:{path:"/company-profile/our-works/update-project", name: "Update Project"},
  UPDATE_ALBUM:{path:"/company-profile/our-works/update-album", name: "Update Album"},
  COMPARE:{path:"/compare", name: "Compare"},
  CREATE_USER:{path:"/company-admin/users/create-user", name: "Create User"},
  EDIT_USER:{path:"/company-admin/users/edit-user", name: "Create User"},
  COMPANY_USERS : { path: "/company-admin/users", name: "Company Admin" },
  COMPANY_GROUPS : { path: "/company-admin/groups", name: "Groups" },
  INVITEES : { path: "/admin/invitees", name: "Invitees" },
  NOT_FOUND : { path: "/page-not-found", name: "404" },
  NOTIFICATIONS: { path: "/admin/notifications", name: "Notifications" },
  POST_ANNOUNCEMENTS: { path: "/company-profile/post-announcements", name: "Post Announcements" },
  BUSINESS_SOLUTIONS: { path: "/business-solutions", name: "Business Solutions" },
  // COMPANY_ADMIN: {
  //   USERS: {
  //     path: "/company-admin/users", name: "Company Users"
  //   }
  // }
};
