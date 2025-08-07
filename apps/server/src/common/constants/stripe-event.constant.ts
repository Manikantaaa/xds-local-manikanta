export const STRIPE_EVENT = {
  invoice: {
    paid: "invoice.paid",
    payment_failed: "invoice.payment_failed",
    payment_succeeded : "invoice.payment_succeeded"
  },
  customer: {
    created: "customer.created",
    updated: "customer.updated",
    subscription: {
      deleted: "customer.subscription.deleted",
      updated: "customer.subscription.updated",
    },
  },
  // checkout : {
  //   session: {
  //     completed: "checkout.session.completed"
  //   }
  // }
};
