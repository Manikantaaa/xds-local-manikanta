import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { subMonths, startOfMonth, subDays, lastDayOfMonth, startOfYear } from "date-fns";
import { Stripe } from "stripe";
import { ConfigService } from "@nestjs/config";
const mailchimp = require("@mailchimp/mailchimp_marketing");

@Injectable()
export class CompanyReportsRepository {
    private stripe;
    constructor(private readonly configService: ConfigService,
        private readonly prismaService: PrismaService,
    ) {
        this.stripe = new Stripe(
            this.configService.get("XDS_STRIPE_PRIVATE_KEY") as string,
            {
                apiVersion: this.configService.get("XDS_STRIPE_API_VERSION"),
            },
        );

        mailchimp.setConfig({
            apiKey: this.configService.get("XDS_MAILCHIMP_API_KEY"),
            server: this.configService.get("XDS_MAILCHIMP_SERVER_PREFIX") // Load from environment variables
        });
    }


    async getCountsForPeriod(startDate: Date, endDate: Date, isPaidUser: boolean) {

        const whereClause: any = {
            isDelete: false,
            isArchieve: false,
            status: 1,
        };

        if (isPaidUser) {
            whereClause.user = {
                isArchieve: false,
                isDelete: false,
                userType: "paid",
                BillingDetails: {
                    some: {
                        isRenewed: false,
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                },
                isPaidUser: isPaidUser,
                stripeSubscriptionId: { not: null }
            }
        } else {
            whereClause.user = {
                isArchieve: false,
                isDelete: false,
                userType: "free",
                isLoggedOnce: true,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                isPaidUser: isPaidUser,
                stripeSubscriptionId: null
            }
        }
        return await this.prismaService.userRoles.groupBy({
            by: ['roleCode'],
            where: whereClause,
            _count: {
                userId: true,
            },
        });
    }

    calculatePercentageChange(current: number, previous: number) {
        if ((previous === 0 && current === 0) || (!previous && !current)) {
            return 0;
        }
        if (previous === 0 || !previous) {
            return current * 100;
        }
        if (current === 0 || !current) {
            return -100;
        }
        return Number((((current - previous) / previous) * 100).toFixed(2));
    }

    async getInviteeUsersCount(startDate: Date, endDate: Date) {
        return await this.prismaService.companyAdminUser.count({
            where: {
                companies: {
                    user: {
                        isDelete: false,
                        isArchieve: false,
                    }
                },
                isArchieve: false,
                isDelete: false,
                createdAt: { gte: startDate, lte: endDate },
            }
        });
    }

    async getNewSubscriptions(startDate: Date, endDate: Date) {


        const subscriptionData = await this.prismaService.billingDetails.groupBy({
            by: ["userId"],
            _count: {
                isRenewed: true,
            },
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                isRenewed: false,
                user: {
                    isDelete: false,
                },
            },
        });

        const newSubscribers = subscriptionData.filter(sub => sub._count.isRenewed === 1);
        const newSubscribersIds = newSubscribers.map(sub => sub.userId);

        const monthlySubscriptionData = await this.prismaService.billingDetails.groupBy({
            by: ["userId"],
            _count: {
                isRenewed: true,
            },
            where: {
                isRenewed: false,
                userId: { in: newSubscribersIds },
                subscriptionType: "month",
            },
        });

        const yearlySubscriptionData = await this.prismaService.billingDetails.groupBy({
            by: ["userId"],
            _count: {
                isRenewed: true,
            },
            where: {
                isRenewed: false,
                userId: { in: newSubscribersIds },
                subscriptionType: "year",
            },
        });

        // Separate the users based on the _count.isRenewed value

        // const returnedSubscribers = subscriptionData.filter(sub => sub._count.isRenewed > 1);

        return { newSubscribers: { total: newSubscribers.length, monthly: monthlySubscriptionData.length, yearly: yearlySubscriptionData.length } };
    }
    async getReturnedSubscriptions() {


        // const subscriptionData = await this.prismaService.billingDetails.groupBy({
        //     by: ["userId"],
        //     _count: {
        //         isRenewed: true,
        //     },
        //     where: {
        //         isRenewed: false,
        //         user: {
        //             isDelete: false,
        //         },
        //     },
        // });


        // const returnedSubscribers = subscriptionData.filter(sub => sub._count.isRenewed > 1);

        const cancelleddata = await this.prismaService.users.findMany({
            where: {
                BillingDetails: {
                    some: {
                        isRenewed: false,
                    }
                },
                isDelete: false,
            },
            select: {
                _count: {
                    select: {
                        BillingDetails: {
                            where: {
                                isRenewed: false,
                            }
                        },
                    }
                },
            },
            orderBy: {
                id: "desc"
            }
        });

        const rturnedArray = cancelleddata.filter((resSubs) => resSubs._count.BillingDetails > 1);

        return rturnedArray.length;
    }

