export const routeAccessMap = {
  //   Referrals & Payouts
  "/referrals-and-payouts": [
    "/refral/summary", // GET
  ],
  //   All Users
  "/registered-users": [
    "/all/user", // GET
  ],
  //  Affiliates
  "/affiliates": [
    "/user/kyc/pending", // GET
  ],
  //  Payouts
  "/payouts": [
    "/earnings", // GET
  ],
  //  Weekly Payouts
  "/weekly-payouts": [
    "/weekly-earnings", // GET
  ],
  // Purchase History/Orders
  "/purchase-history": [
    "/all-orders", // GET
    "/user/:id", // GET SINGLE ORDER
    "/course/single/:id", // GET SINGLE ORDER
    "//order/cancel", // PUT
  ],
  // Talents
  "/talents": [
    "/talent", // GET
    "/talent/delete/:id", // DELETE
  ],
  // Testimonials
  "/manage-testimonials": [
    "/testimonial", // GET
    "/testimonial/add", // POST
    "/testimonial/delete/:id", // DELETE
  ],
  // Photo Gallery
  "/manage-photo-gallery": [
    "/photoGallery", // GET
    "/photoGallery/add", // POST
    "/photoGallery/delete/:id", // DELETE
  ],
  // Leaderboard
  "/leaderboard": [
    "/referral/leaderboard", // GET
  ],
  // Referral Network
  "/referral-network": [
    "/referralNetwork", // GET
  ],
  // Business plan
  "/business-plan": [
    "/businessPlan", // GET
    "/businessPlan/upload", // POST
    "/businessPlan/:id", // PUT
  ],

  //   Referrals & Payouts
  // "/referrals-and-payouts": [
  //   "/content/create-content", // POST
  //   "/content", // GET all
  //   "/content/:contentId", // GET one
  //   "/content/:contentId", // PUT
  //   "/content/delete-content/:contentId/:type/:url", // DELETE
  // ],
};
