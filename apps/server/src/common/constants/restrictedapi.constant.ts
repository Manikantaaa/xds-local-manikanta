const   API_PERMISSIONS = {
    //service rates
    addServiceRates: { url: "add-service-rates", pageId: [13], type: 'W' },
    getServiceRates: { url: "getServiceRates", pageId: [13], type: 'W' },
    getAllServiceRates: { url: "getAllServiceRates", pageId: [13], type: 'R' },
    deleteServiceRate: { url: "delete-service-rate", pageId: [13], type: 'D' },
    updateServiceRates: { url: "update-service-rates", pageId: [13], type: 'W' },

    //performance review
    getAllProjectPerformanceReviews: { url: "get-all-project-performance-reviews", pageId: [14], type: 'R' },
    createProjectperformances: { url: "create-project-performance", pageId: [14], type: 'W' },
    getprojectPerformance: { url: "getprojectPerformance", pageId: [14], type: 'W' },
    deleteProject: { url: "delete-project", pageId: [14], type: 'D' },
    updateProject: { url: "update-project", pageId: [14], type: 'W' },

    //Overall buyer ratings on sp
    
    createOverallRatings: { url: "rating-review-status", pageId: [15, 12], type: 'W' },
    getOverallRatings: { url: "getOverallRatings", pageId: [15], type: 'R' },

    //Company-Admin Users apis
    createCompanyUser: { url: "create-company-user", pageId: [16], type: 'W' },
    findCompanyUsers: { url: "findCompanyUsers", pageId: [16], type: 'R' },
    findCompanyUser: { url: "findCompanyUser", pageId: [16], type: 'R' },
    deleteCompanyUser: { url: "delete-company-user", pageId: [16], type: 'D' },


    //Company-Admin Group apis
    assignUsertoGroup: { url: "assign-userto-group", pageId: [17], type: 'W' },
    removeUserfromGroup: { url: "remove-userfrom-group", pageId: [17], type: 'W' },
    updateGroupPermissions: { url: "group-permission", pageId: [17], type: 'W' },
    findGroupPermissions: { url: "find-groups-permissions", pageId: [17], type: 'R' },
    createGroup: { url: "create-group", pageId: [17], type: 'W' },
    findCompanyAdmin: { url: "find-admin-groups", pageId: [17,16], type: 'R' },
    updateGroup: { url: "update-group", pageId: [17], type: 'W' },
    findGroupUser: { url: "find-group-users", pageId: [17], type: 'R' },
    
    //Notes api's
    getAllNotesFromBuyer: { url: "get-all-notes", pageId: [18], type: 'R' },
    addNewNote: { url: "add-new-note", pageId: [18], type: 'W' },
    removeNote: { url: "delete-note", pageId: [18], type: 'D' },
    updateNote: { url: "update-note", pageId: [18], type: 'W' },
  };

  export default API_PERMISSIONS;