    async getCancelledSubscriptions(startDate: Date, endDate: Date) {
        return this.prismaService.billingDetails.count({
            where: {
                isSubscriptionCancelled: true,
                cancellationDate: {
                    gte: startDate,
                    lte: endDate,
                }
            },
        })
    }

    async getMonthlyandYearlySubscriptionsCount() {
        const Data = await this.prismaService.billingDetails.groupBy({
            by: ["subscriptionType"],
            _count: {
                id: true
            },
            where: {
                isActive: true,
                user: {
                    isDelete: false,
                }
            }
        });
        if (Data[0] && Data[1]) {
            return Data;
        }
        else if (Data[0] && Data[0].subscriptionType === "month") {
            Data[1] = { _count: { id: 0 }, subscriptionType: "year" }
        } else {
            Data[1] = { _count: { id: 0 }, subscriptionType: "month" }
        }
        return Data;
    }

    async getEmptyProfilesPercentage() {
        const totalUsers = await this.prismaService.companies.count({
            where: {
                isArchieve: false,
                isDelete: false,
                user: {
                    approvalStatus: "completed",
                    userRoles: {
                        some: {
                            roleCode: "service_provider",
                        }
                    }
                }
            },
        });
        const usersProfileCompleted = await this.prismaService.companies.count({
            where: {
                isDelete: false,
                isArchieve: false,
                profileCompleted: true,
                user: {
                    approvalStatus: "completed",
                    userRoles: {
                        some: {
                            roleCode: "service_provider",
                        }
                    }
                }
            }
        });
        const usersWithoutProfileImage = await this.prismaService.companies.count({
            where: {
                isDelete: false,
                isArchieve: false,
                logoAssetId: null,
                user: {
                    approvalStatus: "completed",
                    userRoles: {
                        some: {
                            roleCode: "service_provider",
                        }
                    }
                }
            }
        });

        const emptyProfileUsers = ((usersWithoutProfileImage / totalUsers) * 100).toFixed(2) + '%';
        const profileCompletedUser = ((usersProfileCompleted / totalUsers) * 100).toFixed(2) + '%';
        return { emptyProfileUsers, profileCompletedUser };
    }

    async getTopProjectsAndListsCreatedByCompany() {
        const allProjects = await this.prismaService.users.findMany({
            where: {
                myProjects: {
                    some: { isDelete: false },
                },
                userRoles: {
                    some: {
                        roleCode: "buyer",
                    }
                }
            },
            select: {
                companies: {
                    select: {
                        name: true,
                    }
                },
                _count: {
                    select: {
                        myProjects: true,
                    },
                },
            },
        });

        const newProjects = allProjects.sort((a: {
            companies: {
                name: string;
            }[];
            _count: {
                myProjects: number;
            };
        }, b: {
            companies: {
                name: string;
            }[];
            _count: {
                myProjects: number;
            };
        }) => {
            const countDifference = b._count.myProjects - a._count.myProjects;

            if (countDifference === 0) {
                return a.companies[0].name.localeCompare(b.companies[0].name);
            }
            return countDifference;
        }).slice(0, 10);

        const allList = await this.prismaService.users.findMany({
            where: {
                myLists: {
                    some: { isDelete: false },
                },
                userRoles: {
                    some: {
                        roleCode: "buyer",
                    }
                }
            },
            select: {
                companies: {
                    select: {
                        name: true,
                    }
                },
                _count: {
                    select: {
                        myLists: true
                    },
                },
            },
        });

        const newLists = allList.sort((a, b) => {
            // First, sort by the count of `myLists`
            const countDifference = b._count.myLists - a._count.myLists;

            if (countDifference === 0) {
                return a.companies[0].name.localeCompare(b.companies[0].name);
            }
            return countDifference;
        }).slice(0, 10);

        const topList = newLists;
        const topProjects = newProjects;

        return { TopProjectsCount: topProjects, TopListCount: topList };
    }

    async getSuppliersCountOfList() {
        const AllSuppliers = await this.prismaService.companies.findMany({
            where: {
                isDelete: false,
                user: {
                    isDelete: false,
                    isArchieve: false,
                    userRoles: {
                        some: {
                            roleCode: "buyer",
                        }
                    },
                    myLists: {
                        some: {
                            isArchieve: false,
                            isDelete: false,
                        }
                    }
                },
            },
            select: {
                user: {

                    select: {
                        companies: {
                            select: {
                                name: true,
                            }
                        },
                        myLists: {
                            select: {
                                _count: {
                                    select: {
                                        IntrestedInMyLists: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        const userInterestSums = AllSuppliers.map(supplier => {
            const individualSum = supplier.user.myLists.reduce((sum, list) => sum + list._count.IntrestedInMyLists, 0);
            return {
                companyName: supplier.user.companies[0].name,
                totalIntrestedInMyLists: individualSum
            };
        });

        userInterestSums.sort((a: {
            companyName: string;
            totalIntrestedInMyLists: number
        }, b: {
            companyName: string;
            totalIntrestedInMyLists: number
        }) => {
            const diff = b.totalIntrestedInMyLists - a.totalIntrestedInMyLists;
            if (diff == 0) {
                return a.companyName.localeCompare(b.companyName)
            }
            return diff;
        });
        const TopSuppliers = userInterestSums.slice(0, 10);
        return { TopListBySuppliers: TopSuppliers };
    }

    async getTopCompaniesByInvitees() {

        // 1. Group by companyId and get the user counts
        const userCounts = await this.prismaService.companyAdminUser.groupBy({
            by: ['companyId'],
            where: {
                isDelete: false,
                isArchieve: false,
                companies: {
                    user: {
                        isDelete: false,
                        isArchieve: false,
                        userRoles: {
                            some: {
                                roleCode: "buyer",
                            }
                        }
                    }
                }
            },
            _count: {
                companyId: true,
            },
        });

        userCounts.sort((a, b) => b._count.companyId - a._count.companyId);
        const newUsersCount = userCounts.slice(0, 10);
        // 2. Extract the companyIds from the grouped data
        const companyIds = newUsersCount.map((uc) => uc.companyId ? uc.companyId : 0);

        // 3. Fetch the company names for the relevant companyIds
        const companies = await this.prismaService.companies.findMany({
            where: { id: { in: companyIds } },
            select: {
                id: true,
                name: true,
            },
        });

        // 4. Merge the user counts with company names
        const result = newUsersCount.map((uc) => {
            const company = companies.find((c) => c.id === uc.companyId);
            return {
                companyName: company?.name || 'Unknown',
                userCount: uc._count.companyId,
            };
        });

        const TopUserCount = result.sort((a, b) => {
            const diff = b.userCount - a.userCount
            if (diff === 0) {
                return a.companyName.localeCompare(b.companyName);
            }
            return diff;
        }).slice(0, 10);
        return { topInviteesCount: TopUserCount };
    }

    async getTopOpportunitiesByCompanies() {
        const opportunityData = await this.prismaService.opportunities.groupBy({
            by: ["companyId"],
            _count: {
                companyId: true,
            },
            where: {
                company: {
                    user: {
                        isDelete: false,
                        isArchieve: false,
                        userRoles: {
                            some: {
                                roleCode: "buyer",
                            }
                        }
                    }
                }
            }
        });

        const TopTenOpportunities = opportunityData.sort((a, b) => {
            return b._count.companyId - a._count.companyId;
        }).slice(0, 10);

        const getCompaniesId = TopTenOpportunities.map((opp) => opp.companyId);

        const CompaniesData = await this.prismaService.companies.findMany(({
            where: {
                id: {
                    in: getCompaniesId,
                }
            },
            select: {
                name: true,
                id: true,
            },
        }))

        const TopOpportunities = TopTenOpportunities.map((company) => {
            const companies = CompaniesData.find((opp) => opp.id === company.companyId);

            const opportunitiesCount = company?._count.companyId

            return {
                ...companies,
                opportunitiesCount,
            };
        });

        TopOpportunities.sort((a, b) => {
            if (a.name && b.name) {
                const diff = b.opportunitiesCount - a.opportunitiesCount;
                if (diff == 0) {
                    return a.name?.localeCompare(b.name)
                }
                return diff;
            }
            return -1;

        })
        return TopOpportunities;
    }

    async getTopUserLogins() {

        const today = new Date();
        const daysAgo_30 = subDays(today, 30);
        const CompanyLogins = await this.prismaService.userLogins.groupBy({
            by: ["userId"],
            _count: {
                userId: true,
            },
            where: {
                loggedInAt: {
                    lte: today,
                    gte: daysAgo_30,
                },
                user: {
                    isDelete: false,
                    isArchieve: false,
                    userRoles: {
                        some: {
                            roleCode: "buyer",
                        }
                    }
                }
            }
        });

        const companyInvitees = await this.prismaService.inviteeUserLogins.groupBy({
            by: ["adminUserId"],
            _count: {
                adminUserId: true,
            },
            where: {
                loggedInAt: {
                    lte: today,
                    gte: daysAgo_30,
                },
                companyadminusers: {
                    companies: {
                        user: {
                            userRoles: {
                                some: {
                                    roleCode: "buyer",
                                }
                            }
                        }
                    }
                }
            }
        });

        const inviteesMap: Record<number, number> = companyInvitees.reduce((acc, invitee) => {
            acc[invitee.adminUserId] = invitee._count.adminUserId;
            return acc;
        }, {} as Record<number, number>);

        const CombinedLogIns = CompanyLogins.map((companyLogin) => {
            const inviteeLoginCount = inviteesMap[companyLogin.userId] || 0;
            return {
                ...companyLogin,
                loginCount: inviteeLoginCount + companyLogin._count.userId
            };
        });

        const companyLoginUserIds = new Set(CompanyLogins.map((login) => login.userId));
        const additionalInvitees = Object.keys(inviteesMap)
            .filter((inviteeUserId) => !companyLoginUserIds.has(parseInt(inviteeUserId)));
        const InviteesNotPresentCompanyLogins = additionalInvitees.map((inviteeId) => ({
            userId: parseInt(inviteeId),
            loginCount: inviteesMap[parseInt(inviteeId)],
        }));

        const TopLogins = [...CombinedLogIns, ...InviteesNotPresentCompanyLogins];

        const userIds = TopLogins.map((login) => login.userId);
        const TopUsersData = await this.prismaService.users.findMany({
            where: {
                id: {
                    in: userIds,
                }
            },
            select: {
                id: true,
                companies: {
                    select: {
                        name: true,
                    }
                },
            }
        })

        const userCompaniesMap = TopUsersData.reduce((acc, user) => {
            acc[user.id] = user.companies[0].name || 'Unknown';
            return acc;
        }, {} as Record<number, string>);

        const CombinedData = TopLogins.map((login) => ({
            userId: login.userId,
            loginCount: login.loginCount,
            userFullName: userCompaniesMap[login.userId],
        })).sort((a, b) => {
            const diff = b.loginCount - a.loginCount;
            if (diff == 0) {
                return a.userFullName.localeCompare(b.userFullName);
            }
            return diff;
        });

        const topTenUsers = CombinedData.slice(0, 10);

        return { topTenUsers };
    }


    async sumInvoicesInRange(startDate: number, endDate: number) {
        let hasMore = true;
        let totalRevenue = 0;
        let startingAfter: string | null = null;

        while (hasMore) {
            const invoices: Stripe.ApiList<Stripe.Invoice> = await this.stripe.invoices.list({

                created: {
                    gte: startDate,
                    lte: endDate,
                },
                status: 'paid',
                limit: 100,
                starting_after: startingAfter || undefined,
            });

            invoices.data.forEach((invoice) => {
                if (invoice.subscription) {
                    totalRevenue += invoice.amount_paid / 100;
                }
            });

            hasMore = invoices.has_more;
            if (hasMore) {
                startingAfter = invoices.data[invoices.data.length - 1].id;
            }
        }
        return totalRevenue.toExponential(2);
    }

    async mailchimpAPis(type: "listCount" | "listPercent" | "listsData") {

        if (type === "listCount") {
            const response = await mailchimp.lists.getList("eec362cf4a");
            const MainConatctCount = response.stats.member_count;
            return { MainConatctCount }
        }

        if (type === "listsData") {
            const responses = await mailchimp.reports.getAllCampaignReports({
                count: 5
            });
            const mailchimpData = responses.reports.map((mails: { campaign_title: any; unsubscribed: any; opens: any; clicks: any; }) => ({
                campaign_title: mails.campaign_title,
                unsubscribed: mails.unsubscribed,
                opens: mails.opens.opens_total,
                clicks: mails.clicks.clicks_total,
            }));

            return { listData: mailchimpData }
        }

        if (type === "listPercent") {
            let listStats = 0;
            try {
                const responsesee = await mailchimp.lists.getListGrowthHistory("eec362cf4a");
                const thisMonthCount = responsesee.history[0].subscribed;
                const lastMonthCount = responsesee.history[1].subscribed;
                const beforeLastMonthCount = responsesee.history[2].subscribed;

                const currentMonthCount = thisMonthCount - lastMonthCount;
                const previousMonthCount = lastMonthCount - beforeLastMonthCount;
                listStats = this.calculatePercentageChange(thisMonthCount, lastMonthCount);

                const TwoYearsData = responsesee.history.filter((listHistory: { month: string }, index: number, arr: { month: string }[]) => {
                    const currentYear = listHistory.month.split('-')[0]; // Extract year from 'YYYY-MM'
                    const previousYear = index > 0 ? arr[index - 1].month.split('-')[0] : null;
                    return index === 0 || currentYear !== previousYear;
                });

                const listMTDStats = this.calculatePercentageChange(currentMonthCount, previousMonthCount);
                const listYTDStats = this.calculatePercentageChange(TwoYearsData[0].subscribed, TwoYearsData[1]?.subscribed ?? 0);

                return { listStats, thisMonthStats: { currentMonthCount, listMTDStats }, thisYear: { listYTDStats, members: TwoYearsData[0].subscribed } };
            } catch (error) {
                console.log(error);
                return { listStats: 0 };
            }
        }

    }

    async MostActiveByProfileViewing() {
        const today = new Date();
        const daysAgo_30 = subDays(today, 30);

        const Topviewers = await this.prismaService.profileViews.groupBy({
            by: ["viewerUserId"],
            _count: {
                viewerUserId: true,
            },
            where: {
                createdAt: {
                    gte: daysAgo_30,
                    lte: today,
                },
                viewer: {
                    userRoles: {
                        some: {
                            roleCode: "buyer",
                        }
                    }
                }
            },
            orderBy: {
                _count: {
                    viewerUserId: "desc",
                },
            },
            take: 10, // Limit to top 10 viewers
        });

        // Then fetch additional details (like name) for these top viewers
        const topViewerIds = Topviewers.map(view => view.viewerUserId);

        const topViewerDetails = await this.prismaService.users.findMany({
            where: {
                id: { in: topViewerIds },
                isDelete: false,
                isArchieve: false,
            },
            select: {
                id: true,
                companies: {
                    select: {
                        name: true,
                    }
                },
            },
        });
        // Combine details and view counts
        const topViewersWithCount = topViewerDetails.map(user => ({
            ...user,
            views: Topviewers.find(view => view.viewerUserId === user.id)?._count.viewerUserId || 0,
        }));

        topViewersWithCount.sort((a, b) => {
            const diff = b.views - a.views
            if (diff == 0) {
                return a.companies[0].name.localeCompare(b.companies[0].name)
            }
            return diff;
        });
        return topViewersWithCount;


    }

    async activeBuyersByRegion() {
        const now = new Date();
        const dayEnd = new Date(now.setHours(23, 59, 59, 999));
        const daysAgo_30 = subDays(dayEnd, 30);
        const regionData = await this.prismaService.billingDetails.groupBy({
            by: ["billingRegion"],
            _count: {
                userId: true,
            },
            where: {
                user: {
                    isLoggedOnce: true,
                    isArchieve: false,
                    isDelete: false,
                    userRoles: {
                        some: {
                            roleCode: "buyer",
                        }
                    },
                    lastLoginDate: {
                        gte: daysAgo_30,
                    }
                }
            }
        });

        const formattedData = regionData.map((region) => {
            return {
                region: region.billingRegion,
                regionCount: region._count.userId,
            }
        });
        return formattedData;

    }

    async findAll() {

        // code to check change in percentage of sp and buyers compare to last month
        const now = new Date();
        const dayEnd = new Date(now.setHours(23, 59, 59, 999));
        const currentMonthStart = startOfMonth(now);
        const previousMonthStart = subMonths(currentMonthStart, 1);
        const daysAgo_30 = subDays(dayEnd, 30);
        const AllUsersData = await this.prismaService.companies.findMany({
            where: {
                isArchieve: false,
                isDelete: false,
                user: {
                    isArchieve: false,
                    isDelete: false,
                    lastLoginDate: {
                        gte: daysAgo_30,
                    }
                }
            },
            select: {
                user: {
                    select: {
                        lastLoginDate: true,
                        isPaidUser: true,
                        stripeSubscriptionId: true,
                        userType: true,
                        userRoles: {
                            select: {
                                roleCode: true,
                            }
                        }
                    }
                },
            }
        });

        const response = {
            premiumActiveBuyers: { count: 0, change: 0 },
            foundationalActiveBuyers: { count: 0, change: 0 },
            premiumActiveSPs: { count: 0, change: 0 },
            foundationalActiveSPs: { count: 0, change: 0 },
            inviteeUsersCount: { count: 0, change: 0 },
        };

        AllUsersData.forEach((item) => {
            const { user } = item;
            const isPaid = user.stripeSubscriptionId;
            if (user.userRoles[0].roleCode === 'buyer' && isPaid && user.userType == "paid" && user.lastLoginDate && user.lastLoginDate > daysAgo_30) {
                response.premiumActiveBuyers.count++;
            } else if (user.userRoles[0].roleCode === 'buyer' && user.userType == "free" && !isPaid && user.lastLoginDate && user.lastLoginDate > daysAgo_30) {
                response.foundationalActiveBuyers.count++;
            } else if (user.userRoles[0].roleCode === 'service_provider' && isPaid && user.userType == "paid") {
                response.premiumActiveSPs.count++;
            } else if (user.userRoles[0].roleCode === 'service_provider' && user.userType == "free" && !isPaid) {
                response.foundationalActiveSPs.count++;
            }
        });

        const inviteeUsersCount = await this.prismaService.companyAdminUser.count({
            where: {
                companies: {
                    user: {
                        isDelete: false,
                        isArchieve: false,
                    },
                    isArchieve: false,
                    isDelete: false,
                },
            }
        });
        response.inviteeUsersCount.count = inviteeUsersCount;



        // Fetch data for the current and previous periods
        const [currentPremiumData, previousPremiumData, currentFreeData, previousfreeData, currentInviteeCount, previousInviteeCount,] = await Promise.all([
            this.getCountsForPeriod(currentMonthStart, now, true),
            this.getCountsForPeriod(previousMonthStart, subMonths(now, 1), true),
            this.getCountsForPeriod(currentMonthStart, now, false),
            this.getCountsForPeriod(previousMonthStart, subMonths(now, 1), false),
            this.getInviteeUsersCount(currentMonthStart, now),
            this.getInviteeUsersCount(previousMonthStart, subMonths(now, 1)),
        ]);

        const mapData = (data: any[], isPaidUsers: boolean) =>
            data.reduce((acc, { roleCode, _count }) => {
                if (isPaidUsers == true) {
                    acc[roleCode + 's_premium'] = _count.userId;
                } else {
                    acc[roleCode + 's_free'] = _count.userId;
                }

                return acc;
            }, {});

        const currentPremiumCounts = mapData(currentPremiumData, true);
        const previousPremiumCounts = mapData(previousPremiumData, true);
        const currentFreeCounts = mapData(currentFreeData, false);
        const previousFreeCounts = mapData(previousfreeData, false);


        const buyer_PercentChange_Premuium = this.calculatePercentageChange(currentPremiumCounts.buyers_premium, previousPremiumCounts.buyers_premium)
        const buyer_PercentChange_Free = this.calculatePercentageChange(currentFreeCounts.buyers_free, previousFreeCounts.buyers_free);
        const SP_PercentChange_Premuium = this.calculatePercentageChange(currentPremiumCounts.service_providers_premium, previousPremiumCounts.service_providers_premium)
        const SP_PercentChange_Free = this.calculatePercentageChange(currentPremiumCounts.service_providers_free, previousFreeCounts.service_providers_free);

        const InviteesPercentageChange = this.calculatePercentageChange(currentInviteeCount, previousInviteeCount);

        response.foundationalActiveBuyers.change = buyer_PercentChange_Free;
        response.foundationalActiveSPs.change = SP_PercentChange_Free;
        response.premiumActiveBuyers.change = buyer_PercentChange_Premuium;
        response.premiumActiveSPs.change = SP_PercentChange_Premuium;
        response.inviteeUsersCount.change = InviteesPercentageChange;

        // new subscriptios MTD and YTD

        const newSubscriptionsMTD = await this.getNewSubscriptions(startOfMonth(now), now);
        const newSubscriptionsYTD = await this.getNewSubscriptions(startOfYear(now), now);

        const returnedSubscriptions = await this.getReturnedSubscriptions();

        // Cancelled subscriptios MTD and YTD
        const cancelledSubscriptionsMTD = await this.getCancelledSubscriptions(startOfMonth(now), now);
        const cancelledSubscriptionsYTD = await this.getCancelledSubscriptions(startOfYear(now), now);

        // Monthly vs yearly for pie chart
        const emptyProfilesCount = await this.getEmptyProfilesPercentage();
        return {
            response: {
                response,
                newSubscriptionsMTD,
                newSubscriptionsYTD,
                cancelledSubscriptionsMTD,
                cancelledSubscriptionsYTD,
                emptyProfilesCount,
                returnedSubscriptions,
            }
        };




        //return { cancelledSubscriptionsMTD, cancelledSubscriptionsYTD };
    }

    async findStaticsData() {

        const activeBuyersByRegion = await this.activeBuyersByRegion();
        const OverallSubscribersMonthlyAndYearly = await this.getMonthlyandYearlySubscriptionsCount();
        return {
            activeBuyersByRegion,
            OverallSubscribersMonthlyAndYearly
        }
    }

    async findListsData() {
        const noOfListAndProjectesCreated = await this.getTopProjectsAndListsCreatedByCompany()

        const noOfSuppliersAddedtoList = await this.getSuppliersCountOfList();

        const MostInviteesByCompany = await this.getTopCompaniesByInvitees();

        const TopOpportunitiesByCompanies = await this.getTopOpportunitiesByCompanies();

        const TopLogins = await this.getTopUserLogins();

        const MostActiveByProfileViewing = await this.MostActiveByProfileViewing();

        return {
            noOfListAndProjectesCreated,
            noOfSuppliersAddedtoList,
            MostInviteesByCompany,
            TopOpportunitiesByCompanies,
            TopLogins,
            MostActiveByProfileViewing,
        }

    }

    async getStripeData() {
        const now = new Date();
        const StripestartOfMonthDate = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
        const startOfYearDate = Math.floor(new Date(now.getFullYear(), 0, 1).getTime() / 1000);
        const MTDRevenue = await this.sumInvoicesInRange(StripestartOfMonthDate, Math.floor(now.getTime() / 1000));
        const YTDRevenue = await this.sumInvoicesInRange(startOfYearDate, Math.floor(now.getTime() / 1000));
        return {
            MTDRevenue,
            YTDRevenue,
        }

    }

    async getMailchimpData(type: "listCount" | "listPercent" | "listsData") {
        const MailchimpAPi = await this.mailchimpAPis(type);
        return {
            MailchimpAPi,
        }
    }




}